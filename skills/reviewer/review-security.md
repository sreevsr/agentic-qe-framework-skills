# Skill: Review Security (Dimension 7)

## Purpose
Audit for hardcoded credentials, tokens, and secrets. Weight: **High**.

## Scope
All scenario types.

## Checklist

- [ ] No passwords, tokens, or secrets hardcoded anywhere in code
- [ ] All credentials use `process.env.VARIABLE_NAME`
- [ ] `.env.example` exists with placeholder variable names (no real values)
- [ ] `.gitignore` includes `.env`
- [ ] Scenario `.md` files use `{{ENV.VARIABLE}}` pattern, not real values

## What to Check

### Global Search for Secrets

Search ALL files in `output/` for patterns that indicate hardcoded credentials:

| Pattern | Risk |
|---------|------|
| `password = '...'` or `password: '...'` | Hardcoded password |
| `token = '...'` or `Bearer ...` with literal string | Hardcoded token |
| `secret_sauce` in `.ts` files | SauceDemo default — should be in .env |
| `standard_user` in `.ts` files | SauceDemo default — should be in .env |
| Literal API keys (long alphanumeric strings) | Hardcoded API key |
| `Authorization: 'Basic ...'` with literal value | Hardcoded auth header |

### Credential Usage Pattern

Every credential reference should follow:
```typescript
// CORRECT
process.env.TEST_USERNAME
process.env.TEST_PASSWORD
process.env.API_TOKEN

// WRONG
'standard_user'
'secret_sauce'
'Bearer abc123token'
```

### Environment Files

1. `output/.env.example` must exist with template variables (empty values)
2. `output/.env` must NOT be committed (check `.gitignore`)
3. `.env.example` should list ALL variables used in the generated code

### Scenario Files

Check `scenarios/**/*.md` for real credential values. Should use `{{ENV.VARIABLE}}` pattern.

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | Zero hardcoded credentials, `.env.example` complete, `.gitignore` correct |
| 4 | No credentials in code but `.env.example` missing 1-2 variables |
| 3 | 1-2 hardcoded values (e.g., test username but not password) |
| 2 | Multiple hardcoded credentials in test files |
| 1 | Passwords and tokens hardcoded throughout, no `.env.example` |

## Output
Return: score (1-5), list of issues with file paths and line numbers, key finding summary.
