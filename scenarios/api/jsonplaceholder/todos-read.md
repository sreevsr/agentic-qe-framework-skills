# Feature: Todos Read Operations

## API Base URL: https://jsonplaceholder.typicode.com
## API Behavior: mock

---

### Scenario: GET /todos — List All Todos
**Tags:** api, todos, smoke, P0

1. API GET: /todos
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{totalTodos}}
5. VERIFY: {{totalTodos}} is greater than 0
6. VERIFY: Response[0] has fields: userId, id, title, completed
7. REPORT: Print "Found {{totalTodos}} todos"

---

### Scenario: GET /todos/{id} — Retrieve Specific Todo
**Tags:** api, todos, smoke, P0

1. API GET: /todos/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.id equals 1
4. VERIFY: Response has fields: userId, id, title, completed
5. CAPTURE: Response $.title as {{todoTitle}}
6. CAPTURE: Response $.completed as {{isCompleted}}
7. REPORT: Print "Todo: {{todoTitle}} (Completed: {{isCompleted}})"

---

### Scenario: GET /todos/{id} — Non-Existent Todo (Negative)
**Tags:** api, todos, regression, P1

1. API GET: /todos/999999
2. VERIFY: Response status is 404
3. REPORT: Print "Non-existent todo returned 404 as expected"

---

### Scenario: GET /todos?userId=1 — Filter Todos by User
**Tags:** api, todos, regression, P1

1. API GET: /todos?userId=1
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{userTodos}}
5. VERIFY: {{userTodos}} is greater than 0
6. VERIFY: Response[0].userId equals 1
7. VERIFY: Response[0] has fields: id, title, completed
8. REPORT: Print "User 1 has {{userTodos}} todos"

---

### Scenario: GET /todos?completed=true — Filter Completed Todos
**Tags:** api, todos, regression, P1

1. API GET: /todos?completed=true
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{completedTodos}}
5. VERIFY: {{completedTodos}} is greater than 0
6. VERIFY: Response[0].completed equals true
7. REPORT: Print "Found {{completedTodos}} completed todos"

---

### Scenario: GET /todos?completed=false — Filter Incomplete Todos
**Tags:** api, todos, regression, P1

1. API GET: /todos?completed=false
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{incompleteTodos}}
5. VERIFY: {{incompleteTodos}} is greater than 0
6. VERIFY: Response[0].completed equals false
7. REPORT: Print "Found {{incompleteTodos}} incomplete todos"

---

### Scenario: GET /todos?userId=1&completed=true — Combined Filters
**Tags:** api, todos, regression, P1

1. API GET: /todos?userId=1&completed=true
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{userCompletedTodos}}
5. VERIFY: Response[0].userId equals 1
6. VERIFY: Response[0].completed equals true
7. REPORT: Print "User 1 has {{userCompletedTodos}} completed todos"

---

### Scenario: GET /todos — Count Completed vs Incomplete
**Tags:** api, todos, regression, P2

1. API GET: /todos?userId=1
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. CAPTURE: Response array length as {{totalUserTodos}}
5. API GET: /todos?userId=1&completed=true
6. VERIFY: Response status is 200
7. CAPTURE: Response array length as {{completed}}
8. API GET: /todos?userId=1&completed=false
9. VERIFY: Response status is 200
10. CAPTURE: Response array length as {{incomplete}}
11. CALCULATE: {{completed}} + {{incomplete}} as {{sum}}
12. VERIFY: {{sum}} equals {{totalUserTodos}}
13. REPORT: Print "User 1 todos: {{completed}} completed + {{incomplete}} incomplete = {{sum}} total"

---

### Scenario: GET /todos — Validate Todo Structure
**Tags:** api, todos, regression, P2

1. API GET: /todos/1
2. VERIFY: Response status is 200
3. CAPTURE: Response $.userId as {{userId}}
4. CAPTURE: Response $.id as {{todoId}}
5. CAPTURE: Response $.title as {{title}}
6. CAPTURE: Response $.completed as {{completed}}
7. VERIFY: {{userId}} is greater than 0
8. VERIFY: {{todoId}} is greater than 0
9. VERIFY: {{title}} is not empty
10. VERIFY: {{completed}} is boolean
11. REPORT: Print "Todo validation passed"
12. REPORT: Print "Todo {{todoId}}: '{{title}}' (User: {{userId}})"
