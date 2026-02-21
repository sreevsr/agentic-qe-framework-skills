# Feature: Petstore API — Store Orders

## Module: api
## Type: API
## API Base URL: https://petstore3.swagger.io/api/v3
## Auth: None required

---

### Scenario: Place an order for a pet
**Tags:** api, store, smoke, P0

1. API POST: /store/order with body:
   ```json
   {
     "id": 88001,
     "petId": 99001,
     "quantity": 1,
     "shipDate": "2026-02-15T00:00:00.000Z",
     "status": "placed",
     "complete": false
   }
   ```
2. VERIFY: Response status is 200
3. VERIFY: Response $.status equals "placed"
4. VERIFY: Response $.quantity equals 1
5. CAPTURE: Response $.id as {{orderId}}
6. SAVE: {{orderId}} to test-data/shared-state.json as "lastOrderId"
7. REPORT: Print "Order placed with ID: {{orderId}}"

---

### Scenario: Retrieve order by ID
**Tags:** api, store, smoke, P0
**Depends On:** Place an order (needs: lastOrderId)

1. Read {{orderId}} from test-data/shared-state.json key "lastOrderId"
2. API GET: /store/order/{{orderId}}
3. VERIFY: Response status is 200
4. VERIFY: Response $.id equals {{orderId}}
5. VERIFY: Response $.petId equals 99001
6. VERIFY: Response $.status equals "placed"
7. REPORT: Print "Order {{orderId}} retrieved successfully"

---

### Scenario: Get store inventory
**Tags:** api, store, regression, P1

1. API GET: /store/inventory
2. VERIFY: Response status is 200
3. VERIFY: Response is an object with at least 1 key
4. CAPTURE: Read the value of "available" key as {{availableCount}}
5. REPORT: Print "Store has {{availableCount}} available items"

---

### Scenario: Delete an order
**Tags:** api, store, regression, P1
**Depends On:** Place an order (needs: lastOrderId)

1. Read {{orderId}} from test-data/shared-state.json key "lastOrderId"
2. API DELETE: /store/order/{{orderId}}
3. VERIFY: Response status is 200
4. API GET: /store/order/{{orderId}}
5. VERIFY: Response status is 404
6. REPORT: Print "Order {{orderId}} deleted successfully"

---

### Scenario: Get order — not found
**Tags:** api, store, regression, P2

1. API GET: /store/order/9999999
2. VERIFY: Response status is 404

## Expected Results
- Orders can be created, retrieved, and deleted
- Inventory endpoint returns current stock counts
- Non-existent orders return 404

## Notes
- Order IDs between 1-10 are pre-seeded in Petstore. Use ID > 80000 for test data.
- The Petstore API may reset data periodically.
