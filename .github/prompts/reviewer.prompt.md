---
mode: agent
description: "Run QE Reviewer to audit generated framework against 8 QE quality dimensions"
---

---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths
- DO NOT use git commands or check repository state
- Self-contained execution mode
---

SCENARIO_NAME = {{scenario}}
SCENARIO_TYPE = {{type}}

Read agents/04-reviewer.md for your instructions.

SCOPE — Review all files in output/:
- core/ (locator-loader, base-page, shared-state)
- locators/ (all JSON files — web only)
- pages/ (all Page Objects — web only)
- tests/web/ and tests/api/ (all spec files)
- test-data/web/ and test-data/api/ (all JSON files)
- playwright.config.ts, .env.example

Apply all 8 quality dimensions defined in your agent instructions.
Score each dimension 1-5.



Save output/review-scorecard-{{scenario}}.md with:
- Score per dimension with specific findings
- Total score out of 40
- List of every issue found with file path and line reference
- Overall verdict: APPROVED (score >= 32 and no dimension below 3)
  or NEEDS FIXES (list exact fixes required)
