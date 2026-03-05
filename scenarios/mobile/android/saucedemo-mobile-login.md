# Feature: Mobile Login

## Type: mobile
## Platform: android
## Module: auth
## Priority: P0-Critical
## Depends On: None
## Produces: None

## Application
- **App:** Sauce Labs My Demo App RN (React Native)
- **APK:** https://github.com/saucelabs/my-demo-app-rn/releases/download/v1.3.0/Android-MyDemoAppRN.1.3.0.build-244.apk
- **Package:** com.saucelabs.mydemoapp.rn
- **Activity:** com.saucelabs.mydemoapp.rn.MainActivity
- **Credentials:** username: {{ENV.MOBILE_USERNAME}} / password: {{ENV.MOBILE_PASSWORD}}

**Tags:** smoke, auth, P0

---

### Scenario: Successful login with valid credentials
**Tags:** smoke, P0

1. Wait for the Login screen to be displayed
2. Tap the username field
3. Type {{ENV.MOBILE_USERNAME}} into the username field
4. Tap the password field
5. Type {{ENV.MOBILE_PASSWORD}} into the password field
6. Tap the "Login" button
7. VERIFY: Products screen (catalog/home) is displayed
8. VERIFY: At least one product is visible in the list
9. SCREENSHOT: login-success-home-screen

---

### Scenario: Login failure with invalid credentials
**Tags:** regression, P1

1. Wait for the Login screen to be displayed
2. Tap the username field
3. Type "wrong@example.com" into the username field
4. Tap the password field
5. Type "wrongpassword" into the password field
6. Tap the "Login" button
7. VERIFY: Error message is displayed
8. VERIFY: Login screen is still displayed (not navigated away)
9. SCREENSHOT: login-error-invalid-credentials

---

### Scenario: Login with empty credentials
**Tags:** regression, P2

1. Wait for the Login screen to be displayed
2. Tap the "Login" button without entering any credentials
3. VERIFY: Error or validation message is displayed
4. VERIFY: Login screen remains active
5. SCREENSHOT: login-error-empty-fields

---

### Scenario: Logout after successful login
**Tags:** regression, P1

1. Wait for the Login screen to be displayed
2. Tap the username field
3. Type {{ENV.MOBILE_USERNAME}} into the username field
4. Tap the password field
5. Type {{ENV.MOBILE_PASSWORD}} into the password field
6. Tap the "Login" button
7. VERIFY: Products screen is displayed
8. Open the side menu (tap the hamburger/menu icon)
9. Tap the "Log Out" option
10. VERIFY: Login screen is displayed again
11. SCREENSHOT: logout-success

## Pre-conditions
- Appium server is running on localhost:4723
- Android device or emulator is connected and recognized by ADB
- APP_PATH environment variable points to the downloaded APK
- ANDROID_DEVICE environment variable is set to the device/emulator name
- TEST_USERNAME is set to bob@example.com
- TEST_PASSWORD is set to 10203040

## Expected Results
- Login with valid credentials navigates to the Products screen
- Login with invalid credentials shows a descriptive error message without crashing
- Login with empty fields shows a validation message
- Logout returns the user to the Login screen

## Notes for Analyst Agent
- The app launches directly to the Login screen on fresh install
- If the app was previously opened and a session was cached, a "Welcome Back" overlay or auto-login may appear — dismiss it or reset app state via capabilities (appium:noReset: false)
- Username and password fields may have accessibility labels "test-Username" and "test-Password" (Sauce Labs RN app convention uses test- prefixed content-desc attributes)
- The Login button has accessibility label "test-LOGIN"
- After login, the catalog/home screen has a header with the app name or "Products" label
- The hamburger menu is typically in the top-left or top-right corner; look for a three-line icon
- Error messages appear as a red banner or inline text below the login form
- The app does NOT use a WebView for the login screen — all elements are native React Native components

<!--
KEYWORD REFERENCE (mobile):
  VERIFY          — Assert a condition (becomes expect() assertion via Screen Object)
  CAPTURE         — Store a runtime value (becomes variable assignment via screen.getText())
  SCREENSHOT      — Capture screen screenshot (becomes screen.takeScreenshot('name'))
  REPORT          — Print value to test output (becomes console.log — Mocha, not Playwright)
  SAVE            — Persist to shared-state.json (becomes saveState() call)
  USE_HELPER      — Call team helper method (requires *.helpers.ts file in output/screens/)
  {{ENV.VAR}}     — Environment variable (becomes process.env.VAR — no fallback defaults)
  ---             — Separator between scenarios in multi-scenario file
  Tags            — In it() description string with @prefix: it('test name @smoke @P0', ...)

MOBILE-SPECIFIC RULES:
  - No driver.pause() — use screen.waitForElement() instead
  - No direct browser.$() calls — all interactions via Screen Objects
  - App launch happens via wdio.conf.ts capabilities, not a navigate() call
  - First action in every test MUST be waitForElement() on a stable screen identifier
  - Gestures use W3C Actions API via BaseScreen.swipe() — no deprecated touchAction()
-->
