# Skill: Fix Code Quality (Dimension 5 Fixes)

## Purpose
Fix code quality issues: unused imports, missing awaits, `any` types, missing JSDoc.

## Fixes

### Remove Unused Imports

```typescript
// BEFORE
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';     // ← not used
import { CartPage } from '../pages/CartPage';

// AFTER
import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
```

### Add Missing Awaits

```typescript
// BEFORE (missing await on async call)
const isVisible = loginPage.isVisible();     // Returns Promise, not boolean

// AFTER
const isVisible = await loginPage.isVisible();
```

### Replace `any` Types

```typescript
// BEFORE
const data: any = await response.json();

// AFTER
const data = await response.json() as { id: string; name: string };
// or
interface UserResponse { id: string; name: string; }
const data = await response.json() as UserResponse;
```

### Add JSDoc to Page Object Methods

```typescript
// BEFORE
async login(username: string, password: string): Promise<void> {

// AFTER
/** Log in with the given credentials */
async login(username: string, password: string): Promise<void> {
```

### Fix Variable Names

```typescript
// BEFORE
const x = await cartPage.getSubtotal();
const temp = parseFloat(x.replace('$', ''));

// AFTER
const subtotalText = await cartPage.getSubtotal();
const subtotalValue = parseFloat(subtotalText.replace('$', ''));
```

## Validation
After fixes, run `npx tsc --noEmit` to verify type correctness.

## Rules
- Quality fixes must NOT change test behavior
- Do not modify `*.helpers.ts` files
- Keep changes minimal — only fix what the Reviewer flagged
