# Skill: Generate API Spec

## Purpose
Generate Playwright TypeScript test spec files for `type=api` scenarios. Uses Playwright's built-in `request` fixture (not axios/fetch).

## Paths
- Output (with folder): `output/tests/api/{folder}/{scenario}.spec.ts`
- Output (without folder): `output/tests/api/{scenario}.spec.ts`
- Scenario source (with folder): `scenarios/api/{folder}/{scenario}.md`
- Scenario source (without folder): `scenarios/api/{scenario}.md`

## Rules
- **Assertion Protection:** VERIFY steps produce `expect()` assertions matching the scenario's explicit expected values. Never weaken or remove them.

## Keyword Patterns
Apply keyword patterns from `skills/_shared/keyword-reference.md` (loaded separately by the orchestrator before this skill runs).

## Input
- Scenario `.md` file (API scenarios skip the Analyst stage — read scenario directly)
- Test data files (from `setup-test-data` skill)

## Output Path
- With folder: `output/tests/api/{folder}/{scenario}.spec.ts`
- Without folder: `output/tests/api/{scenario}.spec.ts`

## Process

### Step 1: Read Scenario

Parse the API scenario file for:
- API base URL (from `## API Base URL:` header or `{{ENV.API_BASE_URL}}`)
- API endpoints and methods (GET, POST, PUT, PATCH, DELETE)
- Request bodies and headers
- Expected status codes
- VERIFY, CAPTURE, SAVE, REPORT keywords
- Tags
- DATASETS (if present)
- `## API Behavior:` header (mock or live)

### Step 2: Generate Imports

```typescript
import { test, expect } from '@playwright/test';
```

For SHARED_DATA:
```typescript
import { loadTestData } from '../../core/test-data-loader';
```

For SAVE:
```typescript
import { saveState } from '../../core/shared-state';
```

### Step 3: Generate Test Body

API tests use the `request` fixture (not `page`):

```typescript
test.describe('API: Resource CRUD', () => {
  const baseURL = process.env.API_BASE_URL || 'https://api.example.com';
  const headers = {
    Authorization: `Bearer ${process.env.API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  test('POST /resource — Create', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const response = await request.post(`${baseURL}/resource`, {
      headers,
      data: { name: 'Test Resource' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  test('GET /resource/{id} — Retrieve', { tag: ['@api', '@smoke'] }, async ({ request }) => {
    const response = await request.get(`${baseURL}/resource/${resourceId}`, { headers });
    expect(response.status()).toBe(200);
  });
});
```

### Step 4: CRUD Chain Pattern

For scenarios with linked CRUD operations (Create → Read → Update → Delete):

```typescript
test.describe.serial('API: Resource CRUD Chain', () => {
  let resourceId: string;

  test('Create resource', async ({ request }) => {
    const response = await request.post(`${baseURL}/resource`, {
      headers,
      data: testData.createPayload,
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    resourceId = body.id;
  });

  test('Read resource', async ({ request }) => {
    const response = await request.get(`${baseURL}/resource/${resourceId}`, { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(resourceId);
  });
});
```

Use `test.describe.serial()` for ordered CRUD chains.

### Step 5: Auth Headers

All API auth headers MUST come from environment variables:

```typescript
const headers = {
  Authorization: `Bearer ${process.env.API_TOKEN}`,
};
```

Never hardcode tokens or credentials.

## Prohibited Patterns
- No `axios`, `fetch`, or `node-fetch` — use Playwright's `request` fixture
- No hardcoded tokens or API keys
- No `page` fixture in API-only tests
- No `waitForTimeout`

## Quality Checks
- [ ] Uses Playwright's built-in `request` fixture
- [ ] Auth headers use `process.env.API_TOKEN`
- [ ] Response status assertions present for every API call
- [ ] Response body structure verified (not just status code)
- [ ] CRUD chains properly pass values between requests
- [ ] CAPTURE steps on API responses use property access
- [ ] Tags present on every test
