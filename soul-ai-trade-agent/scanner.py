"""
scanner.py — Live market data fetcher for Soul AI Trade Agent.
Fetches XAUUSD, DXY, Oil, and US 10Y yield via yfinance.
All failures on correlated assets are non-fatal; XAUUSD failure aborts the cycle.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf

log = logging.getLogger(__name__)

SYMBOLS = {
    "xauusd": "XAUUSD=X",
    "dxy": "DX-Y.NYB",
    "oil": "CL=F",
    "yield10": "^TNX",
}


class DataFetchError(Exception):
    """Raised when XAUUSD data is unavailable — aborts the current cycle."""
    pass


def _fetch_history(symbol: str, period: str, interval: str) -> pd.DataFrame:
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)
    if df.empty:
        raise DataFetchError(f"Empty response for {symbol} (period={period}, interval={interval})")
    return df


def calculate_sma(series: pd.Series, period: int) -> Optional[float]:
    if len(series) < period:
        return None
    val = series.rolling(period).mean().iloc[-1]
    return float(val) if not np.isnan(val) else None


def calculate_rsi(series: pd.Series, period: int = 14) -> Optional[float]:
    if len(series) < period + 1:
        return None
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean().iloc[-1]
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean().iloc[-1]
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(float(100 - (100 / (1 + rs))), 2)


def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
    if len(series) < slow + signal:
        return {"macd": None, "signal": None, "histogram": None}
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return {
        "macd": round(float(macd_line.iloc[-1]), 4),
        "signal": round(float(signal_line.iloc[-1]), 4),
        "histogram": round(float(histogram.iloc[-1]), 4),
    }


def detect_bos(df: pd.DataFrame) -> str:
    """
    Break of Structure on 4H data.
    Compares last close to recent swing high/low to determine directional bias.
    """
    if len(df) < 20:
        return "NEUTRAL"
    closes = df["Close"]
    highs = df["High"]
    lows = df["Low"]
    last_close = float(closes.iloc[-1])

    # Look at the last 20 candles for swing structure
    recent_high = float(highs.iloc[-20:-1].max())
    recent_low = float(lows.iloc[-20:-1].min())
    mid = (recent_high + recent_low) / 2

    if last_close > recent_high * 0.998:
        return "BULLISH"
    elif last_close < recent_low * 1.002:
        return "BEARISH"
    elif last_close > mid:
        return "BULLISH"
    elif last_close < mid:
        return "BEARISH"
    return "NEUTRAL"


def get_swing_levels(df: pd.DataFrame, n: int = 5) -> dict:
    """Returns the last n swing highs and lows from OHLCV data."""
    highs = df["High"].nlargest(n).sort_index().round(2).tolist()
    lows = df["Low"].nsmallest(n).sort_index().round(2).tolist()
    return {"recent_highs": highs, "recent_lows": lows}


def _get_dxy_trend(df: pd.DataFrame) -> str:
    if len(df) < 20:
        return "UNKNOWN"
    sma5 = calculate_sma(df["Close"], 5)
    sma20 = calculate_sma(df["Close"], 20)
    if sma5 is None or sma20 is None:
        return "UNKNOWN"
    if sma5 > sma20:
        return "RISING"
    elif sma5 < sma20:
        return "FALLING"
    return "FLAT"


def scan_market() -> dict:
    """
    Master market scan. Fetches all required data and returns a MarketSnapshot dict.
    Raises DataFetchError if XAUUSD data is unavailable.
    """
    fetch_errors = []
    timestamp = datetime.now(timezone.utc).isoformat()

    # ── XAUUSD 4H (primary — hard fail if unavailable) ──────────────────────
    try:
        df_4h = _fetch_history(SYMBOLS["xauusd"], period="60d", interval="4h")
    except Exception as e:
        raise DataFetchError(f"XAUUSD 4H fetch failed: {e}")

    closes_4h = df_4h["Close"]
    xauusd_price = round(float(closes_4h.iloc[-1]), 2)

    sma20 = calculate_sma(closes_4h, 20)
    sma50 = calculate_sma(closes_4h, 50)
    sma100 = calculate_sma(closes_4h, 100)
    sma200 = calculate_sma(closes_4h, 200)
    rsi_4h = calculate_rsi(closes_4h, 14)
    macd_4h = calculate_macd(closes_4h)
    bos = detect_bos(df_4h)
    swings = get_swing_levels(df_4h, 5)

    xauusd_4h = {
        "bos_direction": bos,
        "sma20": round(sma20, 2) if sma20 else None,
        "sma50": round(sma50, 2) if sma50 else None,
        "sma100": round(sma100, 2) if sma100 else None,
        "sma200": round(sma200, 2) if sma200 else None,
        "rsi_4h": rsi_4h,
        "macd_4h": macd_4h,
        "recent_highs": swings["recent_highs"],
        "recent_lows": swings["recent_lows"],
    }

    # ── XAUUSD 1H ────────────────────────────────────────────────────────────
    try:
        df_1h = _fetch_history(SYMBOLS["xauusd"], period="7d", interval="1h")
        closes_1h = df_1h["Close"]
        xauusd_1h = {
            "rsi_1h": calculate_rsi(closes_1h, 14),
            "macd_1h": calculate_macd(closes_1h),
            "last_20_closes": [round(float(c), 2) for c in closes_1h.iloc[-20:].tolist()],
        }
    except Exception as e:
        fetch_errors.append(f"XAUUSD 1H: {e}")
        xauusd_1h = {"rsi_1h": None, "macd_1h": {}, "last_20_closes": []}

    # ── XAUUSD 15M ───────────────────────────────────────────────────────────
    try:
        df_15m = _fetch_history(SYMBOLS["xauusd"], period="2d", interval="15m")
        closes_15m = df_15m["Close"]
        xauusd_15m = {
            "rsi_15m": calculate_rsi(closes_15m, 14),
            "last_10_closes": [round(float(c), 2) for c in closes_15m.iloc[-10:].tolist()],
        }
    except Exception as e:
        fetch_errors.append(f"XAUUSD 15M: {e}")
        xauusd_15m = {"rsi_15m": None, "last_10_closes": []}

    # ── Correlated Assets (non-fatal) ─────────────────────────────────────────
    correlations = {}

    try:
        df_dxy = _fetch_history(SYMBOLS["dxy"], period="30d", interval="1d")
        correlations["dxy"] = round(float(df_dxy["Close"].iloc[-1]), 3)
        correlations["dxy_trend"] = _get_dxy_trend(df_dxy)
    except Exception as e:
        fetch_errors.append(f"DXY: {e}")
        correlations["dxy"] = None
        correlations["dxy_trend"] = "UNKNOWN"

    try:
        df_oil = _fetch_history(SYMBOLS["oil"], period="5d", interval="1d")
        correlations["oil"] = round(float(df_oil["Close"].iloc[-1]), 2)
    except Exception as e:
        fetch_errors.append(f"Oil: {e}")
        correlations["oil"] = None

    try:
        df_yield = _fetch_history(SYMBOLS["yield10"], period="5d", interval="1d")
        correlations["yield_10y"] = round(float(df_yield["Close"].iloc[-1]), 3)
    except Exception as e:
        fetch_errors.append(f"10Y yield: {e}")
        correlations["yield_10y"] = None

    if fetch_errors:
        log.warning(f"Non-fatal fetch errors: {fetch_errors}")

    return {
        "timestamp_utc": timestamp,
        "xauusd_price": xauusd_price,
        "xauusd_4h": xauusd_4h,
        "xauusd_1h": xauusd_1h,
        "xauusd_15m": xauusd_15m,
        "correlations": correlations,
        "fetch_errors": fetch_errors,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import json
    snap = scan_market()
    print(json.dumps(snap, indent=2))
