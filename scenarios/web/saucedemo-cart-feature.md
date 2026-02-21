# Feature: Shopping Cart

## Module: cart
## Application
- **URL:** https://www.saucedemo.com
- **Credentials:** username: `standard_user` / password: `secret_sauce`

## Common Setup
1. Navigate to https://www.saucedemo.com
2. Fill username with `standard_user`
3. Fill password with `secret_sauce`
4. Click "Login" button
5. VERIFY: URL contains "/inventory"

---

### Scenario: Add single item to cart
**Tags:** smoke, cart, P0

1. Click "Add to cart" on "Sauce Labs Backpack"
2. VERIFY: Cart badge shows "1"
3. SCREENSHOT: cart-badge-single-item
4. Click the shopping cart link
5. VERIFY: "Sauce Labs Backpack" is listed in the cart
6. VERIFY: Cart shows exactly 1 item

---

### Scenario: Add multiple items to cart
**Tags:** regression, cart, P1

1. Click "Add to cart" on "Sauce Labs Backpack"
2. VERIFY: Cart badge shows "1"
3. Click "Add to cart" on "Sauce Labs Bike Light"
4. VERIFY: Cart badge shows "2"
5. Click the shopping cart link
6. VERIFY: Cart shows exactly 2 items
7. VERIFY: "Sauce Labs Backpack" is listed
8. VERIFY: "Sauce Labs Bike Light" is listed

---

### Scenario: Remove item from cart
**Tags:** regression, cart, P1

1. Click "Add to cart" on "Sauce Labs Backpack"
2. VERIFY: Cart badge shows "1"
3. Click the shopping cart link
4. VERIFY: "Sauce Labs Backpack" is listed
5. Click "Remove" on "Sauce Labs Backpack"
6. VERIFY: Cart is empty — no items listed

---

### Scenario: Continue shopping from cart
**Tags:** regression, cart, P2

1. Click "Add to cart" on "Sauce Labs Backpack"
2. Click the shopping cart link
3. VERIFY: Cart page is displayed
4. Click "Continue Shopping" button
5. VERIFY: URL contains "/inventory"
6. VERIFY: "Products" heading is visible

## Expected Results
- Items can be added, viewed, and removed from cart
- Cart badge accurately reflects item count
- Continue Shopping returns to inventory page
