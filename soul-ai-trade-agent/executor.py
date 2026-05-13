"""
executor.py — Order placement for Soul AI Trade Agent.

EXECUTION_MODE=dry_run (default on Linux): simulates orders, never touches real money.
EXECUTION_MODE=live (Windows only): places real orders via MetaTrader5 Python library.

If EXECUTION_MODE=live is set but MetaTrader5 is not importable (Linux),
the executor falls back to dry_run with a CRITICAL log warning.
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

log = logging.getLogger(__name__)


def _import_mt5():
    """Attempts to import the MetaTrader5 library (Windows only)."""
    try:
        import MetaTrader5 as mt5
        return mt5
    except ImportError:
        raise ImportError(
            "MetaTrader5 Python library is not available on this platform. "
            "MT5 live trading requires Windows with MetaTrader 5 installed. "
            "Set EXECUTION_MODE=dry_run in your .env file to use paper trading mode."
        )


def place_order_dry_run(trade: dict) -> dict:
    """
    Simulates order placement. Generates a fake UUID ticket.
    Returns a complete OrderResult dict with status='simulated'.
    """
    fake_ticket = str(uuid.uuid4())[:8].upper()
    order_result = {
        "mode": "dry_run",
        "status": "simulated",
        "order_id": fake_ticket,
        "symbol": "XAUUSD",
        "direction": trade.get("direction"),
        "entry_price": trade.get("entry_price"),
        "stop_loss": trade.get("stop_loss"),
        "take_profit_1": trade.get("take_profit_1"),
        "take_profit_2": trade.get("take_profit_2"),
        "take_profit_3": trade.get("take_profit_3"),
        "lot_size": trade.get("position_size", {}).get("lot_size", 0.01),
        "risk_usd": trade.get("position_size", {}).get("risk_usd", 0.0),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "raw_response": {"simulated": True, "ticket": fake_ticket},
        "error_message": None,
        "realized_pnl_usd": None,
    }

    log.info(
        f"[DRY RUN] Simulated {trade.get('direction')} order | "
        f"Entry: {trade.get('entry_price')} | "
        f"SL: {trade.get('stop_loss')} | "
        f"TP1: {trade.get('take_profit_1')} | "
        f"Lots: {order_result['lot_size']} | "
        f"Ticket: {fake_ticket}"
    )
    return order_result


def place_order_live(trade: dict) -> dict:
    """
    Places a live order via the MetaTrader5 Python library.
    Only available on Windows with MT5 installed and running.
    """
    mt5 = _import_mt5()

    login = int(os.getenv("MT5_LOGIN", 0))
    password = os.getenv("MT5_PASSWORD", "")
    server = os.getenv("MT5_SERVER", "")
    mt5_path = os.getenv("MT5_PATH", "")

    if not mt5.initialize(login=login, password=password, server=server, path=mt5_path):
        error = mt5.last_error()
        mt5.shutdown()
        return {
            "mode": "live",
            "status": "error",
            "order_id": None,
            "symbol": "XAUUSD",
            "direction": trade.get("direction"),
            "entry_price": trade.get("entry_price"),
            "stop_loss": trade.get("stop_loss"),
            "take_profit_1": trade.get("take_profit_1"),
            "take_profit_2": trade.get("take_profit_2"),
            "take_profit_3": trade.get("take_profit_3"),
            "lot_size": trade.get("position_size", {}).get("lot_size", 0.01),
            "risk_usd": trade.get("position_size", {}).get("risk_usd", 0.0),
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "raw_response": {"error": str(error)},
            "error_message": f"MT5 initialization failed: {error}",
            "realized_pnl_usd": None,
        }

    try:
        if not mt5.symbol_select("XAUUSD", True):
            raise RuntimeError("Failed to select XAUUSD in MT5 Market Watch.")

        direction = trade.get("direction")
        lot_size = trade.get("position_size", {}).get("lot_size", 0.01)
        entry = trade.get("entry_price")
        sl = trade.get("stop_loss")
        tp1 = trade.get("take_profit_1")

        order_type = mt5.ORDER_TYPE_BUY_LIMIT if direction == "BUY" else mt5.ORDER_TYPE_SELL_LIMIT

        request = {
            "action": mt5.TRADE_ACTION_PENDING,
            "symbol": "XAUUSD",
            "volume": lot_size,
            "type": order_type,
            "price": entry,
            "sl": sl,
            "tp": tp1,
            "deviation": 20,
            "magic": 202501,
            "comment": "SoulAI-TheGeneral",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
            retcode = result.retcode if result else "None"
            comment = result.comment if result else "No result"
            return {
                "mode": "live",
                "status": "rejected",
                "order_id": None,
                "symbol": "XAUUSD",
                "direction": direction,
                "entry_price": entry,
                "stop_loss": sl,
                "take_profit_1": tp1,
                "take_profit_2": trade.get("take_profit_2"),
                "take_profit_3": trade.get("take_profit_3"),
                "lot_size": lot_size,
                "risk_usd": trade.get("position_size", {}).get("risk_usd", 0.0),
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "raw_response": {"retcode": retcode, "comment": comment},
                "error_message": f"Order rejected: {comment} (retcode {retcode})",
                "realized_pnl_usd": None,
            }

        log.info(f"[LIVE] Order placed | Ticket: {result.order} | {direction} {lot_size} XAUUSD @ {entry}")
        return {
            "mode": "live",
            "status": "filled",
            "order_id": str(result.order),
            "symbol": "XAUUSD",
            "direction": direction,
            "entry_price": entry,
            "stop_loss": sl,
            "take_profit_1": tp1,
            "take_profit_2": trade.get("take_profit_2"),
            "take_profit_3": trade.get("take_profit_3"),
            "lot_size": lot_size,
            "risk_usd": trade.get("position_size", {}).get("risk_usd", 0.0),
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "raw_response": {"retcode": result.retcode, "ticket": result.order},
            "error_message": None,
            "realized_pnl_usd": None,
        }

    finally:
        mt5.shutdown()


def execute_trade(trade: dict) -> dict:
    """
    Routes trade to dry_run or live based on EXECUTION_MODE env var.
    If EXECUTION_MODE=live but MT5 is unavailable, falls back to dry_run
    with a CRITICAL warning — never silently drops a trade.
    """
    mode = os.getenv("EXECUTION_MODE", "dry_run").lower().strip()

    if mode == "live":
        try:
            return place_order_live(trade)
        except ImportError as e:
            log.critical(
                f"EXECUTION_MODE=live but MT5 unavailable — falling back to dry_run. "
                f"Error: {e}"
            )
            return place_order_dry_run(trade)
        except Exception as e:
            log.error(f"Live order placement failed: {e}")
            return {
                "mode": "live",
                "status": "error",
                "order_id": None,
                "symbol": "XAUUSD",
                "direction": trade.get("direction"),
                "entry_price": trade.get("entry_price"),
                "stop_loss": trade.get("stop_loss"),
                "take_profit_1": trade.get("take_profit_1"),
                "take_profit_2": trade.get("take_profit_2"),
                "take_profit_3": trade.get("take_profit_3"),
                "lot_size": trade.get("position_size", {}).get("lot_size", 0.01),
                "risk_usd": trade.get("position_size", {}).get("risk_usd", 0.0),
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "raw_response": {"exception": str(e)},
                "error_message": str(e),
                "realized_pnl_usd": None,
            }

    return place_order_dry_run(trade)
