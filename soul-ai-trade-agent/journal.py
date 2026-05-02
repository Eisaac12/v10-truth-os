"""
journal.py — Append-only JSONL trade journal for Soul AI Trade Agent.
Every decision (TRADE or STAND_DOWN) is logged here with full context.
"""

import json
import logging
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)

JOURNAL_PATH = Path(__file__).parent / "trade_log.jsonl"


def _get_session(hour_utc: int) -> str:
    if 0 <= hour_utc < 4:
        return "ASIAN"
    if 4 <= hour_utc < 8:
        return "ASIAN_LATE"
    if 8 <= hour_utc < 12:
        return "LONDON"
    if 12 <= hour_utc < 16:
        return "NY_OPEN"
    if 16 <= hour_utc < 20:
        return "NY_CLOSE"
    return "ASIAN_PRE"


def build_entry(
    cycle_type: str,
    market_snapshot: dict,
    claude_raw: str,
    claude_decision: dict,
    risk_result: dict,
    order_result: Optional[dict] = None,
    telegram_sent: bool = False,
    notion_synced: bool = False,
    notes: str = "",
) -> dict:
    """
    Factory that builds a complete journal entry dict.
    cycle_type: 'trade' | 'stand_down' | 'halt' | 'error'
    """
    now = datetime.now(timezone.utc)
    return {
        "entry_id": str(uuid.uuid4()),
        "timestamp_utc": now.isoformat(),
        "cycle_type": cycle_type,
        "session": _get_session(now.hour),
        "market_snapshot": market_snapshot,
        "claude_raw_response": claude_raw,
        "claude_decision": claude_decision,
        "risk_validation": risk_result,
        "order_result": order_result,
        "telegram_sent": telegram_sent,
        "notion_synced": notion_synced,
        "notes": notes,
    }


def append_entry(entry: dict) -> None:
    """Thread-safe append of a single entry to trade_log.jsonl."""
    try:
        with open(JOURNAL_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, default=str) + "\n")
        log.debug(f"Journal entry written: {entry.get('entry_id')} ({entry.get('cycle_type')})")
    except Exception as e:
        log.error(f"Failed to write journal entry: {e}")


def read_today_entries(date_utc: Optional[date] = None) -> list:
    """Returns all journal entries from the given UTC date (defaults to today)."""
    if date_utc is None:
        date_utc = datetime.now(timezone.utc).date()

    if not JOURNAL_PATH.exists():
        return []

    entries = []
    with open(JOURNAL_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                ts = entry.get("timestamp_utc", "")
                entry_date = datetime.fromisoformat(ts).date()
                if entry_date == date_utc:
                    entries.append(entry)
            except Exception:
                continue
    return entries


def get_last_entry() -> Optional[dict]:
    """Returns the most recent journal entry without reading the entire file."""
    if not JOURNAL_PATH.exists():
        return None
    last = None
    with open(JOURNAL_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    last = json.loads(line)
                except Exception:
                    continue
    return last


def get_daily_pnl(date_utc: Optional[date] = None) -> float:
    """
    Sums realized P&L for the given UTC date from closed trade entries.
    Returns total loss as positive float (losses only; unrealized not counted).
    """
    entries = read_today_entries(date_utc)
    total_pnl = 0.0
    for entry in entries:
        order = entry.get("order_result")
        if order and order.get("status") in ("filled", "simulated"):
            pnl = order.get("realized_pnl_usd")
            if pnl is not None:
                total_pnl += float(pnl)
    return total_pnl


def read_unsynced_entries() -> list:
    """Returns all entries where notion_synced=False."""
    if not JOURNAL_PATH.exists():
        return []
    unsynced = []
    with open(JOURNAL_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                if not entry.get("notion_synced", False):
                    unsynced.append(entry)
            except Exception:
                continue
    return unsynced


def mark_notion_synced(entry_id: str) -> bool:
    """
    Rewrites trade_log.jsonl to mark the given entry as notion_synced=True.
    This is an in-place rewrite — only called after confirmed Notion success.
    """
    if not JOURNAL_PATH.exists():
        return False
    lines = []
    updated = False
    with open(JOURNAL_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                if entry.get("entry_id") == entry_id:
                    entry["notion_synced"] = True
                    updated = True
                lines.append(json.dumps(entry, default=str))
            except Exception:
                lines.append(line)

    if updated:
        with open(JOURNAL_PATH, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    return updated
