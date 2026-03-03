# Skill: Fix Security (Dimension 7 Fixes)

## Purpose
Replace hardcoded credentials, tokens, and secrets with environment variable references.

## Pre-Edit Gate
Before editing ANY file, check its path:
| File Pattern | Edit Allowed? | Alternative |
|-------------|--------------|-------------|
| `*.helpers.ts` | **NO** | Document in report but do NOT fix |
| `test-data/shared/*` | **NO** | Create scenario override instead |
| `output/core/*` | **NO** | Document for team review |
| Everything else | **YES** | Proceed with fix |

## Fixes

### Replace Hardcoded Credentials

```typescript
// BEFORE (hardcoded — WRONG)
await loginPage.login('standard_user', 'secret_sauce');

// AFTER (from environment — CORRECT)
await loginPage.login(
  process.env.TEST_USERNAME || '',
  process.env.TEST_PASSWORD || ''
);
```

### Replace Hardcoded Tokens

```typescript
// BEFORE
const headers = { Authorization: 'Bearer abc123_hardcoded_token' };

// AFTER
const headers = { Authorization: `Bearer ${process.env.API_TOKEN}` };
```

### Update .env.example

Ensure `output/.env.example` includes ALL variables used in generated code:

```bash
# Copy this file to .env and fill in actual values
# .env is gitignored — never commit real credentials
BASE_URL=
TEST_USERNAME=
TEST_PASSWORD=
API_BASE_URL=
API_TOKEN=
```

Add any new variables discovered during security fixes.

### Verify .gitignore

Ensure `output/.gitignore` (or root `.gitignore`) includes:
```
.env
.env.local
.env.*.local
```

## Validation
After fixes:
1. Verify `.env` file has the actual values (so tests still pass)
2. Run tests to confirm environment variable references work
3. Search for remaining hardcoded strings

## Rules
- Replace ALL hardcoded credentials, not just the ones the Reviewer found
- Always provide fallback `|| ''` for optional env vars
- Never commit actual credential values — only update `.env.example` with empty placeholders
