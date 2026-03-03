# Skill: Setup Framework

## Purpose
Copy core framework files from `templates/` into `output/` and set up project configuration. This runs first in the Generator stage to establish the project scaffold.

## References
- `skills/_shared/output-structure.md` — directory tree contract
- `skills/_shared/path-resolution.md` — file paths
- `skills/_shared/reporting.md` — reporter configuration

## Process

### Step 1: Create Directory Structure

Ensure these directories exist inside `output/`:
```
output/core/
output/locators/
output/pages/
output/tests/web/
output/tests/api/
output/test-data/
```

If `folder` parameter is provided, also create:
```
output/tests/web/{folder}/
output/tests/api/{folder}/
output/{folder}/
```

### Step 2: Copy Core Files

Copy from `templates/core/` to `output/core/`. **Do NOT overwrite if already exists.**

| Source | Destination | Condition |
|--------|------------|-----------|
| `templates/core/locator-loader.ts` | `output/core/locator-loader.ts` | Always |
| `templates/core/base-page.ts` | `output/core/base-page.ts` | Always |
| `templates/core/shared-state.ts` | `output/core/shared-state.ts` | Always |
| `templates/core/test-data-loader.ts` | `output/core/test-data-loader.ts` | Always |

### Step 3: Copy Config Files

Copy and customize into `output/`:

| Source | Destination | Notes |
|--------|------------|-------|
| `templates/config/playwright.config.ts` | `output/playwright.config.ts` | Set `baseURL` from analyst report or scenario |
| `templates/config/package.json` | `output/package.json` | Verify `@types/node` and `dotenv` in devDependencies |
| `templates/config/tsconfig.json` | `output/tsconfig.json` | — |

### Step 4: Create .env.example

Create `output/.env.example` with all required environment variables (no actual values):

```bash
# Copy this file to .env and fill in actual values
# .env is gitignored — never commit real credentials
BASE_URL=
TEST_USERNAME=
TEST_PASSWORD=
API_BASE_URL=
API_TOKEN=
```

Add any additional variables discovered in the scenario's `{{ENV.VARIABLE}}` references.

### Step 5: Verify Setup

Check that all required files exist before proceeding to other Generator skills.

## Quality Checks
- [ ] `output/core/locator-loader.ts` exists
- [ ] `output/core/base-page.ts` exists
- [ ] `output/core/shared-state.ts` exists
- [ ] `output/core/test-data-loader.ts` exists
- [ ] `output/playwright.config.ts` uses `channel: 'chrome'` (not `browserName: 'chrome'`)
- [ ] `output/package.json` includes `@types/node` and `dotenv` in devDependencies
- [ ] `output/.env.example` exists with placeholder variable names
- [ ] No real credentials anywhere in generated files
