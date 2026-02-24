#!/bin/bash
# =============================================================================
# QE Pipeline Orchestrator
# =============================================================================
# Runs Generator → Healer → Reviewer automatically using Claude Code CLI.
#
# Prerequisites:
#   - Claude Code CLI installed (npm install -g @anthropic-ai/claude-code)
#   - Analyst report already generated (output/analyst-report.md)
#
# Usage:
#   ./run-pipeline.sh <scenario-name> <scenario-type>
#
# Examples:
#   ./run-pipeline.sh saucedemo-cart-feature web
#   ./run-pipeline.sh pet-store-crud api
# =============================================================================

set -e

# --- Validate arguments ---
if [ $# -lt 2 ]; then
  echo "Usage: ./run-pipeline.sh <scenario-name> <scenario-type>"
  echo "  scenario-type: web or api"
  echo ""
  echo "Example: ./run-pipeline.sh saucedemo-cart-feature web"
  exit 1
fi

SCENARIO_NAME=$1
SCENARIO_TYPE=$2
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=============================================="
echo "  QE Pipeline Orchestrator"
echo "=============================================="
echo "  Scenario:  $SCENARIO_NAME"
echo "  Type:      $SCENARIO_TYPE"
echo "  Started:   $TIMESTAMP"
echo "=============================================="
echo ""

# --- Pre-flight check ---
if [ "$SCENARIO_TYPE" = "web" ] && [ ! -f "output/analyst-report.md" ]; then
  echo "❌ ERROR: output/analyst-report.md not found."
  echo "   Run the Analyst agent first in VS Code Copilot Chat:"
  echo "   Select QE Analyst → 'Run scenario: $SCENARIO_NAME'"
  echo ""
  exit 1
fi

if [ "$SCENARIO_TYPE" = "web" ] && [ ! -f "scenarios/web/${SCENARIO_NAME}.md" ]; then
  echo "❌ ERROR: scenarios/web/${SCENARIO_NAME}.md not found."
  exit 1
fi

if [ "$SCENARIO_TYPE" = "api" ] && [ ! -f "scenarios/api/${SCENARIO_NAME}.md" ]; then
  echo "❌ ERROR: scenarios/api/${SCENARIO_NAME}.md not found."
  exit 1
fi

# --- Agent 1: Generator ---
echo "🔧 [1/3] Running Generator Agent..."
echo "----------------------------------------------"

GENERATOR_PROMPT="You are the QE Generator agent.

RULES:
- Do NOT use Playwright MCP browser tools or create subagents
- This is a code generation task only — read files and create files

SCENARIO_NAME = ${SCENARIO_NAME}
SCENARIO_TYPE = ${SCENARIO_TYPE}

Read agents/02-generator.md for your instructions.

SOURCE FILES:
- If SCENARIO_TYPE is web: Read output/analyst-report.md + scenarios/web/${SCENARIO_NAME}.md
- If SCENARIO_TYPE is web AND scout-reports/page-inventory-latest.md exists: Also read this file for accurate DOM selectors
- If SCENARIO_TYPE is api: Read scenarios/api/${SCENARIO_NAME}.md directly

Use templates in templates/core/ and templates/config/ as code patterns.

SHARED FILES — CREATE IF NOT EXISTS:
Check if these files already exist in output/. If they do, skip creating them.

SCENARIO-SPECIFIC FILES — ALWAYS RECREATE:
Delete and regenerate only the current scenario files:
- Test spec: output/tests/${SCENARIO_TYPE}/${SCENARIO_NAME}.spec.ts
- Test data: output/test-data/${SCENARIO_TYPE}/${SCENARIO_NAME}/

For web scenarios, also generate (create if not exists):
- output/locators/[page-name].json (one per page discovered)
- output/pages/[PageName].ts (one Page Object per page)

ZERO DROPPED STEPS: Every step in the source must have a // STEP N: comment in the spec.

QUALITY CHECKS before finishing:
- STEP comment count matches source step count
- All import paths resolve correctly
- playwright.config.ts uses channel: 'chrome' (NOT browserName: 'chrome')
- Zero waitForTimeout anywhere
- No hardcoded passwords
- Every async call has await"

claude -p "$GENERATOR_PROMPT" 2>&1 | tee /tmp/generator-output.log

if [ $? -ne 0 ]; then
  echo "❌ Generator failed. Check /tmp/generator-output.log"
  exit 1
fi

echo ""
echo "✅ Generator complete."
echo ""

# --- Agent 2: Healer ---
echo "🏥 [2/3] Running Healer Agent..."
echo "----------------------------------------------"

HEALER_PROMPT="You are the QE Healer agent.

RULES:
- Do NOT use Playwright MCP browser tools or create subagents
- Use ONLY the terminal to run commands and edit files

SCENARIO_NAME = ${SCENARIO_NAME}
SCENARIO_TYPE = ${SCENARIO_TYPE}

Read agents/03-healer.md for your instructions.

PHASE 1: PRE-FLIGHT VALIDATION
1. Read the source file: output/analyst-report.md (web) or scenarios/api/${SCENARIO_NAME}.md (api)
2. Open the test spec: output/tests/${SCENARIO_TYPE}/${SCENARIO_NAME}.spec.ts
3. Count // STEP N: comments vs total steps in source
4. If steps are missing: add them

PHASE 2: SETUP
1. cd into output/
2. Copy .env.example to .env if missing
3. Run npm install only if node_modules/ does not exist
4. npx playwright install chromium
5. npx tsc --noEmit — fix any TypeScript errors

PHASE 3: RUN TESTS
Run ONLY: npx playwright test tests/${SCENARIO_TYPE}/${SCENARIO_NAME}.spec.ts --project=chrome --reporter=list

PHASE 4: DIAGNOSE AND FIX (max 3 cycles)
If tests fail, classify root cause and fix:
A. NAVIGATION — add missing navigation
B. TIMING — add waitForSelector or waitForLoadState
C. WRONG SELECTOR — try fallbacks from locator JSON or Scout report
D. WRONG EXPECTED VALUE — update assertion
E. IMPORT ERROR — fix paths
Apply fix → re-run → repeat (max 3 cycles)

PHASE 5: REPORT
Save output/healer-report.md with results."

claude -p "$HEALER_PROMPT" 2>&1 | tee /tmp/healer-output.log

if [ $? -ne 0 ]; then
  echo "❌ Healer failed. Check /tmp/healer-output.log"
  exit 1
fi

echo ""
echo "✅ Healer complete."
echo ""

# --- Agent 3: Reviewer ---
echo "📋 [3/3] Running Reviewer Agent..."
echo "----------------------------------------------"

REVIEWER_PROMPT="You are the QE Reviewer agent.

RULES:
- Do NOT use Playwright MCP browser tools or create subagents
- Read files only — do NOT modify any files
- This is an audit. Be critical.

Read agents/04-reviewer.md for your instructions.

SCOPE — Review all files in output/:
- core/ (locator-loader, base-page, shared-state)
- locators/ (all JSON files)
- pages/ (all Page Objects)
- tests/web/ and tests/api/ (all spec files)
- test-data/ (all JSON files)
- playwright.config.ts, .env.example

Score these 8 dimensions (1-5 each):
1. Code Hygiene — no commented-out code, unused imports, console.log
2. Import Integrity — every import resolves to an actual file
3. Step Completeness — STEP comments match source steps
4. Locator Quality — primary + fallbacks, no raw selectors in specs
5. Wait Strategy — zero waitForTimeout
6. Test Architecture — tags, independent tests, proper structure
7. Security — no hardcoded credentials
8. Configuration — channel: 'chrome', proper reporters

Save output/review-scorecard.md with scores and verdict:
APPROVED (score >= 32, no dimension below 3) or NEEDS FIXES."

claude -p "$REVIEWER_PROMPT" 2>&1 | tee /tmp/reviewer-output.log

if [ $? -ne 0 ]; then
  echo "❌ Reviewer failed. Check /tmp/reviewer-output.log"
  exit 1
fi

echo ""
echo "✅ Reviewer complete."
echo ""

# --- Summary ---
END_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=============================================="
echo "  Pipeline Complete!"
echo "=============================================="
echo "  Started:   $TIMESTAMP"
echo "  Finished:  $END_TIMESTAMP"
echo "  Scenario:  $SCENARIO_NAME ($SCENARIO_TYPE)"
echo ""
echo "  Generated files:"
echo "    📄 output/tests/${SCENARIO_TYPE}/${SCENARIO_NAME}.spec.ts"
echo "    📄 output/healer-report.md"
echo "    📄 output/review-scorecard.md"
echo ""

# Show test results if healer report exists
if [ -f "output/healer-report.md" ]; then
  echo "  Test Results:"
  grep -E "passed|failed|PASS|FAIL" output/healer-report.md | head -5
  echo ""
fi

# Show review verdict if scorecard exists
if [ -f "output/review-scorecard.md" ]; then
  echo "  Review Verdict:"
  grep -iE "APPROVED|NEEDS FIXES|verdict" output/review-scorecard.md | head -3
  echo ""
fi

echo "=============================================="
