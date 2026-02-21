# Feature: ReqRes API — Users

## Module: api
## Type: API
## API Base URL: https://reqres.in
## Auth: None required (public API)

---

### Scenario: List users — page 1
**Tags:** api, users, smoke, P0

1. API GET: /api/users?page=1
2. VERIFY: Response status is 200
3. VERIFY: Response $.page equals 1
4. VERIFY: Response $.per_page equals 6
5. VERIFY: Response $.data is an array with 6 items
6. CAPTURE: Response $.total as {{totalUsers}}
7. CAPTURE: Response $.data[0].id as {{firstUserId}}
8. CAPTURE: Response $.data[0].email as {{firstUserEmail}}
9. REPORT: Print "Total users: {{totalUsers}}, First user: {{firstUserEmail}}"

---

### Scenario: Get single user
**Tags:** api, users, smoke, P0

1. API GET: /api/users/2
2. VERIFY: Response status is 200
3. VERIFY: Response $.data.id equals 2
4. VERIFY: Response $.data has fields: id, email, first_name, last_name, avatar
5. CAPTURE: Response $.data.first_name as {{firstName}}
6. CAPTURE: Response $.data.last_name as {{lastName}}
7. REPORT: Print "User 2: {{firstName}} {{lastName}}"

---

### Scenario: Get user — not found
**Tags:** api, users, regression, P1

1. API GET: /api/users/23
2. VERIFY: Response status is 404
3. VERIFY: Response body is empty object {}

---

### Scenario: Create user
**Tags:** api, users, smoke, P0

1. API POST: /api/users with body:
   ```json
   {
     "name": "Test Engineer",
     "job": "QE Automation Lead"
   }
   ```
2. VERIFY: Response status is 201
3. VERIFY: Response $.name equals "Test Engineer"
4. VERIFY: Response $.job equals "QE Automation Lead"
5. VERIFY: Response has fields: id, createdAt
6. CAPTURE: Response $.id as {{newUserId}}
7. CAPTURE: Response $.createdAt as {{createdAt}}
8. SAVE: {{newUserId}} to test-data/shared-state.json as "reqresUserId"
9. REPORT: Print "Created user ID: {{newUserId}} at {{createdAt}}"

---

### Scenario: Update user — PUT
**Tags:** api, users, regression, P1

1. API PUT: /api/users/2 with body:
   ```json
   {
     "name": "Updated Name",
     "job": "Senior QE Lead"
   }
   ```
2. VERIFY: Response status is 200
3. VERIFY: Response $.name equals "Updated Name"
4. VERIFY: Response $.job equals "Senior QE Lead"
5. VERIFY: Response has field: updatedAt
6. REPORT: Print "User updated successfully"

---

### Scenario: Update user — PATCH
**Tags:** api, users, regression, P1

1. API PATCH: /api/users/2 with body:
   ```json
   {
     "job": "Director of QE"
   }
   ```
2. VERIFY: Response status is 200
3. VERIFY: Response $.job equals "Director of QE"
4. VERIFY: Response has field: updatedAt

---

### Scenario: Delete user
**Tags:** api, users, regression, P1

1. API DELETE: /api/users/2
2. VERIFY: Response status is 204

---

### Scenario: Register and Login
**Tags:** api, auth, smoke, P0

1. API POST: /api/register with body:
   ```json
   {
     "email": "eve.holt@reqres.in",
     "password": "pistol"
   }
   ```
2. VERIFY: Response status is 200
3. VERIFY: Response has field: token
4. CAPTURE: Response $.token as {{authToken}}
5. API POST: /api/login with body:
   ```json
   {
     "email": "eve.holt@reqres.in",
     "password": "pistol"
   }
   ```
6. VERIFY: Response status is 200
7. VERIFY: Response has field: token
8. REPORT: Print "Auth token: {{authToken}}"

---

### Scenario: Register — missing password
**Tags:** api, auth, regression, P1

1. API POST: /api/register with body:
   ```json
   {
     "email": "sydney@fife"
   }
   ```
2. VERIFY: Response status is 400
3. VERIFY: Response $.error equals "Missing password"

---

### Scenario: Delayed response
**Tags:** api, performance, regression, P2

1. API GET: /api/users?delay=3
2. VERIFY: Response status is 200
3. VERIFY: Response $.data is an array with items
4. REPORT: Print "Delayed response received successfully"

## Expected Results
- Users CRUD operations work correctly
- Auth register/login flow returns tokens
- Invalid operations return correct error codes
- Delayed response completes within timeout

## Notes
- reqres.in is a public test API — data is not actually persisted
- POST/PUT/DELETE return correct response codes but don't modify server state
- Use this for validating your API test framework logic
- The delayed response (3s) tests your timeout configuration
