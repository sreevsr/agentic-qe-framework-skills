# Skill: Review API Test Quality (Dimension 8)

## Purpose
Audit API test implementation patterns. Weight: **Medium**. Only scored if API or hybrid tests exist.

## Scope
API and hybrid scenarios only. Return N/A for web-only scenarios.

## Checklist

- [ ] Uses Playwright's built-in `request` fixture (not axios/fetch/node-fetch)
- [ ] API auth headers use `process.env.API_TOKEN`
- [ ] Response status assertions present for every API call
- [ ] Response body structure verified (not just status code)
- [ ] API chaining properly passes values between requests (variables, not hardcoded IDs)
- [ ] CAPTURE steps on API responses correctly use JSONPath or property access
- [ ] CRUD chains use `test.describe.serial()` for ordered execution

## What to Check

### Request Fixture

```typescript
// CORRECT — Playwright built-in
test('API test', async ({ request }) => {
  const response = await request.get('/api/users');
});

// WRONG — external HTTP library
import axios from 'axios';                    // ❌
const response = await fetch('/api/users');    // ❌
```

### Status Assertions

Every API call should have a status assertion:
```typescript
const response = await request.post('/api/users', { data });
expect(response.status()).toBe(201);           // ✅ Required
const body = await response.json();            // Then process body
```

### Body Assertions

Not just status codes — verify response structure:
```typescript
expect(body).toHaveProperty('id');             // ✅ Structure check
expect(body.name).toBe('John');                // ✅ Value check
expect(Array.isArray(body.items)).toBe(true);  // ✅ Type check
```

### Auth Headers

```typescript
// CORRECT
const headers = { Authorization: `Bearer ${process.env.API_TOKEN}` };

// WRONG
const headers = { Authorization: 'Bearer hardcoded_token_123' };
```

### CRUD Chain Integrity

For Create → Read → Update → Delete chains:
1. Values pass between tests via variables (not hardcoded IDs)
2. Uses `test.describe.serial()` to ensure execution order
3. Each step verifies the previous step's effect

### Hybrid Test Patterns (if type=hybrid)

1. Test destructures `{ page, request }` — both fixtures
2. API results feed into UI assertions and vice versa
3. Variables shared between API and UI steps in same function scope

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | Playwright request fixture, all status + body assertions, proper chaining, env auth |
| 4 | Correct fixture and assertions, minor: 1-2 API calls missing body checks |
| 3 | Correct fixture, but several missing assertions or hardcoded values |
| 2 | Using external HTTP library, or widespread missing assertions |
| 1 | No proper API testing patterns, hardcoded tokens |
| N/A | No API tests exist (web-only scenario) |

## Output
Return: score (1-5 or N/A), list of issues with file paths and line numbers, key finding summary.
