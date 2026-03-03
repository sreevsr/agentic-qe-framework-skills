# Reference Documentation — NOT Loaded at Runtime

These files are **canonical human reference documents** for onboarding, auditing, and propagating changes to individual skill files. They are NOT loaded by the LLM during pipeline execution.

## Why These Exist

Each skill file has the relevant rules and paths inlined directly (Tier 1 of the tiered architecture). These reference files serve as the single source of truth for humans:

- **Updating a guardrail?** Edit `guardrails.md` here first, then propagate the change to affected skill files.
- **Changing a path convention?** Edit `path-resolution.md` here first, then propagate.
- **Onboarding a new team member?** Read these files for the full picture of all rules and conventions.

## Files

| File | Purpose | Inlined Into |
|------|---------|-------------|
| `guardrails.md` | Helper, shared data, assertion, core file protection rules | Generator, Healer, Healer-Review skills |
| `path-resolution.md` | Canonical file paths for all input/output files | All skills that read/write files |
| `output-structure.md` | Directory tree contract and naming conventions | `setup-framework.md` |
| `reporting.md` | Reporter configuration (HTML, Allure, ReportPortal) | `setup-framework.md` |
| `fix-guardrails.md` | Pre-edit gate table for Healer and Healer-Review | `apply-fix.md`, `fix-*.md` skills |

## The One Exception

`skills/_shared/keyword-reference.md` is the ONLY shared file still loaded at runtime. It's loaded by the orchestrator (CLAUDE.md) during the spec generation step only — not "always loaded." This is Tier 2 of the tiered architecture, kept shared because keywords change when new MCP servers are added.
