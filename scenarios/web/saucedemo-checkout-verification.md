# Scenario: Checkout with Price Verification

## Module: checkout
## Priority: P0-Critical
## Depends On: None
## Produces: order-confirmation

## Application
- **URL:** https://www.saucedemo.com
- **Credentials:** username: `standard_user` / password: `secret_sauce`

**Tags:** smoke, checkout, P0

## Steps
1. Navigate to https://www.saucedemo.com
2. Login with username `standard_user` and password `secret_sauce`
3. VERIFY: URL contains "/inventory"
4. VERIFY: "Products" heading is visible
5. Add "Sauce Labs Backpack" to cart
6. VERIFY: Cart badge shows "1"
7. Add "Sauce Labs Bike Light" to cart
8. VERIFY: Cart badge shows "2"
9. Click the shopping cart link
10. VERIFY: Cart shows exactly 2 items
11. CAPTURE: Read the price of "Sauce Labs Backpack" and store as {{backpackPrice}}
12. CAPTURE: Read the price of "Sauce Labs Bike Light" and store as {{bikeLightPrice}}
13. SCREENSHOT: cart-with-two-items
14. Click "Checkout"
15. Fill first name: `John`, last name: `Doe`, postal code: `90210`
16. Click "Continue"
17. CAPTURE: Read "Item total" value and store as {{subtotal}}
18. CAPTURE: Read "Tax" value and store as {{tax}}
19. CAPTURE: Read "Total" value and store as {{displayedTotal}}
20. CALCULATE: {{expectedSubtotal}} = {{backpackPrice}} + {{bikeLightPrice}}
21. VERIFY: {{subtotal}} equals {{expectedSubtotal}}
22. CALCULATE: {{expectedTotal}} = {{subtotal}} + {{tax}}
23. VERIFY: {{displayedTotal}} equals {{expectedTotal}}
24. SCREENSHOT: checkout-overview-verified
25. REPORT: Print subtotal, tax, displayedTotal, expectedTotal
26. Click "Finish"
27. VERIFY: Page shows "Thank you for your order!"
28. SCREENSHOT: order-complete
29. CAPTURE: Read confirmation message and store as {{confirmationMessage}}
30. REPORT: Print confirmationMessage
31. SAVE: Write {{confirmationMessage}} to test-data/shared-state.json as "lastOrderConfirmation"

## Expected Results
- Order completes successfully
- All price calculations are mathematically correct
- Subtotal = sum of individual item prices
- Total = subtotal + tax

## Notes for Analyst Agent
- Prices on the checkout overview page include "$" prefix — strip it for math
- Tax is calculated by the application — capture it, don't assume a value
