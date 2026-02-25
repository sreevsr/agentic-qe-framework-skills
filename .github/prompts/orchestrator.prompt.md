---
mode: agent
description: "Run the full QE pipeline: Planner → Generator → Healer → Reviewer → Review Fixes"
---

Run the full QE pipeline for:

SCENARIO_NAME = {{scenario}}
SCENARIO_TYPE = {{type}}

Execute all stages in sequence. Verify output files exist between stages.

FINAL STEP — MANDATORY (run this after all stages complete or if any stage fails):
Create the file output/pipeline-summary.md using the editFiles tool with the pipeline results.
Do NOT skip this step. Do NOT just print the summary in chat.
