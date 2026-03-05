# Skill: Generate Mobile Locators

## Purpose
Create mobile locator JSON files for each screen discovered in the analyst report. Every locator entry records multiple strategies (accessibility_id → id → xpath → uiautomator/class_chain) in priority order so the MobileLocatorLoader can fall back gracefully.

## Paths
- Output: `output/locators/mobile/{screen-name}.locators.json` (kebab-case)
- Source: Analyst report Screen Map

## Locator JSON Format

Each file is a flat map from element key (camelCase) to a strategy object:

```json
{
  "usernameField": {
    "accessibility_id": "test-Username",
    "id": "com.saucelabs.rdc:id/username",
    "xpath": "//android.widget.EditText[@content-desc='test-Username']",
    "description": "Username input field on Login screen"
  },
  "passwordField": {
    "accessibility_id": "test-Password",
    "id": "com.saucelabs.rdc:id/password",
    "xpath": "//android.widget.EditText[@content-desc='test-Password']"
  },
  "loginButton": {
    "accessibility_id": "test-LOGIN",
    "uiautomator": "new UiSelector().text(\"LOGIN\")",
    "class_chain": "**/XCUIElementTypeButton[`label == 'LOGIN'`]",
    "xpath": "//android.widget.Button[@content-desc='test-LOGIN']"
  }
}
```

### Strategy Selection Rules

**Include a strategy only when the analyst report provides reliable evidence for it:**

| Strategy | Include when | Example value |
|----------|-------------|---------------|
| `accessibility_id` | Element has stable `content-desc` (Android) or accessibility label (iOS) | `"test-Username"` |
| `id` | Element has a fully-qualified `resource-id` (Android: `package:id/name`) | `"com.saucelabs.rdc:id/username"` |
| `xpath` | Fallback — use when neither above is available; keep it as short and stable as possible | `"//android.widget.EditText[@text='Username']"` |
| `uiautomator` | Android-specific — for elements best found by UIAutomator2 selectors | `"new UiSelector().className(\"android.widget.Button\").text(\"Add\")"` |
| `class_chain` | iOS-specific — for elements best found by XCUITest class chain | `"**/XCUIElementTypeButton[\`label == 'Add'\`]"` |
| `predicate_string` | iOS-specific — predicate expressions | `"type == 'XCUIElementTypeButton' AND label == 'Add'"` |

**NEVER include:**
- Dynamic / auto-generated IDs (e.g., `com.example:id/view_1234` where the number changes)
- Index-based xpaths (`//android.widget.LinearLayout[3]/android.widget.Button[1]`) — fragile
- Fully-dynamic content-desc values that change with data

If an element only has a dynamic ID, use `xpath` with a stable attribute instead:
```json
{
  "submitButton": {
    "xpath": "//android.widget.Button[@text='Submit']"
  }
}
```

## Process

### Step 1: Parse Analyst Report Screen Map

For each screen in the Screen Map:
1. Create one JSON file: `output/locators/mobile/{screen-name}.locators.json`
2. Screen name → kebab-case file name: `LoginScreen` → `login-screen`

### Step 2: Map Elements to Keys

For each element in the screen:
1. Create a camelCase key reflecting the element's purpose (not its class/ID):
   - `usernameField`, `loginButton`, `errorMessage`, `productTitle`
   - NOT `editText1`, `button_login`, `tvTitle`
2. Populate strategies from the analyst report's element table

### Step 3: Write the JSON File

Write the completed map to `output/locators/mobile/{screen-name}.locators.json`.

### Step 4: Create Screen-Name Mapping

After creating all locator files, output a summary table for use by the Generator skills:

```
LoginScreen      → login-screen.locators.json
HomeScreen       → home-screen.locators.json
ProductScreen    → product-screen.locators.json
```

## Naming Conventions

| Screen Object name | JSON file name |
|---|---|
| `LoginScreen` | `login-screen.locators.json` |
| `HomeScreen` | `home-screen.locators.json` |
| `CheckoutStepOneScreen` | `checkout-step-one-screen.locators.json` |

## Quality Checks
- [ ] One JSON file per screen identified in analyst report
- [ ] Every element used in scenario steps has a key
- [ ] Every key has at least one reliable strategy
- [ ] No index-based xpaths
- [ ] No auto-generated dynamic IDs
- [ ] camelCase keys, kebab-case file names
- [ ] `accessibility_id` listed before `id` before `xpath` in each entry (for readability)
