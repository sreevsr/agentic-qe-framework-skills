---
mode: agent
description: "Run the full QE pipeline: Planner → Generator → Healer → Reviewer → Review Fixes"
---

Run the full QE pipeline for:

SCENARIO_NAME = {{scenario}}
SCENARIO_TYPE = {{type}}

Execute all stages in sequence. Verify output files exist between stages.
Save pipeline-summary.md when complete.
