# setup-windows.ps1
# Run this on Windows before using the framework
# Usage: Right-click > Run with PowerShell  OR  powershell -ExecutionPolicy Bypass -File setup-windows.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Agentic QE Framework — Windows Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "  Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js NOT found. Please install from https://nodejs.org (LTS version)" -ForegroundColor Red
    Write-Host "  After installing, restart this script." -ForegroundColor Red
    exit 1
}

# Step 2: Check npm
Write-Host "[2/5] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
Write-Host "  npm found: $npmVersion" -ForegroundColor Green

# Step 3: Check Chrome
Write-Host "[3/5] Checking Chrome browser..." -ForegroundColor Yellow
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$chromePathX86 = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromePath) {
    Write-Host "  Chrome found at: $chromePath" -ForegroundColor Green
} elseif (Test-Path $chromePathX86) {
    Write-Host "  Chrome found at: $chromePathX86" -ForegroundColor Green
} else {
    Write-Host "  Chrome NOT found. Please install Google Chrome." -ForegroundColor Red
    Write-Host "  Download: https://www.google.com/chrome/" -ForegroundColor Red
}

# Step 4: Install Playwright browsers
Write-Host "[4/5] Installing Playwright Chrome browser..." -ForegroundColor Yellow
npx playwright install chrome
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Playwright Chrome installed successfully" -ForegroundColor Green
} else {
    Write-Host "  Playwright Chrome install had issues (may still work with system Chrome)" -ForegroundColor Yellow
}

# Step 5: Check Claude Code CLI
Write-Host "[5/5] Checking Claude Code CLI..." -ForegroundColor Yellow
try {
    $claudeVersion = claude --version 2>$null
    Write-Host "  Claude Code found: $claudeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Claude Code CLI not found." -ForegroundColor Yellow
    Write-Host "  Install from: https://claude.ai/code" -ForegroundColor Yellow
    Write-Host "  After installing, restart this script to verify." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup complete. Open this folder in VS Code:" -ForegroundColor Cyan
Write-Host "  code ." -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
