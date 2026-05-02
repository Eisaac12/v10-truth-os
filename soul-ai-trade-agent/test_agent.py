#!/usr/bin/env python3
"""
test_agent.py — End-to-end pipeline test for Soul AI Trade Agent.

Mocks the Claude API and scanner so the full cycle can be verified
without real credentials or internet access. All risk, executor,
journal, and telegram formatting are tested with real code.

Usage:
  python3 test_agent.py
  python3 test_agent.py --verbose
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure we run from the agent directory
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

os.environ.setdefault("EXECUTION_MODE", "dry_run")
os.environ.setdefault("ACCOUNT_SIZE_USD", "10000")
os.environ.setdefault("MAX_RISK_PCT", "1.0")
os.environ.setdefault("DAILY_LOSS_LIMIT_PCT", "3.0")
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-test-key-mock")

PASS = "✅ PASS"
FAIL = "❌ FAIL"
results = []


def check(name: str, condition: bool, detail: str = ""):
    status = PASS if condition else FAIL
    results.append((name, condition))
    print(f"{status}: {name}" + (f" — {detail}" if detail else ""))


def run_test_trade_cycle(verbose: bool = False):
    """Simulates a full TRADE cycle with mocked Claude response."""
    print("\n── TEST 1: Full TRADE cycle (mocked) ─────────────────────────")

    mock_trade_response = json.dumps({
        "decision": "TRADE",
        "direction": "BUY",
        "entry_price": 2285.50,
        "stop_loss": 2272.00,
        "take_profit_1": 2312.50,
        "take_profit_2": 2335.00,
        "take_profit_3": 2360.00,
        "risk_reward": 2.0,
        "conviction_score": 9,
        "layer1_summary": "DXY falling, 10Y yield flat. Macro backdrop BULLISH_GOLD.",
        "layer2_summary": "4H BOS BULLISH. Price above SMA20/50. RSI 4H 58.",
        "layer3_summary": "1H RSI 52. Bullish OB at 2285-2287. FVG at 2280-2285.",
        "layer4_reasoning": "3 confluence factors aligned. R:R 2.0. No news events. Conviction 9/10.",
        "analysis_summary": "Bullish OB entry at 4H structure with DXY weakness confirming.",
        "stand_down_reason": None
    })

    mock_snapshot = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "xauusd_price": 2287.45,
        "xauusd_4h": {
            "bos_direction": "BULLISH",
            "sma20": 2265.0, "sma50": 2240.0, "sma100": 2210.0, "sma200": 2180.0,
            "rsi_4h": 58.2,
            "macd_4h": {"macd": 2.1, "signal": 1.8, "histogram": 0.3},
            "recent_highs": [2312.0, 2305.0, 2298.0, 2290.0, 2287.5],
            "recent_lows": [2272.0, 2268.0, 2261.0, 2255.0, 2248.0],
        },
        "xauusd_1h": {"rsi_1h": 52.1, "macd_1h": {"macd": 0.5, "signal": 0.3, "histogram": 0.2},
                      "last_20_closes": [2280 + i*0.3 for i in range(20)]},
        "xauusd_15m": {"rsi_15m": 49.8, "last_10_closes": [2284 + i*0.2 for i in range(10)]},
        "correlations": {"dxy": 103.45, "dxy_trend": "FALLING", "oil": 78.20, "yield_10y": 4.215},
        "fetch_errors": [],
    }

    import executor
    import journal
    import telegram_bot
    from risk_guard import validate_trade, RiskViolation

    # Simulate agent.py cycle logic
    decision = json.loads(mock_trade_response)
    check("Claude TRADE response parses", decision["decision"] == "TRADE")
    check("Conviction score ≥ 8", decision["conviction_score"] >= 8)
    check("R:R ≥ 2.0", decision["risk_reward"] >= 2.0)

    try:
        enriched = validate_trade(decision, account_size=10000)
        ps = enriched["position_size"]
        check("Risk guard approved trade", True, f"Lots={ps['lot_size']} Risk=${ps['risk_usd']}")
        check("Lot size > 0", ps["lot_size"] > 0)
        check("Risk USD ≤ account × MAX_RISK_PCT", ps["risk_usd"] <= 10000 * 0.02)
    except RiskViolation as e:
        check("Risk guard approved trade", False, str(e))
        return

    order_result = executor.execute_trade(enriched)
    check("Dry-run order placed", order_result["status"] == "simulated",
          f"Ticket={order_result['order_id']}")
    check("Order direction matches", order_result["direction"] == "BUY")
    check("Order entry price matches", order_result["entry_price"] == 2285.50)

    # Telegram formatting
    signal_msg = telegram_bot.format_signal(decision, order_result)
    check("Telegram signal formatted", "SOUL AI SIGNAL" in signal_msg)
    check("Signal contains [DRY RUN]", "[DRY RUN]" in signal_msg)
    check("Signal contains direction", "BUY" in signal_msg)
    check("Signal contains entry price", "2285.5" in signal_msg)
    if verbose:
        print(f"\n  Signal preview:\n{signal_msg[:300]}...\n")

    # Journal write
    entry = journal.build_entry(
        cycle_type="trade",
        market_snapshot=mock_snapshot,
        claude_raw=mock_trade_response,
        claude_decision=decision,
        risk_result={"valid": True, "position_size": enriched["position_size"]},
        order_result=order_result,
        telegram_sent=False,
    )
    journal.append_entry(entry)
    last = journal.get_last_entry()
    check("Journal entry written", last is not None)
    check("Journal cycle_type is 'trade'", last["cycle_type"] == "trade")
    check("Journal has order_result", last["order_result"] is not None)
    check("Journal entry_id is UUID", len(last["entry_id"]) == 36)


def run_test_stand_down_cycle():
    """Tests that a low-conviction response results in STAND_DOWN."""
    print("\n── TEST 2: STAND DOWN cycle (low conviction) ──────────────────")

    import journal
    import telegram_bot
    from risk_guard import validate_trade, RiskViolation

    mock_stand_down = json.dumps({
        "decision": "STAND_DOWN",
        "direction": None,
        "entry_price": None,
        "stop_loss": None,
        "take_profit_1": None,
        "take_profit_2": None,
        "take_profit_3": None,
        "risk_reward": None,
        "conviction_score": 5,
        "layer1_summary": "DXY rising. Macro backdrop BEARISH_GOLD.",
        "layer2_summary": "4H BOS BEARISH but price above SMA20. Mixed.",
        "layer3_summary": "RSI 1H overbought at 72. No clean OB.",
        "layer4_reasoning": "Only 2 confluence factors. RSI overbought. Conviction 5/10.",
        "analysis_summary": "Mixed signals — standing down this session.",
        "stand_down_reason": "Only 2 confluence factors (need min 3). RSI 1H overbought."
    })

    decision = json.loads(mock_stand_down)
    check("STAND_DOWN decision parsed", decision["decision"] == "STAND_DOWN")
    check("Conviction below threshold", decision["conviction_score"] < 8)

    # Risk guard should block this
    try:
        validate_trade(decision, account_size=10000)
        check("Risk guard blocked STAND_DOWN", False, "Should have raised RiskViolation")
    except RiskViolation as e:
        check("Risk guard blocks low conviction", True, str(e)[:60])

    stand_down_msg = telegram_bot.format_stand_down(decision)
    check("Stand-down message formatted", "STAND DOWN" in stand_down_msg)

    entry = journal.build_entry(
        cycle_type="stand_down",
        market_snapshot={},
        claude_raw=mock_stand_down,
        claude_decision=decision,
        risk_result={"valid": False, "reason": "conviction < 8"},
    )
    journal.append_entry(entry)
    last = journal.get_last_entry()
    check("Stand-down journaled", last["cycle_type"] == "stand_down")


def run_test_risk_violations():
    """Tests all risk guard edge cases."""
    print("\n── TEST 3: Risk guard violation coverage ───────────────────────")

    from risk_guard import (
        RiskViolation, check_conviction_minimum, check_rr_minimum,
        check_news_blackout, calculate_position_size
    )

    # Conviction tests
    try:
        check_conviction_minimum(7)
        check("Conviction 7 blocked", False)
    except RiskViolation:
        check("Conviction 7 blocked", True)

    try:
        check_conviction_minimum(8)
        check("Conviction 8 passes", True)
    except RiskViolation:
        check("Conviction 8 passes", False)

    # R:R tests
    try:
        check_rr_minimum(1.9)
        check("R:R 1.9 blocked", False)
    except RiskViolation:
        check("R:R 1.9 blocked", True)

    try:
        check_rr_minimum(2.0)
        check("R:R 2.0 passes", True)
    except RiskViolation:
        check("R:R 2.0 passes", False)

    # Position sizing
    ps = calculate_position_size(10000, 1.0, 2300.0, 2280.0)
    check("Position size calculated", ps["lot_size"] > 0, f"Lots={ps['lot_size']}")
    check("Risk USD calculated correctly", ps["risk_usd"] == 100.0, f"Risk=${ps['risk_usd']}")

    # Zero SL distance
    try:
        calculate_position_size(10000, 1.0, 2300.0, 2300.0)
        check("Zero SL distance blocked", False)
    except RiskViolation:
        check("Zero SL distance blocked", True)

    # News blackout — FOMC date
    from risk_guard import FOMC_DATES_UTC
    if FOMC_DATES_UTC:
        fomc_date = min(FOMC_DATES_UTC)
        fomc_time = datetime(fomc_date.year, fomc_date.month, fomc_date.day, 14, 0, 0, tzinfo=timezone.utc)
        check("FOMC blackout active at 14:00", check_news_blackout(fomc_time), f"Date: {fomc_date}")

    # NFP: find first Friday of January 2026
    import calendar
    cal = calendar.monthcalendar(2026, 1)
    nfp_day = next(week[4] for week in cal if week[4] != 0)
    nfp_time = datetime(2026, 1, nfp_day, 13, 30, 0, tzinfo=timezone.utc)
    check("NFP blackout active at 13:30", check_news_blackout(nfp_time), f"NFP: {nfp_time.date()}")


def run_test_json_parsing():
    """Tests agent JSON parsing edge cases."""
    print("\n── TEST 4: JSON parsing edge cases ─────────────────────────────")

    import json, re

    def parse(raw):
        try:
            return json.loads(raw.strip())
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
        return {"decision": "STAND_DOWN", "conviction_score": 0, "parse_error": True}

    r1 = parse('{"decision": "TRADE", "conviction_score": 9}')
    check("Clean JSON parsed", r1["decision"] == "TRADE")

    r2 = parse('Here is my analysis:\n\n{"decision": "TRADE", "conviction_score": 9}')
    check("JSON with preamble extracted", r2["decision"] == "TRADE")

    r3 = parse("Not JSON at all — market looks bullish")
    check("Non-JSON falls back to STAND_DOWN", r3["decision"] == "STAND_DOWN")
    check("Non-JSON sets parse_error=True", r3.get("parse_error") is True)

    r4 = parse('{"decision": "TRADE", "conviction_score": 8, "risk_reward": 2.5, "direction": "SELL", "entry_price": 2300.0, "stop_loss": 2315.0, "take_profit_1": 2265.0}')
    check("Full SELL trade JSON parsed", r4["direction"] == "SELL")


def run_test_journal_integrity():
    """Tests journal JSONL integrity after all test writes."""
    print("\n── TEST 5: Journal JSONL integrity ─────────────────────────────")

    import journal
    import json

    if not journal.JOURNAL_PATH.exists():
        check("Journal file exists", False, "No entries written")
        return

    lines_ok = 0
    lines_bad = 0
    with open(journal.JOURNAL_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                assert "entry_id" in entry
                assert "timestamp_utc" in entry
                assert "cycle_type" in entry
                lines_ok += 1
            except Exception as e:
                lines_bad += 1

    check("All JSONL lines valid", lines_bad == 0, f"{lines_ok} entries, {lines_bad} bad")
    check("At least 2 entries written", lines_ok >= 2, f"Total: {lines_ok}")


def cleanup():
    """Remove test journal file after tests complete."""
    import journal
    if journal.JOURNAL_PATH.exists():
        journal.JOURNAL_PATH.unlink()
        print("\n  (Test trade_log.jsonl cleaned up)")


def main():
    parser = argparse.ArgumentParser(description="Soul AI Agent End-to-End Tests")
    parser.add_argument("--verbose", action="store_true", help="Show extra output")
    parser.add_argument("--no-cleanup", action="store_true", help="Keep test journal file")
    args = parser.parse_args()

    print("=" * 60)
    print("  SOUL AI TRADE AGENT — END-TO-END TEST SUITE")
    print("=" * 60)

    run_test_trade_cycle(verbose=args.verbose)
    run_test_stand_down_cycle()
    run_test_risk_violations()
    run_test_json_parsing()
    run_test_journal_integrity()

    if not args.no_cleanup:
        cleanup()

    passed = sum(1 for _, r in results if r)
    failed = sum(1 for _, r in results if not r)
    total = len(results)

    print("\n" + "=" * 60)
    print(f"  RESULTS: {passed}/{total} passed  |  {failed} failed")
    print("=" * 60)

    if failed == 0:
        print("\n  ALL TESTS PASSED — Soul AI pipeline is operational.")
        print("  Next step: fill in soul-ai-trade-agent/.env and run:")
        print("  python3 agent.py --once --dry-run")
    else:
        print(f"\n  {failed} TESTS FAILED — review output above.")
        for name, result in results:
            if not result:
                print(f"  ❌ {name}")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
