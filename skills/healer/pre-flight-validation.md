# Skill: Pre-Flight Validation

## Purpose
Validate the generated code before the first test run. Catch and fix type errors, missing imports, and configuration issues before they cause test failures.

## Process

### Step 1: TypeScript Type Check

```bash
cd output
npx tsc --noEmit
```

If there are type errors, fix them. Common issues:

| Error | Fix |
|-------|-----|
| Missing `await` on async calls | Add `await` (e.g., `this.isVisible()` returns Promise) |
| Missing `@types/node` | `npm install --save-dev @types/node` |
| Wrong import paths | Check relative `../` vs `../../` paths |
| Missing `dotenv` | `npm install --save-dev dotenv` |
| Unknown type from LocatorLoader | Verify `core/locator-loader.ts` exists and exports correctly |

### Step 2: Verify Step Count

Read the scenario `.md` file and count actionable steps. Read the spec file and count test steps (look for `// STEP N:` comments or sequential method calls).

If the spec has fewer steps than the scenario:
- Log a warning — the Generator may have skipped steps
- Do NOT add missing steps in the Healer (that's the Generator's job)
- Note in the report for potential re-generation

### Step 3: Verify Imports

Check that every import in the spec resolves to an existing file:
- Page object imports → verify `output/pages/{PageName}Page.ts` exists
- Core imports → verify `output/core/*.ts` exists
- Test data imports → verify `output/test-data/**/*.json` exists
- Helper imports → verify `output/pages/*.helpers.ts` exists (if imported)

### Step 4: Verify Config

Check `output/playwright.config.ts`:
- `channel: 'chrome'` (not `browserName: 'chrome'`)
- `baseURL` is set
- Test directory path is correct

### Step 5: Verify Package Dependencies

Check `output/package.json`:
- `@playwright/test` in dependencies or devDependencies
- `@types/node` in devDependencies
- `dotenv` in devDependencies (if `.env` is used)

Fix any missing dependencies with `npm install --save-dev {package}`.

## Output
List of issues found and fixed. Pass this to the heal-loop for tracking.
