#!/usr/bin/env bash
# setup.sh — Soul AI Trade Agent setup script
# Run this once after cloning: bash soul-ai-trade-agent/setup.sh

set -e
AGENT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================================"
echo "  SOUL AI TRADE AGENT — Setup"
echo "========================================================"
echo ""

# ── Python check ─────────────────────────────────────────────
echo "[1/4] Checking Python version..."
PYTHON=$(python3 --version 2>&1)
echo "  Found: $PYTHON"
PYVER=$(python3 -c "import sys; print(sys.version_info >= (3,10))")
if [ "$PYVER" = "False" ]; then
  echo "  ERROR: Python 3.10+ required."
  exit 1
fi

# ── Install deps ─────────────────────────────────────────────
echo ""
echo "[2/4] Installing Python dependencies..."
pip3 install -q -r "$AGENT_DIR/requirements.txt"
python3 -c "import anthropic, yfinance, apscheduler, telegram, notion_client; print('  All dependencies OK')"

# ── Create .env from template ─────────────────────────────────
echo ""
echo "[3/4] Setting up environment file..."
if [ -f "$AGENT_DIR/.env" ]; then
  echo "  .env already exists — skipping (edit manually to update credentials)"
else
  cp "$AGENT_DIR/.env.example" "$AGENT_DIR/.env"
  echo "  Created .env from .env.example"
  echo ""
  echo "  ACTION REQUIRED: Edit .env and fill in your credentials:"
  echo "    $AGENT_DIR/.env"
  echo ""
  echo "  Required:"
  echo "    ANTHROPIC_API_KEY   — from https://console.anthropic.com"
  echo "    TELEGRAM_BOT_TOKEN  — from @BotFather on Telegram"
  echo "    TELEGRAM_CHANNEL_ID — your signal group chat ID"
  echo ""
  echo "  Optional (Notion sync):"
  echo "    NOTION_TOKEN        — from https://www.notion.so/profile/integrations"
  echo "    NOTION_DATABASE_ID  — your Notion trading database ID"
  echo ""
  echo "  Optional (live MT5 on Windows only):"
  echo "    MT5_LOGIN, MT5_PASSWORD, MT5_SERVER"
  echo "    EXECUTION_MODE=live  (default is dry_run)"
fi

# ── Run tests ─────────────────────────────────────────────────
echo ""
echo "[4/4] Running test suite..."
cd "$AGENT_DIR"
python3 test_agent.py

echo ""
echo "========================================================"
echo "  Setup complete!"
echo ""
echo "  To start the agent (single test cycle):"
echo "    cd $AGENT_DIR"
echo "    python3 agent.py --once --dry-run"
echo ""
echo "  To run on the 4H schedule:"
echo "    python3 agent.py --dry-run"
echo ""
echo "  Trade log:"
echo "    $AGENT_DIR/trade_log.jsonl"
echo "========================================================"
