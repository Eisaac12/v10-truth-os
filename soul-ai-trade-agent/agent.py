#!/usr/bin/env python3
"""
agent.py — Soul AI XAUUSD Autonomous Trading Agent.

Usage:
  python agent.py           # Run on 4H schedule indefinitely
  python agent.py --once    # Run one cycle immediately and exit (testing)
  python agent.py --dry-run # Force dry_run mode regardless of .env
  python agent.py --once --dry-run

The agent fires at every 4H candle close + 2min buffer:
  00:02, 04:02, 08:02, 12:02, 16:02, 20:02 UTC
"""

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Load .env from the same directory as this file
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import anthropic
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

import executor
import journal
import notion_sync
import scanner
import telegram_bot
from risk_guard import RiskViolation, check_daily_loss_limit, validate_trade

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_PATH = Path(__file__).parent / "agent.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_PATH),
    ],
)
log = logging.getLogger("soul-ai")

# ── Constants ─────────────────────────────────────────────────────────────────
MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 2048
SYSTEM_PROMPT_PATH = Path(__file__).parent / "CLAUDE.md"


def load_system_prompt() -> str:
    """Re-reads CLAUDE.md on every cycle so prompt edits take effect immediately."""
    return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


def build_user_message(snapshot: dict) -> str:
    """Formats the market snapshot into a structured prompt for Claude."""
    ts = snapshot.get("timestamp_utc", "unknown")
    price = snapshot.get("xauusd_price", "N/A")
    s4h = snapshot.get("xauusd_4h", {})
    s1h = snapshot.get("xauusd_1h", {})
    s15m = snapshot.get("xauusd_15m", {})
    corr = snapshot.get("correlations", {})
    errors = snapshot.get("fetch_errors", [])

    macd_4h = s4h.get("macd_4h", {})
    macd_1h = s1h.get("macd_1h", {})

    lines = [
        f"## CURRENT MARKET DATA — {ts}",
        "",
        "### XAUUSD Price",
        f"Current Price: {price}",
        "",
        "### 4H Structure",
        f"BOS Direction: {s4h.get('bos_direction', 'N/A')}",
        f"SMA20: {s4h.get('sma20', 'N/A')} | SMA50: {s4h.get('sma50', 'N/A')} | SMA100: {s4h.get('sma100', 'N/A')} | SMA200: {s4h.get('sma200', 'N/A')}",
        f"RSI(14) 4H: {s4h.get('rsi_4h', 'N/A')}",
        f"MACD 4H: line={macd_4h.get('macd', 'N/A')} signal={macd_4h.get('signal', 'N/A')} hist={macd_4h.get('histogram', 'N/A')}",
        f"Recent Swing Highs: {s4h.get('recent_highs', [])}",
        f"Recent Swing Lows: {s4h.get('recent_lows', [])}",
        "",
        "### 1H Momentum",
        f"RSI(14) 1H: {s1h.get('rsi_1h', 'N/A')}",
        f"MACD 1H: line={macd_1h.get('macd', 'N/A')} signal={macd_1h.get('signal', 'N/A')} hist={macd_1h.get('histogram', 'N/A')}",
        f"Last 20 closes (1H): {s1h.get('last_20_closes', [])}",
        "",
        "### 15M Precision",
        f"RSI(14) 15M: {s15m.get('rsi_15m', 'N/A')}",
        f"Last 10 closes (15M): {s15m.get('last_10_closes', [])}",
        "",
        "### Correlated Assets",
        f"DXY: {corr.get('dxy', 'N/A')} (trend: {corr.get('dxy_trend', 'N/A')})",
        f"WTI Crude Oil: {corr.get('oil', 'N/A')}",
        f"US 10Y Yield: {corr.get('yield_10y', 'N/A')}%",
    ]

    if errors:
        lines += ["", "### Data Fetch Warnings", *[f"- {e}" for e in errors]]

    lines += [
        "",
        "---",
        "Perform your complete 4-layer TRUTHOS analysis on this data.",
        "Respond with JSON ONLY — no text before or after the JSON block.",
    ]

    return "\n".join(lines)


def parse_claude_response(raw: str) -> dict:
    """
    Extracts JSON from Claude's response.
    Falls back to regex extraction, then to a safe STAND_DOWN on failure.
    """
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    log.error(f"Failed to parse Claude response as JSON. Raw: {raw[:300]}")
    return {
        "decision": "STAND_DOWN",
        "conviction_score": 0,
        "stand_down_reason": f"JSON parse error in agent response. Raw: {raw[:200]}",
        "parse_error": True,
    }


def run_cycle() -> None:
    """
    Single 4H trading cycle. Complete flow:
    1. Daily loss halt check
    2. Market scan
    3. Claude API call (claude-sonnet-4-6)
    4. Parse JSON decision
    5. Risk validation (if TRADE)
    6. Order execution (if valid TRADE)
    7. Telegram signal
    8. Journal entry
    9. Notion sync
    """
    cycle_start = datetime.now(timezone.utc)
    log.info(f"=== SOUL AI CYCLE START {cycle_start.strftime('%Y-%m-%d %H:%M UTC')} ===")

    account_size = float(os.getenv("ACCOUNT_SIZE_USD", 10000))
    journal_path = str(journal.JOURNAL_PATH)

    # ── Step 1: Daily loss halt check ─────────────────────────────────────────
    try:
        check_daily_loss_limit(
            journal_path=journal_path,
            account_size=account_size,
            limit_pct=float(os.getenv("DAILY_LOSS_LIMIT_PCT", 3.0)),
        )
    except RiskViolation as e:
        log.critical(f"DAILY HALT TRIGGERED: {e}")
        telegram_bot.send_alert("DAILY_HALT", str(e))
        journal.append_entry(journal.build_entry(
            cycle_type="halt",
            market_snapshot={},
            claude_raw="",
            claude_decision={},
            risk_result={"reason": str(e)},
            notes=str(e),
        ))
        return

    # ── Step 2: Market scan ───────────────────────────────────────────────────
    try:
        snapshot = scanner.scan_market()
        log.info(f"Market scan complete. XAUUSD: {snapshot.get('xauusd_price')} | BOS: {snapshot.get('xauusd_4h', {}).get('bos_direction')}")
    except scanner.DataFetchError as e:
        log.error(f"Market scan failed — skipping cycle: {e}")
        telegram_bot.send_alert("ERROR", f"Market scan failed: {e}")
        return
    except Exception as e:
        log.error(f"Unexpected scanner error: {e}")
        return

    # ── Step 3: Claude API call ───────────────────────────────────────────────
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or "your_" in api_key:
        log.error("ANTHROPIC_API_KEY not configured. Set it in .env file.")
        return

    client = anthropic.Anthropic(api_key=api_key)
    system_prompt = load_system_prompt()
    user_message = build_user_message(snapshot)
    raw_response = ""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_response = response.content[0].text
        log.info(
            f"Claude response: {response.usage.input_tokens} in / "
            f"{response.usage.output_tokens} out tokens"
        )
    except anthropic.AuthenticationError as e:
        log.critical(f"Authentication error — check ANTHROPIC_API_KEY: {e}")
        telegram_bot.send_alert("ERROR", f"Auth error: invalid API key.")
        return
    except anthropic.RateLimitError as e:
        log.warning(f"Rate limit hit — skipping cycle: {e}")
        return
    except anthropic.APIConnectionError as e:
        log.error(f"API connection error — skipping cycle: {e}")
        return
    except Exception as e:
        log.error(f"Claude API error: {e}")
        return

    # ── Step 4: Parse decision ────────────────────────────────────────────────
    decision = parse_claude_response(raw_response)
    log.info(
        f"Decision: {decision.get('decision')} | "
        f"Conviction: {decision.get('conviction_score')}/10 | "
        f"R:R: {decision.get('risk_reward')}"
    )

    order_result = None
    telegram_sent = False
    notion_synced = False
    risk_result = {}

    # ── Steps 5–7: TRADE path ─────────────────────────────────────────────────
    if decision.get("decision") == "TRADE":
        try:
            enriched = validate_trade(decision, account_size=account_size)
            risk_result = {
                "valid": True,
                "position_size": enriched.get("position_size"),
            }
            order_result = executor.execute_trade(enriched)
            log.info(
                f"Order: {order_result['status']} | "
                f"ID: {order_result['order_id']} | "
                f"Lots: {order_result['lot_size']}"
            )
            telegram_sent = telegram_bot.send_signal(decision, order_result)

        except RiskViolation as e:
            log.warning(f"Risk violation — trade blocked: {e}")
            risk_result = {"valid": False, "reason": str(e)}
            decision["decision"] = "STAND_DOWN"
            decision["stand_down_reason"] = f"Risk guard: {e}"
    else:
        log.info(f"STAND DOWN — {decision.get('stand_down_reason', 'no reason given')}")
        telegram_bot.send_stand_down(decision)

    # ── Step 8: Journal ───────────────────────────────────────────────────────
    cycle_type = "trade" if order_result else "stand_down"
    entry = journal.build_entry(
        cycle_type=cycle_type,
        market_snapshot=snapshot,
        claude_raw=raw_response,
        claude_decision=decision,
        risk_result=risk_result,
        order_result=order_result,
        telegram_sent=telegram_sent,
        notion_synced=False,
    )
    journal.append_entry(entry)

    # ── Step 9: Notion sync ───────────────────────────────────────────────────
    if order_result:
        notion_synced = notion_sync.sync_entry(entry)
        if notion_synced:
            journal.mark_notion_synced(entry["entry_id"])

    elapsed = (datetime.now(timezone.utc) - cycle_start).total_seconds()
    log.info(f"=== CYCLE COMPLETE in {elapsed:.1f}s ===")


def main():
    parser = argparse.ArgumentParser(description="Soul AI XAUUSD Autonomous Trading Agent")
    parser.add_argument("--once", action="store_true", help="Run one cycle then exit")
    parser.add_argument("--dry-run", action="store_true", help="Force dry_run execution mode")
    args = parser.parse_args()

    if args.dry_run:
        os.environ["EXECUTION_MODE"] = "dry_run"

    mode = os.getenv("EXECUTION_MODE", "dry_run")
    log.info("=" * 60)
    log.info("  SOUL AI — XAUUSD Autonomous Trading Agent")
    log.info(f"  Model: {MODEL}")
    log.info(f"  Execution mode: {mode.upper()}")
    log.info(f"  Account size: ${os.getenv('ACCOUNT_SIZE_USD', '10000')}")
    log.info(f"  Max risk per trade: {os.getenv('MAX_RISK_PCT', '1.0')}%")
    log.info(f"  Daily loss limit: {os.getenv('DAILY_LOSS_LIMIT_PCT', '3.0')}%")
    log.info("=" * 60)

    if mode == "live":
        log.warning(
            "EXECUTION_MODE=live is set. "
            "Real orders will be placed in MetaTrader 5. "
            "Ensure DRY_RUN testing is complete before running live."
        )

    # Catch up any pending Notion entries from previous run
    notion_sync.sync_pending_entries(str(journal.JOURNAL_PATH))

    # Send startup alert
    telegram_bot.send_alert(
        "STARTUP",
        f"Soul AI agent started.\nMode: {mode.upper()}\nModel: {MODEL}"
    )

    if args.once:
        log.info("Running single cycle (--once mode)...")
        run_cycle()
        log.info("Single cycle complete. Exiting.")
        return

    # ── Scheduled mode (default) ──────────────────────────────────────────────
    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(
        run_cycle,
        CronTrigger(hour="0,4,8,12,16,20", minute=2),
        id="soul_ai_cycle",
        max_instances=1,
        misfire_grace_time=300,
        coalesce=True,
    )

    next_run = "00:02, 04:02, 08:02, 12:02, 16:02, 20:02 UTC"
    log.info(f"Scheduler active. Firing at: {next_run}")
    log.info("Press Ctrl+C to stop the agent gracefully.")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Agent shutting down gracefully.")
        telegram_bot.send_alert("STARTUP", "Soul AI agent stopped by user.")


if __name__ == "__main__":
    main()
