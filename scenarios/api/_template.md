# Feature: [Feature Name]

## Type: api
## Module: [api | users | posts | orders | payments | admin]
## Priority: [P0-Critical | P1-High | P2-Medium | P3-Low]
## Depends On: [None | scenario-name (needs: value-name)]
## Produces: [None | value-name]

## API Base URL: [https://api.example.com or {{ENV.API_BASE_URL}}]
## API Behavior: [live | mock]
## Auth: [None | Bearer {{ENV.API_TOKEN}} | Basic {{ENV.API_USER}}:{{ENV.API_PASSWORD}}]

**Tags:** [api, smoke, regression, P0]

---

### Scenario: [HTTP Method] [Endpoint] — [Description]
**Tags:** [api, resource-name, smoke, P0]

1. API POST: /resource with body {"field": "value", "other": 123}
2. VERIFY: Response status is 201
3. VERIFY: Response has fields: id, field, other
4. VERIFY: Response $.field equals "value"
5. CAPTURE: Response $.id as {{resourceId}}
6. SAVE: {{resourceId}} to shared-state.json as "lastResourceId"
7. REPORT: Print "Created resource with id={{resourceId}}"

---

### Scenario: [Another Endpoint Scenario]
**Tags:** [api, resource-name, regression, P1]

1. API GET: /resource/1
2. VERIFY: Response status is 200
3. VERIFY: Response has fields: id, field, other
4. VERIFY: Response $.id equals 1
5. CAPTURE: Response $.field as {{fieldValue}}
6. REPORT: Print "Retrieved field={{fieldValue}}"

## SHARED_DATA (optional — reuse cross-scenario reference data)
SHARED_DATA: users, products

## DATASETS (optional — for data-driven testing)
| field1 | field2 | expectedStatus |
|--------|--------|----------------|
| value1 | value2 | 200            |
| value3 | value4 | 201            |

## Expected Results
- [What should be true at the end]

<!--
KEYWORD REFERENCE (api):
  API GET/POST/PUT/PATCH/DELETE — REST API call (uses Playwright { request } fixture)
  VERIFY          — Assert response status, fields, values, array properties
  CAPTURE         — Store a response value (becomes variable assignment)
  CALCULATE       — Math on captured values (becomes inline calculation)
  REPORT          — Print value to test report (becomes console.log + annotation)
  SAVE            — Persist to shared-state.json (becomes saveState() call)
  SHARED_DATA     — Load shared reference data (users, products, customers)
  DATASETS        — Data-driven test rows (becomes for...of loop)
  Tags            — CI/CD filtering labels (becomes { tag: ['@tagName'] })
  {{ENV.VAR}}     — Environment variable (becomes process.env.VAR)
  ---             — Separator between scenarios in multi-scenario file

RESPONSE ASSERTIONS:
  VERIFY: Response status is {code}
  VERIFY: Response has fields: field1, field2
  VERIFY: Response has field: fieldName
  VERIFY: Response $.path equals {value}
  VERIFY: Response $.path is a/an {type}       (string, integer, array, object)
  VERIFY: Response is an array
  VERIFY: Response array length is {n}
  VERIFY: Every item $.field equals {value}
  VERIFY: Every item $.field matches pattern {regex}
  VERIFY: Each item has fields: field1, field2

NOTE: API scenarios skip the Analyst stage (no browser needed).
      Pipeline: Generator → Healer → Reviewer → [Healer-Review if needed]
-->
