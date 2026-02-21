#!/bin/bash
# setup-linux.sh
# Run this on your Linux Mint machine for development
# Usage: chmod +x scripts/setup-linux.sh && ./scripts/setup-linux.sh

echo "============================================"
echo "  Agentic QE Framework — Linux Setup"
echo "============================================"
echo ""

# Step 1: Check Node.js
echo "[1/4] Checking Node.js..."
if command -v node &> /dev/null; then
    echo "  Node.js found: $(node --version)"
else
    echo "  Node.js NOT found. Installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
    echo "  Node.js installed: $(node --version)"
fi

# Step 2: Check npm
echo "[2/4] Checking npm..."
echo "  npm found: $(npm --version)"

# Step 3: Install Playwright Chrome
echo "[3/4] Installing Playwright Chrome browser..."
npx playwright install chrome
npx playwright install-deps chrome
echo "  Playwright Chrome installed"

# Step 4: Quick verification
echo "[4/4] Verifying installation..."
echo "  Node: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Playwright: $(npx playwright --version 2>/dev/null || echo 'will install on first use')"

echo ""
echo "============================================"
echo "  Setup complete. Open in VS Code:"
echo "  code ."
echo "============================================"
