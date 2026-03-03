# Scenario: Complete Purchase Flow

## Module: checkout
## Priority: P0-Critical

## Application
- **URL:** https://www.saucedemo.com
- **Credentials:** username: `standard_user` / password: `secret_sauce`

**Tags:** smoke, e2e, P0

## Steps
1. Navigate to https://www.saucedemo.com
2. Login with username `standard_user` and password `secret_sauce`
3. VERIFY: URL contains "/inventory"
4. Add "Sauce Labs Backpack" to cart
5. Add "Sauce Labs Bolt T-Shirt" to cart
6. VERIFY: Cart badge shows "2"
7. Click the shopping cart link
8. VERIFY: Cart page shows 2 items
9. Click "Checkout"
10. Fill first name with "Jane"
11. Fill last name with "Smith"
12. Fill postal code with "10001"
13. Click "Continue"
14. VERIFY: Checkout overview page displays items, prices, and total
15. SCREENSHOT: checkout-overview
16. Click "Finish"
17. VERIFY: "Thank you for your order!" message is displayed
18. SCREENSHOT: order-confirmation

## Expected Results
- User can login, add items, and complete checkout
- All pages load correctly in sequence
- Order confirmation is displayed at the end

## Test Data
| Field | Value |
|-------|-------|
| username | standard_user |
| password | secret_sauce |
| firstName | Jane |
| lastName | Smith |
| postalCode | 10001 |
| product1 | Sauce Labs Backpack |
| product2 | Sauce Labs Bolt T-Shirt |
