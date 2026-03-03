# API Test Scenarios — Auto-Generated
**Source:** jsonplaceholder-v1.json
**Date:** 2026-03-03
**Base URL:** https://jsonplaceholder.typicode.com
**Authentication:** None required
**API Behavior:** mock (server processes requests but does not persist changes)

| Scenario File | Scenarios | Tags |
|---------------|-----------|------|
| posts-crud.md | 12 | api, posts, smoke, regression, P0, P1, P2 |
| comments-read.md | 6 | api, comments, smoke, regression, P0, P1, P2 |
| users-read.md | 9 | api, users, smoke, regression, P0, P1, P2 |
| todos-read.md | 10 | api, todos, smoke, regression, P0, P1, P2 |
| **Total** | **37** | |

## Resource Coverage

| Resource | GET List | GET by ID | POST | PUT | PATCH | DELETE | Nested | Filters | Negative |
|----------|----------|-----------|------|-----|-------|--------|--------|---------|----------|
| Posts | Y | Y | Y | Y | Y | Y | /posts/{id}/comments | userId | 404, missing field, invalid type |
| Comments | Y | Y | - | - | - | - | /posts/{id}/comments | postId | empty filter |
| Users | Y | Y | - | - | - | - | /users/{id}/posts | - | 404 |
| Todos | Y | Y | - | - | - | - | - | userId, completed | 404, empty filter |

## Execution Order

No authentication dependency — all scenarios can run independently.

1. posts-crud.md (full CRUD + data-driven)
2. comments-read.md (read + filter validation)
3. users-read.md (read + nested object validation)
4. todos-read.md (read + filter + CALCULATE)

## Key Test Patterns

- **CRUD lifecycle:** POST → GET → PUT → PATCH → DELETE (posts only)
- **Nested resources:** `/posts/{id}/comments` and `/users/{id}/posts`
- **Filter validation:** Query param filtering with result verification
- **Data-driven:** DATASETS table for multiple POST inputs
- **Structure validation:** Field type checks, nested object inspection
- **Email format:** Regex pattern validation on comment and user emails
- **Arithmetic:** CALCULATE keyword for completed vs incomplete todo counts

## Manual Review Needed

- [ ] Verify array lengths match current JSONPlaceholder data (100 posts, 500 comments, 10 users, 200 todos)
- [ ] Confirm 404 behavior — JSONPlaceholder returns `{}` for some non-existent resources, not always 404
- [ ] Add business-specific edge cases if extending beyond JSONPlaceholder
- [ ] Review data-driven test values for coverage adequacy
