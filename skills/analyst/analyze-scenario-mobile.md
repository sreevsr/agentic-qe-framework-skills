# Skill: Analyze Scenario — Mobile

## Purpose
Execute a mobile test scenario step-by-step using Appium MCP tools, discover all screen elements, and produce a structured analyst report. This is the only mobile skill that requires device/emulator access.

## Tools Required
Appium MCP server: `launch_app`, `close_app`, `tap`, `type_text`, `get_text`, `get_attribute`, `is_displayed`, `wait_for_element`, `page_source`, `screenshot`, `swipe`, `scroll_to_element`, `press_key`, `back`, `long_press`.

## Paths
- Report output (no folder): `output/analyst-report-{scenario}.md`
- Report output (with folder): `output/{folder}/analyst-report-{scenario}.md`
- Scenario source: `scenarios/mobile/{platform}/{scenario}.md` or `scenarios/mobile/{platform}/{folder}/{scenario}.md`

## Input
- Scenario `.md` file from `scenarios/mobile/{platform}/` (platform = android | ios)
- `platform` parameter from pipeline invocation

## Process

### Step 1: Read Scenario

Read the scenario file and identify:
- All actionable steps
- Keywords: VERIFY, CAPTURE, SCREENSHOT, CALCULATE, REPORT, SAVE
- App launch details (package/activity for Android, bundle ID for iOS)
- Environment variable references (`{{ENV.VARIABLE}}`)
- Tags (record for Generator — no action needed)
- DATASETS tables (execute only FIRST row)

### Step 2: Launch the App

Call `launch_app` with the appropriate platform and capabilities:
```
mcp__appium__launch_app(
  platform = "android" | "ios",
  appPath = value from ENV.APP_PATH (if installing fresh)
  appPackage / appActivity = from scenario or ENV vars (Android launch existing)
  bundleId = from scenario or ENV vars (iOS)
)
```

Take an initial screenshot after launch.

### Step 3: Execute Each Step

For each scenario step:

1. **Execute** the action using the appropriate Appium MCP tool:
   - Navigate / open screen → `launch_app` or `tap` a navigation element
   - Tap button/link → `tap`
   - Enter text → `type_text`
   - Swipe → `swipe`
   - Scroll to element → `scroll_to_element`
   - Press hardware key → `press_key`
   - Navigate back → `back`
   - Long-press → `long_press`

2. **After every action**, call `page_source` to capture the XML hierarchy of the resulting screen. This is CRITICAL — always get page source after each action.

3. **Record** for every element you interact with (from `page_source` XML):
   - Element class (e.g., `android.widget.Button`, `XCUIElementTypeTextField`)
   - `content-desc` / accessibility label
   - `resource-id` (Android) or `name` (iOS)
   - `text` attribute
   - `enabled`, `clickable`, `checked` states
   - Which screen/activity this element is on

4. **Handle keywords:**
   - VERIFY: Call `is_displayed` or `get_text`/`get_attribute`, log pass/fail
   - CAPTURE: Call `get_text` or `get_attribute`, record with `{{variableName}}`
   - SCREENSHOT: Call `screenshot`, note filename
   - CALCULATE: Perform the math, record result
   - REPORT: Note the value for test output

5. **Log** pass/fail for each step

### Step 4: Record ALL Elements Per Screen

On each screen visited, record ALL interactive elements from `page_source` — not just the ones used in the scenario. Parse the XML to find:
- All `android.widget.Button`, `android.widget.EditText`, `android.widget.TextView` (Android)
- All `XCUIElementTypeButton`, `XCUIElementTypeTextField`, `XCUIElementTypeStaticText` (iOS)
- Any element with `clickable="true"` (Android) or `traits` (iOS)

This gives the Generator comprehensive element data for building locator JSONs.

### Step 5: Identify Screens

For each distinct UI state encountered, record the screen name:
- **Android**: read the current activity from page source root `package` attribute, or derive from the screen's primary heading element
- **iOS**: derive from the root accessibility container or heading

Name screens descriptively: `LoginScreen`, `HomeScreen`, `ProductDetailScreen`, etc.

### Step 6: Handle Environment Variables

If a step references `{{ENV.VARIABLE_NAME}}`, look for the actual value in the `.env` file.

### Step 7: Close the App

After all steps are complete, call `close_app`.

## Output Format

```markdown
# Analyst Report — Mobile
**Scenario:** [scenario name]
**Platform:** [android | ios]
**Device:** [device name / emulator serial]
**App:** [package name or bundle ID]
**Date:** [today]
**Time:** [HH:MM UTC]
**Result:** [PASSED/FAILED] ([X/Y steps passed])

## App Details
- **Platform:** android | ios
- **Package / Bundle ID:** [value]
- **Entry Activity (Android):** [value]
- **App Version:** [value if discoverable]

## Screen Map
### Screen: [ScreenName] — [Activity/ViewController]
| Element | Class | AccessibilityId / content-desc | ResourceId / name | Text | Clickable |
|---------|-------|-------------------------------|-------------------|------|-----------|
| ...     | ...   | ...                           | ...               | ...  | yes/no    |

(repeat for each screen visited)

## Captured Values
| Variable | Value | Source Element |
|----------|-------|----------------|
| {{price}} | $9.99 | product_price TextView |

## Step Results
### Scenario: [name]
**Tags:** [tags if present]
1. [pass/fail] [Step] — [element used] — [notes]
2. [pass/fail] VERIFY: [condition] — [result]
3. [pass/fail] CAPTURE: {{variableName}} = [value]
4. SCREENSHOT: [filename]

## Screenshots Captured (if any SCREENSHOT steps)
1. **[filename].png** — [description]

## Calculations Summary (if any CALCULATE steps)
- **[Variable]:** [value1] [operator] [value2] = [result] [✓/✗]

## Data Sets (if present)
The scenario contains DATASETS with [N] rows. Only row 1 was executed.

## Issues Found
- [failures, unexpected behavior, missing elements, timing issues]

## Notes for Generator Agent
- [Which locator strategies are most reliable for this app (accessibility_id vs resource-id vs xpath)]
- [Any dynamic element IDs or text that will need xpath fallback]
- [Screen transition timing observations — which transitions need waitForElement]
- [Keyboard dismissal requirements — which screens auto-dismiss vs need manual back]
- [Any permission dialogs that appeared and how they were handled]
- [Scroll requirements — which screens need scrollToElement before interaction]
```

## Output Path
- With folder: `output/{folder}/analyst-report-{scenario}.md`
- Without folder: `output/analyst-report-{scenario}.md`

## Critical Reminders
- Call `page_source` BEFORE and AFTER every interaction — mobile UIs change dramatically on each action
- Record ALL interactive elements per screen, not just the ones in the scenario steps
- Prefer `accessibility_id` (content-desc/accessibility label) over resource-id over xpath when noting element identifiers — Generator will use this priority order
- Note any elements with dynamic IDs (e.g., auto-generated IDs like `com.example:id/view_123`) — these need xpath fallback
- For DATASETS, execute only the first row but document ALL rows in the report
- If the app crashes or the session drops, note the exact step and error — this is important diagnostic information for the Generator's healer
- Take a screenshot at the START and END of each scenario, and after every SCREENSHOT keyword
