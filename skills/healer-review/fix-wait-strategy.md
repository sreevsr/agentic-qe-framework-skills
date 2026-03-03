# Skill: Fix Wait Strategy (Dimension 2 Fixes)

## Purpose
Replace all `waitForTimeout` and artificial delays with proper Playwright waits.

## Fixes

### Remove waitForTimeout

```typescript
// BEFORE (bad)
await page.waitForTimeout(3000);

// AFTER (good) — choose the appropriate replacement:

// After navigation:
await page.waitForLoadState('domcontentloaded');

// Waiting for specific element:
await page.waitForSelector('.element', { state: 'visible' });

// Waiting for URL change:
await page.waitForURL('**/dashboard');

// Often: just remove the wait entirely — Playwright auto-waits on actions
```

### Remove setTimeout

```typescript
// BEFORE
await new Promise(resolve => setTimeout(resolve, 2000));

// AFTER
await page.waitForLoadState('domcontentloaded');
// or remove entirely if Playwright auto-wait handles it
```

### Add Missing Navigation Waits

```typescript
// BEFORE — navigation without wait
await page.goto('/checkout');
await checkoutPage.fillForm();  // May fail if page not loaded

// AFTER — proper wait after navigation
await page.goto('/checkout');
await page.waitForLoadState('domcontentloaded');
await checkoutPage.fillForm();
```

### Add Missing Form Submission Waits

```typescript
// BEFORE — no wait after form submit
await loginPage.clickLogin();
const welcomeText = await dashboardPage.getWelcomeText();  // May fail

// AFTER — wait for navigation after submit
await loginPage.clickLogin();
await page.waitForLoadState('domcontentloaded');
const welcomeText = await dashboardPage.getWelcomeText();
```

## Validation
After all fixes, run tests to verify timing changes don't break anything.

## Rules
- Never add `waitForTimeout` — always use event-based waits
- Prefer Playwright's built-in auto-waiting over explicit waits when possible
- Do not change test behavior — only replace timing mechanisms
