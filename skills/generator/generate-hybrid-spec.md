# Skill: Generate Hybrid Spec

## Purpose
Generate Playwright TypeScript test spec files for `type=hybrid` scenarios that interleave API calls and browser UI interactions in the same test. Uses both `{ page, request }` fixtures.

## Paths
- Output (with folder): `output/tests/web/{folder}/{scenario}.spec.ts`
- Output (without folder): `output/tests/web/{scenario}.spec.ts`
(Hybrid specs go in `tests/web/` because they include UI interactions.)

## Rules
- **Helper File Protection:** If a page has a `*.helpers.ts` file, import the helpers class aliased to the base name. NEVER create or modify helper files.
- **Assertion Protection:** VERIFY steps produce `expect()` assertions matching the scenario's explicit expected values. Never weaken or remove them.

## Keyword Patterns
Apply keyword patterns from `skills/_shared/keyword-reference.md` (loaded separately by the orchestrator before this skill runs).

## Input
- Analyst report — step results for UI steps
- Page objects and helper registry
- Original scenario `.md` file
- Test data files

## Output Path
- With folder: `output/tests/web/{folder}/{scenario}.spec.ts`
- Without folder: `output/tests/web/{scenario}.spec.ts`

(Hybrid specs go in `tests/web/` because they include UI interactions.)

## Process

### Step 1: Identify Interleaved Steps

Parse the scenario to identify the flow pattern. Hybrid scenarios freely mix API and UI steps:

```
1. API POST: /api/orders with body {...}        ← API step
2. CAPTURE: Response $.id as {{orderId}}         ← API capture
3. Navigate to {{ENV.BASE_URL}}/orders           ← UI step
4. Login with {{ENV.TEST_USERNAME}}              ← UI step
5. VERIFY: Order {{orderId}} appears in list     ← UI verification of API data
6. Click on order {{orderId}}                    ← UI step
7. API GET: /api/orders/{{orderId}}/status       ← Mid-flow API check
8. VERIFY: API status matches UI status          ← Cross-domain assertion
9. Click "Complete Order" button                 ← UI step
10. API GET: /api/orders/{{orderId}}             ← Final API assertion
11. VERIFY: Response $.status is "completed"     ← API verification
```

### Step 2: Generate Imports

```typescript
import { test, expect } from '@playwright/test';
// Page objects (with helpers if available)
import { OrdersPage } from '../pages/OrdersPage';
import { LoginPage } from '../pages/LoginPage';
// Shared data if needed
import { loadTestData } from '../../core/test-data-loader';
```

### Step 3: Generate Test with Dual Fixtures

The key difference from web-only specs: destructure BOTH `page` and `request` from the test fixture.

```typescript
test('Create order via API and verify in UI', {
  tag: ['@hybrid', '@smoke', '@P0']
}, async ({ page, request }) => {
  const baseAPIUrl = process.env.API_BASE_URL || 'https://api.example.com';
  const headers = {
    Authorization: `Bearer ${process.env.API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // STEP 1: API — Create test data
  const createResponse = await request.post(`${baseAPIUrl}/orders`, {
    headers,
    data: { product: 'Widget', quantity: 5 },
  });
  expect(createResponse.status()).toBe(201);
  const orderBody = await createResponse.json();
  const orderId = orderBody.id;

  // STEP 2: UI — Navigate and verify
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!);

  const ordersPage = new OrdersPage(page);
  await ordersPage.navigate();

  // STEP 3: UI — Verify API-created data appears
  expect(await ordersPage.isOrderVisible(orderId)).toBe(true);

  // STEP 4: API — Mid-flow check
  const statusResponse = await request.get(`${baseAPIUrl}/orders/${orderId}/status`, { headers });
  expect(statusResponse.status()).toBe(200);
  const statusBody = await statusResponse.json();

  // STEP 5: UI — Cross-domain assertion
  const uiStatus = await ordersPage.getOrderStatus(orderId);
  expect(uiStatus).toBe(statusBody.status);

  // STEP 6: UI — Complete the action
  await ordersPage.clickCompleteOrder(orderId);

  // STEP 7: API — Final verification
  const finalResponse = await request.get(`${baseAPIUrl}/orders/${orderId}`, { headers });
  const finalBody = await finalResponse.json();
  expect(finalBody.status).toBe('completed');
});
```

### Step 4: Variable Sharing Between Domains

Variables captured from API responses (via CAPTURE) are available to UI steps and vice versa. All variables live in the same test function scope:

```typescript
// API CAPTURE feeds UI step
const resourceId = apiBody.id;                    // From API
expect(await uiPage.isItemVisible(resourceId));   // Used in UI

// UI CAPTURE feeds API step
const uiPrice = await cartPage.getSubtotal();     // From UI
const apiResponse = await request.get(`/api/price-check?amount=${uiPrice}`); // Used in API
```

### Step 5: Apply All Keywords

Hybrid specs support ALL keywords from `keyword-reference.md`. The only difference is that API steps use `request` and UI steps use `page`/page objects. Keywords like VERIFY, CAPTURE, CALCULATE, SCREENSHOT, REPORT, SAVE all work identically.

## Prohibited Patterns
- No `axios` or `fetch` — use Playwright `request` fixture
- No `waitForTimeout()`
- No hardcoded selectors in test code
- No hardcoded credentials or tokens
- UI assertions must use page objects, not raw selectors

## Quality Checks
- [ ] Test function destructures `{ page, request }` (both fixtures)
- [ ] API steps use `request` fixture
- [ ] UI steps use page objects
- [ ] Variables captured from API are accessible to UI steps and vice versa
- [ ] Auth headers from environment variables
- [ ] All keywords implemented correctly
- [ ] Tags include `@hybrid`
