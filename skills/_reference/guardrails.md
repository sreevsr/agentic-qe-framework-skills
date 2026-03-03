# Guardrails — Cross-Cutting Protection Rules

These rules are ABSOLUTE. Every skill that modifies files MUST check this document before applying changes.

## 1. Helper File Protection

Files matching `output/pages/*.helpers.ts` are **team-owned**. The pipeline NEVER creates, modifies, or deletes them.

- **Generator:** Read helpers for discovery only. Import the helpers class in specs, never edit the file.
- **Healer:** If a helper method causes a test failure, mark the step with `test.fixme('HELPER ISSUE: {PageName}.{methodName} — [description]')`. Document in report under "Helper Method Issues". Do NOT rewrite, delete, or work around the helper.
- **Healer-Review:** If a helpers file contains raw selectors (Dimension 4 issue), document it in the report but do NOT fix it.

## 2. Shared Test Data Protection

Files in `output/test-data/shared/` are cross-scenario reference data owned by the team.

- **No skill may modify or delete files in `test-data/shared/`.**
- If a shared value causes a test failure, create a scenario-level override in `test-data/{type}/{scenario}.json` instead.
- The Generator may CREATE new shared data files if they don't already exist, but must NEVER overwrite existing ones.

## 3. Assertion Protection

The Healer fixes TEST CODE (how we test). It must NEVER alter EXPECTED BEHAVIOR (what we test).

**What the Healer CAN fix (test defects):**
- Wrong import path or missing module
- Wrong/stale CSS selector — find the correct one in the DOM
- Missing `await` or missing wait after navigation
- Wrong relative URL in test code
- Config error (channel, env file, missing dependency)
- TypeScript type error

**What the Healer must NEVER do (masks application bugs):**
- Change expected status codes in assertions (e.g., 201 → 200)
- Change expected values in VERIFY assertions that the scenario explicitly defines
- Remove or comment out VERIFY/assertion steps
- Use `{ force: true }` to bypass disabled or overlapped elements — **Exception:** `{ force: true }` IS allowed when the Scout report explicitly flags a `HIT-AREA MISMATCH` warning for the specific element. No other justification is accepted.
- Substitute a different resource ID when a CRUD chain fails at persistence
- Add login/auth/navigation steps not present in the source scenario
- Remove response body field assertions
- Change CALCULATE expected results

## 4. API Behavior Escape Hatch

The guardrails above are **ABSOLUTE by default**. The Healer must NOT use its own judgment to decide whether a persistence failure is "expected" or "by design." Only ONE thing overrides the guardrails:

**The scenario file declares `## API Behavior: mock` in its header.**

| Scenario Header | Healer Behavior |
|----------------|-----------------|
| `## API Behavior: mock` | API is a known non-persistent mock. Healer MAY adapt tests for non-persistence (e.g., use existing IDs instead of dynamically created ones). Document as "Mock API Adaptation" (not a potential bug). |
| `## API Behavior: live` OR no header | Treat as real production API. All persistence/assertion guardrails apply with ZERO exceptions. If POST returns 2xx but GET returns 404, flag as POTENTIAL BUG. No rationalization. |

**The Healer must NEVER infer API behavior from the URL, API name, or its own knowledge. Only the explicit `## API Behavior` header in the scenario file controls this.**

## 5. Core File Protection

Files in `output/core/` are framework infrastructure. The Generator copies them from `templates/core/` on first run.

- **Healer:** May fix import paths referencing core files, but must NOT modify the core files themselves.
- **Healer-Review:** Must NOT modify core files to fix review issues.
- If a core file has a bug, document it in the report for manual team review.

## 6. Pre-Edit Gate (for Healer and Healer-Review)

Before editing ANY file, check its filename:

| Pattern | Action |
|---------|--------|
| `*.helpers.ts` | **STOP.** Do not edit. Use `test.fixme()` and document. |
| `test-data/shared/*` | **STOP.** Create scenario-level override instead. |
| `output/core/*` | **STOP.** Document for team review. |
| Everything else | Proceed with the fix. |
