# Skill: Discover Helpers

## Purpose
Scan for team-maintained helper files (`*.helpers.ts`) and build an in-memory registry of available helper classes, methods, and scenario triggers. This registry informs spec generation.

## References
- `skills/_shared/guardrails.md` — helper file protection (read-only)

## Process

### Step 1: Scan for Helper Files

List all files matching `output/pages/*.helpers.ts`.

If no helper files exist, the registry is empty — proceed to spec generation with base page imports only.

### Step 2: Read Each Helper File

For each helper file found, extract:

1. **Class name** — must follow `{PageName}WithHelpers` convention
2. **Base page it extends** — e.g., `extends CartPage`
3. **Public method signatures** — method name, parameters, return type
4. **`@scenario-triggers` JSDoc tags** — natural language phrases that trigger the method

### Step 3: Build Helper Registry

Create an in-memory mapping:

```
Registry:
  CartPage:
    helperClass: CartPageWithHelpers
    helperFile: ./CartPage.helpers
    methods:
      - name: calculateTotalPrice
        returns: Promise<number>
        triggers: ["calculate total", "verify total price", "sum all item prices"]
      - name: validateAllCartPrices
        returns: Promise<void>
        triggers: ["validate prices", "check all prices"]
```

### Step 4: Inform Spec Generation

Pass the registry to the spec generation skill. The registry controls two things:

**Import routing:** If a page has a helpers file, the spec imports the helpers class aliased to the base name:
```typescript
// WITHOUT helpers:
import { CartPage } from '../pages/CartPage';

// WITH helpers (CartPage.helpers.ts exists):
import { CartPageWithHelpers as CartPage } from '../pages/CartPage.helpers';
```

**Method routing:** If a scenario step's natural language matches a `@scenario-triggers` phrase, or if the scenario uses `USE_HELPER: PageName.methodName`, call the helper method instead of generating inline code.

## Critical Rules
- **NEVER create, modify, or delete `*.helpers.ts` files.** Read-only discovery.
- Helper classes extend the base page — all generated methods remain available through inheritance.
- If a helper file doesn't follow the `{PageName}WithHelpers` naming convention, log a warning but still include it in the registry.
