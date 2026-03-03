# Skill: Fix API Quality (Dimension 8 Fixes)

## Purpose
Fix API test quality issues: wrong HTTP client, missing assertions, hardcoded auth.

## Scope
Only applies if API or hybrid tests exist.

## Fixes

### Replace External HTTP Library

```typescript
// BEFORE (wrong — external library)
import axios from 'axios';
const response = await axios.get('/api/users');

// AFTER (correct — Playwright request fixture)
test('API test', async ({ request }) => {
  const response = await request.get('/api/users');
});
```

Also remove `axios`, `node-fetch`, etc. from `package.json` if no longer used.

### Add Missing Status Assertions

```typescript
// BEFORE (no status check)
const response = await request.post('/api/users', { data: payload });
const body = await response.json();

// AFTER (status assertion added)
const response = await request.post('/api/users', { data: payload });
expect(response.status()).toBe(201);
const body = await response.json();
```

### Add Missing Body Assertions

```typescript
// BEFORE (status only — insufficient)
expect(response.status()).toBe(200);

// AFTER (status + body verification)
expect(response.status()).toBe(200);
const body = await response.json();
expect(body).toHaveProperty('id');
expect(body.name).toBe(expectedName);
```

### Fix Hardcoded Auth

```typescript
// BEFORE
const headers = { Authorization: 'Bearer hardcoded_123' };

// AFTER
const headers = { Authorization: `Bearer ${process.env.API_TOKEN}` };
```

### Fix CRUD Chain Issues

```typescript
// BEFORE (hardcoded ID — WRONG)
test('read user', async ({ request }) => {
  const response = await request.get('/api/users/42');
});

// AFTER (dynamic ID from previous step)
test.describe.serial('User CRUD', () => {
  let userId: string;

  test('create user', async ({ request }) => {
    const response = await request.post('/api/users', { data });
    const body = await response.json();
    userId = body.id;
  });

  test('read user', async ({ request }) => {
    const response = await request.get(`/api/users/${userId}`);
  });
});
```

## Validation
After fixes, run API tests to verify they pass with the corrected patterns.

## Rules
- Review fixes must not change expected test behavior (assertion values)
- Do not change expected status codes (that would mask application bugs)
- Follow the same guardrails as the Healer for assertion protection
