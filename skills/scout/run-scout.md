# Skill: Scout — DOM Reconnaissance

## What Scout Is

Scout is a standalone DOM reconnaissance tool. It opens a real browser, scans each page you navigate to, and produces a machine-readable inventory of every interactive element — including which UI component library it belongs to, the correct selector, and the exact interaction pattern needed to automate it.

**Scout is NOT a pipeline stage.** It runs once per application (or after significant UI changes) before starting the main pipeline. The Orchestrator never calls Scout — you run it manually.

## When to Use Scout

Run Scout before the pipeline when the application uses component libraries with non-standard interaction patterns:

| Library | Prefix | Examples |
|---------|--------|----------|
| Fluent UI v9 | `fui-` | Combobox, Dropdown, DataGrid, Dialog, Tab, Menu, SpinButton, Slider |
| Fluent UI v8 | `ms-` | ComboBox, Dropdown, DetailsList, Panel, Pivot, CommandBar, DatePicker |
| Material UI (MUI) | `Mui` | Select, Autocomplete, DataGrid, Drawer, Tab, TextField |
| Ant Design | `ant-` | Select, Modal, Drawer, Table, Tree, Cascader, Tabs, Menu |
| PrimeNG / PrimeReact | `p-` | Dropdown, DataTable, Dialog, MultiSelect, AutoComplete |
| Bootstrap | `btn-`, `form-` | Select, Modal, Nav Tabs, Input |
| Kendo UI | `k-` | Dropdown, ComboBox, Grid, Dialog, DatePicker |

For standard HTML applications (saucedemo, simple forms), the Analyst alone is sufficient — Scout is optional.

## Setup

### Step 1: Configure the Scout spec

Edit `output/tools/scout-agent-v4.spec.ts`, lines 36–44:

```typescript
const CFG = {
  startUrl: 'https://your-app-url.com',   // ← Target application URL
  scenarioName: 'your-scenario-name',      // ← Match your scenario filename exactly
  appFolder: 'your-folder',               // ← Match your folder param (blank if none)
  ...
};
```

`scenarioName` and `appFolder` must match your pipeline invocation parameters so the report path aligns with what Generator and Healer look up.

### Step 2: Open two terminals (both from `output/`)

**Terminal 1 — Start the browser session:**
```bash
cd output
npx playwright test tools/scout-agent-v4.spec.ts --project=chrome --headed --reporter=list
```

**Terminal 2 — Start the remote control:**
```bash
cd output
node tools/remote-control.js
```

## Running a Scan Session

1. Terminal 1 opens a browser at `startUrl`
2. Navigate to the page you want to scan (login if needed, click through to the target page)
3. When the page is ready, switch to Terminal 2 and press **S**
4. Scout scans instantly — Terminal 1 shows element count and library detected
5. Navigate to the next page, press **S** again
6. For tooltips or hover-triggered menus: press **T** (5-second delay), then hover over the element
7. Repeat for all pages in the scenario
8. Press **D** when done — Scout generates the report and closes the browser

### Remote Control Keys

| Key | Action |
|-----|--------|
| **S** | Scan current page (instant) |
| **T** | Scan in 5 seconds (hover first, then scan fires) |
| **D** | Done — generate report and close browser |

Keys are case-insensitive. No Enter key needed.

## Output

Reports are saved to `output/scout-reports/`:

```
With folder:    output/scout-reports/{folder}/{scenario}-page-inventory-latest.md
Without folder: output/scout-reports/{scenario}-page-inventory-latest.md
```

Report format:
```
## Page: Login — https://app.example.com/login

LIBRARY: Microsoft Fluent UI v8
ELEMENTS_FOUND: 12

COMPONENT: Fluent UI ComboBox | SELECTOR: #ComboBox1wrapper | METHOD: fluentComboBoxSelect | FALLBACKS: [role="combobox"], .ms-ComboBox
  INTERACTION: Click button.ms-ComboBox-CaretDown-button → wait .ms-Callout [role="option"] → click option
COMPONENT: Fluent UI DetailsList | SELECTOR: .ms-DetailsList | METHOD: fluentGridClick | FALLBACKS: [role="grid"]
  INTERACTION: Rows: [role="row"], cells: [role="gridcell"]

WARNINGS:
- HIT-AREA MISMATCH: ComboBox — Inner button 24x24px inside 200x32px container
```

## How the Pipeline Uses the Scout Report

**Generator (generate-locators):** If the Scout report exists, uses Scout-discovered selectors instead of analyst-inferred ones. Scout's selector priority chain (`data-testid → data-automation-id → id → role+aria-label → component class → tag`) produces more reliable primary selectors.

**Generator (generate-pages):** If the Scout report identifies a custom component (e.g., Fluent UI ComboBox), generates a multi-step interaction method in the page object using the Scout-reported METHOD and INTERACTION pattern — not a plain `click()`.

**Healer (diagnose-failure):** When a locator fails (Category B), checks the Scout report for the failing element. If found, uses Scout's selector and interaction pattern as the authoritative fix source.

## Notes

- Scout reads the DOM at the moment you press S. Wait for the page to fully load before scanning.
- Elements added by JavaScript after a long delay may be missed — wait 2–3 seconds after the page appears stable.
- Cross-origin iframes are reported as blocked and cannot be probed.
- Scout reports are gitignored — they are application-specific and should not be committed.
