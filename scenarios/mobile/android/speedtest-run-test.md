# Feature: Speedtest Run Speed Test

## Type: mobile
## Platform: android
## Module: speedtest
## Priority: P0-Critical
## Depends On: None
## Produces: None

## Application
- **App:** Speedtest by Ookla (Production)
- **Package:** org.zwanoo.android.speedtest
- **Activity:** com.ookla.mobile4.screens.main.MainActivity
- **Credentials:** None required

**Tags:** smoke, speedtest, P0

---

### Scenario: Run a speed test and verify results
**Tags:** smoke, P0

1. Wait for the Speedtest app to finish launching
2. Dismiss any overlays that appear: permission dialog ("Welcome back to Speedtest" — tap "Not Now"), "Take a Video Test" banner (press back), or ad overlays
3. VERIFY: The home screen is displayed with the "GO" button visible (content-desc: "Start a Speedtest")
4. Tap the "GO" button to start the speed test
5. If a notification prompt appears ("NEVER MISS A SPEEDTEST RESULT"), dismiss it by tapping "Not Now"
6. Wait for the speed test to complete — both download and upload phases (allow up to 60 seconds)
7. VERIFY: Download speed result is displayed (a numeric value > 0 with "Mbps" unit)
8. VERIFY: Upload speed result is displayed (a numeric value > 0 with "Mbps" unit)
9. SCREENSHOT: speedtest-results-complete

## Pre-conditions
- Appium server is running on localhost:4723
- Android device is connected and recognized by ADB
- Speedtest app is installed on the device
- No login is required
- Device has an active internet connection (WiFi or mobile data)

## Expected Results
- App launches and the main screen with the GO button is displayed
- Overlays (permission dialog, banners, notification prompt) are dismissed without blocking the flow
- Tapping GO initiates the speed test
- After completion, both download and upload speeds are shown as numeric values with Mbps units

## Notes for Analyst Agent
- **Permission dialog**: A "Welcome back to Speedtest" dialog appears on launch — tap "Not Now" to dismiss
- **Video banner**: A "Take a Video Test" overlay may appear on the home screen — press back to dismiss
- **Notification prompt**: A "NEVER MISS A SPEEDTEST RESULT" prompt appears mid-test — tap "Not Now"
- **Ad overlay**: An ad may appear on the results screen but does NOT block result elements — no dismissal needed
- **GO button**: Large circular button in the center of the home screen (content-desc: "Start a Speedtest", resource-id: go_button)
- **Test duration**: 30-45 seconds total (download + upload phases). Use 60 second timeout.
- **Result disambiguation**: Download and upload result elements share the same resource-id (`txt_test_result_value`). Use parent container (`download_result_view` / `upload_result_view`) to disambiguate.
- **Locator strategy**: resource-id is reliable for most Speedtest elements. Use accessibility_id as primary, resource-id as fallback.
- **No login required**: App works fully without authentication.

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
