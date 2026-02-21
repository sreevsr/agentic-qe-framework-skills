# Scout Agent — DOM Reconnaissance for Test Automation

## What It Does

Scout Agent scans your web application's pages and produces a detailed inventory of every
interactive element — buttons, dropdowns, grids, panels, modals, navigation links, inputs,
and more. For each element, it identifies:

- **Which UI component library** it belongs to (Fluent UI, Material UI, Ant Design, PrimeNG, Bootstrap, Kendo UI, or native HTML)
- **What type of component** it is (ComboBox, DetailsList, Panel, Dialog, Nav, etc.)
- **The exact CSS selector** to target it in Playwright
- **The interaction pattern** — the specific sequence of actions needed to operate it (e.g., "click caret button → wait for callout → click option" for a Fluent UI ComboBox)
- **Automation risk level** — high/medium/low confidence in the selector's stability

The output is a `.md` report and a `.json` file that other agents (Generator, Healer) 
consume to produce accurate test automation code.

## Why It Exists

Modern enterprise applications use component libraries like Microsoft Fluent UI, 
Material UI, or Ant Design. These libraries render custom HTML structures that look 
nothing like standard HTML elements. A Fluent UI dropdown isn't a `<select>` tag — 
it's a `<div>` with nested `<button>`, `<input>`, and dynamically created `<div>` 
elements inside a callout overlay.

Without Scout, the AI-powered Generator agent has to guess how these components work. 
It often guesses wrong — clicking the input field instead of the caret button, waiting 
for `[role="option"]` when the menu uses `[role="menuitemcheckbox"]`, etc.

Scout eliminates the guessing by scanning the real DOM and reporting exactly what's there.

## How It Works — Architecture

Scout uses a **two-process architecture** with file-based communication:

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   Terminal 1             │         │   Terminal 2             │
│   Playwright Test        │         │   remote-control.js      │
│                          │         │                          │
│   scout-agent-v3.spec.ts │         │   Node.js CLI            │
│   - Opens Chrome browser │         │   - Reads keyboard input │
│   - Polls for trigger    │◄────────│   - Writes trigger file  │
│     file every 500ms     │  file   │     when you press S     │
│   - When trigger found:  │  I/O    │   - Writes stop file     │
│     1. Reads the DOM     │────────►│     when you press D     │
│     2. Detects libraries │         │                          │
│     3. Maps components   │         │                          │
│     4. Writes report     │         │                          │
│   - Deletes trigger file │         │                          │
│   - Resumes polling      │         │                          │
└─────────────────────────┘         └─────────────────────────┘
         │                                      │
         │  Both processes read/write to:        │
         │                                      │
         ▼                                      ▼
   ┌──────────────────────────────────────────────┐
   │  File System (your project folder)            │
   │                                               │
   │  .scout-trigger   ← created by remote-control │
   │                   ← deleted by scout after scan│
   │                                               │
   │  .scout-stop      ← created by remote-control │
   │                   ← read by scout to exit      │
   │                                               │
   │  scout-reports/                               │
   │    page-inventory-latest.md  ← written by scout│
   │    page-inventory-latest.json                  │
   └──────────────────────────────────────────────┘
```

### The File-Trigger Mechanism (how Terminal 2 "hooks" into the browser)

This is the key question: **how does a command in Terminal 2 control a browser 
running in Terminal 1?**

The answer: **they don't communicate directly.** There is no network connection, 
no WebSocket, no IPC. Instead, they use the simplest possible inter-process 
communication — **file system polling**.

Here's the exact sequence when you press `S`:

1. **You press `S` in Terminal 2** (`remote-control.js`)
2. `remote-control.js` creates a tiny file called `.scout-trigger` in the project root
3. Meanwhile, in Terminal 1, the Playwright test is running an infinite loop:
   ```typescript
   while (true) {
     // Check every 500ms if the trigger file exists
     if (fs.existsSync('.scout-trigger')) {
       // Trigger found! Run the scan
       const results = await scanPage(page);
       // Delete the trigger file so we don't scan again
       fs.unlinkSync('.scout-trigger');
       // Append results to the report
       appendToReport(results);
     }
     // Check if stop file exists (user pressed D)
     if (fs.existsSync('.scout-stop')) {
       break; // Exit the loop, end the test
     }
     await page.waitForTimeout(500); // Wait 500ms, check again
   }
   ```
4. The Playwright test detects `.scout-trigger`, runs the DOM scan, deletes the file
5. The scan results are appended to `scout-reports/page-inventory-latest.md`
6. The test resumes polling, waiting for the next `S` press

When you press `D`:

1. `remote-control.js` creates `.scout-stop`
2. The Playwright test detects it, breaks out of the loop
3. The test writes the final report and exits cleanly

**Why file-based and not WebSockets or HTTP?**

- Zero dependencies — no server to set up, no ports to configure
- Works behind corporate firewalls and proxies
- Works on Windows, Mac, and Linux identically
- Playwright tests can't easily run an HTTP server alongside the browser
- File polling at 500ms intervals is fast enough for manual scanning (you're navigating pages by hand)

### The DOM Scan — What Happens When You Press S

When the trigger file is detected, Scout performs a **two-pass scan**:

**Pass 1 — Interactive Elements:**
Scout queries the DOM for 50+ CSS selectors covering all supported libraries:
```
button, a[href], input, select, textarea,
[role="button"], [role="combobox"], [role="listbox"],
[class*="ms-ComboBox"], [class*="ms-Dropdown"], [class*="ms-Panel"],
[class*="Mui"], [class*="ant-select"], [class*="p-dropdown"],
[class*="k-dropdown"], [data-testid], [aria-haspopup], ...
```

For each element found, it extracts:
- Tag name, ID, classes, ARIA role, ARIA label
- `data-testid` and `data-automation-id` attributes
- Bounding box (position and size on screen)
- Visibility state
- `aria-haspopup` and `aria-expanded` attributes

**Pass 2 — Component Detection:**
For each element, Scout checks its CSS classes against known patterns:
- `ms-ComboBox` → Fluent UI ComboBox
- `ms-DetailsList` → Fluent UI DetailsList
- `MuiSelect` → Material UI Select
- `ant-select` → Ant Design Select
- `p-dropdown` → PrimeNG Dropdown
- `k-dropdown` → Kendo UI Dropdown
- etc.

Each detection includes the **interaction pattern** — the exact steps needed 
to operate that component in Playwright.

**Noise Filtering:**
Scout filters out invisible elements, elements smaller than 10x10 pixels, 
duplicate elements (same selector appearing multiple times), and non-interactive 
decorative elements.

**Hit-Area Mismatch Detection:**
Scout checks if a clickable element's visual size matches its actual click target. 
If the visible area is much smaller than the bounding box (common with Fluent UI 
ComboBox where the caret button is tiny), it flags a `HIT-AREA MISMATCH` warning 
in the report.

## Supported UI Component Libraries

| Library | Class Prefix | Components Detected |
|---------|-------------|-------------------|
| Microsoft Fluent UI | `ms-` | ComboBox, Dropdown, ContextualMenu, DetailsList, Panel, Modal/Dialog, Nav, Pivot, CommandBar, SearchBox, Toggle, Checkbox |
| Material UI (MUI) | `Mui` | Select, Autocomplete, Dialog, Drawer, TextField, Button |
| Ant Design | `ant-` | Select, Modal, Drawer, Table, Menu, Tabs, Button, Input |
| PrimeNG / PrimeReact | `p-` | Dropdown, DataTable, Dialog, Button |
| Bootstrap | `btn-`, `form-`, `modal-`, `nav-` | Dropdown, Modal, Form controls, Nav tabs |
| Kendo UI | `k-` | Dropdown, ComboBox, Grid, Dialog, Button |
| Native HTML | — | `<select>`, `<input>`, `<button>`, `<a>` |

## Output Files

### page-inventory-latest.md

Human-readable report. Each scan produces a section like:

```markdown
## Scan 1 — Dashboard Page
**URL:** https://app.example.com/dashboard
**Timestamp:** 2026-02-21T10:30:00Z
**Library Detected:** Microsoft Fluent UI

### Interactive Elements

| # | Component Type | Selector | Label/Text | Interaction Pattern | Confidence |
|---|---------------|----------|-----------|-------------------|------------|
| 1 | Fluent UI ComboBox | #ComboBox21wrapper | Branch | Click caret → wait callout → click option | high |
| 2 | Fluent UI DetailsList | div.ms-DetailsList | Employee Grid | Rows: [role="row"], click to select | high |
| 3 | Fluent UI Panel | div.ms-Panel | Employee Detail | Wait for .ms-Panel, close via button | high |

### Warnings
- HIT-AREA MISMATCH: ComboBox #ComboBox21wrapper — caret button is 32x32px inside 300x32px container
```

### page-inventory-latest.json

Machine-readable version. Same data in JSON format for programmatic consumption 
by Generator and Healer agents.

## Usage

### Prerequisites

- Node.js 18+
- Playwright installed (`npm install`)
- Chrome browser installed

### Step 1: Configure the Scout

Edit `tests/web/scout-agent-v3.spec.ts`, line ~46:

```typescript
const SCOUT_CONFIG = {
  startUrl: 'https://your-app-url.com',  // ← Change this
  outputDir: './scout-reports',
};
```

If your app requires login, the Scout opens a real Chrome browser with your 
existing session cookies. Log in manually before running, or configure `storageState` 
in `playwright.config.ts`.

### Step 2: Run the Scout

Open **two terminals** in your project root:

**Terminal 1 — Start the Scout:**
```powershell
npx playwright test tests/web/scout-agent-v3.spec.ts --project=chrome --headed
```

This opens Chrome and navigates to your start URL. The browser stays open, 
waiting for your commands.

**Terminal 2 — Start Remote Control:**
```powershell
node remote-control.js
```

You'll see:
```
Scout Remote Control
  Press S to scan current page
  Press D to finish and generate report
```

### Step 3: Scan Pages

1. In the browser (Terminal 1), navigate to the page you want to scan
2. In Terminal 2, press `S`
3. You'll see: `Scan triggered — scanning...` followed by `Scan complete. X elements found.`
4. Navigate to the next page in the browser
5. Press `S` again
6. Repeat for all pages you want to map

### Step 4: Finish

Press `D` in Terminal 2. The Scout writes the final report and exits.

### Step 5: Review Output

```powershell
cat scout-reports/page-inventory-latest.md
```

Review the report. The Generator and Healer agents will read this file 
automatically when generating test code (if configured in their prompts).

## Tips

- **Scan pages in the order your test scenario visits them.** This makes the 
  report easier to follow.
- **If a page has tabs or expandable sections**, expand them before pressing S. 
  Scout only sees what's currently in the DOM.
- **If a dropdown is complex**, open it manually before scanning. Scout will 
  capture the dropdown options and the callout overlay.
- **For apps behind SSO/MFA**, log in manually in the Scout's browser window 
  before starting scans.
- **Don't scan too many pages at once.** 3-5 pages per scenario is typical. 
  The report gets noisy with too many scans.

## Integration with Other Agents

The Scout report is consumed by:

- **Generator Agent** — reads `scout-reports/page-inventory-latest.md` to select 
  correct selectors and interaction patterns when generating page objects
- **Healer Agent** — checks the Scout report when diagnosing selector failures, 
  preferring Scout-discovered selectors over guessed ones
- **base-page.ts** — contains pre-built methods (`fluentComboBoxSelect()`, 
  `muiSelectOption()`, etc.) that match the component types Scout identifies

## Limitations

- Scout reads the DOM at a point in time. If the page content changes dynamically 
  (e.g., after an API call), you need to wait for the content to load before pressing S.
- Scout cannot detect interaction behaviors that require runtime observation 
  (e.g., "double-click to open" vs "single-click to open"). It reports the 
  component type and standard interaction pattern for that library.
- Scout does not scan inside iframes by default (it reports their presence but 
  doesn't enter them).
- Elements rendered by JavaScript after a long delay may be missed if you scan 
  too quickly after page load. Wait 2-3 seconds after the page appears stable.

## Files

| File | Location | Purpose |
|------|----------|---------|
| `scout-agent-v3.spec.ts` | `tests/web/` | The Playwright test that runs the scanner |
| `remote-control.js` | Project root | CLI tool for triggering scans from Terminal 2 |
| `page-inventory-latest.md` | `scout-reports/` | Latest scan report (human-readable) |
| `page-inventory-latest.json` | `scout-reports/` | Latest scan report (machine-readable) |
| `.scout-trigger` | Project root (temporary) | Trigger file created by remote-control, deleted after scan |
| `.scout-stop` | Project root (temporary) | Stop file created by remote-control to end the session |

> **Note:** Scout reports are generated per-project and contain app-specific DOM data.
> They should NOT be committed to Git. Only this README is committed.
> Add `scout-reports/*.md` and `scout-reports/*.json` to your `.gitignore`.
