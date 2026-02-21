/**
 * SCOUT AGENT — Remote Control
 * ==============================
 * 
 * Run this in Terminal 2 while the Scout Agent runs in Terminal 1.
 * 
 * Controls:
 *   S  = Scan current page (instant)
 *   T  = Scan in 5 seconds (for tooltips/hovers — gives you time to hover)
 *   D  = Done — stop session and generate report
 * 
 * All keys are case-insensitive. No Enter key needed.
 * 
 * Usage:
 *   node remote-control.js
 */

const fs = require('fs');
const path = require('path');

const SCOUT_REPORTS_DIR = './scout-reports';
const SCAN_FILE = path.join(SCOUT_REPORTS_DIR, 'SCAN');
const DONE_FILE = path.join(SCOUT_REPORTS_DIR, 'DONE');

// Ensure the directory exists
try { fs.mkdirSync(SCOUT_REPORTS_DIR, { recursive: true }); } catch {}

let scanCount = 0;

function triggerScan() {
  scanCount++;
  const name = `Scan ${scanCount}`;
  try {
    fs.writeFileSync(SCAN_FILE, name, 'utf-8');
    console.log(`\n  🔍 Scan #${scanCount} triggered!`);
    console.log(`  ⏳ Waiting for result in Terminal 1...`);
    printPrompt();
  } catch (e) {
    console.log(`\n  ❌ Failed to trigger scan: ${e}`);
    printPrompt();
  }
}

function triggerDelayedScan(seconds) {
  console.log(`\n  ⏱️  Scanning in ${seconds} seconds — go hover over your tooltip!`);
  let remaining = seconds;
  const countdown = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      process.stdout.write(`  ⏱️  ${remaining}...`);
    }
  }, 1000);
  setTimeout(() => {
    clearInterval(countdown);
    triggerScan();
  }, seconds * 1000);
}

function triggerDone() {
  try {
    fs.writeFileSync(DONE_FILE, 'done', 'utf-8');
    console.log('\n  📋 DONE signal sent! Check Terminal 1 for the report.');
    console.log('  👋 Goodbye!\n');
    process.exit(0);
  } catch (e) {
    console.log(`\n  ❌ Failed: ${e}`);
  }
}

function printPrompt() {
  console.log('\n  ─────────────────────────────────────');
  console.log('  Press:  S = Scan  |  T = Timed (5s)  |  D = Done');
}

// === MAIN ===

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                                                              ║');
console.log('║   🎮 SCOUT AGENT — Remote Control                           ║');
console.log('║                                                              ║');
console.log('║   S  = Scan current page (instant)                          ║');
console.log('║   T  = Scan in 5 seconds (hover over tooltip first)         ║');
console.log('║   D  = Done — generate report and stop                      ║');
console.log('║                                                              ║');
console.log('║   Keys are NOT case-sensitive. No Enter needed.             ║');
console.log('║                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

printPrompt();

// Enable raw mode for single-keypress detection (no Enter needed)
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdin.resume();
process.stdin.setEncoding('utf-8');

process.stdin.on('data', (key) => {
  const k = key.toString().toLowerCase();

  // Ctrl+C to exit
  if (k === '\u0003') {
    console.log('\n  👋 Exiting remote control (Scout still running).\n');
    process.exit(0);
  }

  if (k === 's') {
    triggerScan();
  } else if (k === 't') {
    triggerDelayedScan(5);
  } else if (k === 'd') {
    triggerDone();
  }
});
