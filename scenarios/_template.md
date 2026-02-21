# Scenario: [Clear Business Flow Name]

## Module: [auth | inventory | cart | checkout | orders | admin | api]
## Priority: [P0-Critical | P1-High | P2-Medium | P3-Low]
## Type: [UI (default) | API]
## Depends On: [None | scenario-name (needs: value-name)]
## Produces: [None | value-name]

## Application
- **URL:** [https://your-app-url.com or {{ENV.APP_BASE_URL}}]
- **Credentials:** username: {{ENV.TEST_USERNAME}} / password: {{ENV.TEST_PASSWORD}}

## For API scenarios only:
## API Base URL: {{ENV.API_BASE_URL}}
## Auth: Bearer {{ENV.API_TOKEN}}

## Pre-conditions
- [Any setup needed]
- [If depends on another scenario]: Read {{valueName}} from test-data/shared-state.json

## Common Setup (for multi-scenario files only)
1. [Steps that run before each scenario]

---

## Steps

### Available Keywords:
- **Plain step:** Normal action (click, fill, navigate)
- **VERIFY:** Assertion checkpoint — `VERIFY: Cart badge shows "2"`
- **CAPTURE:** Read value from UI/API — `CAPTURE: Read subtotal as {{subtotal}}`
- **CALCULATE:** Math on captured values — `CALCULATE: {{total}} = {{sub}} + {{tax}}`
- **SCREENSHOT:** Take visual evidence — `SCREENSHOT: checkout-overview`
- **REPORT:** Include in test output — `REPORT: Print {{orderNumber}}`
- **SAVE:** Persist for other scenarios — `SAVE: Write {{id}} to shared-state.json as "key"`
- **API GET/POST/PUT/PATCH/DELETE:** API call — `API POST: /users with body {...}`

### Steps:
1. Navigate to [URL]
2. [Action]
3. VERIFY: [Expected condition]
4. CAPTURE: Read [element] and store as {{variableName}}
5. CALCULATE: {{result}} = {{value1}} + {{value2}}
6. SCREENSHOT: [descriptive-filename]
7. REPORT: Print {{variableName}}
8. SAVE: Write {{variableName}} to test-data/shared-state.json as "keyName"

**Tags:** [smoke, regression, P0, P1, module-name]

## Expected Results
- [What should be true at the end]

## Test Data
| Field | Value |
|-------|-------|
| [field] | [value or {{ENV.VAR}}] |

## DATASETS (optional — for data-driven testing)
| field1 | field2 | expectedResult |
|--------|--------|----------------|
| value1 | value2 | expected1      |
| value3 | value4 | expected2      |

## Notes for Analyst Agent
- [Popups, iframes, slow pages, dynamic elements]
- [For API: skip Analyst, go directly to Generator]
