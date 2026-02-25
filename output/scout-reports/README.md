# Scout Agent v4 — DOM Reconnaissance

> Scan application pages, detect UI component libraries, map selectors with interaction patterns, and produce a machine-readable inventory for Generator and Healer agents.

## What It Does

The Scout Agent opens your application in a real browser and scans the DOM to identify every interactive element, which UI component library it belongs to, how to select it, and how to interact with it. The output report is consumed by the Generator (for accurate locators) and Healer (for diagnosing selector failures).

**Scout is NOT part of the test pipeline.** It runs once per application (or when the UI changes significantly) and produces a static report. The orchestrator does not call Scout — you run it manually before starting the pipeline.

## Capabilities

- **67 component patterns** across 7 UI libraries
- **Two-pass scanning:** Pass 1 reads DOM attributes (instant, no reflow). Pass 2 uses async Playwright `boundingBox()` checks (non-blocking). Browser stays responsive throughout.
- **Full iframe probing:** Navigates into iframes, runs DOM scan inside, reports separately, navigates back to parent page
- **Hit-area mismatch detection:** Flags custom components where the clickable target is smaller than the visual container
- **Noise filtering:** Skips hidden elements, tiny elements (<5px), duplicates, and decorative elements
- **Compact code-first output format:** One line per component, directly consumable by Generator

### Supported UI Libraries

| Library | Class Prefix | Patterns |
|---------|-------------|----------|
| Fluent UI v9 | `fui-` | Combobox, Dropdown, Dialog, DataGrid, Tab, Menu, Input, Checkbox, Switch, Button, Textarea, SpinButton, Slider |
| Fluent UI v8 | `ms-` | ComboBox, Dropdown, ContextualMenu, DetailsList, Panel, Modal/Dialog, Nav, Pivot, CommandBar, SearchBox, Toggle, Checkbox, DatePicker, Persona |
| Material UI (MUI) | `Mui` | Select, Autocomplete, Dialog, Drawer, DataGrid, Tab, TextField, Button, Chip |
| Ant Design | `ant-` | Select, Modal, Drawer, Table, Tree, Cascader, Tabs, Menu, Input, Button |
| PrimeNG / PrimeReact | `p-` | Dropdown, DataTable, Dialog, MultiSelect, AutoComplete, Calendar |
| Bootstrap | `btn-`, `form-` | Select, Input, Modal, Nav Tabs, Form Controls |
| Kendo UI | `k-` | Dropdown, ComboBox, Grid, Dialog, DatePicker, Window |

### Selector Priority Chain

```
data-testid → data-automation-id → id → role+aria-label → component class → tag
```

Each element gets a primary selector plus up to 3 fallbacks.

## How to Use

### Terminal Setup

**Terminal 1** — Start the Scout browser session:
```powershell
npx playwright test tests/web/scout-agent-v4.spec.ts --project=chrome --headed --reporter=list
```

**Terminal 2** — Start the remote control:
```powershell
node remote-control.js
```

### Controls

| Key | Action |
|-----|--------|
| **S** | Scan current page (instant) |
| **T** | Scan in 5 seconds (for tooltips — gives you time to hover) |
| **D** | Done — generate report and close browser |

Keys are case-insensitive. No Enter key needed.

### Workflow

1. The browser opens to the configured `startUrl`
2. Navigate to a page you want to scan (login, click through menus, etc.)
3. When the page is ready, click Terminal 2 and press **S**
4. The scan runs instantly — check Terminal 1 for element count
5. Navigate to the next page, press **S** again
6. For tooltips or hover menus: press **T**, go hover over the element, scan fires after 5 seconds
7. When all pages are scanned, press **D** to generate the report

### Configuration

Edit `scout-agent-v4.spec.ts` line 38 to change the start URL:

```typescript
const CFG = {
  startUrl: 'https://your-app-url.com',  // ← Change this
  ...
};
```

## Output Format

The report is saved to `scout-reports/page-inventory-latest.md`:

```
# Scout Report — DOM Intelligence
Generated: 2026-02-25T10:30:00Z

## Page: Login — https://app.example.com/login

LIBRARY: Microsoft Fluent UI v8
ELEMENTS_FOUND: 12

COMPONENT: Fluent UI SearchBox | SELECTOR: #SearchBox1 | METHOD: fill | FALLBACKS: input.ms-SearchBox-field, [role="searchbox"]
COMPONENT: Fluent UI ComboBox | SELECTOR: #ComboBox21wrapper | METHOD: fluentComboBoxSelect | FALLBACKS: [role="combobox"], .ms-ComboBox
  INTERACTION: Click button.ms-ComboBox-CaretDown-button → wait .ms-Callout [role="option"] → click option
COMPONENT: Fluent UI DetailsList | SELECTOR: .ms-DetailsList | METHOD: fluentGridClick | FALLBACKS: [role="grid"]
  INTERACTION: Rows: [role="row"], cells: [role="gridcell"]

WARNINGS:
- HIT-AREA MISMATCH: ComboBox — Inner button 24x24px inside 200x32px container

IFRAMES: 1
- src: https://app.example.com/embedded-form | id: form-iframe

## Page: Login → iframe: form-iframe — https://app.example.com/embedded-form

LIBRARY: Native HTML / Unknown
ELEMENTS_FOUND: 5
...
```

## How Other Agents Use the Scout Report

**Generator** reads `scout-reports/page-inventory-latest.md` to:
- Use Scout-discovered selectors instead of analyst-guessed selectors in locator JSONs
- Apply correct multi-step interaction patterns for custom components (e.g., Fluent UI ComboBox open → wait → click sequence)
- Add `{ force: true }` for elements with hit-area mismatches

**Healer** checks the Scout report when diagnosing Category C (Wrong Selector) failures:
- Looks up the failing element in the Scout report for the correct selector
- If Scout shows it's a custom component, fixes the interaction pattern (not just the selector)

**base-page.ts** contains pre-built methods (`fluentComboBoxSelect()`, `muiSelectOption()`, etc.) that match the component types and methods Scout identifies.

## Adding Custom Component Libraries

If your application uses an in-house component library, add detection patterns to `scout-agent-v4.spec.ts`:

1. Add library prefix to `LIBS` array:
   ```typescript
   { name: 'MyCompany UI', ids: [/^myco-/], comps: [
     { cp: /myco-DatePicker/, type: 'MyCompany DatePicker', cat: 'input',
       method: 'fill', interaction: 'Click input → wait popup → select date' },
   ]}
   ```

2. The Scout will detect elements with `myco-` class prefix and report them with your custom interaction patterns.

## Architecture

### Two-Pass Scanner (No Browser Freeze)

**Pass 1 (synchronous, ~50ms):** Runs inside `page.evaluate()`. Reads only DOM attributes — tag, classes, role, ARIA, text, data attributes. No `getComputedStyle()`, no `getBoundingClientRect()`. Browser UI thread is never blocked.

**Pass 2 (asynchronous, ~2-3s for 70 elements):** For each element from Pass 1, uses Playwright's async `locator().boundingBox({ timeout: 300 })` via CDP. Browser stays fully interactive. Elements that aren't visible or don't match are filtered out.

### Communication Model

Terminal 1 (Scout) and Terminal 2 (Remote Control) communicate through the file system:

```
Terminal 2: Press S → creates scout-reports/SCAN file
Terminal 1: Polls every 500ms → finds SCAN file → runs scan → deletes SCAN file
Terminal 2: Press D → creates scout-reports/DONE file
Terminal 1: Polls → finds DONE file → generates report → closes browser
```

There is no direct connection between the two terminals.

## Files

| File | Location | Purpose |
|------|----------|---------|
| `scout-agent-v4.spec.ts` | `tests/web/` | Playwright test that runs the two-pass scanner |
| `remote-control.js` | Project root | CLI tool for triggering scans from Terminal 2 |
| `page-inventory-latest.md` | `scout-reports/` | Latest scan report (consumed by Generator/Healer) |
| `page-inventory-latest.json` | `scout-reports/` | Latest scan report (machine-readable) |
| `SCAN` | `scout-reports/` (temporary) | Trigger file created by remote control, deleted after scan |
| `DONE` | `scout-reports/` (temporary) | Stop file created by remote control to end session |

## Gitignore

Scout reports are application-specific and should not be committed to the template repo. Add to `.gitignore`:

```
scout-reports/*.md
scout-reports/*.json
scout-reports/SCAN
scout-reports/DONE
```

The `scout-reports/README.md` file (this file) should be committed.

## Limitations

- Scout reads the DOM at a point in time. If page content changes dynamically after an API call, wait for the content to load before pressing S.
- Scout cannot detect interaction behaviors that require runtime observation (e.g., double-click vs single-click). It reports the standard interaction pattern for each component type.
- Elements rendered by JavaScript after a long delay may be missed if you scan too quickly after page load. Wait 2-3 seconds after the page appears stable.
- Cross-origin iframes cannot be probed (reported as `IFRAME BLOCKED — cross-origin`).
