"""
telegram_bot.py — Telegram signal broadcaster for Soul AI Trade Agent.
Sends formatted trade signals and system alerts to a Telegram group/channel.
All send failures are logged and return False — Telegram is non-critical.
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Optional

log = logging.getLogger(__name__)


def _get_credentials() -> tuple[str, str]:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHANNEL_ID", "")
    return token, chat_id


async def _send_async(token: str, chat_id: str, text: str) -> bool:
    """Core async send using python-telegram-bot."""
    try:
        from telegram import Bot
        from telegram.error import TelegramError
        bot = Bot(token=token)
        await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
        return True
    except Exception as e:
        log.error(f"Telegram send failed: {e}")
        return False


def _send(text: str) -> bool:
    """Sync wrapper over the async send. Reads credentials from env."""
    token, chat_id = _get_credentials()
    if not token or not chat_id or "your_" in token:
        log.warning("Telegram credentials not configured — skipping send.")
        return False
    try:
        return asyncio.run(_send_async(token, chat_id, text))
    except RuntimeError:
        # Event loop already running (edge case in some environments)
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(_send_async(token, chat_id, text))
        finally:
            loop.close()


def _pips(entry: Optional[float], sl: Optional[float]) -> str:
    if entry is None or sl is None:
        return "?"
    return str(round(abs(entry - sl) * 10, 1))


def _rr_str(rr: Optional[float]) -> str:
    if rr is None:
        return "?"
    return str(round(rr, 1))


def format_signal(decision: dict, order_result: dict, timestamp_utc: Optional[datetime] = None) -> str:
    """
    Formats the Soul AI signal message for Telegram.
    Prefixed with [DRY RUN] when in paper trading mode.
    """
    if timestamp_utc is None:
        timestamp_utc = datetime.now(timezone.utc)

    mode = order_result.get("mode", "dry_run")
    prefix = "🔵 [DRY RUN] " if mode == "dry_run" else "🟢 "

    direction = decision.get("direction", "?")
    entry = decision.get("entry_price")
    sl = decision.get("stop_loss")
    tp1 = decision.get("take_profit_1")
    tp2 = decision.get("take_profit_2")
    tp3 = decision.get("take_profit_3")
    rr = decision.get("risk_reward")
    conviction = decision.get("conviction_score", "?")
    summary = decision.get("analysis_summary", "")
    ticket = order_result.get("order_id", "?")
    lots = order_result.get("lot_size", "?")

    direction_emoji = "📈" if direction == "BUY" else "📉"

    lines = [
        f"{prefix}<b>⬡ SOUL AI SIGNAL — XAUUSD</b>",
        f"",
        f"{direction_emoji} <b>Direction:</b> {direction}",
        f"🎯 <b>Entry:</b> {entry}",
        f"🛡 <b>SL:</b> {sl} ({_pips(entry, sl)} pips)",
        f"💰 <b>TP1:</b> {tp1} | <b>TP2:</b> {tp2} | <b>TP3:</b> {tp3}",
        f"⚖️ <b>R:R:</b> 1:{_rr_str(rr)}",
        f"🧠 <b>Conviction:</b> {conviction}/10",
        f"📦 <b>Lots:</b> {lots} | <b>Ticket:</b> {ticket}",
        f"",
        f"📝 {summary}",
        f"",
        f"🕐 {timestamp_utc.strftime('%Y-%m-%d %H:%M')} UTC",
        f"",
        f"<i>— The General | Soul AI TruthOS</i>",
    ]
    return "\n".join(lines)


def format_stand_down(decision: dict, timestamp_utc: Optional[datetime] = None) -> str:
    """Formats a brief stand-down notification."""
    if timestamp_utc is None:
        timestamp_utc = datetime.now(timezone.utc)

    conviction = decision.get("conviction_score", "?")
    reason = decision.get("stand_down_reason", "Insufficient confluence.")

    return (
        f"⬡ <b>SOUL AI — STAND DOWN</b>\n"
        f"\n"
        f"🔕 No trade this session.\n"
        f"🧠 Conviction: {conviction}/10 (need ≥8)\n"
        f"\n"
        f"📋 {reason}\n"
        f"\n"
        f"🕐 {timestamp_utc.strftime('%Y-%m-%d %H:%M')} UTC"
    )


def format_alert(alert_type: str, message: str) -> str:
    """Formats system alert messages."""
    icons = {
        "DAILY_HALT": "🚨",
        "ERROR": "⚠️",
        "STARTUP": "🟢",
    }
    icon = icons.get(alert_type, "ℹ️")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return (
        f"{icon} <b>SOUL AI — {alert_type}</b>\n"
        f"\n"
        f"{message}\n"
        f"\n"
        f"🕐 {now}"
    )


def send_signal(decision: dict, order_result: dict) -> bool:
    """Sends a trade signal to the configured Telegram channel."""
    text = format_signal(decision, order_result)
    success = _send(text)
    if success:
        log.info("Telegram signal sent successfully.")
    return success


def send_stand_down(decision: dict) -> bool:
    """Optionally sends a stand-down notification (can be toggled off to reduce noise)."""
    send_stand_downs = os.getenv("TELEGRAM_SEND_STAND_DOWN", "false").lower() == "true"
    if not send_stand_downs:
        return True
    text = format_stand_down(decision)
    return _send(text)


def send_alert(alert_type: str, message: str) -> bool:
    """Sends a system alert to the configured Telegram channel."""
    text = format_alert(alert_type, message)
    success = _send(text)
    if success:
        log.info(f"Telegram alert sent: {alert_type}")
    return success
