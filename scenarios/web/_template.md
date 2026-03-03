# Feature: [Feature Name]

## Type: web
## Module: [auth | inventory | cart | checkout | orders | admin]
## Priority: [P0-Critical | P1-High | P2-Medium | P3-Low]
## Depends On: [None | scenario-name (needs: value-name)]
## Produces: [None | value-name]

## SHARED_DATA: [users, products]

## Application
- **URL:** [https://your-app-url.com or {{ENV.BASE_URL}}]
- **Credentials:** username: {{ENV.TEST_USERNAME}} / password: {{ENV.TEST_PASSWORD}}

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

## Pre-conditions
- [Any setup needed before the first scenario runs]
- [If depends on another scenario]: Read {{valueName}} from test-data/shared-state.json

## DATASETS (optional — for data-driven testing)
| field1 | field2 | expectedResult |
|--------|--------|----------------|
| value1 | value2 | expected1      |
| value3 | value4 | expected2      |

## Expected Results
- [What should be true at the end]

## Notes for Analyst Agent
- [Popups, iframes, slow pages, dynamic elements]

<!--
KEYWORD REFERENCE (web):
  VERIFY          — Assert a condition inline (becomes expect() assertion)
  CAPTURE         — Store a runtime value (becomes variable assignment)
  CALCULATE       — Math on captured values (becomes inline calculation)
  SCREENSHOT      — Capture page screenshot (becomes page.screenshot() + attach)
  REPORT          — Print value to test report (becomes console.log + annotation)
  SAVE            — Persist to shared-state.json (becomes saveState() call)
  USE_HELPER      — Call team helper method (requires *.helpers.ts file)
  SHARED_DATA     — Load shared reference data (users, products, customers)
  DATASETS        — Data-driven test rows (becomes for...of loop)
  Tags            — CI/CD filtering labels (becomes { tag: ['@tagName'] })
  {{ENV.VAR}}     — Environment variable (becomes process.env.VAR)
  ---             — Separator between scenarios in multi-scenario file
  Common Setup    — Steps shared by all scenarios (becomes test.beforeEach())

HYBRID SCENARIOS (type=hybrid):
  If your test mixes UI actions with API calls, invoke with type=hybrid instead of type=web.
  This adds the { request } fixture alongside { page }.
  You can then use API keywords (API GET/POST/PUT/PATCH/DELETE) inline with UI steps.
  Example: call an API to seed data, then verify the result in the browser.
-->
