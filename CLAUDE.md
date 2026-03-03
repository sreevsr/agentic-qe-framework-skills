# Agentic QE Framework — Skills Architecture

AI-powered test automation framework that converts plain English scenarios into production-ready Playwright TypeScript tests. Skills-based architecture with composable, self-contained skill files.

## Tech Stack

- **Runtime:** Node.js 18+ / TypeScript
- **Test Engine:** Playwright
- **AI Pipeline:** Claude Code with composable skills
- **MCP:** Playwright MCP Server (browser automation for Analyst stage)

## Project Structure

```
skills/                          # Composable skill definitions (self-contained)
  _shared/                       # keyword-reference.md only (loaded during spec generation)
  _reference/                    # Human reference docs — NOT loaded by LLM at runtime
  analyst/                       # Browser-based scenario execution
  generator/                     # Code generation (10 skills)
  healer/                        # Test healing (6 skills)
  reviewer/                      # Quality audit (9 skills)
  healer-review/                 # Review fix application (9 skills)
  api-analyst/                   # Swagger → scenario generation
  scout/                         # DOM reconnaissance
scenarios/                       # Plain English test scenarios (.md files)
  web/                           # Web UI scenarios (with optional {folder}/ subfolders)
  api/                           # API scenarios (with optional {folder}/ subfolders)
templates/                       # Source of truth for core framework files
  core/                          # locator-loader.ts, base-page.ts, shared-state.ts, test-data-loader.ts
  config/                        # playwright.config.ts, package.json, tsconfig.json
output/                          # Shared generated Playwright project (ONE project, all scenarios)
```

## Running the Pipeline

Invoke with: `scenario={name} type={web|api|hybrid} [folder={subfolder}]`

### Pipeline Stages

```
Web:    Analyst → Generator → Healer → Reviewer → [Healer-Review if needed]
API:    Generator → Healer → Reviewer → [Healer-Review if needed]
Hybrid: Analyst → Generator → Healer → Reviewer → [Healer-Review if needed]
```

### Stage 1: Analyst (skip if type=api)

Read and execute `skills/analyst/analyze-scenario.md`.
Execute scenario in browser via Playwright MCP, discover elements, produce analyst report.
Verify: analyst report exists before proceeding.

### Stage 2: Generator

Execute skills one at a time. Read each skill, complete it fully, verify its output, then proceed:

1. Read and execute `skills/generator/setup-framework.md`
   Verify: `output/core/`, `output/playwright.config.ts`, `output/package.json` exist

2. Read and execute `skills/generator/setup-test-data.md`
   Verify: test-data files created

3. Read and execute `skills/generator/discover-helpers.md` (web/hybrid only)
   Verify: helper registry noted (in-memory, used by spec generation)

4. Read and execute `skills/generator/generate-locators.md` (web/hybrid only)
   Verify: `output/locators/*.locators.json` files exist

5. Read and execute `skills/generator/generate-pages.md` (web/hybrid only)
   Verify: `output/pages/*Page.ts` files exist

6. Read `skills/_shared/keyword-reference.md` for keyword→TypeScript patterns, then
   read and execute the spec skill for your type:
   - `type=web` → `skills/generator/generate-web-spec.md`
   - `type=api` → `skills/generator/generate-api-spec.md`
   - `type=hybrid` → `skills/generator/generate-hybrid-spec.md`
   Verify: test spec file exists at the correct path

7. Read and execute `skills/generator/generate-report.md`
   Verify: `output/generator-report-{scenario}.md` exists

### Stage 3: Healer

Read and execute `skills/healer/heal-loop.md`.
It orchestrates its sub-skills internally (pre-flight → run → diagnose → fix → repeat → report).
Each sub-skill is self-contained — no shared files needed.
Verify: healer report exists. Record pass/fail/fixme counts.

### Stage 4: Reviewer

Execute each dimension review one at a time:

1. Read and execute `skills/reviewer/review-locator-quality.md` (skip for API-only)
2. Read and execute `skills/reviewer/review-wait-strategy.md`
3. Read and execute `skills/reviewer/review-test-architecture.md`
4. Read and execute `skills/reviewer/review-configuration.md`
5. Read and execute `skills/reviewer/review-code-quality.md`
6. Read and execute `skills/reviewer/review-maintainability.md`
7. Read and execute `skills/reviewer/review-security.md`
8. Read and execute `skills/reviewer/review-api-quality.md` (skip for web-only)
9. Read and execute `skills/reviewer/aggregate-scorecard.md` — combines all scores, issues verdict.

Verify: scorecard exists. Read verdict: APPROVED or NEEDS FIXES.

### Stage 5: Healer-Review (only if verdict = NEEDS FIXES)

Read scorecard. For each dimension with score <= 3, read and execute the matching fix skill:
- `skills/healer-review/fix-locator-quality.md`
- `skills/healer-review/fix-wait-strategy.md`
- `skills/healer-review/fix-test-architecture.md`
- `skills/healer-review/fix-configuration.md`
- `skills/healer-review/fix-code-quality.md`
- `skills/healer-review/fix-maintainability.md`
- `skills/healer-review/fix-security.md`
- `skills/healer-review/fix-api-quality.md`

Then: Read and execute `skills/healer-review/validate-fixes.md`.
Verify: report exists, tests still pass.

### Final Step: Pipeline Summary

Read and execute `skills/generator/generate-pipeline-summary.md`.
Reads all stage reports (analyst, generator, healer, reviewer, healer-review if applicable) and produces a single summary.
Verify: `output/pipeline-summary-{scenario}.md` exists. This is the LAST file written in every pipeline run.

### Standalone: API Analyst

Read `skills/api-analyst/generate-api-scenarios.md`. Input: Swagger spec. Output: scenario `.md` files. Then run the API pipeline (Stages 2-5).

## Type Routing

| Type | Analyst | Locators/Pages | Spec Skill | Fixtures | Reviewer Dims |
|------|---------|---------------|------------|----------|--------------|
| `web` | Yes | Yes | `generate-web-spec` | `{ page }` | 1-7 |
| `api` | No | No | `generate-api-spec` | `{ request }` | 2-8 |
| `hybrid` | Yes | Yes | `generate-hybrid-spec` | `{ page, request }` | 1-8 (all) |

## Critical Rules

- NEVER modify `*.helpers.ts` files in `output/pages/` — team-owned
- NEVER modify files in `output/test-data/shared/` — team-owned
- NEVER commit `.env` files with real credentials
- NEVER use `waitForTimeout()` — use proper Playwright waits
- NEVER hardcode selectors in page objects or specs — all via LocatorLoader + JSON
- All scenarios share one `output/` project — do NOT create per-scenario projects
- Run ONLY the current scenario's spec file — never `npx playwright test` without a path
- Every scenario step MUST produce a corresponding test step — no step skipping

## Commands

```bash
cd output && npm install                          # Install dependencies
npx playwright test tests/web/{scenario}.spec.ts --project=chrome  # Run scenario
npx playwright test --grep @smoke                 # Tag-based filtering
npx playwright show-report                        # View HTML report
```

## MCP Extensibility

Current: Playwright MCP (browser automation for Analyst). Future extensions require only new skill files — no existing skill modifications:
- Appium MCP → `skills/analyst/analyze-scenario-mobile.md`
- Database MCP → `skills/generator/generate-db-assertions.md`
