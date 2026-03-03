# Keyword Reference — Scenario Keywords and Code Patterns

Complete specification of all scenario keywords with their TypeScript code generation patterns. Referenced by Generator specs, Healer pre-flight validation, and Reviewer step-completeness checks.

## Keywords

### VERIFY — Mid-Step Assertion

Converts to an `expect()` assertion inline where it appears in the scenario.

```typescript
// VERIFY: Cart badge shows "2"
expect(await inventoryPage.getCartBadgeCount()).toBe(2);

// VERIFY: URL contains "/dashboard"
await expect(page).toHaveURL(/\/dashboard/);

// VERIFY: "Sauce Labs Backpack" appears in cart
expect(await cartPage.isItemInCart('Sauce Labs Backpack')).toBe(true);
```

### CAPTURE — Store Runtime Value

Reads a value from the page or API response into a variable for later use.

```typescript
// CAPTURE: Read subtotal as {{subtotal}}
const subtotal = await checkoutPage.getSubtotal();

// CAPTURE: Response $.id as {{resourceId}}
const resourceId = body.id;
```

Page objects should have getter methods for CAPTURE targets (e.g., `getSubtotal(): Promise<string>`).

### CALCULATE — Arithmetic on Captured Values

Performs math on previously captured values.

```typescript
// CALCULATE: {{expectedTotal}} = {{subtotal}} + {{tax}}
const expectedTotal = (
  parseFloat(subtotal.replace('$', '')) +
  parseFloat(tax.replace('$', ''))
).toFixed(2);
```

### SCREENSHOT — Visual Evidence Capture

Captures a full-page screenshot and attaches it to the Playwright report.

```typescript
// SCREENSHOT: checkout-overview
const screenshot = await page.screenshot({ fullPage: true });
await test.info().attach('checkout-overview', {
  body: screenshot,
  contentType: 'image/png',
});
```

### REPORT — Print to Console and Annotations

Logs captured values and attaches as test annotations.

```typescript
// REPORT: Print subtotal, tax, total
console.log(`Subtotal: ${subtotal}`);
test.info().annotations.push({ type: 'subtotal', description: subtotal });
test.info().annotations.push({ type: 'tax', description: tax });
test.info().annotations.push({ type: 'total', description: total });
```

### SAVE — Write to Shared State

Persists a value to `shared-state.json` for cross-scenario chaining.

```typescript
// SAVE: Write {{orderNumber}} to shared-state.json as "lastOrderNumber"
import { saveState } from '../core/shared-state';
saveState('lastOrderNumber', orderNumber);
```

### DATASETS — Data-Driven Parameterized Tests

Creates parameterized `for...of` loops from a markdown table.

```typescript
// Scenario with DATASETS table
import testData from '../../test-data/login-datasets.json';

for (const data of testData) {
  test(`Login: ${data.username || '(empty)'} — expects ${data.expectedResult}`,
    { tag: ['@regression'] },
    async ({ page }) => {
      // Use data.username, data.password, etc.
    });
}
```

The Analyst executes only the FIRST data row. The Generator creates a JSON array with ALL rows.

### SHARED_DATA — Load Shared Reference Data

Loads reusable data from `test-data/shared/` and merges with scenario-specific data.

```typescript
// SHARED_DATA: users, products
import { loadTestData } from '../../core/test-data-loader';
const testData = loadTestData('web/saucedemo-checkout', ['users', 'products']);
// testData merges shared/users.json + shared/products.json + web/saucedemo-checkout.json
```

When no shared data is needed, use direct import (backward compatible):
```typescript
import testData from '../../test-data/web/saucedemo-checkout.json';
```

### USE_HELPER — Call Team-Maintained Helper Method

Calls a method from a `*.helpers.ts` file. Format: `USE_HELPER: PageName.methodName` or `USE_HELPER: PageName.methodName → {{variable}}`.

```typescript
// USE_HELPER: CartPage.calculateTotalPrice → {{cartTotal}}
const cartTotal = await cartPage.calculateTotalPrice();

// USE_HELPER: CartPage.validateAllCartPrices (no capture — just call it)
await cartPage.validateAllCartPrices();
```

If the helpers file does not exist or the method is not found, emit a warning comment:
```typescript
// WARNING: USE_HELPER requested CartPage.calculateTotalPrice but CartPage.helpers.ts not found
```

### API Steps — REST API Calls

For `API GET/POST/PUT/PATCH/DELETE` steps in scenarios:

```typescript
// API POST: /api/users with body {"name": "John"}
const response = await request.post('/api/users', {
  data: { name: 'John' },
});
expect(response.status()).toBe(201);
const body = await response.json();

// API GET: /api/users/{{userId}}
const getResponse = await request.get(`/api/users/${userId}`);
expect(getResponse.status()).toBe(200);
```

- Use `{ request }` fixture for API-only tests
- Use `{ page, request }` fixtures for hybrid (web + API) tests
- Set auth headers from environment: `{ Authorization: \`Bearer ${process.env.API_TOKEN}\` }`

### Tags — CI/CD Filtering Labels

```typescript
// **Tags:** smoke, cart, P0
test('scenario name', { tag: ['@smoke', '@cart', '@P0'] }, async ({ page }) => {
  // ...
});
```

Always prefix tag values with `@`.

### ENV_VARS — Environment Variables

Scenario references like `{{ENV.TEST_USERNAME}}` become `process.env.TEST_USERNAME` in generated code. Never hardcode credentials.

### API Behavior — API Persistence Declaration

Declared in scenario header. Controls Healer behavior. See `guardrails.md` for full rules.

- `## API Behavior: mock` — Non-persistent mock API
- `## API Behavior: live` — Real persistent API (default if omitted)

### Multi-Scenario Files

- `---` separator between scenarios in one file
- `## Common Setup` steps become `test.beforeEach()` in the spec
- Each `### Scenario:` block becomes a separate `test()` inside `test.describe()`
