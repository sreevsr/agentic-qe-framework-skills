# Feature: Todos Read

## API Base URL: https://jsonplaceholder.typicode.com

---

### Scenario: GET /todos — List All Todos
**Tags:** api, todos, smoke, P0

1. API GET: /todos
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 200
5. VERIFY: Each item has fields: userId, id, title, completed
6. CAPTURE: Response array length as {{totalTodos}}
7. REPORT: Print "Found {{totalTodos}} todos"

---

### Scenario: GET /todos/{id} — Retrieve Single Todo
**Tags:** api, todos, smoke, P0

1. API GET: /todos/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.id equals 1
4. VERIFY: Response $.userId is an integer
5. VERIFY: Response $.title is a string
6. VERIFY: Response $.completed is a boolean
7. CAPTURE: Response $.title as {{todoTitle}}
8. CAPTURE: Response $.completed as {{todoStatus}}
9. REPORT: Print "Todo 1: title={{todoTitle}}, completed={{todoStatus}}"

---

### Scenario: GET /todos?userId=1 — Filter Todos by User
**Tags:** api, todos, regression, P1

1. API GET: /todos?userId=1
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 20
5. VERIFY: Every item $.userId equals 1
6. CAPTURE: Response array length as {{userTodoCount}}
7. REPORT: Print "User 1 has {{userTodoCount}} todos"

---

### Scenario: GET /todos?completed=true — Filter Completed Todos
**Tags:** api, todos, regression, P1

1. API GET: /todos?completed=true
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Every item $.completed equals true
5. CAPTURE: Response array length as {{completedCount}}
6. REPORT: Print "Found {{completedCount}} completed todos"

---

### Scenario: GET /todos?completed=false — Filter Incomplete Todos
**Tags:** api, todos, regression, P1

1. API GET: /todos?completed=false
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Every item $.completed equals false
5. CAPTURE: Response array length as {{incompleteCount}}
6. REPORT: Print "Found {{incompleteCount}} incomplete todos"

---

### Scenario: GET /todos — Count Completed vs Incomplete
**Tags:** api, todos, regression, P1

1. API GET: /todos
2. VERIFY: Response status is 200
3. CAPTURE: Count of items where $.completed equals true as {{completedCount}}
4. CAPTURE: Count of items where $.completed equals false as {{incompleteCount}}
5. CALCULATE: {{completedCount}} + {{incompleteCount}} as {{totalCount}}
6. VERIFY: {{totalCount}} equals 200
7. REPORT: Print "Completed={{completedCount}}, Incomplete={{incompleteCount}}, Total={{totalCount}}"

---

### Scenario: GET /todos?userId=1&completed=true — Combined Filters
**Tags:** api, todos, regression, P1

1. API GET: /todos?userId=1&completed=true
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Every item $.userId equals 1
5. VERIFY: Every item $.completed equals true
6. CAPTURE: Response array length as {{filteredCount}}
7. REPORT: Print "User 1 has {{filteredCount}} completed todos"

---

### Scenario: GET /todos — Validate Todo Structure
**Tags:** api, todos, regression, P2

1. API GET: /todos/1
2. VERIFY: Response status is 200
3. VERIFY: Response $.userId is an integer
4. VERIFY: Response $.id is an integer
5. VERIFY: Response $.title is a string
6. VERIFY: Response $.completed is a boolean
7. VERIFY: Response $.completed equals false
8. REPORT: Print "Todo 1 structure validated"

---

### Scenario: GET /todos/{id} — Non-Existent Todo (404)
**Tags:** api, todos, regression, P2

1. API GET: /todos/99999
2. VERIFY: Response status is 404
3. REPORT: Print "Correctly received 404 for non-existent todo"

---

### Scenario: GET /todos?userId=99999 — Non-Existent User Filter
**Tags:** api, todos, regression, P2

1. API GET: /todos?userId=99999
2. VERIFY: Response status is 200
3. VERIFY: Response is an array
4. VERIFY: Response array length is 0
5. REPORT: Print "Non-existent user returns empty todos array"
