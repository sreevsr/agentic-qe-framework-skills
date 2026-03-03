# Scenario: Hybrid API + UI — Order Flow with API Cross-Checks

## Type: hybrid
## Module: checkout
## Priority: P1-High

## Application
- **URL:** https://www.saucedemo.com
- **Credentials:** username: {{ENV.TEST_USERNAME}} / password: {{ENV.TEST_PASSWORD}}

## API Base URL: https://jsonplaceholder.typicode.com
## API Behavior: mock

**Tags:** hybrid, smoke, checkout, P1

## SHARED_DATA: users, products, customers

## Pre-conditions
- SauceDemo accessible at https://www.saucedemo.com
- JSONPlaceholder API accessible at https://jsonplaceholder.typicode.com
- Standard user credentials available in environment variables

## Steps

1. API POST: https://jsonplaceholder.typicode.com/users with body {"name": "Test Buyer", "email": "buyer@test.com", "phone": "555-1234"}
2. VERIFY: Response status is 201
3. CAPTURE: Response $.id as {{apiUserId}}
4. CAPTURE: Response $.name as {{apiUserName}}
5. Navigate to https://www.saucedemo.com
6. Enter standard user username from environment into the Username field
7. Enter standard user password from environment into the Password field
8. Click the "Login" button
9. VERIFY: URL contains "/inventory"
10. VERIFY: Page title shows "Products"
11. Click "Add to cart" button for "Sauce Labs Backpack"
12. VERIFY: Cart badge shows "1"
13. CAPTURE: Read the price displayed for "Sauce Labs Backpack" as {{backpackPrice}}
14. Click "Add to cart" button for "Sauce Labs Fleece Jacket"
15. VERIFY: Cart badge shows "2"
16. CAPTURE: Read the price displayed for "Sauce Labs Fleece Jacket" as {{jacketPrice}}
17. API POST: https://jsonplaceholder.typicode.com/posts with body {"title": "Order for user {{apiUserId}}", "body": "Items: Backpack={{backpackPrice}}, Jacket={{jacketPrice}}", "userId": {{apiUserId}}}
18. VERIFY: Response status is 201
19. CAPTURE: Response $.id as {{apiOrderId}}
20. Click the shopping cart icon
21. VERIFY: "Sauce Labs Backpack" appears in the cart list
22. VERIFY: "Sauce Labs Fleece Jacket" appears in the cart list
23. Click "Checkout" button
24. Enter default customer first name from shared data into the First Name field
25. Enter default customer last name from shared data into the Last Name field
26. Enter default customer postal code from shared data into the Zip/Postal Code field
27. Click "Continue" button
28. VERIFY: Checkout overview page is displayed
29. CAPTURE: Read the item total as {{itemTotal}}
30. CAPTURE: Read the tax amount as {{tax}}
31. CAPTURE: Read the total amount as {{total}}
32. SCREENSHOT: hybrid-checkout-overview
33. Click "Finish" button
34. VERIFY: Order confirmation message "Thank you for your order!" is displayed
35. SCREENSHOT: hybrid-order-complete
36. API PATCH: https://jsonplaceholder.typicode.com/posts/{{apiOrderId}} with body {"title": "Completed order for user {{apiUserId}}", "body": "Total: {{total}} — Confirmed via UI"}
37. VERIFY: Response status is 200
38. CAPTURE: Response $.title as {{updatedTitle}}
39. VERIFY: {{updatedTitle}} contains "Completed order"
40. API GET: https://jsonplaceholder.typicode.com/users/{{apiUserId}}
41. VERIFY: Response status is 200
42. CAPTURE: Response $.name as {{verifiedUserName}}

## Expected Results
- API user creation returns 201 with an id
- Login succeeds with standard user credentials from environment
- Both products added to cart with correct prices
- API order creation succeeds with captured product prices and user id
- Checkout completes using shared customer data
- Order confirmation is displayed in the UI
- API PATCH updates the order record with the UI-confirmed total
- API GET verifies the user record is accessible

## Notes for Analyst Agent
- This is a HYBRID scenario — the Analyst should execute only the UI steps (steps 5-35)
- Skip API steps (1-4, 17-19, 36-42) during browser execution — they use the Playwright request fixture, not the browser
- For steps 13 and 16, capture the visible price text from the inventory page (includes "$" prefix)
- All SauceDemo elements use data-test attributes for reliable selectors
- JSONPlaceholder is a mock API — POST returns 201 but doesn't actually persist data
- The API Behavior: mock declaration tells the Healer not to expect cross-request persistence
