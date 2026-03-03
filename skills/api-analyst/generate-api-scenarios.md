# Skill: Generate API Scenarios

## Purpose
Read a Swagger/OpenAPI specification and automatically generate test scenario `.md` files. These scenario files are then fed into the Generator for Playwright API test creation.

## Input
- Swagger/OpenAPI spec file (JSON or YAML)
  - Without folder: `scenarios/api/swagger-specs/{spec-file}.json`
  - With folder: `scenarios/api/{folder}/swagger-specs/{spec-file}.json`

## Process

### Step 1: Parse the Spec

Read the spec and identify:
- Base URL from `servers[0].url`
- All endpoints (paths + methods)
- Request body schemas for POST/PUT/PATCH
- Response schemas and status codes
- Required vs optional fields
- Authentication scheme (Bearer, API key, Basic)

### Step 2: Group by Resource

Group endpoints by resource (e.g., all `/users/*` together, all `/orders/*` together).

### Step 3: Generate Scenario Files

For each resource group, create a scenario `.md` file with these categories:

**Category A: Happy Path CRUD**
```markdown
### Scenario: POST /resource — Create [Resource]
**Tags:** api, [resource], smoke, P0

1. API POST: /[resource] with body {schema-based test data}
2. VERIFY: Response status is 201
3. VERIFY: Response has fields: [required fields from schema]
4. CAPTURE: Response $.id as {{resourceId}}
5. SAVE: {{resourceId}} to shared-state.json as "lastResourceId"
```

Create Read, Update, Delete scenarios similarly, linked by `{{resourceId}}`.

**Category B: Negative Tests**
- Missing required fields (expected 400)
- Invalid data types (expected 400)
- Non-existent resource (expected 404)
- Unauthorized access (expected 401)

**Category C: List/Search**
- Pagination tests (`?page=1&limit=10`)
- Array response verification

**Category D: Data-Driven (if applicable)**
- DATASETS table for multiple valid/invalid inputs

### Step 4: Generate Auth Setup Scenario (if needed)

If the API requires authentication:
```markdown
### Scenario: Obtain Auth Token
**Tags:** api, auth, smoke, P0

1. API POST: /auth/login with body {"username": {{ENV.API_USERNAME}}, "password": {{ENV.API_PASSWORD}}}
2. VERIFY: Response status is 200
3. CAPTURE: Response $.token as {{authToken}}
4. SAVE: {{authToken}} to shared-state.json as "authToken"
```

### Step 5: Generate Summary File

Create `api-test-summary.md` listing all generated scenario files:

```markdown
# API Test Scenarios — Auto-Generated
**Source:** [swagger spec filename]
**Date:** [today]
**Base URL:** [from spec]

| Scenario File | Scenarios | Tags |
|---------------|-----------|------|
| auth-setup.md | 1 | api, auth, smoke |
| users-crud.md | 8 | api, users, smoke, regression |
| **Total** | **9** | |

## Execution Order
1. auth-setup.md (produces auth token)
2. Resource CRUD files (use auth token)

## Manual Review Needed
- [ ] Verify test data values make sense
- [ ] Add business-specific edge cases
- [ ] Adjust expected status codes if API deviates from spec
```

## Output Paths

Without folder:
```
scenarios/api/
├── {resource-1}-crud.md
├── {resource-2}-crud.md
├── auth-setup.md
└── api-test-summary.md
```

With folder:
```
scenarios/api/{folder}/
├── {resource-1}-crud.md
├── {resource-2}-crud.md
├── auth-setup.md
└── api-test-summary.md
```

## Rules
- All auth credentials use `{{ENV.VARIABLE}}` pattern — never real values
- Use the framework's standard keywords: VERIFY, CAPTURE, SAVE, REPORT, DATASETS, Tags
- Generate realistic test data based on schema definitions
- The API Analyst produces scenario `.md` files only — NOT test code
- The generated scenarios are then processed by the Generator + Healer + Reviewer pipeline
