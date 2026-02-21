# Feature: Petstore API — Pet CRUD Operations

## Module: api
## Type: API
## API Base URL: https://petstore3.swagger.io/api/v3
## Auth: API Key header `api_key: special-key`

## Common Setup
- Set API base URL to https://petstore3.swagger.io/api/v3
- Set header: api_key = special-key

---

### Scenario: Create a new pet
**Tags:** api, pets, smoke, P0

1. API POST: /pet with body:
   ```json
   {
     "id": 99001,
     "name": "Buddy",
     "category": {"id": 1, "name": "Dogs"},
     "photoUrls": ["https://example.com/buddy.jpg"],
     "tags": [{"id": 1, "name": "friendly"}],
     "status": "available"
   }
   ```
2. VERIFY: Response status is 200
3. VERIFY: Response $.name equals "Buddy"
4. VERIFY: Response $.status equals "available"
5. CAPTURE: Response $.id as {{petId}}
6. SAVE: {{petId}} to test-data/shared-state.json as "createdPetId"
7. REPORT: Print "Created pet with ID: {{petId}}"

---

### Scenario: Retrieve the created pet
**Tags:** api, pets, smoke, P0
**Depends On:** Create a new pet (needs: createdPetId)

1. Read {{petId}} from test-data/shared-state.json key "createdPetId"
2. API GET: /pet/{{petId}}
3. VERIFY: Response status is 200
4. VERIFY: Response $.name equals "Buddy"
5. VERIFY: Response $.id equals {{petId}}
6. REPORT: Print "Retrieved pet: {{petId}} — name is Buddy"

---

### Scenario: Update pet status
**Tags:** api, pets, regression, P1
**Depends On:** Create a new pet (needs: createdPetId)

1. Read {{petId}} from test-data/shared-state.json key "createdPetId"
2. API PUT: /pet with body:
   ```json
   {
     "id": {{petId}},
     "name": "Buddy Updated",
     "category": {"id": 1, "name": "Dogs"},
     "photoUrls": ["https://example.com/buddy.jpg"],
     "tags": [{"id": 1, "name": "friendly"}],
     "status": "sold"
   }
   ```
3. VERIFY: Response status is 200
4. VERIFY: Response $.name equals "Buddy Updated"
5. VERIFY: Response $.status equals "sold"
6. API GET: /pet/{{petId}}
7. VERIFY: Response $.name equals "Buddy Updated"
8. REPORT: Print "Pet updated and verified"

---

### Scenario: Find pets by status
**Tags:** api, pets, regression, P1

1. API GET: /pet/findByStatus?status=available
2. VERIFY: Response status is 200
3. VERIFY: Response is an array with at least 1 item
4. CAPTURE: Response array length as {{availableCount}}
5. REPORT: Print "Found {{availableCount}} available pets"

---

### Scenario: Get pet — not found
**Tags:** api, pets, regression, P2

1. API GET: /pet/9999999
2. VERIFY: Response status is 404

---

### Scenario: Delete pet
**Tags:** api, pets, regression, P1
**Depends On:** Create a new pet (needs: createdPetId)

1. Read {{petId}} from test-data/shared-state.json key "createdPetId"
2. API DELETE: /pet/{{petId}}
3. VERIFY: Response status is 200
4. API GET: /pet/{{petId}}
5. VERIFY: Response status is 404
6. REPORT: Print "Pet {{petId}} deleted and confirmed gone"

## Expected Results
- Full CRUD lifecycle works: create → read → update → delete
- API returns correct status codes
- Chained operations correctly pass pet ID between scenarios
- Not-found returns 404

## Notes for Analyst Agent
- This is an API-only scenario — no browser needed
- Skip this with the Analyst agent — go directly to Generator (Agent 2)
- The Petstore API does not require authentication for most operations
- Use pet ID 99001 to avoid conflicts with existing test data
