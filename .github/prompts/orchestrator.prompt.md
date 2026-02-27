---
mode: agent
description: "Run the full QE pipeline: Planner → Generator → Healer → Reviewer → Review Fixes"
---

Run the full QE pipeline for:

SCENARIO_NAME = {{scenario}}
SCENARIO_TYPE = {{type}}
FOLDER = {{folder}}    ← omit this line if no folder was provided

Execute all stages in sequence. Verify output files exist between stages.

IMPORTANT: Do NOT run the API Analyst agent. For type=api, the scenario .md file already exists. Start from the Generator (Stage 2).

FINAL STEP — MANDATORY (run this after all stages complete or if any stage fails):
Create the pipeline summary file at:
  If folder provided: output/{{folder}}/pipeline-summary-{{scenario}}.md
  If folder not provided: output/pipeline-summary-{{scenario}}.md
Use the editFiles tool with the pipeline results.
Do NOT skip this step. Do NOT just print the summary in chat.
