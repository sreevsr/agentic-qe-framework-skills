# Skill: Analyze Scenario

## Purpose
Execute a test scenario step-by-step using Playwright MCP browser tools, discover all page elements, and produce a structured analyst report. This is the only skill that requires browser access.

## Tools Required
Playwright MCP server (browser automation): navigate, click, fill, snapshot, screenshot.

## References
- `skills/_shared/keyword-reference.md` — how to handle each keyword during execution
- `skills/_shared/path-resolution.md` — report output path

## Input
- Scenario `.md` file from `scenarios/web/` (or `scenarios/web/{folder}/`)

## Process

### Step 1: Read Scenario

Read the scenario file and identify:
- All actionable steps
- Keywords: VERIFY, CAPTURE, CALCULATE, SCREENSHOT, REPORT, SAVE
- Common Setup sections (for multi-scenario files)
- DATASETS tables (execute only FIRST row)
- Environment variable references (`{{ENV.VARIABLE}}`)
- Tags (record for Generator — no action needed)

### Step 2: Execute Each Step

For each step:

1. **Execute** the action using Playwright MCP tools
2. **Snapshot** the page after each action (CRITICAL — always snapshot)
3. **Record** for every element you interact with:
   - Element role and name (e.g., `button "Login"`)
   - `data-testid` attribute if present
   - `id` attribute if present
   - `name` attribute if present
   - Visible text content
   - Element type (input, button, link, select, checkbox)
   - Which page/URL this element is on
4. **Handle keywords:**
   - VERIFY: Check the condition, log pass/fail
   - CAPTURE: Read value from page, record with `{{variableName}}`
   - SCREENSHOT: Take visual screenshot, note filename
   - CALCULATE: Perform the math, record result
   - REPORT: Note the value for test output
5. **Log** pass/fail for each step

### Step 3: Handle Multi-Scenario Files

If the file contains multiple `### Scenario:` blocks separated by `---`:
1. Execute Common Setup steps first
2. Execute Scenario 1 fully
3. Navigate back to start / reset state
4. Execute Common Setup again
5. Execute Scenario 2 fully
6. Repeat for each scenario
7. Create separate Step Results sections in the report

### Step 4: Handle Environment Variables

If a step references `{{ENV.VARIABLE_NAME}}`, look for the actual value in the `.env` file.

### Step 5: Record ALL Elements

On each page visited, record ALL interactive elements — not just the ones used in the scenario. This gives the Generator comprehensive element data for building locator JSONs.

## Output Format

```markdown
# Analyst Report
**Scenario:** [scenario name]
**Date:** [today]
**Time:** [HH:MM UTC]
**Result:** [PASSED/FAILED] ([X/Y steps passed])

## Page Map
### Page: [page name] — [URL]
| Element | Role | TestID | ID | Name | Text | Type |
|---------|------|--------|----|------|------|------|
| ...     | ...  | ...    | .. | ...  | ...  | ...  |

(repeat for each page visited)

## Captured Values
| Variable | Value | Source Element |
|----------|-------|----------------|
| {{subtotal}} | $62.98 | .summary_subtotal_label |

## Step Results
### Scenario: [name]
**Tags:** [tags if present]
1. [pass/fail] [Step] — [element used] — [notes]
2. [pass/fail] VERIFY: [condition] — [result]
3. [pass/fail] CAPTURE: {{variableName}} = [value]
4. SCREENSHOT: [filename]

## Screenshots Captured (if any SCREENSHOT steps)
1. **[filename].png** — [description of what the screenshot shows]
2. ...

## Calculations Summary (if any CALCULATE steps)
- **[Variable]:** [value1] [operator] [value2] = [result] [✓/✗]
- ...

## Data Sets (if present)
The scenario contains DATASETS with [N] rows. Only row 1 was executed.

## Issues Found
- [failures, unexpected behavior, missing elements]

## Notes for Generator Agent
- [Observations about element discovery: which attributes are reliable, which are dynamic]
- [Price/text formatting notes: e.g., "$" prefix needs stripping for calculations]
- [Navigation flow notes: e.g., checkout requires three pages]
- [Form field notes: e.g., all fields use data-test attributes]
- [Cross-scenario chaining notes: e.g., confirmation message should be saved to shared-state]
- [Any dynamic behavior or timing observations relevant to test generation]
```

## Output Path
- With folder: `output/{folder}/analyst-report-{scenario}.md`
- Without folder: `output/analyst-report-{scenario}.md`

## Critical Reminders
- Take a snapshot BEFORE and AFTER login/navigation actions
- Record ALL interactive elements on each page, not just the ones you use
- If a page has a form, record every field in that form
- Note any popups, modals, or overlays that appear
- For CAPTURE steps, record the exact selector used to find the value
- For multi-scenario files, clearly separate each scenario's results
- For DATASETS, execute only the first row but document ALL rows
