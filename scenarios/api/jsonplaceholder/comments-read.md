# Feature: Comments Read

## API Base URL: https://jsonplaceholder.typicode.com

---

### Scenario: GET /comments — List All Comments
**Tags:** api, comments, smoke, P0

1. API GET: /comments
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 500
5. VERIFY: Each item has fields: postId, id, name, email, body
6. CAPTURE: Response array length as {{totalComments}}
7. REPORT: Print "Found {{totalComments}} comments"

---

### Scenario: GET /comments?postId=1 — Filter Comments by Post
**Tags:** api, comments, smoke, P0

1. API GET: /comments?postId=1
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 5
5. VERIFY: Every item $.postId equals 1
6. VERIFY: Each item has fields: postId, id, name, email, body
7. CAPTURE: Response array length as {{filteredCount}}
8. REPORT: Print "Post 1 has {{filteredCount}} comments"

---

### Scenario: GET /posts/{id}/comments — Nested Comments Endpoint
**Tags:** api, comments, regression, P1

1. API GET: /posts/1/comments
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 5
5. VERIFY: Every item $.postId equals 1
6. REPORT: Print "Nested endpoint returns same comments as filter"

---

### Scenario: GET /comments — Validate Email Format
**Tags:** api, comments, regression, P1

1. API GET: /comments?postId=1
2. VERIFY: Response status is 200
3. VERIFY: Every item $.email matches pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/
4. CAPTURE: First item $.email as {{firstEmail}}
5. REPORT: Print "First comment email={{firstEmail}}"

---

### Scenario: GET /comments — Validate Comment Structure
**Tags:** api, comments, regression, P1

1. API GET: /comments/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.id equals 1
4. VERIFY: Response $.postId is an integer
5. VERIFY: Response $.name is a string
6. VERIFY: Response $.email is a string
7. VERIFY: Response $.body is a string
8. CAPTURE: Response $.name as {{commentName}}
9. REPORT: Print "Comment 1 name={{commentName}}"

---

### Scenario: GET /comments?postId=99999 — Non-Existent Post Filter
**Tags:** api, comments, regression, P2

1. API GET: /comments?postId=99999
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 0
5. REPORT: Print "Non-existent post returns empty comments array"
