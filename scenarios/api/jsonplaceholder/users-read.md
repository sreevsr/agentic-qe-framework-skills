# Feature: Users Read Operations

## API Base URL: https://jsonplaceholder.typicode.com
## API Behavior: mock

---

### Scenario: GET /users — List All Users
**Tags:** api, users, smoke, P0

1. API GET: /users
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{totalUsers}}
5. VERIFY: {{totalUsers}} is greater than 0
6. VERIFY: Response[0] has fields: id, name, username, email
7. VERIFY: Response[0].email matches email format
8. REPORT: Print "Found {{totalUsers}} users"

---

### Scenario: GET /users/{id} — Retrieve Specific User
**Tags:** api, users, smoke, P0

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.id equals 1
4. VERIFY: Response has fields: id, name, username, email
5. CAPTURE: Response $.name as {{userName}}
6. CAPTURE: Response $.email as {{userEmail}}
7. REPORT: Print "User: {{userName}} ({{userEmail}})"

---

### Scenario: GET /users/{id} — Non-Existent User (Negative)
**Tags:** api, users, regression, P1

1. API GET: /users/999999
2. VERIFY: Response status is 404
3. REPORT: Print "Non-existent user returned 404 as expected"

---

### Scenario: GET /users — Validate User Structure with Nested Objects
**Tags:** api, users, regression, P1

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response has fields: id, name, username, email
4. VERIFY: Response $.address has fields: street, city, zipcode
5. VERIFY: Response $.address.geo has fields: lat, lng
6. VERIFY: Response $.company has fields: name, catchPhrase, bs
7. CAPTURE: Response $.address.city as {{city}}
8. CAPTURE: Response $.company.name as {{companyName}}
9. REPORT: Print "User location: {{city}}"
10. REPORT: Print "Company: {{companyName}}"

---

### Scenario: GET /users/{id}/posts — Get User's Posts
**Tags:** api, users, posts, regression, P1

1. API GET: /users/1/posts
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{userPosts}}
5. VERIFY: {{userPosts}} is greater than 0
6. VERIFY: Response[0] has fields: userId, id, title, body
7. VERIFY: Response[0].userId equals 1
8. REPORT: Print "User 1 has {{userPosts}} posts"

---

### Scenario: GET /users — Validate Email Formats
**Tags:** api, users, regression, P1

1. API GET: /users
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response[0].email matches email format
5. VERIFY: Response[1].email matches email format
6. VERIFY: Response[2].email matches email format
7. CAPTURE: Response[0].email as {{email1}}
8. CAPTURE: Response[1].email as {{email2}}
9. REPORT: Print "Email validation passed: {{email1}}, {{email2}}"

---

### Scenario: GET /users — Validate Website Field
**Tags:** api, users, regression, P2

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.website is not empty
4. CAPTURE: Response $.website as {{website}}
5. VERIFY: {{website}} does not contain "http://"
6. VERIFY: {{website}} does not contain "https://"
7. REPORT: Print "User website: {{website}}"

---

### Scenario: GET /users — Extract Geographic Data
**Tags:** api, users, regression, P2

1. API GET: /users/1
2. VERIFY: Response status is 200
3. CAPTURE: Response $.address.geo.lat as {{latitude}}
4. CAPTURE: Response $.address.geo.lng as {{longitude}}
5. VERIFY: {{latitude}} is not empty
6. VERIFY: {{longitude}} is not empty
7. REPORT: Print "User coordinates: {{latitude}}, {{longitude}}"

---

### Scenario: GET /users/{id}/posts — Verify Post-User Relationship
**Tags:** api, users, posts, regression, P2

1. API GET: /users/2
2. VERIFY: Response status is 200
3. CAPTURE: Response $.id as {{userId}}
4. API GET: /users/{{userId}}/posts
5. VERIFY: Response status is 200
6. VERIFY: Response is an array
7. CAPTURE: Response array length as {{postCount}}
8. VERIFY: Response[0].userId equals {{userId}}
9. REPORT: Print "User {{userId}} has {{postCount}} posts with correct userId"
