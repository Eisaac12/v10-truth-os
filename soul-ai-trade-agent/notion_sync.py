"""
notion_sync.py — Notion database sync for Soul AI Trade Agent.
Syncs trade journal entries to a Notion database.
All failures are non-blocking — errors are logged, never raised.

Required Notion database properties (create once manually):
  Entry ID         (title)
  Timestamp        (date)
  Cycle Type       (select): trade, stand_down, halt, error
  Session          (select): ASIAN, ASIAN_LATE, LONDON, NY_OPEN, NY_CLOSE, ASIAN_PRE
  Decision         (select): TRADE, STAND_DOWN
  Direction        (select): BUY, SELL
  Entry Price      (number)
  Stop Loss        (number)
  TP1              (number)
  Conviction Score (number)
  R:R              (number)
  Order Status     (select): simulated, filled, rejected, error
  Lots             (number)
  Analysis         (rich_text)
  Telegram Sent    (checkbox)
"""

import logging
import os
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)


def _get_client():
    """Returns a configured Notion client, or None if not configured."""
    token = os.getenv("NOTION_TOKEN", "")
    if not token or "your_" in token:
        return None
    try:
        from notion_client import Client
        return Client(auth=token)
    except Exception as e:
        log.error(f"Failed to initialize Notion client: {e}")
        return None


def _get_db_id() -> Optional[str]:
    db_id = os.getenv("NOTION_DATABASE_ID", "")
    if not db_id or "your_" in db_id:
        return None
    return db_id


def _build_page_properties(entry: dict) -> dict:
    """Converts a journal entry dict to Notion page properties format."""
    decision = entry.get("claude_decision", {})
    order = entry.get("order_result") or {}
    ts = entry.get("timestamp_utc", "")

    props = {
        "Entry ID": {
            "title": [{"text": {"content": entry.get("entry_id", "unknown")}}]
        },
        "Cycle Type": {
            "select": {"name": entry.get("cycle_type", "unknown")}
        },
        "Session": {
            "select": {"name": entry.get("session", "UNKNOWN")}
        },
        "Telegram Sent": {
            "checkbox": entry.get("telegram_sent", False)
        },
    }

    # Timestamp
    if ts:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(ts)
            props["Timestamp"] = {"date": {"start": dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")}}
        except Exception:
            pass

    # Decision fields
    if decision:
        if decision.get("decision"):
            props["Decision"] = {"select": {"name": decision["decision"]}}
        if decision.get("direction"):
            props["Direction"] = {"select": {"name": decision["direction"]}}
        if decision.get("entry_price") is not None:
            props["Entry Price"] = {"number": float(decision["entry_price"])}
        if decision.get("stop_loss") is not None:
            props["Stop Loss"] = {"number": float(decision["stop_loss"])}
        if decision.get("take_profit_1") is not None:
            props["TP1"] = {"number": float(decision["take_profit_1"])}
        if decision.get("conviction_score") is not None:
            props["Conviction Score"] = {"number": int(decision["conviction_score"])}
        if decision.get("risk_reward") is not None:
            props["R:R"] = {"number": float(decision["risk_reward"])}
        summary = decision.get("analysis_summary") or decision.get("stand_down_reason") or ""
        if summary:
            props["Analysis"] = {
                "rich_text": [{"text": {"content": summary[:2000]}}]
            }

    # Order fields
    if order:
        if order.get("status"):
            props["Order Status"] = {"select": {"name": order["status"]}}
        if order.get("lot_size") is not None:
            props["Lots"] = {"number": float(order["lot_size"])}

    return props


def sync_entry(entry: dict) -> bool:
    """Creates a new Notion page for a journal entry. Returns True on success."""
    client = _get_client()
    db_id = _get_db_id()

    if client is None or db_id is None:
        log.debug("Notion not configured — skipping sync.")
        return False

    try:
        props = _build_page_properties(entry)
        client.pages.create(
            parent={"database_id": db_id},
            properties=props,
        )
        log.info(f"Notion sync: entry {entry.get('entry_id')} created.")
        return True
    except Exception as e:
        log.error(f"Notion sync failed for entry {entry.get('entry_id')}: {e}")
        return False


def sync_pending_entries(journal_path: str) -> int:
    """
    On startup, reads trade_log.jsonl and syncs any entries where notion_synced=False.
    Returns count of newly synced entries.
    """
    import json
    from journal import mark_notion_synced

    client = _get_client()
    db_id = _get_db_id()
    if client is None or db_id is None:
        return 0

    path = Path(journal_path)
    if not path.exists():
        return 0

    synced_count = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                if not entry.get("notion_synced", False):
                    if sync_entry(entry):
                        mark_notion_synced(entry.get("entry_id", ""))
                        synced_count += 1
            except Exception:
                continue

    if synced_count > 0:
        log.info(f"Notion catch-up: synced {synced_count} pending entries.")
    return synced_count
