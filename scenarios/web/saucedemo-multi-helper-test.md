# Scenario: Multi-Helper Failure Test

## Application
- **URL:** https://www.saucedemo.com
- **Credentials:** username: `standard_user` / password: `secret_sauce`

## SHARED_DATA: users, products

**Tags:** smoke, cart, helpers, P1

## Steps
1. Navigate to https://www.saucedemo.com
2. Login with username `standard_user` and password `secret_sauce`
3. VERIFY: URL contains "/inventory"
4. Add "Sauce Labs Backpack" to cart
5. Add "Sauce Labs Bike Light" to cart
6. Click the shopping cart link
7. USE_HELPER: CartPage.calculateTotalPrice → {{cartTotal}}
8. VERIFY: {{cartTotal}} equals 39.98
9. USE_HELPER: CartPage.emptyCart
10. USE_HELPER: CartPage.calculateTotalPrice → {{emptyTotal}}
11. VERIFY: {{emptyTotal}} equals 0