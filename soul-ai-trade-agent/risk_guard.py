"""
risk_guard.py — Hardcoded risk enforcement for Soul AI Trade Agent.
These rules are NEVER delegated to or overridden by LLM output.
All checks raise RiskViolation on failure.
"""

import json
import logging
import os
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

import pytz

log = logging.getLogger(__name__)

# FOMC meeting dates (UTC) for 2025–2026 — 14:00 UTC announcements
FOMC_DATES_UTC = {
    date(2025, 1, 29), date(2025, 3, 19), date(2025, 5, 7),
    date(2025, 6, 18), date(2025, 7, 30), date(2025, 9, 17),
    date(2025, 10, 29), date(2025, 12, 10),
    date(2026, 1, 28), date(2026, 3, 18), date(2026, 4, 29),
    date(2026, 6, 17), date(2026, 7, 29), date(2026, 9, 16),
    date(2026, 10, 28), date(2026, 12, 9),
}

BLACKOUT_WINDOW_MINUTES = 90  # ±90 min around high-impact events


class RiskViolation(Exception):
    """Raised when a hardcoded risk rule is violated."""
    pass


def check_conviction_minimum(score: int, minimum: int = 8) -> None:
    if score < minimum:
        raise RiskViolation(
            f"Conviction score {score}/10 is below minimum {minimum}/10. STAND DOWN."
        )


def check_rr_minimum(risk_reward: float, minimum: float = 2.0) -> None:
    if risk_reward is None or risk_reward < minimum:
        raise RiskViolation(
            f"R:R {risk_reward} is below minimum 1:{minimum}. STAND DOWN."
        )


def calculate_position_size(
    account_size: float,
    risk_pct: float,
    entry: float,
    stop_loss: float,
) -> dict:
    """
    Calculate lot size for XAUUSD.
    XAUUSD: 1 standard lot = 100 oz; pip = $0.01; pip value per lot = $1.00.
    Caps at env var MAX_RISK_PCT.
    """
    max_risk_pct = float(os.getenv("MAX_RISK_PCT", 1.0))
    effective_risk_pct = min(risk_pct, max_risk_pct)
    risk_usd = account_size * (effective_risk_pct / 100)

    stop_distance = abs(entry - stop_loss)
    if stop_distance == 0:
        raise RiskViolation("Stop loss equals entry price — invalid trade parameters.")

    # XAUUSD: 1 pip = $0.01 price move; 1 lot = 100 oz; pip value = $1 per lot
    stop_pips = stop_distance * 100
    pip_value_per_lot = 1.0
    lot_size = risk_usd / (stop_pips * pip_value_per_lot)
    lot_size = max(0.01, round(lot_size, 2))

    return {
        "lot_size": lot_size,
        "risk_usd": round(risk_usd, 2),
        "risk_pct": effective_risk_pct,
        "stop_pips": round(stop_pips, 1),
    }


def _is_first_friday(dt_utc: datetime) -> bool:
    """Returns True if dt_utc falls on the first Friday of the month (NFP day)."""
    d = dt_utc.date()
    if d.weekday() != 4:  # 4 = Friday
        return False
    return d.day <= 7


def check_news_blackout(timestamp_utc: datetime) -> bool:
    """
    Returns True if trading is currently blocked due to a high-impact news event.
    Blocks: NFP (first Friday 13:30 UTC ± 90min), FOMC (14:00 UTC ± 90min).
    """
    if timestamp_utc.tzinfo is None:
        timestamp_utc = timestamp_utc.replace(tzinfo=timezone.utc)

    today = timestamp_utc.date()
    hour = timestamp_utc.hour
    minute = timestamp_utc.minute
    current_minutes = hour * 60 + minute

    # NFP: first Friday of month, 13:30 UTC
    if _is_first_friday(timestamp_utc):
        nfp_minutes = 13 * 60 + 30
        if abs(current_minutes - nfp_minutes) <= BLACKOUT_WINDOW_MINUTES:
            return True

    # FOMC: known dates, 14:00 UTC
    if today in FOMC_DATES_UTC:
        fomc_minutes = 14 * 60
        if abs(current_minutes - fomc_minutes) <= BLACKOUT_WINDOW_MINUTES:
            return True

    return False


def load_daily_pnl(journal_path: str, account_size: float, date_utc: Optional[date] = None) -> float:
    """
    Reads trade_log.jsonl and sums realized P&L for the given UTC date.
    Returns loss as a positive float (e.g., 250.0 means $250 lost).
    Counts only entries where order_result.status is 'filled' or 'simulated'.
    """
    if date_utc is None:
        date_utc = datetime.now(timezone.utc).date()

    path = Path(journal_path)
    if not path.exists():
        return 0.0

    total_loss = 0.0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                entry_ts = entry.get("timestamp_utc", "")
                entry_date = datetime.fromisoformat(entry_ts).date()
                if entry_date != date_utc:
                    continue
                order_result = entry.get("order_result")
                if order_result and order_result.get("status") in ("filled", "simulated"):
                    pnl = order_result.get("realized_pnl_usd", 0.0)
                    if pnl is not None and pnl < 0:
                        total_loss += abs(pnl)
            except Exception:
                continue

    return total_loss


def check_daily_loss_limit(
    journal_path: str,
    account_size: float,
    limit_pct: float = 3.0,
) -> None:
    """
    Raises RiskViolation if today's realized losses exceed limit_pct of account.
    """
    daily_loss = load_daily_pnl(journal_path, account_size)
    limit_usd = account_size * (limit_pct / 100)
    if daily_loss >= limit_usd:
        raise RiskViolation(
            f"Daily loss limit hit: ${daily_loss:.2f} lost today "
            f"(limit: ${limit_usd:.2f} = {limit_pct}% of ${account_size:.2f}). "
            "AGENT HALTED for today."
        )


def validate_trade(decision: dict, account_size: float) -> dict:
    """
    Runs all risk checks on a proposed TRADE decision.
    Returns an enriched decision dict with position_size attached.
    Raises RiskViolation on any failure.
    """
    check_conviction_minimum(decision.get("conviction_score", 0))
    check_rr_minimum(decision.get("risk_reward"))

    entry = decision.get("entry_price")
    sl = decision.get("stop_loss")
    tp1 = decision.get("take_profit_1")

    if entry is None or sl is None or tp1 is None:
        raise RiskViolation("Missing entry_price, stop_loss, or take_profit_1 in decision.")

    if decision.get("direction") == "BUY" and sl >= entry:
        raise RiskViolation(f"BUY trade: SL ({sl}) must be below entry ({entry}).")
    if decision.get("direction") == "SELL" and sl <= entry:
        raise RiskViolation(f"SELL trade: SL ({sl}) must be above entry ({entry}).")

    now_utc = datetime.now(timezone.utc)
    if check_news_blackout(now_utc):
        raise RiskViolation(
            f"News blackout active at {now_utc.strftime('%H:%M UTC')}. "
            "No trading during NFP/FOMC windows."
        )

    risk_pct = float(os.getenv("MAX_RISK_PCT", 1.0))
    position_size = calculate_position_size(account_size, risk_pct, entry, sl)

    enriched = dict(decision)
    enriched["position_size"] = position_size
    return enriched
