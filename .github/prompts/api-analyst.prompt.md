---
mode: agent
description: "Run QE API Analyst to generate API test scenarios from Swagger/OpenAPI spec"
---

---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
- Output: path.join(process.cwd(), 'output', 'api-analyst-report.md')
---

Read agents/05-api-analyst.md for your instructions.
Read the Swagger/OpenAPI spec from scenarios/api/swagger-specs/{{spec}}.json.

For each resource group in the spec (e.g., pet, store, user):
1. Generate a scenario .md file with CRUD happy path tests
2. Add negative tests (missing fields, not found, unauthorized)
3. Add chaining tests (create → get → update → delete)
4. Include Tags for CI/CD filtering (@smoke, @regression, @P0, @P1, @P2)
5. Use {{ENV.VARIABLE}} for any credentials
6. Use VERIFY, CAPTURE, SAVE, REPORT keywords

Save generated files to scenarios/api/:
- scenarios/api/{resource}-crud.md (one per resource group)
- scenarios/api/api-test-summary.md (summary of all generated scenarios)

After generating, list all files created with scenario counts.
