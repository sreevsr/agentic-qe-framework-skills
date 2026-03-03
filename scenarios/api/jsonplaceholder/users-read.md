# Feature: Users Read

## API Base URL: https://jsonplaceholder.typicode.com

---

### Scenario: GET /users — List All Users
**Tags:** api, users, smoke, P0

1. API GET: /users
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 10
5. VERIFY: Each item has fields: id, name, username, email
6. CAPTURE: Response array length as {{totalUsers}}
7. REPORT: Print "Found {{totalUsers}} users"

---

### Scenario: GET /users/{id} — Retrieve Single User
**Tags:** api, users, smoke, P0

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.id equals 1
4. VERIFY: Response $.name equals "Leanne Graham"
5. VERIFY: Response $.username equals "Bret"
6. VERIFY: Response $.email equals "Sincere@april.biz"
7. CAPTURE: Response $.name as {{userName}}
8. REPORT: Print "Retrieved user={{userName}}"

---

### Scenario: GET /users/{id} — Validate Nested Address Object
**Tags:** api, users, regression, P1

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.address has fields: street, suite, city, zipcode, geo
4. VERIFY: Response $.address.street equals "Kulas Light"
5. VERIFY: Response $.address.city equals "Gwenborough"
6. VERIFY: Response $.address.geo has fields: lat, lng
7. CAPTURE: Response $.address.city as {{userCity}}
8. REPORT: Print "User 1 lives in {{userCity}}"

---

### Scenario: GET /users/{id} — Validate Nested Company Object
**Tags:** api, users, regression, P1

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.company has fields: name, catchPhrase, bs
4. VERIFY: Response $.company.name equals "Romaguera-Crona"
5. CAPTURE: Response $.company.name as {{companyName}}
6. REPORT: Print "User 1 works at {{companyName}}"

---

### Scenario: GET /users — Validate Email Format
**Tags:** api, users, regression, P1

1. API GET: /users
2. VERIFY: Response status is 200
3. VERIFY: Every item $.email matches pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/
4. CAPTURE: First item $.email as {{firstEmail}}
5. REPORT: Print "First user email={{firstEmail}}"

---

### Scenario: GET /users/{id} — Extract Website and Phone
**Tags:** api, users, regression, P1

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.website is a string
4. VERIFY: Response $.phone is a string
5. CAPTURE: Response $.website as {{website}}
6. CAPTURE: Response $.phone as {{phone}}
7. REPORT: Print "User 1 website={{website}}, phone={{phone}}"

---

### Scenario: GET /users/{id}/posts — User Posts Relationship
**Tags:** api, users, regression, P1

1. API GET: /users/1/posts
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 10
5. VERIFY: Every item $.userId equals 1
6. VERIFY: Each item has fields: userId, id, title, body
7. CAPTURE: Response array length as {{userPostCount}}
8. REPORT: Print "User 1 authored {{userPostCount}} posts"

---

### Scenario: GET /users/{id} — Validate Geographic Data
**Tags:** api, users, regression, P2

1. API GET: /users/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.address.geo.lat is a string
4. VERIFY: Response $.address.geo.lng is a string
5. CAPTURE: Response $.address.geo.lat as {{lat}}
6. CAPTURE: Response $.address.geo.lng as {{lng}}
7. REPORT: Print "User 1 geo: lat={{lat}}, lng={{lng}}"

---

### Scenario: GET /users/{id} — Non-Existent User (404)
**Tags:** api, users, regression, P2

1. API GET: /users/99999
2. VERIFY: Response status is 404
3. REPORT: Print "Correctly received 404 for non-existent user"
