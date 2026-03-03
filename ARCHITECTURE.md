# Skills-Based Claude Code Architecture for Agentic QE Framework

## Executive Summary

This document describes the architectural evolution of the Agentic QE Test Automation Framework from a **monolithic agent-based design** (running on GitHub Copilot Chat) to a **composable skills-based architecture** (running on Claude Code). The motivation, trade-offs, technical design, and implementation plan are all covered here.

**What changed:** 5 monolithic AI agents decomposed into 41 focused, composable skills.
**What stayed:** Every framework capability — keywords, guardrails, output structure, enterprise patterns — is preserved.
**What was added:** Native hybrid (web+API) test support, enterprise reporting extensibility, MCP server extensibility for mobile and beyond.

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
| **Adding new types (hybrid, mobile)** | Modify 16 files, add branching everywhere | Write 1 new skill, compose with existing ones |
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
- **Quality dimensions** — Same 8-dimension scorecard with same scoring

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
  generate-pages.md                    ← Page Object creation (50 lines)
  discover-helpers.md                  ← Helper file scanning (30 lines)
  generate-web-spec.md                 ← Web test spec (80 lines)
  generate-api-spec.md                 ← API test spec (60 lines)
  generate-hybrid-spec.md             ← Hybrid test spec (90 lines)
  setup-test-data.md                   ← Test data management (40 lines)
  setup-framework.md                   ← Core file setup (30 lines)
```

10 focused skills replace 1 monolithic agent. The orchestrator (CLAUDE.md) composes the right combination based on scenario type. Each skill does exactly one thing.

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

### 2.4 Side-by-Side Comparison

| Dimension | Agent-Based (Copilot Chat) | Skills-Based (Claude Code) |
|-----------|---------------------------|----------------------------|
| **File count** | 19 files (7 .agent.md + 5 agents/ + 7 .prompt.md) | 44 skill files + CLAUDE.md |
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

### 3.2 Generator Skills (10 files)

Decomposed from `agents/02-generator.md` (357 lines).

| Skill | Input | Output | Lines |
|-------|-------|--------|-------|
| `setup-framework.md` | templates/ directory | output/core/, config files | ~30 |
| `setup-test-data.md` | Scenario .md, existing shared data | output/test-data/ | ~40 |
| `discover-helpers.md` | output/pages/*.helpers.ts | In-memory helper registry | ~30 |
| `generate-locators.md` | Analyst report, Scout report | output/locators/*.json | ~40 |
| `generate-pages.md` | Locator JSON files | output/pages/*.ts | ~50 |
| `generate-web-spec.md` | Analyst report, pages, helpers, scenario | output/tests/web/*.spec.ts | ~80 |
| `generate-api-spec.md` | Scenario .md | output/tests/api/*.spec.ts | ~60 |
| `generate-hybrid-spec.md` | Analyst report, pages, helpers, scenario | output/tests/web/*.spec.ts (with { page, request }) | ~90 |
| `generate-report.md` | All generator outputs | generator-report-{scenario}.md | ~30 |
| `generate-pipeline-summary.md` | All stage reports | pipeline-summary-{scenario}.md | ~40 |

### 3.3 Healer Skills (6 files)

Decomposed from `agents/03-healer.md` (207 lines). Note: `fix-guardrails.md` is in `skills/_reference/` (not loaded at runtime); its rules are inlined in `apply-fix.md`.

| Skill | Purpose | Key Rule |
|-------|---------|----------|
| `heal-loop.md` | Orchestrates full cycle: pre-flight → run → diagnose → fix → repeat (max 5) | Entry point for Stage 3 |
| `pre-flight-validation.md` | Step count, imports, tsc --noEmit | Fix before first test run |
| `run-tests.md` | Execute playwright test for specific spec | NEVER run all tests |
| `diagnose-failure.md` | Classify into categories A-G | Category C: check scenario before changing values |
| `apply-fix.md` | Apply targeted fix by category (includes inlined pre-edit gate) | Protects helpers, shared data, assertions |
| `generate-healer-report.md` | Format results into markdown | Include bugs, helper issues, remaining failures |

### 3.4 Reviewer Skills (9 files)

Decomposed from `agents/04-reviewer.md` (120 lines). Each dimension is independently auditable.

| Skill | Dimension | Scope |
|-------|-----------|-------|
| `review-locator-quality.md` | Primary + fallbacks, no raw selectors | Web/hybrid only |
| `review-wait-strategy.md` | Zero waitForTimeout | All types |
| `review-test-architecture.md` | Tags, POM, parameterization, helpers | All types |
| `review-configuration.md` | channel:'chrome', reporters, timeouts | All types |
| `review-code-quality.md` | No any types, JSDoc, unused imports | All types |
| `review-maintainability.md` | Extensibility, helper conventions | All types |
| `review-security.md` | No hardcoded credentials | All types |
| `review-api-quality.md` | Request fixture, status assertions | API/hybrid only |
| `aggregate-scorecard.md` | Combine scores, issue APPROVED/NEEDS FIXES | All types |

**Parallelization opportunity:** All 8 dimension reviews are independent reads — they can run as parallel Claude Code subagents, then aggregate results.

### 3.5 Healer-Review Skills (9 files)

Decomposed from `healer-review.agent.md` (269 lines). One fix skill per dimension.

### 3.6 Analyst + API Analyst (2 files)

Already focused — kept as single skills.

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

### 6.1 Current MCP: Playwright

The Analyst skill is the only skill requiring browser access. It uses Playwright MCP for element discovery. Configuration in `.vscode/mcp.json`.

### 6.2 Why Skills Architecture is Inherently MCP-Extensible

In the agent-based model, adding a new tool means modifying the agent that uses it. But other agents might need the tool too, leading to capability creep.

In the skills model:
1. Only the skill that needs a tool declares the dependency
2. Adding a new MCP server = configure it + write a new skill
3. **Zero changes to existing skills**

### 6.3 Future MCP Integration Paths

| MCP Server | Use Case | New Skill Files Needed | Existing Skills Modified |
|------------|----------|----------------------|--------------------------|
| **Appium MCP** | Mobile test automation | `analyze-scenario-mobile.md`, `generate-mobile-spec.md` | None |
| **Database MCP** | DB state verification in hybrid tests | `generate-db-assertions.md` | None |
| **Browser-use MCP** | Alternative browser automation | Swap reference in `analyze-scenario.md` | 1 file (swap, not add) |
| **GitHub MCP** | Auto-create issues for flagged bugs | `report-bugs-to-github.md` | None |
| **Slack MCP** | Pipeline status notifications | `notify-slack.md` | None |

### 6.4 Platform Parameter (Future Extension Point)

When mobile support is added:
```
platform=web    → Playwright MCP + web skills
platform=mobile → Appium MCP + mobile skills
platform=api    → no MCP needed
```

Documented as a future extension. The architecture supports it; the implementation is deferred.

---

## 7. Risk Assessment

### 7.1 What Could Go Wrong

| Risk | Mitigation |
|------|------------|
| **More files to maintain (41 vs 19)** | Each file is 3-5x smaller. Total lines of instructions is roughly the same. Navigation by directory structure is clearer than searching monoliths. |
| **Orchestrator complexity** | CLAUDE.md is the single coordination point. If it gets too long, it suffers the same attention dilution. Mitigation: keep CLAUDE.md under 200 lines, reference skill files for details. |
| **Claude Code agent teams are experimental** | The plan uses subagents (Task tool), which are stable. Agent teams are optional — used only for reviewer parallelization. Fallback: run dimensions sequentially. |
| **No enterprise deployment yet** | This is an R&D investment. The Copilot Chat version continues for enterprise delivery. Skills architecture proves the concept; enterprise deployment follows when Claude Code gets team licenses. |
| **Skills need Claude Code context to read them** | Each skill file must be read by the LLM at runtime. More file reads = more token usage. Mitigation: skills are short (30-80 lines each), and only the relevant skills are read per stage. |

### 7.2 What We Gain

| Benefit | Impact |
|---------|--------|
| **Hybrid support from day 1** | Unlocks "Create via API → Verify in UI" scenarios without workarounds |
| **Faster debugging** | 1 skill = 1 output. If locators are wrong, the problem is in `generate-locators.md` |
| **Parallel reviewer execution** | 8 dimension reviews can run simultaneously instead of sequentially |
| **Lower risk for future changes** | New type/tool/capability = new skill file. No existing modifications. |
| **Better AI consistency** | 40-line prompts are dramatically more predictable than 400-line prompts |
| **Team scalability** | Different team members can own different skills without conflicts |

---

## 8. Implementation Plan

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

1. All 44 skill files exist in correct directories
2. Every rule from current `agents/0X-*.md` exists in exactly one skill file
3. Every `skills/_shared/` file is referenced by at least one skill
4. All guardrails preserved: helper protection, shared data protection, assertion protection, API Behavior escape hatch
5. Every scenario keyword appears in `keyword-reference.md` with code pattern
6. `generate-hybrid-spec.md` exists with `{ page, request }` fixture pattern
7. CLAUDE.md covers all 5 pipeline stages with skill composition for web, API, and hybrid
8. Zero references to "Copilot Chat", ".agent.md", ".prompt.md" in functional files
9. `skills/_shared/reporting.md` documents Allure, ReportPortal, JSON dashboard patterns
10. CLAUDE.md has MCP extensibility section with Appium/DB/GitHub paths
11. Dry run: Open repo in Claude Code, invoke pipeline, verify correct skill file reads
