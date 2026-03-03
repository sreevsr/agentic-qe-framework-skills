# Feature: Posts CRUD

## API Base URL: https://jsonplaceholder.typicode.com
## API Behavior: live

---

### Scenario: POST /posts — Create Post
**Tags:** api, posts, smoke, P0

1. API POST: /posts with body {"userId": 1, "title": "Automated Test Post", "body": "This post was created by the API test framework."}
2. VERIFY: Response status is 201
3. VERIFY: Response has fields: id, userId, title, body
4. VERIFY: Response $.title equals "Automated Test Post"
5. CAPTURE: Response $.id as {{postId}}
6. SAVE: {{postId}} to shared-state.json as "lastPostId"
7. REPORT: Print "Created post with id={{postId}}"

---

### Scenario: GET /posts/{id} — Retrieve Post
**Tags:** api, posts, smoke, P0

1. API GET: /posts/1
2. VERIFY: Response status is 200
3. VERIFY: Response has fields: userId, id, title, body
4. VERIFY: Response $.id equals 1
5. VERIFY: Response $.userId is an integer
6. CAPTURE: Response $.title as {{postTitle}}
7. REPORT: Print "Retrieved post title={{postTitle}}"

---

### Scenario: PUT /posts/{id} — Update Post
**Tags:** api, posts, regression, P1

1. API PUT: /posts/1 with body {"userId": 1, "title": "Updated Post Title", "body": "This post body has been updated by API test."}
2. VERIFY: Response status is 200
3. VERIFY: Response $.title equals "Updated Post Title"
4. VERIFY: Response $.body equals "This post body has been updated by API test."
5. VERIFY: Response $.userId equals 1
6. REPORT: Print "Updated post 1 successfully"

---

### Scenario: PATCH /posts/{id} — Partial Update Post
**Tags:** api, posts, regression, P1

1. API PATCH: /posts/1 with body {"title": "Patched Title Only"}
2. VERIFY: Response status is 200
3. VERIFY: Response $.title equals "Patched Title Only"
4. VERIFY: Response $.id equals 1
5. REPORT: Print "Patched post 1 title successfully"

---

### Scenario: DELETE /posts/{id} — Delete Post
**Tags:** api, posts, regression, P1

1. API DELETE: /posts/1
2. VERIFY: Response status is 200
3. REPORT: Print "Deleted post 1"

---

### Scenario: GET /posts — List All Posts
**Tags:** api, posts, smoke, P0

1. API GET: /posts
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 100
5. VERIFY: Each item has fields: userId, id, title, body
6. CAPTURE: Response array length as {{totalPosts}}
7. REPORT: Print "Found {{totalPosts}} posts"

---

### Scenario: GET /posts?userId=1 — Filter Posts by User
**Tags:** api, posts, regression, P1

1. API GET: /posts?userId=1
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 10
5. VERIFY: Every item $.userId equals 1
6. CAPTURE: Response array length as {{userPostCount}}
7. REPORT: Print "User 1 has {{userPostCount}} posts"

---

### Scenario: GET /posts/{id}/comments — Get Comments for Post
**Tags:** api, posts, regression, P1

1. API GET: /posts/1/comments
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 5
5. VERIFY: Every item $.postId equals 1
6. VERIFY: Each item has fields: postId, id, name, email, body
7. CAPTURE: Response array length as {{commentCount}}
8. REPORT: Print "Post 1 has {{commentCount}} comments"

---

### Scenario: GET /posts/{id} — Non-Existent Post (404)
**Tags:** api, posts, regression, P1

1. API GET: /posts/99999
2. VERIFY: Response status is 404
3. REPORT: Print "Correctly received 404 for non-existent post"

---

### Scenario: POST /posts — Missing Required Field
**Tags:** api, posts, regression, P2

1. API POST: /posts with body {"userId": 1, "title": "Post Without Body"}
2. VERIFY: Response status is 201
3. VERIFY: Response has field: id
4. REPORT: Print "JSONPlaceholder accepts partial data (mock API)"

---

### Scenario: POST /posts — Invalid Data Type for userId
**Tags:** api, posts, regression, P2

1. API POST: /posts with body {"userId": "not-a-number", "title": "Invalid Type Test", "body": "Testing invalid userId type"}
2. VERIFY: Response status is 201
3. VERIFY: Response has field: id
4. REPORT: Print "JSONPlaceholder accepts any type (mock API, no server validation)"

---

### Scenario: POST /posts — Various Valid Inputs
**Tags:** api, posts, regression, P2

## DATASETS
| userId | title                  | body                              | expectedStatus |
|--------|------------------------|-----------------------------------|----------------|
| 1      | First Test Post        | Body for first test post          | 201            |
| 2      | Second Test Post       | Body for second test post         | 201            |
| 5      | Enterprise QE Post     | Testing data-driven API scenarios | 201            |
| 10     | Final User Post        | Last user creates a post          | 201            |

1. API POST: /posts with body {"userId": {{userId}}, "title": "{{title}}", "body": "{{body}}"}
2. VERIFY: Response status is {{expectedStatus}}
3. VERIFY: Response has fields: id, userId, title, body
4. CAPTURE: Response $.id as {{createdId}}
5. REPORT: Print "Created post {{createdId}} for userId={{userId}}"
