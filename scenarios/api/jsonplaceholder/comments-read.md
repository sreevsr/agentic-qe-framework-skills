# Feature: Comments Read Operations

## API Base URL: https://jsonplaceholder.typicode.com
## API Behavior: mock

---

### Scenario: GET /comments — List All Comments
**Tags:** api, comments, smoke, P0

1. API GET: /comments
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{totalComments}}
5. VERIFY: {{totalComments}} is greater than 0
6. VERIFY: Response[0] has fields: postId, id, name, email, body
7. VERIFY: Response[0].email matches email format
8. REPORT: Print "Found {{totalComments}} comments"

---

### Scenario: GET /comments?postId=1 — Filter Comments by Post
**Tags:** api, comments, regression, P1

1. API GET: /comments?postId=1
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{postComments}}
5. VERIFY: {{postComments}} is greater than 0
6. VERIFY: Response[0].postId equals 1
7. VERIFY: Response[0] has fields: id, name, email, body
8. REPORT: Print "Post 1 has {{postComments}} comments"

---

### Scenario: GET /posts/1/comments — Nested Comments Resource
**Tags:** api, comments, posts, regression, P1

1. API GET: /posts/1/comments
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{nestedComments}}
5. VERIFY: {{nestedComments}} is greater than 0
6. VERIFY: Response[0].postId equals 1
7. CAPTURE: Response[0].email as {{firstCommentEmail}}
8. REPORT: Print "Nested endpoint returned {{nestedComments}} comments"
9. REPORT: Print "First comment email: {{firstCommentEmail}}"

---

### Scenario: GET /comments — Validate Email Format
**Tags:** api, comments, regression, P1

1. API GET: /comments
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response[0].email matches email format
5. VERIFY: Response[1].email matches email format
6. VERIFY: Response[2].email matches email format
7. REPORT: Print "Email format validation passed for first 3 comments"

---

### Scenario: GET /comments?postId=999 — Non-Existent Post Filter
**Tags:** api, comments, regression, P1

1. API GET: /comments?postId=999999
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{filteredCount}}
5. VERIFY: {{filteredCount}} equals 0
6. REPORT: Print "Non-existent post filter returned empty array"

---

### Scenario: GET /comments — Verify Comment Structure
**Tags:** api, comments, regression, P2

1. API GET: /comments
2. VERIFY: Response status is 200
3. CAPTURE: Response[0].postId as {{postId}}
4. CAPTURE: Response[0].id as {{commentId}}
5. CAPTURE: Response[0].name as {{commentName}}
6. CAPTURE: Response[0].email as {{commentEmail}}
7. CAPTURE: Response[0].body as {{commentBody}}
8. VERIFY: {{postId}} is greater than 0
9. VERIFY: {{commentId}} is greater than 0
10. VERIFY: {{commentName}} is not empty
11. VERIFY: {{commentEmail}} contains "@"
12. VERIFY: {{commentBody}} is not empty
13. REPORT: Print "Comment structure validation passed"
14. REPORT: Print "Comment ID: {{commentId}}, PostId: {{postId}}"
