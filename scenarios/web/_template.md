# Feature: [Feature Name]

## SHARED_DATA: [users, products]
## API Behavior: [live|mock]
**Tags:** [smoke, regression, P0]

## Common Setup
1. Navigate to {{ENV.BASE_URL}}
2. Login with {{ENV.TEST_USERNAME}} / {{ENV.TEST_PASSWORD}}

---

### Scenario: [Scenario Name]
**Tags:** [smoke, P0]

1. [Action step — click, fill, navigate]
2. [Another action step]
3. VERIFY: [condition to assert]
4. CAPTURE: [value] as {{variableName}}
5. CALCULATE: {{expectedTotal}} = {{subtotal}} + {{tax}}
6. SCREENSHOT: [screenshot-name]
7. REPORT: Print {{variableName}}
8. SAVE: {{variableName}} to shared-state.json as "keyName"
9. USE_HELPER: [PageName.methodName] → {{result}}

---

### Scenario: [Another Scenario Name]
**Tags:** [regression, P1]

1. [Steps for second scenario]
2. VERIFY: [condition]

## DATASETS
| field1 | field2 | expectedResult |
|--------|--------|----------------|
| value1 | value2 | expected1      |
| value3 | value4 | expected2      |

<!--
KEYWORD REFERENCE:
  VERIFY          — Assert a condition inline (becomes expect() assertion)
  CAPTURE         — Store a runtime value (becomes variable assignment)
  CALCULATE       — Math on captured values (becomes inline calculation)
  SCREENSHOT      — Capture page screenshot (becomes page.screenshot() + attach)
  REPORT          — Print value to test report (becomes console.log + annotation)
  SAVE            — Persist to shared-state.json (becomes saveState() call)
  USE_HELPER      — Call team helper method (requires *.helpers.ts file)
  SHARED_DATA     — Load shared reference data (users, products, customers)
  DATASETS        — Data-driven test rows (becomes for...of loop)
  API GET/POST/PUT/DELETE — REST API call (uses Playwright request fixture)
  Tags            — CI/CD filtering labels (becomes { tag: ['@tagName'] })
  {{ENV.VAR}}     — Environment variable (becomes process.env.VAR)
  API Behavior    — mock (non-persistent) or live (default, guardrails enforced)
  ---             — Separator between scenarios in multi-scenario file
  Common Setup    — Steps shared by all scenarios (becomes test.beforeEach())

TYPE OPTIONS:
  type=web     — Browser UI tests (uses { page } fixture)
  type=api     — API-only tests (uses { request } fixture)
  type=hybrid  — Interleaved API + UI tests (uses { page, request } fixtures)
-->
