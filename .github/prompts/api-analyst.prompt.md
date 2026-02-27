---
mode: agent
description: "Run QE API Analyst to generate API test scenarios from Swagger/OpenAPI spec"
---

---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
---

Read agents/05-api-analyst.md for your instructions.

SPEC_NAME = {{spec}}

SPEC PATH RESOLUTION:
- Without folder: scenarios/api/swagger-specs/{{spec}}.json
- With folder:    scenarios/api/{{folder}}/swagger-specs/{{spec}}.json

SCENARIO OUTPUT RESOLUTION:
- Without folder: scenarios/api/{resource}-crud.md
- With folder:    scenarios/api/{{folder}}/{resource}-crud.md

SUMMARY FILE RESOLUTION:
- Without folder: scenarios/api/api-test-summary.md
- With folder:    scenarios/api/{{folder}}/api-test-summary.md

For each resource group in the spec (e.g., pet, store, user):
1. Generate a scenario .md file with CRUD happy path tests
2. Add negative tests (missing fields, not found, unauthorized)
3. Add chaining tests (create → get → update → delete)
4. Include Tags for CI/CD filtering (@smoke, @regression, @P0, @P1, @P2)
5. Use {{ENV.VARIABLE}} for any credentials
6. Use VERIFY, CAPTURE, SAVE, REPORT keywords

Save generated files using the resolved paths above.

After generating, list all files created with scenario counts.
