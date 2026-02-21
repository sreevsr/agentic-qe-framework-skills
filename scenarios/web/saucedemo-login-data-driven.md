# Feature: Login Validation

## Module: auth
## Priority: P0-Critical

## Application
- **URL:** https://www.saucedemo.com
- **Credentials:** from DATASETS below

**Tags:** regression, auth, P0

## Steps
1. Navigate to https://www.saucedemo.com
2. Fill username with {{username}}
3. Fill password with {{password}}
4. Click "Login" button
5. If {{expectedResult}} is "success":
   - VERIFY: URL contains "/inventory"
   - VERIFY: "Products" heading is visible
   - REPORT: Print "Login SUCCESS for {{username}}"
6. If {{expectedResult}} is "error":
   - VERIFY: Error message container is visible
   - VERIFY: Error message contains "{{errorMessage}}"
   - REPORT: Print "Login correctly BLOCKED for {{username}}"

## DATASETS
| username          | password       | expectedResult | errorMessage                                          |
|-------------------|----------------|----------------|-------------------------------------------------------|
| standard_user     | secret_sauce   | success        |                                                       |
| locked_out_user   | secret_sauce   | error          | Sorry, this user has been locked out                  |
| problem_user      | secret_sauce   | success        |                                                       |
| standard_user     | wrong_password | error          | Username and password do not match any user            |
|                   | secret_sauce   | error          | Username is required                                  |
| standard_user     |                | error          | Password is required                                  |

## Expected Results
- Valid users can login successfully
- Locked users see locked-out error
- Invalid credentials show mismatch error
- Empty fields show validation messages

## Notes for Analyst Agent
- Execute only the FIRST dataset row (standard_user / secret_sauce)
- The Generator will create parameterized tests for all 6 rows
- Error messages appear in an element with class "error-message-container"
