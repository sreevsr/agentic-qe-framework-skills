---
mode: agent
description: "Run QE Healer to execute tests, diagnose failures, and auto-fix (max 3 cycles)"
---

---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths
- DO NOT use git commands or check repository state
- Self-contained execution mode
- Input (no folder): path.join(process.cwd(), 'output', 'tests', '{{type}}', '{{scenario}}.spec.ts')
- Input (with folder): path.join(process.cwd(), 'output', 'tests', '{{type}}', '{{folder}}', '{{scenario}}.spec.ts')
- Output: Fixed test in same location
---

SCENARIO_NAME = {{scenario}}
SCENARIO_TYPE = {{type}}

Read agents/03-healer.md for your instructions.

─── PHASE 1: PRE-FLIGHT VALIDATION ───

1. Read the source file:
   - If SCENARIO_TYPE is web and folder provided: Read output/{{folder}}/analyst-report-{{scenario}}.md
   - If SCENARIO_TYPE is web and no folder: Read output/analyst-report-{{scenario}}.md
   - If SCENARIO_TYPE is api: Read scenarios/api/{{scenario}}.md
2. Open the test spec:
    If folder provided: output/tests/{{type}}/{{folder}}/{{scenario}}.spec.ts
    If folder not provided: output/tests/{{type}}/{{scenario}}.spec.ts
3. Count // STEP N: comments in the spec vs total steps in the source
4. If steps are missing: add them in correct sequence using surrounding code as pattern
5. Log what was added. Proceed only when all steps are accounted for.

─── PHASE 2: SETUP ───

6. cd into output/
7. Copy .env.example to .env if missing; fill in values
8. Run npm install only if node_modules/ does not exist
9. npx playwright install chromium
10. npx tsc --noEmit → fix any TypeScript errors

─── PHASE 3: TARGETED TEST RUN ───

11. Run ONLY the current scenario's spec file:
        If folder is provided: npx playwright test tests/{{type}}/{{folder}}/{{scenario}}.spec.ts --project=chrome --reporter=list
        If folder is not provided: npx playwright test tests/{{type}}/{{scenario}}.spec.ts --project=chrome --reporter=list
        Never run npx playwright test without a file path.

─── PHASE 4: DIAGNOSE AND FIX (max 3 cycles) ───

Apply diagnosis categories A-F from your agent instructions. For Category A, always check the source file for what navigation should have preceded the failing step. Verify the test is on the right screen before assuming the selector is wrong.

Apply fix → re-run → repeat (max 3 cycles).
After 3 cycles, mark unresolved tests with test.fixme() and document the issue.

─── PHASE 5: REPORT ───

16. Save the healer report with:
    - If folder provided: output/{{folder}}/healer-report-{{scenario}}.md
    - If no folder: output/healer-report-{{scenario}}.md
    Contents:
    - Pre-flight results (steps added, if any)
    - Fix cycles used (out of 3 max)
    - Each fix: root cause category, what was wrong, what was fixed
    - Final results: passed / failed / skipped / fixme
    - Unresolved issues with recommended investigation steps
