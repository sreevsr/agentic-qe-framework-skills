---
mode: agent
description: "Run QE Planner to execute a web UI scenario in real browser and produce analyst report"
---

---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
---

SCENARIO_NAME = {{scenario}}

Read the file agents/01-analyst.md for your instructions.
Then read the scenario:
- If folder is provided: scenarios/web/{{folder}}/{{scenario}}.md
- If folder is not provided: scenarios/web/{{scenario}}.md.

Execute every step in the scenario using the Playwright MCP tools listed in your agent instructions.
Take a page snapshot after each action to confirm the result before moving to the next step.

For VERIFY steps: check the stated condition and log pass/fail.
For CAPTURE steps: read the value from the page and record it.
For SCREENSHOT steps: take a screenshot and note the filename.
For DATASETS: execute only the FIRST data row.

After completing all steps, save your report as output/analyst-report-{{scenario}}.md.
