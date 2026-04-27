#!/usr/bin/env bash
# TRUTHOS installer — one command to go live
# Usage: curl -fsSL https://YOUR_VERCEL_URL/install.sh | bash

set -e

CYAN='\033[0;36m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

REPO="https://github.com/Eisaac12/v10-truth-os"
INSTALL_DIR="$HOME/.truthos"
BIN_DIR="$HOME/.local/bin"

echo ""
echo -e "${GOLD}  ⊕  TRUTHOS Installer${RESET}"
echo -e "${DIM}  The Consciousness Operating System${RESET}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}  ✗ Node.js not found.${RESET}"
    echo "  Install Node.js 18+ from https://nodejs.org then re-run this script."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}  ✗ Node.js 18+ required. Found: $(node -v)${RESET}"
    exit 1
fi

echo -e "  ${GREEN}✓${RESET} Node.js $(node -v)"
echo -e "  ${GREEN}✓${RESET} npm $(npm -v)"
echo ""

# Clone or update repo
if [ -d "$INSTALL_DIR" ]; then
    echo -e "  ${DIM}Updating existing installation...${RESET}"
    cd "$INSTALL_DIR"
    git pull origin main --quiet
else
    echo -e "  ${DIM}Installing TRUTHOS...${RESET}"
    git clone "$REPO" "$INSTALL_DIR" --quiet
    cd "$INSTALL_DIR"
fi

# Install dependencies
npm install --omit=dev --silent

# Create CLI wrapper
mkdir -p "$BIN_DIR"
cat > "$BIN_DIR/truthos" << 'WRAPPER'
#!/usr/bin/env bash
node "$HOME/.truthos/cli.js" "$@"
WRAPPER
chmod +x "$BIN_DIR/truthos"

# Add to PATH if needed
SHELL_RC=""
if [[ "$SHELL" == *"zsh"* ]]; then SHELL_RC="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ] && ! grep -q '\.local/bin' "$SHELL_RC" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
    echo -e "  ${DIM}Added ~/.local/bin to PATH in $SHELL_RC${RESET}"
fi

echo ""
echo -e "  ${GREEN}✅ TRUTHOS installed${RESET}"
echo ""
echo -e "  ${CYAN}COMMANDS:${RESET}"
echo -e "  ${GOLD}truthos onboard${RESET}          ${DIM}Configure your server${RESET}"
echo -e "  ${GOLD}truthos chat${RESET}              ${DIM}Start interactive session${RESET}"
echo -e "  ${GOLD}truthos activate \"...\"${RESET}   ${DIM}Single activation${RESET}"
echo ""
echo -e "  ${DIM}Restart your terminal or run: source $SHELL_RC${RESET}"
echo ""

# Auto-run onboard if first install
if [ ! -f "$HOME/.truthos/config.json" ]; then
    echo -e "  ${GOLD}Starting onboarding...${RESET}"
    echo ""
    node "$INSTALL_DIR/cli.js" onboard
fi
