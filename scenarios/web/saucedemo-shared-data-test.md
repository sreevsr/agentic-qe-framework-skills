# Scenario: SauceDemo Add to Cart — Shared Data Test

## Module: cart
## Priority: P1-High
## Type: UI

## Application
- **URL:** https://www.saucedemo.com
- **Credentials:** username: {{ENV.TEST_USERNAME}} / password: {{ENV.TEST_PASSWORD}}

## SHARED_DATA: users, products, customers

## Pre-conditions
- Standard user credentials available in shared data
- Product catalog with prices available in shared data

## Steps

1. Navigate to https://www.saucedemo.com
2. Enter standard user username from shared data into the Username field
3. Enter standard user password from shared data into the Password field
4. Click the "Login" button
5. VERIFY: URL contains "/inventory"
6. VERIFY: Page title shows "Products"
7. Click "Add to cart" button for "Sauce Labs Backpack"
8. VERIFY: Cart badge shows "1"
9. CAPTURE: Read the price displayed for "Sauce Labs Backpack" as {{backpackPrice}}
10. VERIFY: {{backpackPrice}} equals "$29.99" from shared product data
11. Click "Add to cart" button for "Sauce Labs Onesie"
12. VERIFY: Cart badge shows "2"
13. Click the shopping cart icon
14. VERIFY: "Sauce Labs Backpack" appears in the cart list
15. VERIFY: "Sauce Labs Onesie" appears in the cart list
16. Click "Checkout" button
17. Enter default customer first name from shared data into the First Name field
18. Enter default customer last name from shared data into the Last Name field
19. Enter default customer postal code from shared data into the Zip/Postal Code field
20. Click "Continue" button
21. VERIFY: Checkout overview page is displayed
22. CAPTURE: Read the item total as {{itemTotal}}
23. CAPTURE: Read the tax amount as {{tax}}
24. SCREENSHOT: checkout-overview-shared-data
25. Click "Finish" button
26. VERIFY: Order confirmation message is displayed
27. SCREENSHOT: order-complete-shared-data

**Tags:** smoke, cart, checkout, P1, shared-data-test

## Expected Results
- Login succeeds with standard user credentials from shared data
- Both products added to cart with correct prices from shared product catalog
- Checkout completes using default customer info from shared data
- Order confirmation is displayed

## Test Data
| Field | Value |
|-------|-------|
| Products to add | Sauce Labs Backpack, Sauce Labs Onesie |
| Expected cart count | 2 |

## Notes for Analyst Agent
- This scenario tests the SHARED_DATA keyword — user credentials, product prices, and customer info come from test-data/shared/ files
- All SauceDemo user types are in shared/users.json
- Full product catalog with prices is in shared/products.json
- Customer form data is in shared/customers.json
