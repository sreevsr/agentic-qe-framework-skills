# Skills-Based Claude Code Architecture for Agentic QE Framework

## Executive Summary

This document describes the architectural evolution of the Agentic QE Test Automation Framework from a **monolithic agent-based design** (running on GitHub Copilot Chat) to a **composable skills-based architecture** (running on Claude Code). The motivation, trade-offs, technical design, and implementation plan are all covered here.

**What changed:** 5 monolithic AI agents decomposed into 46 focused, composable skills.
**What stayed:** Every framework capability — keywords, guardrails, output structure, enterprise patterns — is preserved.
**What was added:** Native hybrid (web+API) test support, native mobile test automation via Appium MCP (Android/iOS), enterprise reporting extensibility, and MCP server extensibility for future platforms.

---

## 1. Why We Moved to Skills-Based Architecture

### 1.1 The Problem with Monolithic Agents

The original framework uses 5 large AI agents, each with 100-400 lines of instructions. This works but creates three structural issues:

**Attention dilution.** When an LLM reads a 400-line prompt (like the Generator agent), it must do 7 distinct tasks: create locator JSONs, generate page objects, discover helpers, write test specs, set up test data, configure the framework, and validate output. Research and practice show that LLMs prioritize some instructions unpredictably in long prompts. The Generator sometimes forgets helper discovery or skips locator fallbacks — not because the instructions are wrong, but because there's too much to track in one pass.

**Type branching everywhere.** The framework supports `type=web` and `type=api`. Every agent has `if web / else api` branching. Adding a third type (`hybrid`) means touching 16 files and adding three-way branching in every agent. This is invasive and fragile.

**Opaque failures.** When the Generator produces bad locators AND a bad spec in the same run, diagnosing which instruction it misread is difficult. The monolithic output makes root-cause analysis slow.

### 1.2 What Skills-Based Architecture Solves

| Problem | Agent-Based | Skills-Based |
|---------|-------------|-------------|
| **Prompt length** | 400 lines per agent, attention dilution | 30-50 lines per skill, laser focus |
| **Adding new types (hybrid, mobile)** | Modify 16 files, add branching everywhere | Write new skill files, compose with existing ones (hybrid: 1 new file; mobile: 8 new files, zero existing modifications) |
| **Debugging failures** | Which of 7 responsibilities failed? | 1 skill = 1 output, traceable |
| **Testing individual capabilities** | Must run entire agent pipeline | Test each skill independently |
| **Parallelization** | Agents run sequentially | Reviewer dimensions run as parallel subagents |
| **Onboarding new team members** | Read 400-line monolith to understand one thing | Read 40-line skill for exactly what you need |
| **MCP extensibility** | New tool = modify existing agents | New tool = write new skill, zero existing changes |

### 1.3 What Doesn't Change

- **Scenario format** — Plain English `.md` files with the same keywords (VERIFY, CAPTURE, etc.)
- **Output structure** — Same `output/` directory with locators, pages, tests, test-data
- **Core framework** — base-page.ts, locator-loader.ts, shared-state.ts, test-data-loader.ts
- **Enterprise guardrails** — Helper file protection, shared data protection, assertion protection
- **Pipeline stages** — Analyst → Generator → Healer → Reviewer → Healer-Review
- **Quality dimensions** — Same core scorecard with same scoring (8 dimensions for web/API/hybrid, 9 for mobile with added Mobile Quality dimension)

Teams using the framework see zero change in their workflow. The scenarios they write and the tests they get are identical.

---

## 2. Architecture Comparison: Agents vs Skills

### 2.1 Agent-Based Architecture (Copilot Chat — Current)

```
.github/agents/generator.agent.md     ← Identity (15 lines)
agents/02-generator.md                 ← ALL instructions (357 lines)
.github/prompts/generator.prompt.md    ← Runtime template (148 lines)
```

One agent handles everything: locators + pages + helpers + specs + test data + config + validation. The orchestrator delegates to 5 sequential subagents. Subagents cannot nest (Copilot Chat limitation).

### 2.2 Skills-Based Architecture (Claude Code — New)

```
CLAUDE.md                              ← Orchestrator (always loaded)
skills/generator/
  generate-locators.md                 ← Locator JSON creation (40 lines)
  generate-mobile-locators.md          ← Mobile locator JSON creation
  generate-pages.md                    ← Page Object creation (50 lines)
  generate-screens.md                  ← Mobile Screen Object creation
  discover-helpers.md                  ← Helper file scanning (30 lines)
  generate-web-spec.md                 ← Web test spec (80 lines)
  generate-api-spec.md                 ← API test spec (60 lines)
  generate-hybrid-spec.md             ← Hybrid test spec (90 lines)
  generate-mobile-spec.md             ← Mobile test spec (WebdriverIO)
  setup-test-data.md                   ← Test data management (40 lines)
  setup-framework.md                   ← Core file setup (30 lines)
  setup-mobile-framework.md            ← Mobile framework setup (wdio.conf, base-screen)
  generate-report.md                   ← Generator stage report
  generate-pipeline-summary.md         ← Final pipeline summary
```

14 focused skills replace 1 monolithic agent. The orchestrator (CLAUDE.md) composes the right combination based on scenario type. Each skill does exactly one thing.

### 2.3 How Hybrid Support Illustrates the Difference

**Agent-based approach to adding hybrid:**
- Modify `orchestrator.agent.md` — add type routing
- Modify `02-generator.md` — add hybrid spec generation alongside web and API
- Modify `generator.agent.md` — add hybrid path resolution
- Modify `generator.prompt.md` — add hybrid template
- Modify `03-healer.md` — add hybrid diagnosis rules
- Modify `healer.agent.md` — add hybrid acceptance
- Modify `healer.prompt.md` — add hybrid paths
- Modify `04-reviewer.md` — add hybrid dimension rules
- ...and 8 more files
- **Total: 16 files modified, every agent touched**

**Skills-based approach to adding hybrid:**
- Write `skills/generator/generate-hybrid-spec.md` (1 new file)
- Update CLAUDE.md composition rules (add one line: `type=hybrid → generate-hybrid-spec`)
- **Total: 1 new file + 1 line added. Zero existing skills modified.**

This is the core value proposition: **additive changes instead of invasive modifications.**

**Mobile support confirmed the pattern.** Adding native mobile automation (Android/iOS via Appium MCP) required 8 new skill files — `analyze-scenario-mobile.md`, `setup-mobile-framework.md`, `generate-mobile-locators.md`, `generate-screens.md`, `generate-mobile-spec.md`, `diagnose-failure-mobile.md`, `review-mobile-quality.md`, and `fix-mobile-quality.md` — plus mobile templates in `templates/mobile/`. Zero existing skills were modified. The healer loop, reviewer aggregation, and pipeline summary skills worked unchanged for mobile scenarios.

### 2.4 Side-by-Side Comparison

| Dimension | Agent-Based (Copilot Chat) | Skills-Based (Claude Code) |
|-----------|---------------------------|----------------------------|
| **File count** | 19 files (7 .agent.md + 5 agents/ + 7 .prompt.md) | 46 skill files + CLAUDE.md |
| **Avg instructions per unit** | 200 lines/agent | 40 lines/skill |
| **Runtime** | GitHub Copilot Chat (enterprise-ready) | Claude Code (personal/R&D) |
| **Subagent support** | Flat only, no nesting | Subagents + agent teams |
| **Parallelism** | Sequential pipeline only | Reviewer dims run in parallel |
| **Adding new type** | Modify 16 files | Write 1 skill + 1 line in orchestrator |
| **Adding new MCP tool** | Modify existing agent files | Write 1 new skill, no existing changes |
| **Debugging** | Which of 7 agent responsibilities failed? | 1 skill = 1 output |
| **Enterprise deployment** | Yes (GitHub Copilot licenses) | Not yet (no company subscription) |
| **Model flexibility** | GPT-4o or Claude via Copilot | Claude Opus 4.6 (strongest model) |

---

## 3. Skills Inventory

### 3.1 Shared Rules (1 file in `skills/_shared/`, 7 files in `skills/_reference/`)

These are cross-cutting concerns referenced by multiple skills. They are the "constitution" of the framework.

| File | Purpose | Referenced By |
|------|---------|---------------|
| `guardrails.md` | Helper file protection, shared data protection, assertion protection, API Behavior escape hatch, core file protection | All healer skills, generator skills, reviewer skills |
| `path-resolution.md` | Canonical path patterns for all file types (scenario, report, spec, test-data) with folder/no-folder variants | Every skill that reads or writes files |
| `keyword-reference.md` | Complete specification of all scenario keywords with TypeScript code generation patterns | Generator specs, healer pre-flight, reviewer step-completeness |
| `output-structure.md` | Directory tree contract, file naming, create-if-missing vs always-recreate rules | Generator setup, reviewer maintainability |
| `reporting.md` | Reporter configuration patterns: Playwright HTML (default), Allure, ReportPortal, JSON for dashboards | Generator setup-framework, reviewer configuration |

### 3.2 Generator Skills (14 files)

Decomposed from `agents/02-generator.md` (357 lines), plus 4 mobile-specific skills added for native mobile support.

| Skill | Input | Output | Lines |
|-------|-------|--------|-------|
| `setup-framework.md` | templates/ directory | output/core/, config files | ~30 |
| `setup-mobile-framework.md` | templates/mobile/ directory | output/core/base-screen.ts, wdio.conf.ts, capabilities.ts | ~40 |
| `setup-test-data.md` | Scenario .md, existing shared data | output/test-data/ | ~40 |
| `discover-helpers.md` | output/pages/*.helpers.ts (or screens/*.helpers.ts for mobile) | In-memory helper registry | ~30 |
| `generate-locators.md` | Analyst report, Scout report | output/locators/*.json | ~40 |
| `generate-mobile-locators.md` | Mobile analyst report | output/locators/mobile/*.locators.json | ~40 |
| `generate-pages.md` | Locator JSON files | output/pages/*.ts | ~50 |
| `generate-screens.md` | Mobile locator JSON files | output/screens/*Screen.ts | ~50 |
| `generate-web-spec.md` | Analyst report, pages, helpers, scenario | output/tests/web/*.spec.ts | ~80 |
| `generate-api-spec.md` | Scenario .md | output/tests/api/*.spec.ts | ~60 |
| `generate-hybrid-spec.md` | Analyst report, pages, helpers, scenario | output/tests/web/*.spec.ts (with { page, request }) | ~90 |
| `generate-mobile-spec.md` | Mobile analyst report, screens, helpers, scenario | output/tests/mobile/{platform}/*.spec.ts (WebdriverIO) | ~90 |
| `generate-report.md` | All generator outputs | generator-report-{scenario}.md | ~30 |
| `generate-pipeline-summary.md` | All stage reports | pipeline-summary-{scenario}.md | ~40 |

### 3.3 Healer Skills (7 files)

Decomposed from `agents/03-healer.md` (207 lines), plus 1 mobile-specific diagnosis skill. Note: `fix-guardrails.md` is in `skills/_reference/` (not loaded at runtime); its rules are inlined in `apply-fix.md`.

| Skill | Purpose | Key Rule |
|-------|---------|----------|
| `heal-loop.md` | Orchestrates full cycle: pre-flight → run → diagnose → fix → repeat (max 5) | Entry point for Stage 3 |
| `pre-flight-validation.md` | Step count, imports, tsc --noEmit | Fix before first test run |
| `run-tests.md` | Execute playwright test / wdio for specific spec | NEVER run all tests |
| `diagnose-failure.md` | Classify into categories A-G | Category C: check scenario before changing values |
| `diagnose-failure-mobile.md` | Classify mobile failures into categories M-A through M-I | Mobile-specific: element selectors, gestures, capabilities, timeouts |
| `apply-fix.md` | Apply targeted fix by category (includes inlined pre-edit gate) | Protects helpers, shared data, assertions |
| `generate-healer-report.md` | Format results into markdown | Include bugs, helper issues, remaining failures |

### 3.4 Reviewer Skills (10 files)

Decomposed from `agents/04-reviewer.md` (120 lines), plus 1 mobile-specific dimension. Each dimension is independently auditable.

| Skill | Dimension | Scope |
|-------|-----------|-------|
| `review-locator-quality.md` | Dim 1: Primary + fallbacks, no raw selectors | Web/hybrid/mobile |
| `review-wait-strategy.md` | Dim 2: Zero waitForTimeout / driver.pause | All types |
| `review-test-architecture.md` | Dim 3: Tags, POM, parameterization, helpers | All types |
| `review-configuration.md` | Dim 4: Config correctness (Playwright or wdio) | All types |
| `review-code-quality.md` | Dim 5: No any types, JSDoc, unused imports | All types |
| `review-maintainability.md` | Dim 6: Extensibility, helper conventions | All types |
| `review-security.md` | Dim 7: No hardcoded credentials | All types |
| `review-api-quality.md` | Dim 8: Request fixture, status assertions | API/hybrid only |
| `review-mobile-quality.md` | Dim 9: Mobile gestures, capabilities, screen objects, element waits | Mobile only |
| `aggregate-scorecard.md` | Combine scores, issue APPROVED/NEEDS FIXES | All types |

**Parallelization opportunity:** All dimension reviews are independent reads — they can run as parallel Claude Code subagents, then aggregate results.

### 3.5 Healer-Review Skills (10 files)

Decomposed from `healer-review.agent.md` (269 lines), plus 1 mobile-specific fix skill. One fix skill per dimension:

- `fix-locator-quality.md`, `fix-wait-strategy.md`, `fix-test-architecture.md`, `fix-configuration.md`, `fix-code-quality.md`, `fix-maintainability.md`, `fix-security.md`, `fix-api-quality.md`, `fix-mobile-quality.md` (mobile only), `validate-fixes.md`

### 3.6 Analyst + API Analyst (3 files)

| Skill | Purpose | MCP Dependency |
|-------|---------|----------------|
| `analyze-scenario.md` | Browser-based element discovery for web/hybrid scenarios | Playwright MCP |
| `analyze-scenario-mobile.md` | Device-based element discovery for native mobile scenarios | Appium MCP |
| `generate-api-scenarios.md` | Swagger spec → scenario .md files | None |

---

## 4. Pipeline Composition by Scenario Type

The orchestrator (CLAUDE.md) composes different skill sets based on the `type` parameter. This is the key architectural insight: **the same skills combine in different ways, with no branching inside individual skills.**

### 4.1 Web Pipeline
```
Stage 1: [analyze-scenario]                                    ← Browser via Playwright MCP
Stage 2: [setup-framework] → [setup-test-data + discover-helpers]
          → [generate-locators] → [generate-pages] → [generate-web-spec]
Stage 3: [heal-loop] (composes run/diagnose/fix internally)
Stage 4: [8 review dimensions in parallel] → [aggregate-scorecard]
Stage 5: [fix-{dim} for failing dimensions] → [validate-fixes]  (if needed)
```

### 4.2 API Pipeline
```
(No Stage 1)
Stage 2: [setup-framework] → [setup-test-data] → [generate-api-spec]
Stage 3: [heal-loop]
Stage 4: [7 review dimensions in parallel] → [aggregate-scorecard]
Stage 5: [fix-{dim}] → [validate-fixes]  (if needed)
```

### 4.3 Hybrid Pipeline
```
Stage 1: [analyze-scenario]                                    ← Browser for UI steps
Stage 2: [setup-framework] → [setup-test-data + discover-helpers]
          → [generate-locators] → [generate-pages] → [generate-hybrid-spec]
Stage 3: [heal-loop]                                           ← Diagnoses both web + API failures
Stage 4: [ALL 8 review dimensions in parallel] → [aggregate-scorecard]
Stage 5: [fix-{dim}] → [validate-fixes]  (if needed)
```

**The only difference between web and hybrid is the spec generation skill.** Everything else is identical. This is composability in action.

### 4.4 Mobile Pipeline
```
Stage 1: [analyze-scenario-mobile]                              ← Device via Appium MCP
Stage 2: [setup-mobile-framework] → [setup-test-data + discover-helpers]
          → [generate-mobile-locators] → [generate-screens] → [generate-mobile-spec]
Stage 3: [heal-loop] (uses diagnose-failure-mobile for categories M-A through M-I)
Stage 4: [7 review dimensions + mobile quality in parallel] → [aggregate-scorecard]
Stage 5: [fix-{dim} + fix-mobile-quality] → [validate-fixes]  (if needed)
```

The mobile pipeline reuses the same healer and reviewer infrastructure. Only the analyst, generator setup/locator/screen/spec skills, and one diagnosis skill are mobile-specific. The test runner switches from Playwright to WebdriverIO (`npx wdio wdio.conf.ts --spec ...`), but the heal-loop orchestration, scorecard aggregation, and pipeline summary skills work unchanged.

---

## 5. Enterprise Reporting Strategy

### 5.1 Current State (Built-in)

Playwright generates HTML + JSON + list reports. Configured in `playwright.config.ts`:
```typescript
reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
]
```

### 5.2 Enterprise Integration Paths

| Tool | What It Provides | Integration Approach | Framework Change |
|------|-----------------|---------------------|------------------|
| **Allure** | Rich dashboards, trend analysis, test categorization, history | `npm install -D allure-playwright`, add to reporters array | `playwright.config.ts` only |
| **ReportPortal** | Centralized dashboard, cross-project analytics, AI failure analysis | `npm install -D @reportportal/agent-js-playwright`, add reporter with env vars | `playwright.config.ts` + `.env` |
| **Custom dashboard** | Whatever you build | Consume `test-results/results.json` via CI/CD pipeline step | No framework change |
| **Trend analysis** | Pass/fail rates over time | Allure history OR push JSON to time-series DB | No framework change |

### 5.3 Why This Works Without Framework Changes

Reporting is a **config-level concern**, not a code-generation concern. The framework already generates the JSON output that all dashboard tools consume. Adding Allure or ReportPortal is just adding a line to the reporters array — zero changes to generated test code, page objects, or locators.

The `skills/_shared/reporting.md` file documents all patterns. The `skills/reviewer/review-configuration.md` skill validates reporter configuration.

---

## 6. MCP Extensibility Strategy

### 6.1 Current MCP Servers: Playwright + Appium

Two MCP servers are currently integrated:

- **Playwright MCP** — Browser automation for web/hybrid Analyst stage. Used by `analyze-scenario.md`. Configuration in `.mcp.json`.
- **Appium MCP** — Device automation for mobile Analyst stage. Used by `analyze-scenario-mobile.md`. Custom server in `mcp-servers/appium/`, built with TypeScript, registered in `.mcp.json`. Provides 15 tools: `tap`, `typeText`, `getText`, `screenshot`, `swipe`, `scrollToElement`, `waitForElement`, `isDisplayed`, `getAttribute`, `longPress`, `pressKey`, `pageSource`, `launchApp`, `closeApp`, `back`.

### 6.2 Why Skills Architecture is Inherently MCP-Extensible

In the agent-based model, adding a new tool means modifying the agent that uses it. But other agents might need the tool too, leading to capability creep.

In the skills model:
1. Only the skill that needs a tool declares the dependency
2. Adding a new MCP server = configure it + write a new skill
3. **Zero changes to existing skills**

### 6.3 Current: Appium MCP Server

The Appium MCP server lives in `mcp-servers/appium/` and was purpose-built for this framework:

- **Language:** TypeScript, compiled to `dist/` via `npm run build`
- **Transport:** stdio (launched by Claude Code via `.mcp.json` registration)
- **Backend:** WebdriverIO client connecting to Appium Server 2.x
- **Drivers:** `uiautomator2` (Android), `xcuitest` (iOS)
- **Prerequisites:** Appium Server (`npm install -g appium`), Android SDK or Xcode, connected device/emulator

The server exposes 15 MCP tools that map directly to mobile automation primitives. The `analyze-scenario-mobile.md` skill uses these tools to navigate the app under test, discover element selectors (accessibility IDs, XPaths, resource-ids), and produce a mobile analyst report.

### 6.4 Future MCP Integration Paths

| MCP Server | Use Case | New Skill Files Needed | Existing Skills Modified |
|------------|----------|----------------------|--------------------------|
| **Database MCP** | DB state verification in hybrid tests | `generate-db-assertions.md` | None |
| **Browser-use MCP** | Alternative browser automation | Swap reference in `analyze-scenario.md` | 1 file (swap, not add) |
| **GitHub MCP** | Auto-create issues for flagged bugs | `report-bugs-to-github.md` | None |
| **Slack MCP** | Pipeline status notifications | `notify-slack.md` | None |

### 6.5 Type Parameter Routing (Implemented)

The `type` parameter controls which MCP server and skill set the pipeline uses:

```
type=web     → Playwright MCP + web skills (pages, locators, web spec)
type=mobile  → Appium MCP + mobile skills (screens, mobile locators, mobile spec, wdio runner)
type=api     → no MCP needed (API spec only)
type=hybrid  → Playwright MCP + hybrid skills (pages, locators, hybrid spec with { page, request })
```

This routing is handled entirely by CLAUDE.md composition rules. Individual skills have no awareness of other types.

---

## 7. Risk Assessment

### 7.1 What Could Go Wrong

| Risk | Mitigation |
|------|------------|
| **More files to maintain (46 vs 19)** | Each file is 3-5x smaller. Total lines of instructions is roughly the same. Navigation by directory structure is clearer than searching monoliths. |
| **Orchestrator complexity** | CLAUDE.md is the single coordination point. If it gets too long, it suffers the same attention dilution. Mitigation: keep CLAUDE.md under 200 lines, reference skill files for details. |
| **Claude Code agent teams are experimental** | The plan uses subagents (Task tool), which are stable. Agent teams are optional — used only for reviewer parallelization. Fallback: run dimensions sequentially. |
| **No enterprise deployment yet** | This is an R&D investment. The Copilot Chat version continues for enterprise delivery. Skills architecture proves the concept; enterprise deployment follows when Claude Code gets team licenses. |
| **Skills need Claude Code context to read them** | Each skill file must be read by the LLM at runtime. More file reads = more token usage. Mitigation: skills are short (30-80 lines each), and only the relevant skills are read per stage. |

### 7.2 What We Gain

| Benefit | Impact |
|---------|--------|
| **Hybrid support from day 1** | Unlocks "Create via API → Verify in UI" scenarios without workarounds |
| **Native mobile support** | Android/iOS test automation via Appium MCP — added with 8 new skill files, zero existing modifications |
| **Faster debugging** | 1 skill = 1 output. If locators are wrong, the problem is in `generate-locators.md` |
| **Parallel reviewer execution** | Up to 9 dimension reviews can run simultaneously instead of sequentially |
| **Lower risk for future changes** | New type/tool/capability = new skill file. No existing modifications. |
| **Better AI consistency** | 40-line prompts are dramatically more predictable than 400-line prompts |
| **Team scalability** | Different team members can own different skills without conflicts |

---

## 8. Implementation Plan

> **Status:** Phases 1-9 are complete. Mobile support (Appium MCP, 8 mobile skill files, mobile templates) was implemented after the initial rollout, validating the architecture's extensibility claim — zero existing skills were modified.

### 8.1 Setup

```bash
cp -r agentic-qe-framework-enterprise-main-v4 agentic-qe-framework-skills-v5
cd agentic-qe-framework-skills-v5
git checkout -b skills-architecture
```

### 8.2 Remove Copilot-Specific Files

- `.github/agents/` (7 `.agent.md` files)
- `.github/prompts/` (7 `.prompt.md` files)
- `.github/copilot-instructions.md`
- `agents/` (5 `0X-*.md` files — content decomposed into `skills/`)

### 8.3 Create Skills Structure + Write All Files

| # | What | Files | Content Source |
|---|------|-------|----------------|
| 1 | `skills/_shared/` (5 files) | guardrails, paths, keywords, output-structure, reporting | Extracted from agents/0X-*.md + orchestrator.agent.md |
| 2 | `skills/generator/` (8 files) | setup-framework through setup-test-data | Decomposed from agents/02-generator.md (357 lines) |
| 3 | `skills/healer/` (7 files) | heal-loop through generate-healer-report | Decomposed from agents/03-healer.md (207 lines) |
| 4 | `skills/reviewer/` (9 files) | 8 review dimensions + aggregate-scorecard | Decomposed from agents/04-reviewer.md (120 lines) |
| 5 | `skills/healer-review/` (9 files) | 8 fix dimensions + validate-fixes | Decomposed from healer-review.agent.md (269 lines) |
| 6 | `skills/analyst/` (1 file) | analyze-scenario | Adapted from agents/01-analyst.md |
| 7 | `skills/api-analyst/` (1 file) | generate-api-scenarios | Adapted from agents/05-api-analyst.md |
| 8 | `CLAUDE.md` | Orchestrator + project instructions | Replaces current CLAUDE.md + orchestrator.agent.md |
| 9 | Docs | README.md, ENTERPRISE-SCALING-GUIDE.md, scenario template | Updated for Claude Code + skills + hybrid |

### 8.4 Execution Order

| Phase | Steps | Effort |
|-------|-------|--------|
| **Phase 1: Scaffold** | Copy repo, delete Copilot files, create directory tree | Trivial |
| **Phase 2: Foundation** | Write `skills/_shared/` (5 files) | Medium |
| **Phase 3: Generator** | Write 8 generator skills | **High** |
| **Phase 4: Healer** | Write 7 healer skills | **High** |
| **Phase 5: Reviewer** | Write 9 reviewer skills | Medium |
| **Phase 6: Healer-Review** | Write 9 healer-review skills | Medium |
| **Phase 7: Standalone** | Write analyst + API analyst skills | Small |
| **Phase 8: Orchestrator** | Write CLAUDE.md (with reporting + MCP sections) | **High** |
| **Phase 9: Docs** | Update README, scaling guide, scenario template | Small |

---

## 9. Verification Checklist

After implementation:

1. All 46 skill files exist in correct directories
2. Every rule from current `agents/0X-*.md` exists in exactly one skill file
3. Every `skills/_shared/` file is referenced by at least one skill
4. All guardrails preserved: helper protection, shared data protection, assertion protection, API Behavior escape hatch
5. Every scenario keyword appears in `keyword-reference.md` with code pattern
6. `generate-hybrid-spec.md` exists with `{ page, request }` fixture pattern
7. CLAUDE.md covers all 5 pipeline stages with skill composition for web, API, hybrid, and mobile
8. Zero references to "Copilot Chat", ".agent.md", ".prompt.md" in functional files
9. `skills/_shared/reporting.md` documents Allure, ReportPortal, JSON dashboard patterns
10. CLAUDE.md has MCP extensibility section with Playwright and Appium as current, DB/GitHub as future
11. Dry run: Open repo in Claude Code, invoke pipeline, verify correct skill file reads
12. Mobile skill files exist: `analyze-scenario-mobile.md` (analyst), `setup-mobile-framework.md` + `generate-mobile-locators.md` + `generate-screens.md` + `generate-mobile-spec.md` (generator x4), `diagnose-failure-mobile.md` (healer x1), `review-mobile-quality.md` (reviewer x1), `fix-mobile-quality.md` (healer-review x1)
13. Mobile templates exist in `templates/mobile/`: `base-screen.ts`, `locator-loader-mobile.ts`, `wdio.conf.ts`, `capabilities.ts`
14. Appium MCP server builds (`cd mcp-servers/appium && npm run build`) and is registered in `.mcp.json`
15. CLAUDE.md covers mobile pipeline composition with correct type routing (`type=mobile` → Appium MCP + mobile skills)
