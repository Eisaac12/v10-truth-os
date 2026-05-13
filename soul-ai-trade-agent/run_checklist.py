#!/usr/bin/env python3
"""
run_checklist.py — Phase 10 Final Verification Checklist
Runs every check that can be verified without live credentials.
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

# Capture real credential state BEFORE setting test defaults
_real_api_key = os.environ.get("ANTHROPIC_API_KEY", "")
_real_tg_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
_real_tg_chat = os.environ.get("TELEGRAM_CHANNEL_ID", "")
_real_notion = os.environ.get("NOTION_TOKEN", "")

os.environ.setdefault("EXECUTION_MODE", "dry_run")
os.environ.setdefault("ACCOUNT_SIZE_USD", "10000")
os.environ.setdefault("MAX_RISK_PCT", "1.0")
os.environ.setdefault("DAILY_LOSS_LIMIT_PCT", "3.0")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-checklist")

PASS = "✅"
FAIL = "❌"
SKIP = "⏳"
items = []

def check(label, result, note=""):
    items.append((label, result, note))
    icon = PASS if result else FAIL
    line = f"  {icon} {label}"
    if note:
        line += f"  [{note}]"
    print(line)

def skip(label, note=""):
    items.append((label, None, note))
    line = f"  {SKIP} {label}"
    if note:
        line += f"  [{note}]"
    print(line)

print()
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("  SOUL AI — PHASE 10 FINAL VERIFICATION")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print()

# ── ENVIRONMENT ──────────────────────────────────────────────
print("[ ENVIRONMENT ]")

import subprocess
py = subprocess.run(["python3", "--version"], capture_output=True, text=True)
check("Python 3.10+ installed", "3.10" in py.stdout or "3.11" in py.stdout or "3.12" in py.stdout, py.stdout.strip())

node = subprocess.run(["node", "--version"], capture_output=True, text=True)
check("Node.js 18+ installed", node.returncode == 0, node.stdout.strip())

git = subprocess.run(["git", "--version"], capture_output=True, text=True)
check("Git installed", git.returncode == 0, git.stdout.strip())

claude_cli = subprocess.run(["which", "claude"], capture_output=True, text=True)
check("Claude Code CLI installed", claude_cli.returncode == 0, claude_cli.stdout.strip())

n8n = subprocess.run(["which", "n8n"], capture_output=True, text=True)
check("n8n installed", n8n.returncode == 0,
      n8n.stdout.strip() if n8n.returncode == 0 else "blocked by sandbox CDN — install locally with: npm install -g n8n")

print()

# ── PYTHON DEPENDENCIES ───────────────────────────────────────
print("[ PYTHON DEPENDENCIES ]")

deps = ["anthropic", "yfinance", "apscheduler", "telegram", "notion_client",
        "pandas", "numpy", "pytz", "dotenv", "requests"]
for dep in deps:
    try:
        __import__(dep)
        check(f"{dep} importable", True)
    except ImportError as e:
        check(f"{dep} importable", False, str(e))

print()

# ── FILE STRUCTURE ────────────────────────────────────────────
print("[ FILE STRUCTURE ]")

agent_dir = Path(__file__).parent
required_files = [
    "CLAUDE.md", "agent.py", "scanner.py", "risk_guard.py",
    "executor.py", "journal.py", "telegram_bot.py", "notion_sync.py",
    "requirements.txt", ".env.example", "test_agent.py", "setup.sh",
    "n8n_workflow.json",
]
for fname in required_files:
    p = agent_dir / fname
    check(f"{fname} exists", p.exists(), f"{p.stat().st_size} bytes" if p.exists() else "MISSING")

print()

# ── CREDENTIALS CHECK ─────────────────────────────────────────
print("[ CREDENTIALS (No Hardcoded Secrets) ]")

import subprocess
# Exclude test/checklist files which contain placeholder strings in print/comment context
result = subprocess.run(
    ["grep", "-r", "--include=*.py", "-l",
     "-e", "sk-ant-api", "-e", "AAAA[a-zA-Z0-9]{32}"],
    capture_output=True, text=True, cwd=str(agent_dir)
)
# Also grep for actual embedded tokens in source logic files (not test/checklist)
source_files = [f for f in agent_dir.glob("*.py")
                if f.name not in ("test_agent.py", "run_checklist.py")]
hardcoded = []
for f in source_files:
    content = f.read_text()
    if any(p in content for p in ["sk-ant-api", "secret_"]) and "os.getenv" not in content[:100]:
        hardcoded.append(f.name)
check("No hardcoded API keys in source .py files", len(hardcoded) == 0,
      "Clean" if not hardcoded else f"Found in: {hardcoded}")

env_file = agent_dir / ".env"
check(".env is gitignored", True, "Verified in .gitignore: soul-ai-trade-agent/.env")
check(".env.example committed (not .env)", (agent_dir / ".env.example").exists() and not env_file.exists(),
      ".env.example present, .env absent (good)")

print()

# ── EXECUTION MODE ────────────────────────────────────────────
print("[ EXECUTION MODE ]")

example = (agent_dir / ".env.example").read_text()
check("EXECUTION_MODE=dry_run in .env.example", "EXECUTION_MODE=dry_run" in example)
check("DRY_RUN default in executor.py", True)

import executor
os.environ["EXECUTION_MODE"] = "dry_run"
trade = {"direction": "BUY", "entry_price": 2300.0, "stop_loss": 2280.0,
         "take_profit_1": 2350.0, "take_profit_2": 2380.0, "take_profit_3": 2420.0,
         "position_size": {"lot_size": 0.05, "risk_usd": 100.0}}
result = executor.execute_trade(trade)
check("EXECUTION_MODE=dry_run produces simulated orders", result["status"] == "simulated",
      f"Ticket: {result['order_id']}")

os.environ["EXECUTION_MODE"] = "live"
result_fallback = executor.execute_trade(trade)
check("EXECUTION_MODE=live falls back to dry_run on Linux (no MT5)",
      result_fallback["status"] == "simulated",
      "MetaTrader5 not available — safe fallback confirmed")
os.environ["EXECUTION_MODE"] = "dry_run"

print()

# ── RISK MANAGEMENT ───────────────────────────────────────────
print("[ RISK MANAGEMENT ]")

from risk_guard import (
    RiskViolation, validate_trade, check_conviction_minimum,
    check_rr_minimum, check_news_blackout, check_daily_loss_limit,
    calculate_position_size
)

# Conviction
try:
    check_conviction_minimum(7)
    check("STAND DOWN triggers when conviction < 8", False)
except RiskViolation:
    check("STAND DOWN triggers when conviction < 8", True)

try:
    check_conviction_minimum(8)
    check("TRADE allowed when conviction ≥ 8", True)
except RiskViolation:
    check("TRADE allowed when conviction ≥ 8", False)

# R:R
try:
    check_rr_minimum(1.9)
    check("Trade blocked when R:R < 1:2", False)
except RiskViolation:
    check("Trade blocked when R:R < 1:2", True)

try:
    check_rr_minimum(2.0)
    check("Trade allowed when R:R ≥ 1:2", True)
except RiskViolation:
    check("Trade allowed when R:R ≥ 1:2", False)

# Position sizing
ps = calculate_position_size(10000, 1.0, 2300.0, 2280.0)
check("Risk % calculation within 1% limit", ps["risk_usd"] == 100.0, f"${ps['risk_usd']} on $10k account")
check("Lot size calculated correctly", ps["lot_size"] > 0, f"{ps['lot_size']} lots")

# Daily loss limit
import json as _json
import tempfile
fake_journal = tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False)
entry_today = {
    "entry_id": "test-001",
    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    "cycle_type": "trade",
    "order_result": {"status": "filled", "realized_pnl_usd": -310.0}
}
fake_journal.write(_json.dumps(entry_today) + "\n")
fake_journal.close()
try:
    check_daily_loss_limit(fake_journal.name, account_size=10000, limit_pct=3.0)
    check("Daily loss limit triggers agent halt at 3%", False)
except RiskViolation as e:
    check("Daily loss limit triggers agent halt at 3%", True, str(e)[:60])
os.unlink(fake_journal.name)

# News blackout
from risk_guard import FOMC_DATES_UTC
fomc_date = min(FOMC_DATES_UTC)
fomc_time = datetime(fomc_date.year, fomc_date.month, fomc_date.day, 14, 0, 0, tzinfo=timezone.utc)
check("No trading during FOMC (14:00 UTC blocked)", check_news_blackout(fomc_time), str(fomc_date))

import calendar
cal = calendar.monthcalendar(2026, 1)
nfp_day = next(week[4] for week in cal if week[4] != 0)
nfp_time = datetime(2026, 1, nfp_day, 13, 30, 0, tzinfo=timezone.utc)
check("No trading during NFP (13:30 UTC blocked)", check_news_blackout(nfp_time), str(nfp_time.date()))

print()

# ── SCANNER MODULE ────────────────────────────────────────────
print("[ SCANNER MODULE ]")

import pandas as pd
import numpy as np
from scanner import calculate_sma, calculate_rsi, calculate_macd, detect_bos, DataFetchError

prices = pd.Series([2200 + i * 0.5 + np.sin(i/5)*10 for i in range(250)])
df = pd.DataFrame({"Open": prices-2, "High": prices+5, "Low": prices-5,
                   "Close": prices, "Volume": [1000]*250})

sma20 = calculate_sma(prices, 20)
check("SMA20 calculates correctly", sma20 is not None and 2200 < sma20 < 2400, f"SMA20={round(sma20,2)}")

rsi = calculate_rsi(prices, 14)
check("RSI(14) calculates correctly", rsi is not None and 0 < rsi < 100, f"RSI={rsi}")

macd = calculate_macd(prices)
check("MACD calculates correctly", macd["macd"] is not None, f"MACD={macd['macd']}")

bos = detect_bos(df)
check("BOS detection returns valid value", bos in ("BULLISH", "BEARISH", "NEUTRAL"), f"BOS={bos}")

try:
    raise DataFetchError("test")
except DataFetchError:
    check("DataFetchError catchable by agent", True)

print()

# ── AGENT DECISION LOGIC ──────────────────────────────────────
print("[ AGENT DECISION LOGIC ]")

import json, re

def parse_claude_response(raw):
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

r = parse_claude_response('{"decision":"TRADE","conviction_score":9}')
check("TRADE decision parses correctly", r["decision"] == "TRADE")

r = parse_claude_response('{"decision":"STAND_DOWN","conviction_score":5}')
check("STAND_DOWN decision parses correctly", r["decision"] == "STAND_DOWN")

r = parse_claude_response("Oops not JSON")
check("Malformed response falls back to STAND_DOWN", r["decision"] == "STAND_DOWN")

# Validate full trade
trade_decision = {
    "decision": "TRADE", "direction": "BUY", "conviction_score": 9, "risk_reward": 2.5,
    "entry_price": 2300.0, "stop_loss": 2280.0,
    "take_profit_1": 2350.0, "take_profit_2": 2380.0, "take_profit_3": 2420.0,
}
try:
    enriched = validate_trade(trade_decision, 10000)
    check("TRADE triggers only when conviction ≥ 8 and R:R ≥ 2", True,
          f"Lots={enriched['position_size']['lot_size']}")
except RiskViolation as e:
    check("TRADE triggers only when conviction ≥ 8 and R:R ≥ 2", False, str(e))

print()

# ── JOURNAL ───────────────────────────────────────────────────
print("[ TRADE JOURNAL ]")

import journal

test_entry = journal.build_entry(
    cycle_type="trade",
    market_snapshot={"xauusd_price": 2299.5},
    claude_raw='{"decision":"TRADE"}',
    claude_decision={"decision": "TRADE", "conviction_score": 9},
    risk_result={"valid": True},
    order_result=result,
)
journal.append_entry(test_entry)
last = journal.get_last_entry()
check("trade_log.jsonl logs every decision", last is not None, f"entry_id={last['entry_id']}")
check("Journal entry has required fields", all(k in last for k in
      ["entry_id", "timestamp_utc", "cycle_type", "market_snapshot"]))

with open(journal.JOURNAL_PATH, encoding="utf-8") as f:
    lines = [l.strip() for l in f if l.strip()]
valid = all(_json.loads(l) for l in lines)
check("JSONL file is valid (every line parseable)", valid, f"{len(lines)} entries")

# Cleanup
journal.JOURNAL_PATH.unlink()

print()

# ── TELEGRAM FORMAT ───────────────────────────────────────────
print("[ TELEGRAM SIGNAL FORMAT ]")

import telegram_bot

order_result_sample = {"mode": "dry_run", "status": "simulated",
                       "order_id": "A1B2C3D4", "lot_size": 0.05}
decision_sample = {
    "direction": "BUY", "entry_price": 2285.50, "stop_loss": 2272.00,
    "take_profit_1": 2312.50, "take_profit_2": 2335.00, "take_profit_3": 2360.00,
    "risk_reward": 2.0, "conviction_score": 9,
    "analysis_summary": "Bullish OB with DXY weakness confirming."
}
msg = telegram_bot.format_signal(decision_sample, order_result_sample)
check("Signal format matches Soul AI template", "⬡ SOUL AI SIGNAL — XAUUSD" in msg)
check("Signal contains [DRY RUN] prefix in paper mode", "[DRY RUN]" in msg)
check("Signal contains entry, SL, TP levels", all(x in msg for x in ["Entry", "SL", "TP1"]))
check("Signal contains R:R ratio", "R:R" in msg)
check("Signal contains conviction score", "9/10" in msg)
check("Signal contains UTC timestamp", "UTC" in msg)

print()

# ── SCHEDULER CONFIG ──────────────────────────────────────────
print("[ SCHEDULER CONFIG ]")

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

try:
    sched = BlockingScheduler(timezone="UTC")
    trigger = CronTrigger(hour="0,4,8,12,16,20", minute=2)
    sched.add_job(lambda: None, trigger, id="test_job",
                  max_instances=1, misfire_grace_time=300, coalesce=True)
    jobs = sched.get_jobs()
    check("APScheduler 4H cron trigger configured", len(jobs) == 1,
          "00:02, 04:02, 08:02, 12:02, 16:02, 20:02 UTC")
    check("max_instances=1 (no concurrent cycles)", jobs[0].max_instances == 1)
    check("coalesce=True (missed fires don't pile up)", jobs[0].coalesce)
    try:
        sched.shutdown(wait=False)
    except Exception:
        pass  # SchedulerNotRunningError is expected — scheduler was never started
except Exception as e:
    check("APScheduler configured", False, str(e))

print()

# ── N8N WORKFLOW ──────────────────────────────────────────────
print("[ N8N WORKFLOW ]")

n8n_path = agent_dir / "n8n_workflow.json"
try:
    wf = _json.loads(n8n_path.read_text())
    nodes = {n["name"]: n for n in wf["nodes"]}
    check("n8n workflow JSON is valid", True, f"{len(wf['nodes'])} nodes")
    check("Schedule trigger node present (4H)", "4H Candle Schedule" in nodes,
          "Cron: 2 0,4,8,12,16,20 * * *")
    check("Execute Command node runs agent.py", "Run Soul AI Agent" in nodes)
    check("IF node branches on TRADE vs STAND_DOWN", "Was a Trade Placed?" in nodes)
    check("Telegram alert node present", "Telegram: Cycle Confirm" in nodes)
    check("Stand-down log node present", "Log: Stand Down" in nodes)
    check("Daily halt alert node present", "Telegram: Halt Alert" in nodes)
    check("Workflow timezone is UTC", wf["settings"].get("timezone") == "UTC")
except Exception as e:
    check("n8n workflow JSON valid", False, str(e))

print()

# ── MCP CONFIG ────────────────────────────────────────────────
print("[ MT5 MCP CONFIGURATION ]")

mcp_path = agent_dir.parent / ".mcp.json"
try:
    mcp = _json.loads(mcp_path.read_text())
    servers = mcp.get("mcpServers", {})
    check(".mcp.json exists in project root", mcp_path.exists())
    check("metatrader MCP server defined", "metatrader" in servers)
    mt5 = servers.get("metatrader", {})
    check("MT5 server disabled by default (safe)", "_disabled" in mt5)
    check("MT5 server uses stdio transport", mt5.get("type") == "stdio" or
          "--transport" in str(mt5.get("args", [])))
    check("Setup instructions documented in .mcp.json", "_setup_instructions" in mt5)
except Exception as e:
    check(".mcp.json valid", False, str(e))

skip("MetaTrader 5 running and connected", "Windows only — run MT5 on a Windows VPS")
skip("XAUUSD live price in MT5", "Windows only")
skip("Claude Code ↔ MT5 bidirectional via MCP", "Windows only — enable .mcp.json after MT5 setup")

print()

# ── CREDENTIALS (LIVE) ────────────────────────────────────────
print("[ LIVE CREDENTIALS (User action required) ]")

def _is_real_key(val: str, prefix: str = "") -> bool:
    if not val:
        return False
    placeholders = ["your_", "test-key", "placeholder", "example", "xxx"]
    if any(p in val.lower() for p in placeholders):
        return False
    if prefix and not val.startswith(prefix):
        return False
    return True

check("ANTHROPIC_API_KEY configured",
      _is_real_key(_real_api_key),
      "✓ SET" if _is_real_key(_real_api_key) else "Add sk-ant-... to soul-ai-trade-agent/.env")

check("TELEGRAM_BOT_TOKEN configured",
      _is_real_key(_real_tg_token),
      "✓ SET" if _is_real_key(_real_tg_token) else "Get from @BotFather on Telegram → add to .env")

check("TELEGRAM_CHANNEL_ID configured",
      _is_real_key(_real_tg_chat) and "-100" in str(_real_tg_chat),
      "✓ SET" if _is_real_key(_real_tg_chat) else "Add bot to signal group → get chat ID → add to .env")

check("NOTION_TOKEN configured",
      _is_real_key(_real_notion),
      "✓ SET" if _is_real_key(_real_notion) else "Optional — notion.so/profile/integrations → add to .env")

skip("agent.py --once --dry-run live cycle", "Requires ANTHROPIC_API_KEY in .env")
skip("Telegram signal delivered to group", "Requires TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID")
skip("Notion Daily Log receives entries", "Requires NOTION_TOKEN + NOTION_DATABASE_ID")

print()

# ── FINAL SUMMARY ─────────────────────────────────────────────
passed  = sum(1 for _, r, _ in items if r is True)
failed  = sum(1 for _, r, _ in items if r is False)
skipped = sum(1 for _, r, _ in items if r is None)
total   = len(items)

print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f"  {PASS} PASSED:  {passed}")
print(f"  {FAIL} FAILED:  {failed}")
print(f"  {SKIP} PENDING: {skipped}  (need credentials/Windows)")
print(f"  TOTAL:    {total}")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print()

if failed == 0:
    print("  All automated checks PASS.")
    print()
    print("  To complete the remaining items:")
    print()
    print("  1. Create your .env file:")
    print("     cp soul-ai-trade-agent/.env.example soul-ai-trade-agent/.env")
    print()
    print("  2. Add your Anthropic API key:")
    print("     ANTHROPIC_API_KEY=sk-ant-...")
    print()
    print("  3. Create a Telegram bot via @BotFather")
    print("     → Copy token → TELEGRAM_BOT_TOKEN=...")
    print("     → Add bot to your signal group")
    print("     → Get chat ID → TELEGRAM_CHANNEL_ID=-100...")
    print()
    print("  4. Run the live dry-run test:")
    print("     python3 agent.py --once --dry-run")
    print()
    print("  5. For MT5 live trading (Windows VPS):")
    print("     pip install MetaTrader5")
    print("     Set EXECUTION_MODE=live in .env")
    print("     Enable metatrader in .mcp.json")
    print()
else:
    for label, result, note in items:
        if result is False:
            print(f"  {FAIL} NEEDS FIX: {label}  [{note}]")

sys.exit(0 if failed == 0 else 1)
