# Enterprise Scaling Guide

> How to use the Agentic QE Framework for real enterprise projects with multiple teams, hundreds of scenarios, and diverse applications.

---

## 1. Scaling Model: One Repo Per Application

### Why Separate Repos Per App?

The framework generates a **single shared `output/` project** — one `package.json`, one `playwright.config.ts`, one `core/` directory, shared `pages/` and `locators/`. All scenarios for the same application share these artifacts. This is by design: when two scenarios touch the same Login page, they reuse the same `LoginPage.ts` and `login.locators.json`.

This applies equally to mobile: native mobile scenarios for the same app go in the same repo under `scenarios/mobile/{platform}/` (e.g., `scenarios/mobile/android/`, `scenarios/mobile/ios/`). Mobile screen objects in `output/screens/` and mobile locators in `output/locators/mobile/` follow the same shared-project model.

This means **each application needs its own repo**. Mixing multiple applications in one repo causes:

- **Page object collisions** — App A's `LoginPage.ts` and App B's `LoginPage.ts` can't coexist in `output/pages/`
- **Locator conflicts** — Different apps have different selectors for the same page names
- **Config conflicts** — One `baseURL` in `playwright.config.ts`, one set of environment variables
- **Dependency conflicts** — Different apps may need different Playwright versions or libraries
- **Blast radius** — A broken locator in one app blocks another app's CI pipeline

### The Pattern

Maintain two tiers:

**Tier 1 — Framework Template Repo (maintained by QCoE)**

The reusable engine containing agents, templates, core utilities, and prompt files. Never contains application-specific artifacts.

```
agentic-qe-framework-skills-v5/      ← Template repo
├── CLAUDE.md                         ← Pipeline orchestrator (always loaded)
├── ARCHITECTURE.md                   ← Architecture decisions and rationale
├── skills/                           ← 46 executable skill files + 7 reference/shared docs
│   ├── _shared/                      # Shared runtime: keyword-reference.md only
│   ├── _reference/                   # Archived human reference docs (NOT loaded by LLM)
│   ├── analyst/                      # Browser/device scenario execution (2 files: web + mobile)
│   ├── generator/                    # Code generation (14 skills)
│   ├── healer/                       # Test healing (7 skills)
│   ├── reviewer/                     # Quality audit (10 skills)
│   ├── healer-review/                # Review fix application (10 skills)
│   └── api-analyst/                  # Swagger scenario generation
├── templates/core/                   ← Battle-hardened core files
├── templates/config/                 ← Configuration templates
├── templates/mobile/                 ← Mobile base classes and config
│   ├── base-screen.ts               # Mobile base class
│   ├── locator-loader-mobile.ts     # Mobile locator loader
│   ├── wdio.conf.ts                 # WebdriverIO configuration
│   └── capabilities.ts             # Device capabilities
├── mcp-servers/appium/               ← Custom Appium MCP server
├── scenarios/_template.md            ← Blank scenario template only
└── ENTERPRISE-SCALING-GUIDE.md       ← This file
```

**Tier 2 — Application Repos (one per team / application)**

Each team forks the template repo and adds their application-specific scenarios. All scenarios share a single `output/` project.

```
ars-connect-office-tests/             ← Team repo (forked from template)
├── CLAUDE.md                         ← Inherited from template
├── skills/                           ← Inherited from template
├── templates/                        ← Inherited from template
├── scenarios/
│   ├── web/
│   │   ├── work-orders/              ← folder=work-orders
│   │   │   ├── work-order-crud.md
│   │   │   └── work-order-dispatch.md
│   │   └── technician/               ← folder=technician
│   │       └── technician-schedule.md
│   ├── api/
│   │   ├── field-service-api.md
│   │   └── swagger-specs/
│   │       └── connect-office-v1.json
│   └── mobile/
│       ├── android/
│       │   └── login-flow.md
│       └── ios/
│           └── login-flow.md
├── scout-reports/                    ← App-specific DOM intelligence
├── output/                           ← Shared generated project (gitignored)
│   ├── core/                         ← Shared core files
│   ├── pages/                        ← Shared page objects
│   ├── locators/                     ← Shared locator JSONs
│   ├── tests/web/                    ← Spec files (flat + folder subfolders)
│   │   ├── work-orders/              ← Specs for folder=work-orders
│   │   └── technician/               ← Specs for folder=technician
│   ├── screens/                      ← Screen Objects (mobile)
│   ├── locators/mobile/              ← Mobile locator JSONs
│   ├── tests/mobile/                 ← Mobile spec files
│   │   ├── android/
│   │   └── ios/
│   ├── work-orders/                  ← Reports for folder=work-orders
│   ├── technician/                   ← Reports for folder=technician
│   ├── playwright.config.ts          ← Shared config (web/api/hybrid)
│   ├── wdio.conf.ts                  ← WebdriverIO config (mobile)
│   ├── core/base-screen.ts           ← Mobile base class
│   └── package.json                  ← Shared dependencies
└── .env                              ← App-specific credentials (gitignored)
```

### Update Flow

When you improve a skill file, fix `base-page.ts`, or add a new keyword:

1. Push changes to the template repo
2. Each team pulls the update (only `skills/`, `templates/`, `CLAUDE.md` change)
3. Team scenarios, output, and application-specific code remain untouched
4. Re-run affected scenarios to pick up improvements

### Decision Table

| Situation | Approach |
|-----------|----------|
| Single team, single app | Use template repo directly |
| Multiple teams, different apps | Fork template → **one repo per app** |
| Same app, different modules | Single repo with `folder` parameter |
| Multiple apps, one team | Still separate repos — one per app |
| QCoE managing framework quality | Own the template repo, teams fork |

### Anti-Pattern: Multiple Apps in One Repo

Do **not** try to add an `app` parameter or nest multiple applications in a single repo. The shared `output/` project architecture (one `pages/`, one `locators/`, one config) is designed for a single application. Separate repos give each app team:

- **Independent ownership** — each team controls their repo, CI pipeline, and release cadence
- **Independent lifecycles** — App A can upgrade Playwright while App B stays on current version
- **Isolation** — a failing test in App A never blocks App B
- **Clean onboarding** — new team forks, deletes sample scenarios, writes their own

---

## 2. Scenario Organization

### Flat Structure (small projects, up to ~20 scenarios)

```
scenarios/
├── web/
│   ├── login-standard.md
│   ├── cart-feature.md
│   └── checkout-flow.md
└── api/
    └── products-crud.md
```

Invocation: `scenario=cart-feature type=web`

Generated output (reports at root of `output/`, spec under `tests/web/`):
```
output/
├── analyst-report-cart-feature.md
├── healer-report-cart-feature.md
├── review-scorecard-cart-feature.md
├── pipeline-summary-cart-feature.md
└── tests/web/cart-feature.spec.ts
```

### Subfolder Structure (larger projects, 20+ scenarios)

```
scenarios/
├── web/
│   ├── auth/
│   │   ├── login-standard.md
│   │   └── password-reset.md
│   ├── cart/
│   │   ├── cart-crud.md
│   │   └── cart-edge-cases.md
│   └── checkout/
│       └── checkout-standard.md
└── api/
    ├── products/
    │   └── products-crud.md
    └── orders/
        └── orders-lifecycle.md
```

Invocation with folder: `scenario=cart-crud type=web folder=cart`

Generated output (reports grouped under `output/{folder}/`, spec under `tests/web/{folder}/`):
```
output/
├── cart/                                    ← Reports grouped by folder
│   ├── analyst-report-cart-crud.md
│   ├── healer-report-cart-crud.md
│   ├── review-scorecard-cart-crud.md
│   └── pipeline-summary-cart-crud.md
├── tests/web/cart/cart-crud.spec.ts         ← Spec grouped by folder
├── test-data/web/cart-crud.json
├── pages/CartPage.ts                        ← Shared (not grouped)
└── locators/cart.locators.json              ← Shared (not grouped)
```

### Mobile Scenarios

Mobile scenarios are organized by platform under `scenarios/mobile/`:

```
scenarios/
├── web/
├── api/
└── mobile/
    ├── android/
    │   ├── login-flow.md
    │   └── checkout/
    │       └── purchase-flow.md
    └── ios/
        └── login-flow.md
```

Invocation: `scenario=login-flow type=mobile platform=android`

With folder: `scenario=purchase-flow type=mobile platform=android folder=checkout`

Generated output follows the same pattern — reports at root (or in `output/{folder}/`), specs under `tests/mobile/{platform}/{folder}/`:
```
output/
├── analyst-report-login-flow.md
├── healer-report-login-flow.md
├── review-scorecard-login-flow.md
├── pipeline-summary-login-flow.md
├── tests/mobile/android/login-flow.spec.ts
├── screens/LoginScreen.ts                    ← Shared (not grouped)
└── locators/mobile/login-screen.locators.json
```

### Folder Parameter

The `folder` parameter is optional. When not provided, the framework looks for scenarios in the flat `scenarios/web/`, `scenarios/api/`, or `scenarios/mobile/{platform}/` directory and places reports directly in `output/`.

All report files include the scenario name in the filename (e.g., `analyst-report-cart-crud.md`, not `analyst-report.md`). This prevents collisions when running multiple scenarios.

### Scenario Immutability Principle

Once a scenario file has been through the full pipeline and tests are passing, treat it as frozen. To add new test cases:

- **Create a new scenario file** (e.g., `cart-extended.md`) rather than modifying the existing one
- The Generator will reuse existing page objects and locators from earlier runs
- New file gets its own spec file — zero risk of breaking existing passing tests

This is by design. Each scenario file is independently runnable, independently healable, and independently reviewable.

---

## 3. Running Tests

All commands run from the `output/` directory:

```bash
cd output
```

### By Scenario

```bash
# Flat structure (no folder)
npx playwright test tests/web/cart-feature.spec.ts --project=chrome --reporter=list

# With folder
npx playwright test tests/web/cart/cart-crud.spec.ts --project=chrome --reporter=list
```

### By Folder (all scenarios in a module)

```bash
npx playwright test tests/web/cart/ --reporter=list
```

### By Tag

```bash
npx playwright test --grep @smoke
npx playwright test --grep @P0
npx playwright test --grep "@cart and @regression"
```

### By Browser

```bash
npx playwright test --project=chrome     # Default
npx playwright test --project=edge
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### All Tests

```bash
npx playwright test
```

### Mobile (WebdriverIO + Appium)

```bash
# Prerequisites: Appium server running, device/emulator connected
cd output

# Android
npx wdio wdio.conf.ts --spec tests/mobile/android/login-flow.spec.ts

# iOS (macOS only)
PLATFORM=ios npx wdio wdio.conf.ts --spec tests/mobile/ios/login-flow.spec.ts

# By folder
npx wdio wdio.conf.ts --spec tests/mobile/android/checkout/purchase-flow.spec.ts
```

### View HTML Report

```bash
npx playwright show-report
```

---

## 4. What the Framework Handles Well

| Capability | How It Works |
|-----------|-------------|
| New scenario for same app | Create new `.md` file, run pipeline. Generator reuses existing page objects and locators. |
| Organize by feature/module | Use `folder` parameter: `scenario=X type=web folder=cart`. Reports go to `output/cart/`, specs to `tests/web/cart/`. |
| Selector changed after UI update | Edit one locator JSON file. Fallbacks kick in automatically. No code changes. |
| New page discovered | Generator creates new page object and locator JSON. Existing pages untouched. |
| Environment switch (DEV → QA → STAGING) | Change `.env` file or set `TEST_ENV=qa`. All tests use `process.env` variables. |
| Run subset of tests | Tags (`@smoke`, `@regression`, `@P0`) enable filtering with `--grep`. |
| Full pipeline from one command | `@qe-orchestrator /orchestrator scenario=X type=web` (add `folder=Y` for subfolder structure) |

---

## 5. What Needs Team Awareness

### Page Object Customization — The Helper Pattern

The Generator creates page objects on first run ("create if not exists" rule). If you need to add custom business logic — price calculations, bulk operations, data validation — **never edit the generated page object directly**. Instead, use the **Helper Pattern**: a companion file that the Generator discovers and integrates automatically.

#### Why Not Edit the Generated File?

| Scenario | What Happens |
|----------|-------------|
| QE adds `calculateTotalPrice()` directly to `CartPage.ts` | Works until someone deletes and regenerates — customization lost |
| New team member nukes `output/` and regenerates | Every team customization across every page object — wiped |
| New scenario needs new methods on `CartPage` | Generator sees file exists, skips it. New methods must be added manually |
| Two teams both manually edit `CartPage.ts` | Git merge conflict on a generated file |

#### The Solution: `*.helpers.ts` Companion Files

```
output/pages/
  CartPage.ts                  ← Pipeline-owned. Safe to regenerate.
  CartPage.helpers.ts          ← Team-owned. Never touched by pipeline.
  CheckoutPage.ts              ← Pipeline-owned.
  CheckoutPage.helpers.ts      ← Team-owned (only if custom methods needed).
  InventoryPage.ts             ← Pipeline-owned. No helpers needed = no file.
```

#### How to Create a Helper File

```typescript
// output/pages/CartPage.helpers.ts — TEAM-OWNED
import { CartPage } from './CartPage';

/**
 * Custom helper methods for CartPage.
 * Extends the generated CartPage with team-maintained business logic.
 *
 * @helpers CartPage
 */
export class CartPageWithHelpers extends CartPage {

  /**
   * Calculates the total price of all items currently in the cart.
   *
   * @returns Total price as a number (e.g., 29.99)
   * @scenario-triggers calculate total, verify total price, sum all item prices
   */
  async calculateTotalPrice(): Promise<number> {
    const priceElements = await this.page
      .locator('[data-test="inventory-item-price"]')
      .allTextContents();
    return priceElements.reduce(
      (sum, price) => sum + parseFloat(price.replace('$', '')),
      0
    );
  }

  /**
   * Removes all items from the cart one by one.
   *
   * @scenario-triggers empty cart, remove all items, clear cart
   */
  async emptyCart(): Promise<void> {
    const removeButtons = await this.page.locator('[data-test*="remove"]').all();
    for (const btn of removeButtons) {
      await btn.click();
    }
  }
}
```

#### Conventions (Mandatory)

| Convention | Example | Why |
|---|---|---|
| File name: `{PageName}.helpers.ts` | `CartPage.helpers.ts` | Generator discovers helpers by glob pattern |
| Class name: `{PageName}WithHelpers` | `CartPageWithHelpers` | Predictable import for Generator |
| `extends {PageName}` | `extends CartPage` | Inherits all generated methods |
| `@helpers {PageName}` on class JSDoc | `@helpers CartPage` | AI maps helpers to correct page |
| `@scenario-triggers` on each method | `@scenario-triggers calculate total, verify total price` | AI matches scenario steps to helper methods |

#### How the Generator Uses Helpers

The Generator runs a **Helper Discovery step** before generating spec files:

1. Scans `output/pages/*.helpers.ts`
2. Reads each file, extracts class names and `@scenario-triggers`
3. When generating a spec, if a page has a helpers file:
   ```typescript
   // Generator produces this import (aliased to base name):
   import { CartPageWithHelpers as CartPage } from '../pages/CartPage.helpers';
   // Instead of:
   import { CartPage } from '../pages/CartPage';
   ```
4. If a scenario step matches a `@scenario-triggers` phrase, the Generator calls the helper method instead of generating inline code

The alias (`as CartPage`) means all generated method calls still work — `CartPageWithHelpers` inherits everything from `CartPage`. The helpers are additional methods on top.

#### The `USE_HELPER` Keyword (Explicit Control)

For cases where you want to **explicitly** tell the Generator to use a specific helper:

```markdown
# Scenario: Verify cart total after adding multiple items

1. Navigate to {{ENV.BASE_URL}}
2. Login with {{ENV.TEST_USERNAME}} / {{ENV.TEST_PASSWORD}}
3. Add "Sauce Labs Backpack" to cart
4. Add "Sauce Labs Bike Light" to cart
5. Click cart icon
6. USE_HELPER: CartPage.calculateTotalPrice → {{cartTotal}}
7. VERIFY: {{cartTotal}} equals 39.98
```

- `USE_HELPER: PageName.methodName` — calls the method
- `USE_HELPER: PageName.methodName → {{variable}}` — calls and captures the return value
- The `@scenario-triggers` matching handles implicit discovery. `USE_HELPER` removes ambiguity when you know exactly which helper you want.

#### Using Shared Data in Helpers

Helper classes can import `loadSharedData` or `loadTestData` from `core/test-data-loader` to access shared JSON data:

```typescript
import { CartPage } from './CartPage';
import { loadSharedData } from '../core/test-data-loader';

export class CartPageWithHelpers extends CartPage {

  /**
   * Validates all cart item prices against the shared product catalog.
   * @scenario-triggers validate cart prices, verify all prices correct
   */
  async validateAllCartPrices(): Promise<{ item: string; expected: string; actual: string; match: boolean }[]> {
    const { products } = loadSharedData('products');
    const results = [];
    for (const product of products) {
      if (await this.isProductInCart(product.name)) {
        const actual = await this.page
          .locator('.cart_item')
          .filter({ hasText: product.name })
          .locator('.inventory_item_price')
          .textContent() ?? '';
        results.push({
          item: product.name,
          expected: product.expectedPrice,
          actual: actual.trim(),
          match: actual.trim() === product.expectedPrice,
        });
      }
    }
    return results;
  }
}
```

Helpers can **read** shared data freely. Helpers must **never write** to `test-data/shared/` — that data is owned by the team lead, not individual helpers.

#### Pipeline Guardrails

| Stage | Rule |
|---|---|
| **Generator** | NEVER create, modify, or delete `*.helpers.ts` files. Read them for discovery only. Rule inlined in `skills/generator/generate-pages.md`. |
| **Healer** | NEVER modify `*.helpers.ts` files. If a helper causes a failure, mark with `test.fixme('HELPER ISSUE: ...')` and document in the healer report. Pre-edit gate inlined in `skills/healer/apply-fix.md`. |
| **Reviewer** | Verify specs import helpers class (not base) when helpers exist. Verify helpers follow naming conventions and have proper JSDoc. See `skills/reviewer/review-test-architecture.md`. |

#### Mobile Helper Pattern

Mobile uses the same helper pattern but with Screen Objects in `output/screens/` instead of `output/pages/`. Helper files are `*.helpers.ts` in `output/screens/` (e.g., `LoginScreen.helpers.ts`). The naming convention mirrors the web pattern: `{ScreenName}WithHelpers` extends `{ScreenName}`, with `@helpers {ScreenName}` and `@scenario-triggers` annotations. The Generator discovers mobile helpers by scanning `output/screens/*.helpers.ts`.

#### Team Checklist

1. Name the file `{PageName}.helpers.ts` in `output/pages/` (or `{ScreenName}.helpers.ts` in `output/screens/` for mobile)
2. Export class `{PageName}WithHelpers` extending `{PageName}` (or `{ScreenName}WithHelpers` for mobile)
3. Add `@helpers {PageName}` to the class JSDoc
4. Add `@scenario-triggers` to every method JSDoc — list phrases that should invoke this method
5. Optionally use `USE_HELPER` keyword in scenarios for explicit control
6. Commit the helpers file to Git — it is team-owned and survives regeneration
7. Never put custom logic in the generated page/screen object — use the helpers file

### Modifying an Existing Scenario

If someone modifies steps in an existing `.md` file and re-runs the pipeline, the spec is regenerated. Any Healer-applied fixes (custom selectors, timing adjustments) from previous runs are lost.

**Rule:** If a scenario needs changes, either update the `.md` file and re-run the full pipeline, or manually edit the spec. Don't mix both approaches.

### Cross-Scenario Dependencies

Scenario A creates a user, Scenario B logs in as that user. Within a single spec file, `shared-state.ts` handles this via CAPTURE/SAVE keywords. Across separate spec files, there's no shared state.

**Rule:** For cross-file dependencies, create a setup script or shared fixture manually. The framework doesn't auto-generate these.

### Custom Component Libraries — Scout DOM Reconnaissance

Enterprise applications commonly use component libraries whose controls (ComboBoxes, DataGrids, Modals, Date pickers) require multi-step interaction sequences that a plain Playwright selector cannot handle. Scout solves this by scanning the live DOM before the pipeline runs and producing a machine-readable inventory that the Generator and Healer consume automatically.

#### When to Run Scout

| Situation | Action |
|-----------|--------|
| Standard HTML forms, buttons, links | Skip Scout — the Analyst stage is sufficient |
| Any of the 7 known component libraries detected in the app | **Run Scout before the pipeline** |
| Unknown/custom component library | Run Scout and add custom patterns (see below) |
| UI has changed significantly since last Scout run | Re-run Scout, then re-run affected scenarios |

#### Supported Libraries (out of the box)

| Library | Class Prefix | Detects |
|---------|-------------|---------|
| Fluent UI v9 | `fui-` | Combobox, Dropdown, DataGrid, Dialog, Tab, Menu, SpinButton, Slider |
| Fluent UI v8 | `ms-` | ComboBox, Dropdown, DetailsList, Panel, Pivot, CommandBar, DatePicker |
| Material UI (MUI) | `Mui` | Select, Autocomplete, DataGrid, Drawer, Tab, TextField |
| Ant Design | `ant-` | Select, Modal, Drawer, Table, Tree, Cascader, Tabs, Menu |
| PrimeNG / PrimeReact | `p-` | Dropdown, DataTable, Dialog, MultiSelect, AutoComplete |
| Bootstrap | `btn-`, `form-` | Select, Modal, Nav Tabs, Input |
| Kendo UI | `k-` | Dropdown, ComboBox, Grid, Dialog, DatePicker |

#### Workflow

1. **Configure** — edit `output/tools/scout-agent-v4.spec.ts`, set `startUrl`, `scenarioName`, and `appFolder` to match your scenario
2. **Scan** — open two terminals in `output/`, run Scout in Terminal 1 and remote-control in Terminal 2; navigate to each page and press **S** to scan, **D** when done
3. **Run the pipeline** — the Generator reads the Scout report automatically and uses the correct selectors and interaction patterns; the Healer also checks it when diagnosing locator failures

No extra pipeline invocation flags needed — if `output/scout-reports/{folder}/{scenario}-page-inventory-latest.md` exists, the pipeline picks it up.

See `skills/scout/run-scout.md` for the full setup guide and remote control key reference.

#### Adding Custom In-House Component Libraries

If the application uses a proprietary component library not in the table above, add detection patterns to `output/tools/scout-agent-v4.spec.ts`:

1. Add a library prefix entry to `LIB_PATTERNS`
2. Add component patterns to `COMPONENT_MAP` with the correct METHOD and INTERACTION for each control
3. Add class selectors to `INTERACTIVE_SELECTORS`

Scout will then detect and report those components the same way it handles the built-in libraries.

### Mobile-Specific Awareness

Teams working with `type=mobile` should be aware of these platform-specific behaviors:

| Topic | Details |
|-------|---------|
| **WDIO single session** | WebdriverIO reuses one driver session across tests in a spec file. Form state persists between tests — tests must explicitly clear input fields before typing new values. |
| **Android keyboard overlay** | The on-screen keyboard can obscure elements below input fields. Screen methods should dismiss the keyboard (e.g., tap back or press Enter) before tapping buttons positioned below input fields. |
| **Platform-specific locator strategies** | Some locator strategies are platform-specific: `uiautomator` selectors work only on Android, `class_chain` and `predicate_string` work only on iOS. Use platform-agnostic selectors (`accessibility_id`, `xpath`) for shared scenarios. |
| **APP_PATH vs appPackage** | If the app is already installed on the device/emulator, do not set `APP_PATH` in capabilities — it triggers `aapt2` parsing which may fail. Use `appPackage` + `appActivity` (Android) or `bundleId` (iOS) instead. |

---

## 6. What Needs Framework Enhancement

| Capability | Current State | Path Forward |
|-----------|--------------|-------------|
| Hybrid API + Web scenarios | Supported via `type=hybrid` with `{ page, request }` fixtures | Use `generate-hybrid-spec.md` skill |
| Native mobile testing | Supported via `type=mobile` with Appium MCP + WebdriverIO | Use `platform=android` or `platform=ios`; see Analyst (Appium MCP) → Generator → Healer → Reviewer pipeline |
| Cross-platform mobile | Supported via `platform` parameter (android/ios) | Use platform-specific scenarios or shared scenarios with platform-agnostic locators (`accessibility_id`) |
| Stakeholder reporting dashboards | Playwright HTML + JSON built-in; Allure and ReportPortal documented | See `skills/_reference/reporting.md` |
| Cross-browser testing | Config supports Chrome, Edge, Firefox, WebKit projects | Healer runs Chrome only for fast fix cycles; cross-browser belongs in CI |

---

## 7. CI/CD Integration

The agentic pipeline (Analyst → Generator → Healer → Reviewer) runs at **development time** in Claude Code. It produces deterministic, production-ready Playwright test scripts. CI/CD pipelines run these scripts like any conventional test suite — no AI, no tokens, no agents.

### The Model

```
DEV TIME (VS Code)                          CI/CD (Pipeline)
┌──────────────────────────┐               ┌──────────────────────────┐
│  QE writes scenario .md  │               │  git checkout + npm ci   │
│  Pipeline runs skills    │               │  npx playwright install  │
│  Tests generated + healed│──── commit ──→│  npx appium (for mobile) │
│  Reviewer approves       │    output/    │  npx playwright test     │
│  QE commits output/      │               │  npx wdio wdio.conf.ts   │
└──────────────────────────┘               └──────────────────────────┘
```

### What Gets Committed

Once the pipeline produces APPROVED tests, commit the `output/` directory (or the relevant parts):

```
output/
├── core/                    ← Commit (shared framework)
├── pages/                   ← Commit (page objects)
├── screens/                 ← Commit (mobile screen objects)
├── locators/                ← Commit (selector JSONs, including locators/mobile/)
├── tests/                   ← Commit (spec files, including tests/mobile/)
├── test-data/               ← Commit (test data JSONs)
├── playwright.config.ts     ← Commit (web/api/hybrid config)
├── wdio.conf.ts             ← Commit (mobile config)
├── core/base-screen.ts      ← Commit (mobile base class)
├── package.json             ← Commit (dependencies)
├── tsconfig.json            ← Commit (TypeScript config)
└── .env.example             ← Commit (template only, never .env)
```

Do **not** commit agent reports (`analyst-report-*.md`, `healer-report-*.md`, `review-scorecard-*.md`, `pipeline-summary-*.md`). These are development artifacts.

### Example CI Commands

```bash
cd output
npm ci
npx playwright install chromium --with-deps

# Run by tag
npx playwright test --grep @smoke --project=chrome
npx playwright test --grep @regression --project=chrome

# Run by folder
npx playwright test tests/web/cart/ --project=chrome

# Run all
npx playwright test --project=chrome

# Cross-browser (CI only)
npx playwright test --grep @smoke
```

### Mobile CI Commands

```bash
cd output
npm ci

# Start Appium server in background
npx appium &

# Android
npx wdio wdio.conf.ts --spec tests/mobile/android/login-flow.spec.ts

# iOS (macOS CI runners only)
PLATFORM=ios npx wdio wdio.conf.ts --spec tests/mobile/ios/login-flow.spec.ts
```

### CI Environment Variables

Set these as pipeline secrets (GitHub Actions secrets, GitLab CI variables, Azure DevOps variable groups):

- `BASE_URL` — application URL for the target environment
- `TEST_USERNAME` / `TEST_PASSWORD` — test credentials
- `TEST_ENV` — environment name (`dev`, `qa`, `staging`)
- Any app-specific `ENV_VARS` referenced in scenarios

**Mobile-specific CI variables** (set when running `type=mobile` tests):

- `APPIUM_HOST` — Appium server host (default: `localhost`)
- `APPIUM_PORT` — Appium server port (default: `4723`)
- `ANDROID_DEVICE` — Android device name or emulator ID
- `APP_PACKAGE` — Android app package (e.g., `com.swaglabsmobileapp`)
- `APP_ACTIVITY` — Android launch activity
- `MOBILE_USERNAME` / `MOBILE_PASSWORD` — Mobile app test credentials
- `PLATFORM` — Target platform (`android` or `ios`)

The `playwright.config.ts` reads `TEST_ENV` to load the correct `.env.{env}` file. The `wdio.conf.ts` reads platform-specific variables for device capabilities.

---

## 8. Team Workflow

### Day-to-Day

1. QE writes scenario `.md` file (plain English, 10-20 lines)
2. QE runs the pipeline in Claude Code: `scenario=my-feature type=web` (add `folder=X` if using subfolder structure)
3. Pipeline generates framework, heals tests, audits quality
4. QE reviews `pipeline-summary-my-feature.md` and `review-scorecard-my-feature.md`
5. If APPROVED → commit output to Git
6. If NEEDS FIXES → Healer-Review stage runs automatically (Stage 5)

### Sprint Cadence

- **Sprint start:** Write scenarios for new features
- **During sprint:** Run pipeline as features become testable
- **Sprint end:** All scenarios through pipeline, all tests passing, committed to Git

### Maintenance

- **Selector changes:** Edit locator JSON → re-run affected tests
- **New page in app:** If the page uses a component library, run Scout on it first (`tools/scout-agent-v4.spec.ts`) to capture selectors and interaction patterns, then run the pipeline for the scenario touching that page
- **UI library upgrade** (e.g., Fluent UI v8 → v9): Re-run Scout across all affected pages before re-running the pipeline — class prefixes change between major versions (`ms-` → `fui-`)
- **Framework upgrade:** Pull latest from template repo → re-run scenarios to verify

---

## 9. Skills Architecture

### Composable Skills System

Instead of monolithic agent instructions, the framework uses focused skill files (30-80 lines each) that compose differently based on scenario type:

| Directory | Purpose | Skill Count | Edit When... |
|-----------|---------|-------------|-------------|
| `skills/_shared/` | Shared runtime file: keyword-reference.md (loaded only during spec generation) | 1 | Adding new keywords (e.g., for new MCP servers) |
| `skills/_reference/` | Archived human reference docs: guardrails, paths, output structure, reporting, fix-guardrails, post-stage-checklist | 7 | Updating canonical rules (then propagate to skills) |
| `skills/analyst/` | Browser/device scenario execution (web + mobile) | 2 | Changing element discovery |
| `skills/generator/` | Code generation: locators, pages/screens, specs, test data, framework setup, reports | 14 | Changing how tests are generated |
| `skills/healer/` | Test healing: run, diagnose (web + mobile), fix, report | 7 | Changing diagnosis or fix behavior |
| `skills/reviewer/` | Quality audit: 9 dimensions + scorecard aggregation | 10 | Changing quality standards |
| `skills/healer-review/` | Review fix application: 9 dimension fixes + validation | 10 | Changing fix patterns |
| `skills/api-analyst/` | Swagger → scenario generation | 1 | Changing API scenario templates |
| `skills/scout/` | Pre-pipeline DOM reconnaissance for component-library apps | 1 | Changing Scout usage instructions or library support notes |

### Pipeline Invocation

```
scenario=my-feature type=web folder=cart
│
└── CLAUDE.md orchestrator reads skills based on type:
    ├── Analyst    → skills/analyst/analyze-scenario.md (web/hybrid)
    │                skills/analyst/analyze-scenario-mobile.md (mobile)
    ├── Generator  → skills/generator/ (14 skills composed by type)
    ├── Healer     → skills/healer/heal-loop.md (orchestrates sub-skills)
    ├── Reviewer   → skills/reviewer/ (9 dimensions + aggregate)
    └── Healer-Review (if needed) → skills/healer-review/ (dimension fixes)
```

### Type Routing (Key Advantage)

The orchestrator (CLAUDE.md) composes different skills based on `type`:

| Type | Analyst | Locators/Pages | Spec Skill | Review Dims |
|------|---------|---------------|------------|------------|
| `web` | Yes (Playwright MCP) | Yes (Pages) | `generate-web-spec.md` | 1-7 |
| `api` | No | No | `generate-api-spec.md` | 2-8 |
| `hybrid` | Yes (Playwright MCP) | Yes (Pages) | `generate-hybrid-spec.md` | 1-8 |
| `mobile` | Yes (Appium MCP) | Yes (Screens) | `generate-mobile-spec.md` | 1-7 + 9 |

Adding a new type requires only 1 new skill file + 1 line in CLAUDE.md. Zero existing skill modifications.

### Subagent Architecture

Claude Code runs skills via subagents (Task tool):

- Each stage runs in its own context window
- Reviewer dimensions can run as parallel subagents for speed
- Output files in `output/` serve as the handoff between stages
- The orchestrator verifies output files exist before proceeding

---

## 10. File Ownership

| Folder | Owned By | Committed to Git? | Notes |
|--------|----------|-------------------|-------|
| `CLAUDE.md` | QCoE (template repo) | Yes | Pipeline orchestrator |
| `skills/` | QCoE (template repo) | Yes | 46 executable skill files + 7 reference/shared docs |
| `ARCHITECTURE.md` | QCoE (template repo) | Yes | Architecture decisions and rationale |
| `templates/core/` | QCoE (template repo) | Yes | Source of truth for core files |
| `templates/config/` | QCoE (template repo) | Yes | Config templates |
| `templates/mobile/` | QCoE (template repo) | Yes | Mobile base classes and config |
| `mcp-servers/appium/` | QCoE (template repo) | Yes | Custom Appium MCP server |
| `scenarios/` | Team | Yes | Application-specific test scenarios |
| `scout-reports/` | Generated (app-specific) | No (gitignored) | DOM intelligence reports |
| `output/` | Generated (shared project) | No (gitignored) | One shared project for all scenarios |
| `output/pages/*.ts` | Generated (pipeline-owned) | Optional | Safe to regenerate. Do not add custom logic here |
| `output/pages/*.helpers.ts` | Team-maintained | Yes (always) | Custom helper methods. Never touched by pipeline |
| `output/screens/*.ts` | Generated (pipeline-owned) | Optional | Mobile screen objects. Safe to regenerate |
| `output/screens/*.helpers.ts` | Team-maintained | Yes (always) | Mobile helper methods. Never touched by pipeline |
| `output/locators/` | Generated then team-maintained | Optional | Commit if manually customized |
| `output/locators/mobile/` | Generated then team-maintained | Optional | Mobile locator JSONs. Commit if manually customized |
| `.env` | Team (secrets) | No (gitignored) | Only `.env.example` is committed |

---

## 11. Security & Data Privacy

### Data Flow Architecture

Understanding what data goes where is critical for security reviews and compliance.

#### What Runs Locally (Never Leaves Your Machine)

| Component | What It Does | Data It Handles |
|-----------|-------------|----------------|
| **Playwright MCP** | Drives your browser for web/hybrid Analyst stage | Full browser DOM, screenshots, cookies, form data |
| **Appium MCP** | Drives your device/emulator for mobile Analyst stage | Device screen, page source XML, app data |
| **Test Runner** (Playwright/WDIO) | Executes generated tests in CI or locally | Application under test — full interaction |
| **Generated Code** (`output/`) | TypeScript test files, page objects, locators | Static code — no runtime AI dependency |
| **MCP Servers** (`mcp-servers/`) | Local bridge between Claude and browser/device | Runs as a local Node.js process |

**Key point:** MCP tools are local processes. Playwright controls your browser on your machine. Appium controls your device on your machine. The application under test is never proxied through an external service.

#### What Gets Sent to the AI API

| Pipeline Stage | What's Sent | Contains App Data? | Purpose |
|---------------|-------------|-------------------|---------|
| **Analyst** (web) | Playwright accessibility snapshots, screenshots, DOM fragments | **Yes** — UI text, element labels, visible data | Element discovery and scenario mapping |
| **Analyst** (mobile) | Appium screenshots (PNG), page source (XML) | **Yes** — device screen content | Element discovery and scenario mapping |
| **Generator** | Analyst report text, scenario text, template code | **Indirectly** — element names, URLs, text labels | Code generation |
| **Healer** (diagnosis) | Error messages, stack traces, Playwright snapshots/screenshots, Appium screenshots/page source | **Yes** — failure state of the application | Failure classification and fix strategy |
| **Healer** (fix) | Source code of test files, locator JSON | **Minimal** — code only, not live app data | Code modification |
| **Reviewer** | Generated source code, locator files | **Minimal** — code only | Quality audit |

#### What Never Gets Sent

- Raw database contents or server-side logs
- `.env` files or credentials
- Network traffic captures
- Backend API responses (unless explicitly included in test assertions)
- Source code of the application under test (only the generated test code)

### Security Tiers

Choose the tier that matches your organization's security posture.

#### Tier 1: Test Environment Isolation (Standard)

**Suitable for:** Most commercial software, SaaS applications, non-regulated industries

Run the pipeline against a dedicated test/staging environment populated with **synthetic data**. Screenshots and DOM snapshots sent to the AI contain only fake users, fake orders, and generated content — no real PII.

```
Production Environment          Test/Staging Environment
┌─────────────────────┐        ┌─────────────────────┐
│ Real customer data   │        │ Synthetic test data  │
│ Real PII             │   ──→  │ Fake users/orders    │
│ Real transactions    │  copy  │ Generated content    │
│                      │ schema │ No real PII          │
└─────────────────────┘  only  └─────────────────────┘
                                         │
                                         │ Pipeline runs here
                                         ▼
                                ┌─────────────────────┐
                                │ Claude API receives: │
                                │ - Screenshots of     │
                                │   synthetic data     │
                                │ - Element labels     │
                                │ - URL structures     │
                                │ - Error messages     │
                                └─────────────────────┘
```

**What to do:**
1. Never point the pipeline at a production environment
2. Use test data generators (Faker, factory-bot, etc.) to populate the staging environment
3. URL structures and element labels (e.g., `#login-button`, `data-testid="cart-item"`) are generally non-sensitive

**Risk level:** Low.

#### Tier 2: Anthropic Commercial API (Enhanced)

**Suitable for:** Companies with SOC 2, ISO 27001 requirements; commercial software; internal tools with non-classified data

| Concern | Anthropic Policy |
|---------|-----------------|
| **Training on your data** | API inputs are **not used for model training** (commercial API terms) |
| **Data retention** | Processed for the response. Default 30-day retention for trust & safety monitoring. **Zero-retention** available on Enterprise plans |
| **Encryption** | TLS 1.2+ in transit. AES-256 at rest during retention period |
| **SOC 2 Type II** | Anthropic is SOC 2 Type II certified |

**What to do:**
1. Use Tier 1 (synthetic test data) as the baseline
2. Execute an Anthropic DPA (Data Processing Agreement) for your organization
3. Request zero-retention if your compliance framework requires it
4. Document the data flow in your security review materials

**Risk level:** Low-Medium. Covered by standard commercial SaaS security agreements.

#### Tier 3: Private Cloud Deployment (Regulated Industries)

**Suitable for:** Healthcare (HIPAA), finance (PCI-DSS, SOX), government (FedRAMP), defense (ITAR)

Deploy Claude models within your own cloud infrastructure. No data leaves your VPC/VNet.

```
Your AWS Account / GCP Project (VPC)
┌──────────────────────────────────────────┐
│                                          │
│  ┌─────────┐     ┌──────────────────┐   │
│  │ Dev      │────→│ Claude on        │   │
│  │ Machine  │     │ Bedrock / Vertex │   │
│  └─────────┘     └──────────────────┘   │
│       │                                  │
│       ▼                                  │
│  ┌─────────────────────────────────┐    │
│  │ Test Environment (staging)      │    │
│  │ Playwright/Appium runs here     │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Zero data leaves this boundary          │
└──────────────────────────────────────────┘
```

**Options:**

| Provider | Configuration | Compliance |
|----------|--------------|------------|
| **Amazon Bedrock** | Change API endpoint to Bedrock. Data stays in your AWS account. Inherits IAM, VPC, CloudTrail, KMS. | HIPAA BAA, FedRAMP (GovCloud) |
| **Google Vertex AI** | Change API endpoint to Vertex. Data stays in your GCP project. Inherits VPC Service Controls, CMEK. | HIPAA BAA, FedRAMP |
| **Anthropic Enterprise** | Zero-retention API. No data stored after response generation. | SOC 2 Type II, DPA |

The framework code, skills, and MCP tools stay identical — only the API endpoint changes.

**Risk level:** Minimal. Equivalent to any internal API call within your cloud.

### Generated Tests Run Without AI

A critical security advantage: **CI/CD has zero AI data flow.**

```
DEV TIME (with AI)                    CI/CD (without AI)
┌────────────────────────┐           ┌────────────────────────┐
│ Claude generates tests │           │ Standard Node.js       │
│ Claude heals failures  │── git ──→│ npx playwright test    │
│ Claude reviews quality │  commit   │ npx wdio run           │
│                        │           │                        │
│ AI API required        │           │ NO AI API required     │
│ Screenshots sent       │           │ Zero external calls    │
└────────────────────────┘           └────────────────────────┘
```

Once tests are generated and committed:
- CI runs pure Playwright/WebdriverIO — no Claude API calls
- No screenshots leave the CI environment
- No test data is sent to any AI service
- Tests are standard TypeScript — auditable, reviewable, version-controlled

**Security review is only needed for the development-time pipeline**, not for CI/CD execution.

### Credential Management

The framework uses environment variables for all credentials. No credentials are ever hardcoded in generated code.

| Rule | Enforced By |
|------|------------|
| `.env` never committed | `.gitignore` template includes `.env` |
| No hardcoded credentials in test code | Reviewer skill (`review-security.md`) checks for this |
| `.env.example` committed as template (no real values) | Generator skill creates it |
| CI uses pipeline secrets, not `.env` files | Documented in Section 7 (CI/CD Integration) |

### Network Requirements

**Development time (pipeline running):**

| Destination | Port | Purpose |
|------------|------|---------|
| Claude API endpoint (or Bedrock/Vertex) | 443 | AI reasoning calls |
| Your test environment URL | 80/443 | Playwright/Appium driving the app |
| `registry.npmjs.org` | 443 | npm install (or private registry) |
| `localhost:4723` | 4723 | Appium server (mobile only, local) |

**CI/CD time (tests running):** No AI API access needed. Only your test environment URL, npm registry, and Playwright browser downloads.

**Air-gapped environments:** Run the pipeline on a connected dev machine, commit generated tests, mirror npm packages to a private registry, pre-install Playwright browsers in Docker images. CI runs entirely offline.

### Compliance Mapping

| Framework | How This Pipeline Addresses It |
|-----------|-------------------------------|
| **HIPAA** | Tier 1: synthetic data (no PHI in screenshots). Tier 3: Bedrock/Vertex (data never leaves your VPC) |
| **PCI-DSS** | Tier 1: synthetic card numbers in test env. Generated tests never store card data |
| **SOC 2** | Tier 2: Anthropic DPA + SOC 2 Type II. CI has zero AI vendor dependency |
| **SOX** | Generated tests are version-controlled. Pipeline reports provide audit trail. CI has no AI calls |
| **GDPR** | Tier 2: zero-retention API option. Tier 3: data stays in your region (Bedrock EU, Vertex EU) |
| **FedRAMP** | Tier 3: AWS GovCloud (Bedrock) is FedRAMP authorized |
| **ISO 27001** | DPA with Anthropic. Data flow documented. Credentials in env vars, not code |

### Audit & Traceability

Every pipeline run produces timestamped reports documenting what the AI did:

```
output/
├── analyst-report-{scenario}.md       ← What elements were discovered
├── generator-report-{scenario}.md     ← What code was generated
├── healer-report-{scenario}.md        ← What failures occurred, what fixes applied
├── review-scorecard-{scenario}.md     ← Quality audit results
└── pipeline-summary-{scenario}.md     ← End-to-end summary
```

All generated code goes through the same Git workflow as hand-written code — PR review, diff visibility, branch protection. No hidden AI-modified files.

### Security Deployment Checklist

**Before first pipeline run:**
- [ ] Test/staging environment provisioned with synthetic data
- [ ] No production data accessible from the development machine
- [ ] `.env` file uses test credentials, not production credentials
- [ ] `.gitignore` includes `.env`
- [ ] Team understands: AI is used at dev time only, CI runs standard tests

**For regulated industries (Tier 3):**
- [ ] Claude model deployed on Bedrock, Vertex, or Enterprise zero-retention
- [ ] API endpoint configured to private deployment
- [ ] VPC/VNet rules restrict outbound traffic to authorized destinations
- [ ] DPA executed with Anthropic (if using their API directly)
- [ ] Data flow diagram included in security review documentation
- [ ] Compliance team has reviewed and approved the deployment tier

### Security FAQ

**Q: Are screenshots of my app sent to external servers?**
A: During dev-time Analyst and Healer stages, yes — to the Claude API for element discovery and failure diagnosis. In CI/CD, no — generated tests run standalone. For regulated environments, use Tier 3 (Bedrock/Vertex) to keep all data within your cloud.

**Q: Do I need an AI API key in CI/CD?**
A: No. Generated tests are pure TypeScript. No AI calls during test execution.

**Q: What about the MCP servers — do they send data externally?**
A: No. MCP servers run as local Node.js processes. They bridge Claude's instructions to your local browser/device. Only the AI reasoning flows to the Claude API.

**Q: Can we audit what the AI generated?**
A: Yes. All code is standard TypeScript in `output/`, reviewable in any code review tool. Pipeline reports document every AI decision in human-readable markdown.
