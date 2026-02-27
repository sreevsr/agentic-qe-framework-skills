# Feature: Posts CRUD Operations

## API Base URL: https://jsonplaceholder.typicode.com
## API Behavior: mock

---

### Scenario: POST /posts — Create Post
**Tags:** api, posts, smoke, P0

1. API POST: /posts with body {"userId": 1, "title": "Automated Test Post", "body": "This is a test post created by the QE automation framework."}
2. VERIFY: Response status is 201
3. VERIFY: Response has fields: id, userId, title, body
4. VERIFY: Response $.title equals "Automated Test Post"
5. CAPTURE: Response $.id as {{postId}}
6. SAVE: {{postId}} to test-data/shared-state.json as "lastPostId"
7. REPORT: Print "Created post with ID: {{postId}}"

---

### Scenario: GET /posts/{id} — Retrieve Post
**Tags:** api, posts, smoke, P0
**Depends On:** POST /posts (needs: postId)

1. Read {{postId}} from test-data/shared-state.json key "lastPostId"
2. API GET: /posts/{{postId}}
3. VERIFY: Response status is 200
4. VERIFY: Response $.id equals {{postId}}
5. VERIFY: Response has fields: id, userId, title, body
6. REPORT: Print "Retrieved post: {{postId}}"

---

### Scenario: PUT /posts/{id} — Update Entire Post
**Tags:** api, posts, regression, P1

1. Read {{postId}} from test-data/shared-state.json key "lastPostId"
2. API PUT: /posts/{{postId}} with body {"userId": 1, "title": "Updated Post Title", "body": "This post has been updated via PUT request."}
3. VERIFY: Response status is 200
4. VERIFY: Response $.title equals "Updated Post Title"
5. VERIFY: Response $.body contains "updated via PUT"
6. CAPTURE: Response $.id as {{updatedPostId}}
7. REPORT: Print "Updated post {{updatedPostId}} successfully"

---

### Scenario: PATCH /posts/{id} — Partially Update Post
**Tags:** api, posts, regression, P1

1. Read {{postId}} from test-data/shared-state.json key "lastPostId"
2. API PATCH: /posts/{{postId}} with body {"title": "Patched Title Only"}
3. VERIFY: Response status is 200
4. VERIFY: Response $.title equals "Patched Title Only"
5. VERIFY: Response has fields: id, title
6. REPORT: Print "Patched post title successfully"

---

### Scenario: DELETE /posts/{id} — Delete Post
**Tags:** api, posts, regression, P1

1. Read {{postId}} from test-data/shared-state.json key "lastPostId"
2. API DELETE: /posts/{{postId}}
3. VERIFY: Response status is 200
4. REPORT: Print "Deleted post {{postId}} successfully"

---

### Scenario: GET /posts — List All Posts
**Tags:** api, posts, smoke, P0

1. API GET: /posts
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{totalPosts}}
5. VERIFY: {{totalPosts}} is greater than 0
6. VERIFY: Response[0] has fields: id, userId, title, body
7. REPORT: Print "Found {{totalPosts}} posts"

---

### Scenario: GET /posts?userId=1 — Filter Posts by User
**Tags:** api, posts, regression, P1

1. API GET: /posts?userId=1
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{userPosts}}
5. VERIFY: {{userPosts}} is greater than 0
6. VERIFY: Response[0].userId equals 1
7. REPORT: Print "User 1 has {{userPosts}} posts"

---

### Scenario: GET /posts/{id}/comments — Get Post Comments
**Tags:** api, posts, comments, regression, P1

1. API GET: /posts/1/comments
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{commentCount}}
5. VERIFY: {{commentCount}} is greater than 0
6. VERIFY: Response[0] has fields: postId, id, name, email, body
7. VERIFY: Response[0].postId equals 1
8. REPORT: Print "Post 1 has {{commentCount}} comments"

---

### Scenario: POST /posts — Missing Required Field (Negative)
**Tags:** api, posts, regression, P1

1. API POST: /posts with body {"userId": 1, "body": "Missing title field"}
2. VERIFY: Response status is 400 or 500
3. REPORT: Print "Missing required field validation: status code received"

---

### Scenario: GET /posts/{id} — Non-Existent Post (Negative)
**Tags:** api, posts, regression, P1

1. API GET: /posts/999999
2. VERIFY: Response status is 404
3. REPORT: Print "Non-existent post returned 404 as expected"

---

### Scenario: PUT /posts/{id} — Invalid Data Type (Negative)
**Tags:** api, posts, regression, P1

1. API PUT: /posts/1 with body {"userId": "invalid_string", "title": "Test", "body": "Test body"}
2. VERIFY: Response status is 400 or 500
3. REPORT: Print "Invalid data type validation triggered"

---

### Scenario: POST /posts — Multiple Valid Posts (Data-Driven)
**Tags:** api, posts, regression, P2

## DATASETS
| userId | title | body | expectedStatus |
|--------|-------|------|----------------|
| 1 | "Test Post Alpha" | "Alpha content" | 201 |
| 2 | "Test Post Beta" | "Beta content" | 201 |
| 3 | "Test Post Gamma" | "Gamma content" | 201 |

1. API POST: /posts with body {"userId": {{userId}}, "title": {{title}}, "body": {{body}}}
2. VERIFY: Response status is {{expectedStatus}}
3. VERIFY: Response $.userId equals {{userId}}
4. VERIFY: Response $.title equals {{title}}
5. CAPTURE: Response $.id as {{createdId}}
6. REPORT: Print "Created post {{createdId}} for user {{userId}}"
