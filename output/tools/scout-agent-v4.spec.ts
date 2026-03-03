/**
 * SCOUT AGENT v4 — DOM Reconnaissance with Full Library Detection
 * ================================================================
 *
 * YOU drive the browser. Scout scans when YOU say so.
 *
 * Capabilities:
 *   - 7 UI library families: Fluent UI v8 (ms-), Fluent UI v9 (fui-),
 *     MUI, Ant Design, PrimeNG, Bootstrap, Kendo UI + ARIA fallback
 *   - 40+ component patterns with interaction method mapping
 *   - Full iframe probing (navigates into iframes, scans DOM, returns)
 *   - Two-pass scanner (Pass 1: DOM attributes, Pass 2: async bounding boxes)
 *   - Hit-area mismatch detection
 *   - Noise filtering (hidden, tiny, duplicate, decorative)
 *   - Selector priority: data-testid → data-automation-id → id → role+aria → class → tag
 *   - Compact code-first output format (v4)
 *
 * How it works (run both from the output/ directory):
 *   Terminal 1: npx playwright test tools/scout-agent-v4.spec.ts --project=chrome --headed --reporter=list
 *   Terminal 2: node tools/remote-control.js
 *              Press S = scan current page | T = scan in 5s | D = done
 *
 * Output (scenario-scoped):
 *   scout-reports/[appFolder/]{scenarioName}-page-inventory-latest.md   (code-first format)
 *   scout-reports/[appFolder/]{scenarioName}-page-inventory-latest.json  (structured data)
 */

import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION — Edit startUrl for your target application
// ============================================================================

const CFG = {
  startUrl: 'https://react.fluentui.dev',  // ← CHANGE THIS per app
  scenarioName: '',   // ← CHANGE THIS to match your scenario filename (e.g., 'saucedemo-cart-feature')
  appFolder: '',      // ← CHANGE THIS to match your folder (e.g., 'saucedemo'). Leave blank if flat structure.
  outputDir: './scout-reports',
  pageLoadTimeout: 30000,
  pollInterval: 1000,
  sessionTimeout: 900000,   // 15 min max session
};

// Derive scoped output directory — mirrors scenario folder structure
const SCOUT_OUTPUT_DIR = CFG.appFolder
  ? path.join(CFG.outputDir, CFG.appFolder)
  : CFG.outputDir;

// Derive scoped file base name — one report per scenario
const SCOUT_FILE_BASE = CFG.scenarioName
  ? `${CFG.scenarioName}-page-inventory-latest`
  : 'page-inventory-latest';

const TRIGGER_DIR = CFG.outputDir;

// ============================================================================
// LIBRARY DETECTION PATTERNS
// ============================================================================

const LIB_PATTERNS: { prefix: RegExp; name: string }[] = [
  { prefix: /\bfui-/, name: 'Microsoft Fluent UI v9' },
  { prefix: /\bms-/, name: 'Microsoft Fluent UI v8' },
  { prefix: /\bMui/, name: 'Material UI (MUI)' },
  { prefix: /\bant-/, name: 'Ant Design' },
  { prefix: /\bp-(?:dropdown|button|datatable|dialog)/, name: 'PrimeNG / PrimeReact' },
  { prefix: /\b(?:btn-|form-control|form-select|modal-dialog|nav-tabs)/, name: 'Bootstrap' },
  { prefix: /\bk-(?:dropdown|grid|button|dialog|combobox)/, name: 'Kendo UI' },
];

function detectLib(classes: string[]): string {
  const classStr = classes.join(' ');
  for (const lib of LIB_PATTERNS) {
    if (lib.prefix.test(classStr)) return lib.name;
  }
  return 'Native HTML / Unknown';
}

// ============================================================================
// COMPONENT TYPE CLASSIFICATION (40+ patterns across 7 libraries)
// ============================================================================

interface ComponentDef {
  pattern: RegExp;
  type: string;
  category: string;
  method: string;
  interaction: string;
}

const COMPONENT_MAP: ComponentDef[] = [
  // ── Fluent UI v9 (fui- prefix, CSS-in-JS) ──
  { pattern: /fui-Combobox/, type: 'Fluent UI v9 Combobox', category: 'dropdown', method: 'fluentComboBoxSelect', interaction: 'Click chevron [role="button"] → wait [role="listbox"] → click [role="option"]' },
  { pattern: /fui-Dropdown/, type: 'Fluent UI v9 Dropdown', category: 'dropdown', method: 'fluentDropdownSelect', interaction: 'Click trigger → wait [role="listbox"] → click [role="option"]' },
  { pattern: /fui-Dialog/, type: 'Fluent UI v9 Dialog', category: 'modal', method: 'waitForDialog', interaction: 'Wait [role="dialog"] → close via button or Escape' },
  { pattern: /fui-DataGrid/, type: 'Fluent UI v9 DataGrid', category: 'grid', method: 'fluentGridClick', interaction: 'Rows: [role="row"], cells: [role="gridcell"]' },
  { pattern: /fui-Tab/, type: 'Fluent UI v9 Tab', category: 'tab', method: 'click', interaction: 'Click [role="tab"] matching name' },
  { pattern: /fui-Menu/, type: 'Fluent UI v9 Menu', category: 'navigation', method: 'click', interaction: 'Click [role="menuitem"] matching name' },
  { pattern: /fui-Input/, type: 'Fluent UI v9 Input', category: 'input', method: 'fill', interaction: 'Fill input element directly' },
  { pattern: /fui-Checkbox/, type: 'Fluent UI v9 Checkbox', category: 'input', method: 'click', interaction: 'Click [role="checkbox"]' },
  { pattern: /fui-Switch/, type: 'Fluent UI v9 Switch', category: 'input', method: 'click', interaction: 'Click [role="switch"]' },
  { pattern: /fui-Button/, type: 'Fluent UI v9 Button', category: 'button', method: 'click', interaction: 'Click button directly' },
  { pattern: /fui-Textarea/, type: 'Fluent UI v9 Textarea', category: 'input', method: 'fill', interaction: 'Fill textarea directly' },
  { pattern: /fui-SpinButton/, type: 'Fluent UI v9 SpinButton', category: 'input', method: 'fill', interaction: 'Fill input or click increment/decrement' },
  { pattern: /fui-Slider/, type: 'Fluent UI v9 Slider', category: 'input', method: 'click', interaction: 'Click [role="slider"] or drag' },

  // ── Fluent UI v8 (ms- prefix, legacy) ──
  { pattern: /ms-ComboBox(?!-option)/, type: 'Fluent UI ComboBox', category: 'dropdown', method: 'fluentComboBoxSelect', interaction: 'Click button.ms-ComboBox-CaretDown-button → wait .ms-Callout [role="option"] → click option' },
  { pattern: /ms-Dropdown/, type: 'Fluent UI Dropdown', category: 'dropdown', method: 'fluentDropdownSelect', interaction: 'Click div.ms-Dropdown → wait [role="listbox"] → click [role="option"]' },
  { pattern: /ms-ContextualMenu/, type: 'Fluent UI ContextualMenu', category: 'dropdown', method: 'fluentContextMenuSelect', interaction: 'Click trigger → wait [role="menu"] → getByRole("menuitem")' },
  { pattern: /ms-DetailsList/, type: 'Fluent UI DetailsList', category: 'grid', method: 'fluentGridClick', interaction: 'Rows: [role="row"], cells: [role="gridcell"]' },
  { pattern: /ms-Panel/, type: 'Fluent UI Panel', category: 'modal', method: 'waitForPanel', interaction: 'Wait .ms-Panel or [role="dialog"] → close: button[aria-label="Close"]' },
  { pattern: /ms-Modal|ms-Dialog/, type: 'Fluent UI Modal/Dialog', category: 'modal', method: 'waitForDialog', interaction: 'Wait [role="dialog"] → close: button[aria-label="Close"] or Escape' },
  { pattern: /ms-Nav\b/, type: 'Fluent UI Nav', category: 'navigation', method: 'click', interaction: 'Click a.ms-Nav-link:has-text("Link Name")' },
  { pattern: /ms-Pivot/, type: 'Fluent UI Pivot', category: 'tab', method: 'click', interaction: 'Click button.ms-Pivot-link:has-text("Tab Name")' },
  { pattern: /ms-CommandBar/, type: 'Fluent UI CommandBar', category: 'navigation', method: 'click', interaction: 'Click button.ms-CommandBarItem-link:has-text("Command")' },
  { pattern: /ms-SearchBox/, type: 'Fluent UI SearchBox', category: 'input', method: 'fill', interaction: 'Fill input.ms-SearchBox-field' },
  { pattern: /ms-TextField/, type: 'Fluent UI TextField', category: 'input', method: 'fill', interaction: 'Fill input.ms-TextField-field' },
  { pattern: /ms-Toggle/, type: 'Fluent UI Toggle', category: 'input', method: 'click', interaction: 'Click button.ms-Toggle-button' },
  { pattern: /ms-Checkbox/, type: 'Fluent UI Checkbox', category: 'input', method: 'click', interaction: 'Click input.ms-Checkbox-input or label.ms-Checkbox-label' },
  { pattern: /ms-Button/, type: 'Fluent UI Button', category: 'button', method: 'click', interaction: 'Click button.ms-Button' },
  { pattern: /ms-Callout/, type: 'Fluent UI Callout', category: 'modal', method: 'waitForDialog', interaction: 'Wait .ms-Callout → interact with contents' },
  { pattern: /ms-DatePicker/, type: 'Fluent UI DatePicker', category: 'input', method: 'fill', interaction: 'Fill input or click calendar icon → select date' },
  { pattern: /ms-Persona/, type: 'Fluent UI Persona', category: 'other', method: 'click', interaction: 'Click persona element' },

  // ── Material UI (MUI) ──
  { pattern: /MuiSelect/, type: 'MUI Select', category: 'dropdown', method: 'muiSelectOption', interaction: 'Click .MuiSelect-select → wait [role="listbox"] → click [role="option"]' },
  { pattern: /MuiAutocomplete/, type: 'MUI Autocomplete', category: 'dropdown', method: 'muiAutocompleteSelect', interaction: 'Fill input → wait .MuiAutocomplete-popper → click option' },
  { pattern: /MuiDialog/, type: 'MUI Dialog', category: 'modal', method: 'waitForDialog', interaction: 'Wait [role="dialog"] → close via button' },
  { pattern: /MuiDrawer/, type: 'MUI Drawer', category: 'modal', method: 'waitForPanel', interaction: 'Wait .MuiDrawer-root → close via button or backdrop' },
  { pattern: /MuiDataGrid/, type: 'MUI DataGrid', category: 'grid', method: 'click', interaction: 'Rows: .MuiDataGrid-row, cells: .MuiDataGrid-cell' },
  { pattern: /MuiTab\b/, type: 'MUI Tab', category: 'tab', method: 'click', interaction: 'Click [role="tab"] matching name' },
  { pattern: /MuiTextField/, type: 'MUI TextField', category: 'input', method: 'fill', interaction: 'Fill .MuiInputBase-input' },
  { pattern: /MuiButton/, type: 'MUI Button', category: 'button', method: 'click', interaction: 'Click .MuiButton-root' },
  { pattern: /MuiChip/, type: 'MUI Chip', category: 'other', method: 'click', interaction: 'Click .MuiChip-root or .MuiChip-deleteIcon' },

  // ── Ant Design ──
  { pattern: /ant-select/, type: 'Ant Design Select', category: 'dropdown', method: 'antSelectOption', interaction: 'Click .ant-select-selector → wait .ant-select-dropdown → click .ant-select-item' },
  { pattern: /ant-modal/, type: 'Ant Design Modal', category: 'modal', method: 'waitForDialog', interaction: 'Wait .ant-modal → close .ant-modal-close' },
  { pattern: /ant-drawer/, type: 'Ant Design Drawer', category: 'modal', method: 'waitForPanel', interaction: 'Wait .ant-drawer → close .ant-drawer-close' },
  { pattern: /ant-table/, type: 'Ant Design Table', category: 'grid', method: 'click', interaction: 'Rows: .ant-table-row, cells: .ant-table-cell' },
  { pattern: /ant-menu/, type: 'Ant Design Menu', category: 'navigation', method: 'click', interaction: 'Click .ant-menu-item:has-text("Item")' },
  { pattern: /ant-tabs/, type: 'Ant Design Tabs', category: 'tab', method: 'click', interaction: 'Click .ant-tabs-tab:has-text("Tab Name")' },
  { pattern: /ant-input/, type: 'Ant Design Input', category: 'input', method: 'fill', interaction: 'Fill .ant-input' },
  { pattern: /ant-btn/, type: 'Ant Design Button', category: 'button', method: 'click', interaction: 'Click .ant-btn' },
  { pattern: /ant-tree/, type: 'Ant Design Tree', category: 'navigation', method: 'click', interaction: 'Click .ant-tree-treenode' },
  { pattern: /ant-cascader/, type: 'Ant Design Cascader', category: 'dropdown', method: 'click', interaction: 'Click .ant-cascader-picker → select cascading options' },

  // ── PrimeNG / PrimeReact ──
  { pattern: /p-dropdown/, type: 'PrimeNG Dropdown', category: 'dropdown', method: 'primeDropdownSelect', interaction: 'Click .p-dropdown → wait .p-dropdown-panel → click .p-dropdown-item' },
  { pattern: /p-datatable/, type: 'PrimeNG DataTable', category: 'grid', method: 'click', interaction: 'Rows: .p-datatable-tbody tr' },
  { pattern: /p-dialog/, type: 'PrimeNG Dialog', category: 'modal', method: 'waitForDialog', interaction: 'Wait .p-dialog → close .p-dialog-header-close' },
  { pattern: /p-button/, type: 'PrimeNG Button', category: 'button', method: 'click', interaction: 'Click .p-button' },
  { pattern: /p-multiselect/, type: 'PrimeNG MultiSelect', category: 'dropdown', method: 'click', interaction: 'Click .p-multiselect → wait .p-multiselect-panel → click items' },
  { pattern: /p-autocomplete/, type: 'PrimeNG AutoComplete', category: 'dropdown', method: 'fill', interaction: 'Fill .p-autocomplete-input → wait .p-autocomplete-panel → click item' },

  // ── Bootstrap ──
  { pattern: /dropdown-toggle/, type: 'Bootstrap Dropdown', category: 'dropdown', method: 'click', interaction: 'Click .dropdown-toggle → wait .dropdown-menu.show → click .dropdown-item' },
  { pattern: /modal-dialog/, type: 'Bootstrap Modal', category: 'modal', method: 'waitForDialog', interaction: 'Wait .modal.show → close [data-bs-dismiss="modal"]' },
  { pattern: /nav-tabs/, type: 'Bootstrap Tabs', category: 'tab', method: 'click', interaction: 'Click .nav-link' },
  { pattern: /form-select/, type: 'Bootstrap Select', category: 'dropdown', method: 'selectOption', interaction: 'page.selectOption() — native select' },
  { pattern: /form-control/, type: 'Bootstrap Input', category: 'input', method: 'fill', interaction: 'Fill .form-control' },

  // ── Kendo UI ──
  { pattern: /k-combobox/, type: 'Kendo ComboBox', category: 'dropdown', method: 'kendoDropdownSelect', interaction: 'Click .k-combobox → wait .k-popup → click .k-list-item' },
  { pattern: /k-dropdown/, type: 'Kendo Dropdown', category: 'dropdown', method: 'kendoDropdownSelect', interaction: 'Click .k-dropdown → wait .k-popup → click .k-list-item' },
  { pattern: /k-grid/, type: 'Kendo Grid', category: 'grid', method: 'click', interaction: 'Rows: tr.k-master-row' },
  { pattern: /k-dialog|k-window/, type: 'Kendo Dialog', category: 'modal', method: 'waitForDialog', interaction: 'Wait .k-dialog → close .k-dialog-close' },
  { pattern: /k-button/, type: 'Kendo Button', category: 'button', method: 'click', interaction: 'Click .k-button' },
  { pattern: /k-datepicker/, type: 'Kendo DatePicker', category: 'input', method: 'fill', interaction: 'Fill .k-dateinput-wrap input or click .k-select → pick date' },
];

function detectComponent(el: { classes: string[]; tag: string; role: string | null }): { type: string; category: string; method: string; interaction: string | null } {
  const classStr = el.classes.join(' ');

  // Check component map first
  for (const comp of COMPONENT_MAP) {
    if (comp.pattern.test(classStr)) {
      return { type: comp.type, category: comp.category, method: comp.method, interaction: comp.interaction };
    }
  }

  // ARIA / semantic fallback
  if (el.role === 'combobox') return { type: 'ComboBox (generic)', category: 'dropdown', method: 'click', interaction: 'Click → wait options → select' };
  if (el.role === 'grid' || el.role === 'treegrid') return { type: 'Data Grid', category: 'grid', method: 'click', interaction: 'Rows: [role="row"]' };
  if (el.role === 'dialog' || el.role === 'alertdialog') return { type: 'Dialog', category: 'modal', method: 'waitForDialog', interaction: 'Wait [role="dialog"] → close via button or Escape' };
  if (el.role === 'tablist') return { type: 'Tab List', category: 'tab', method: 'click', interaction: 'Click [role="tab"]' };
  if (el.role === 'navigation') return { type: 'Navigation', category: 'navigation', method: 'click', interaction: 'Click links within nav' };
  if (el.role === 'menu' || el.role === 'menubar') return { type: 'Menu', category: 'navigation', method: 'click', interaction: 'Click [role="menuitem"]' };
  if (el.role === 'switch') return { type: 'Switch', category: 'input', method: 'click', interaction: 'Click [role="switch"]' };
  if (el.role === 'slider') return { type: 'Slider', category: 'input', method: 'click', interaction: 'Drag or click [role="slider"]' };
  if (el.tag === 'select') return { type: 'Native Select', category: 'dropdown', method: 'selectOption', interaction: 'page.selectOption()' };

  // Generic fallback
  if (el.tag === 'button' || el.role === 'button') return { type: 'Button', category: 'button', method: 'click', interaction: null };
  if (el.tag === 'input') return { type: 'Input', category: 'input', method: 'fill', interaction: null };
  if (el.tag === 'textarea') return { type: 'Textarea', category: 'input', method: 'fill', interaction: null };
  if (el.tag === 'a') return { type: 'Link', category: 'link', method: 'click', interaction: null };

  return { type: 'Unknown', category: 'other', method: 'click', interaction: null };
}

// ============================================================================
// SELECTOR GENERATION (priority chain with fallbacks)
// ============================================================================

function generateSelector(el: {
  dataTestId: string | null; dataAutomationId: string | null;
  id: string | null; role: string | null; ariaLabel: string | null;
  classes: string[]; tag: string;
}): string {
  if (el.dataTestId) return `[data-testid="${el.dataTestId}"]`;
  if (el.dataAutomationId) return `[data-automation-id="${el.dataAutomationId}"]`;
  if (el.id && !el.id.match(/^[0-9]/)) return `#${el.id}`;
  if (el.role && el.ariaLabel) return `[role="${el.role}"][aria-label="${el.ariaLabel}"]`;
  const compClass = el.classes.find(c => /^fui-|^ms-|^Mui|^ant-|^p-|^k-/.test(c) && !/--|__/.test(c));
  if (compClass) return `${el.tag}.${compClass}`;
  if (el.role) return `[role="${el.role}"]`;
  if (el.classes.length > 0) return `${el.tag}.${el.classes[0]}`;
  return el.tag;
}

function generateFallbacks(el: {
  dataTestId: string | null; dataAutomationId: string | null;
  id: string | null; role: string | null; ariaLabel: string | null;
  classes: string[]; tag: string; text: string;
}, primarySelector: string): string[] {
  const fallbacks: string[] = [];
  if (primarySelector !== `#${el.id}` && el.id && !el.id.match(/^[0-9]/)) fallbacks.push(`#${el.id}`);
  if (primarySelector !== `[data-testid="${el.dataTestId}"]` && el.dataTestId) fallbacks.push(`[data-testid="${el.dataTestId}"]`);
  if (el.role && el.ariaLabel && primarySelector !== `[role="${el.role}"][aria-label="${el.ariaLabel}"]`) fallbacks.push(`[role="${el.role}"][aria-label="${el.ariaLabel}"]`);
  if (el.text && el.tag) fallbacks.push(`${el.tag}:has-text("${el.text.substring(0, 40)}")`);
  return fallbacks.slice(0, 3);
}

// ============================================================================
// INTERACTIVE ELEMENT SELECTORS (what we scan for)
// ============================================================================

const INTERACTIVE_SELECTORS = [
  'button', 'a[href]', 'input', 'select', 'textarea',
  '[role="button"]', '[role="combobox"]', '[role="listbox"]',
  '[role="menu"]', '[role="menubar"]', '[role="menuitem"]',
  '[role="tab"]', '[role="tablist"]', '[role="grid"]', '[role="treegrid"]',
  '[role="dialog"]', '[role="alertdialog"]',
  '[role="navigation"]', '[role="search"]',
  '[role="switch"]', '[role="slider"]',
  // Fluent UI v9
  '[class*="fui-Combobox"]', '[class*="fui-Dropdown"]', '[class*="fui-Button"]',
  '[class*="fui-Input"]', '[class*="fui-Dialog"]', '[class*="fui-DataGrid"]',
  '[class*="fui-Tab"]', '[class*="fui-Menu"]', '[class*="fui-Checkbox"]',
  '[class*="fui-Switch"]', '[class*="fui-Textarea"]', '[class*="fui-SpinButton"]',
  '[class*="fui-Slider"]',
  // Fluent UI v8
  '[class*="ms-ComboBox"]', '[class*="ms-Dropdown"]',
  '[class*="ms-Button"]', '[class*="ms-TextField"]',
  '[class*="ms-DetailsList"]', '[class*="ms-Pivot"]',
  '[class*="ms-ContextualMenu"]', '[class*="ms-Nav"]',
  '[class*="ms-Modal"]', '[class*="ms-Dialog"]',
  '[class*="ms-Panel"]', '[class*="ms-CommandBar"]',
  '[class*="ms-SearchBox"]', '[class*="ms-Toggle"]',
  '[class*="ms-Checkbox"]', '[class*="ms-Callout"]',
  '[class*="ms-DatePicker"]', '[class*="ms-Persona"]',
  // MUI
  '[class*="Mui"]',
  // Ant Design
  '[class*="ant-select"]', '[class*="ant-btn"]', '[class*="ant-input"]',
  '[class*="ant-table"]', '[class*="ant-modal"]', '[class*="ant-drawer"]',
  '[class*="ant-menu"]', '[class*="ant-tabs"]', '[class*="ant-tree"]',
  '[class*="ant-cascader"]',
  // PrimeNG
  '[class*="p-dropdown"]', '[class*="p-button"]', '[class*="p-datatable"]',
  '[class*="p-dialog"]', '[class*="p-multiselect"]', '[class*="p-autocomplete"]',
  // Bootstrap
  '[class*="btn-"]', '.form-control', '.form-select', '.dropdown-toggle',
  '.modal-dialog', '.nav-tabs',
  // Kendo
  '[class*="k-dropdown"]', '[class*="k-grid"]', '[class*="k-button"]',
  '[class*="k-dialog"]', '[class*="k-combobox"]', '[class*="k-datepicker"]',
  // Generic
  '[onclick]', '[data-testid]', '[data-automation-id]',
  '[aria-haspopup]', '[aria-expanded]',
].join(',');

// ============================================================================
// TWO-PASS SCANNER
// Pass 1: page.evaluate() — reads DOM attributes only (instant, no reflow)
// Pass 2: Playwright locator().boundingBox() — async CDP (non-blocking)
// ============================================================================

interface RawElement {
  tag: string;
  classes: string[];
  id: string | null;
  role: string | null;
  ariaLabel: string | null;
  ariaHasPopup: string | null;
  dataTestId: string | null;
  dataAutomationId: string | null;
  text: string;
  isHidden: boolean;
  hasZeroSize: boolean;
}

interface IframeInfo {
  src: string;
  id: string | null;
  name: string | null;
}

async function scanPage(page: Page, scanName: string): Promise<any> {
  const url = page.url();
  const title = await page.title();

  // ── PASS 1: Extract raw DOM data (no layout calculations) ──
  const { rawElements, iframes } = await page.evaluate((selectors: string) => {
    const seen = new Set<Element>();
    const results: any[] = [];

    document.querySelectorAll(selectors).forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);

      const htmlEl = el as HTMLElement;
      const style = htmlEl.style;
      const isHidden = style.display === 'none' || style.visibility === 'hidden' ||
                       htmlEl.hidden || htmlEl.getAttribute('aria-hidden') === 'true';
      // Quick size check via offset (no reflow in most browsers)
      const hasZeroSize = htmlEl.offsetWidth < 5 && htmlEl.offsetHeight < 5;

      results.push({
        tag: htmlEl.tagName.toLowerCase(),
        classes: Array.from(htmlEl.classList),
        id: htmlEl.id || null,
        role: htmlEl.getAttribute('role'),
        ariaLabel: htmlEl.getAttribute('aria-label'),
        ariaHasPopup: htmlEl.getAttribute('aria-haspopup'),
        dataTestId: htmlEl.getAttribute('data-testid'),
        dataAutomationId: htmlEl.getAttribute('data-automation-id'),
        text: (htmlEl.textContent || '').trim().substring(0, 60),
        isHidden,
        hasZeroSize,
      });
    });

    const iframeData = Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src || '', id: f.id || null, name: f.name || null,
    }));

    return { rawElements: results, iframes: iframeData };
  }, INTERACTIVE_SELECTORS);

  // ── NOISE FILTER: Remove hidden, tiny, duplicates ──
  const seen = new Set<string>();
  const filtered: RawElement[] = [];
  for (const el of rawElements) {
    if (el.isHidden || el.hasZeroSize) continue;
    // Dedup by selector + text
    const key = `${el.tag}|${el.classes.join(',')}|${el.role}|${el.text.substring(0, 20)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    filtered.push(el);
  }

  // ── PASS 2: Async bounding box checks via Playwright (non-blocking) ──
  const elements: any[] = [];
  for (const el of filtered) {
    const lib = detectLib(el.classes);
    const comp = detectComponent(el);
    const selector = generateSelector(el);
    const fallbacks = generateFallbacks(el, selector);

    // Async bounding box check
    let boundingBox = null;
    let hitAreaWarning: string | null = null;
    try {
      const loc = page.locator(selector).first();
      const box = await loc.boundingBox({ timeout: 300 });
      if (box && box.width > 0 && box.height > 0) {
        boundingBox = {
          x: Math.round(box.x), y: Math.round(box.y),
          width: Math.round(box.width), height: Math.round(box.height),
        };
      } else {
        continue; // Not visible, skip
      }
    } catch {
      continue; // Element not found or timeout, skip
    }

    // ── HIT-AREA MISMATCH DETECTION ──
    if (el.ariaHasPopup || el.role === 'combobox') {
      try {
        const innerBtnLoc = page.locator(selector).first().locator('button, [role="button"]').first();
        const innerBox = await innerBtnLoc.boundingBox({ timeout: 200 });
        if (innerBox && boundingBox && innerBox.width < boundingBox.width * 0.3) {
          hitAreaWarning = `Inner button ${Math.round(innerBox.width)}x${Math.round(innerBox.height)}px inside ${boundingBox.width}x${boundingBox.height}px container`;
        }
      } catch { /* no inner button, fine */ }
    }

    elements.push({
      ...el,
      componentLibrary: lib,
      componentType: comp.type,
      category: comp.category,
      method: comp.method,
      interaction: comp.interaction,
      selector,
      fallbacks,
      boundingBox,
      hitAreaWarning,
    });
  }

  const libraries = [...new Set(elements.map(e => e.componentLibrary).filter(l => l !== 'Native HTML / Unknown'))];

  return {
    pageName: scanName,
    url,
    title,
    elements,
    iframes,
    libraries,
    isIframe: false,
    parentPage: null,
  };
}

// ============================================================================
// IFRAME PROBING — Navigate into iframes and scan DOM inside them
// ============================================================================

async function probeIframes(page: Page, parentScan: any): Promise<any[]> {
  const iframeScans: any[] = [];

  for (const iframe of parentScan.iframes) {
    if (!iframe.src || iframe.src === '' || iframe.src === 'about:blank' ||
        iframe.src.startsWith('javascript:')) continue;

    const iframeName = iframe.id || iframe.name || iframe.src.split('/').pop()?.split('?')[0] || 'unnamed';
    console.log(`    🔲 Probing iframe: ${iframeName} (${iframe.src.substring(0, 80)})`);

    try {
      // Save current URL to navigate back
      const parentUrl = page.url();

      // Navigate into the iframe
      await page.goto(iframe.src, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

      // Scan inside the iframe
      const iframeScan = await scanPage(page, `${parentScan.pageName} → iframe: ${iframeName}`);
      iframeScan.isIframe = true;
      iframeScan.parentPage = parentScan.pageName;
      iframeScans.push(iframeScan);

      // Navigate back to parent page
      await page.goto(parentUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

    } catch (err) {
      console.log(`    ⚠️ IFRAME BLOCKED — cross-origin or timeout: ${iframe.src}`);
      iframeScans.push({
        pageName: `${parentScan.pageName} → iframe: ${iframeName}`,
        url: iframe.src,
        title: '',
        elements: [],
        iframes: [],
        libraries: [],
        isIframe: true,
        parentPage: parentScan.pageName,
        error: `IFRAME BLOCKED — ${err instanceof Error ? err.message : 'cross-origin or timeout'}`,
      });
    }
  }

  return iframeScans;
}

// ============================================================================
// FILE-TRIGGER HELPERS (works with remote-control.js)
// ============================================================================

function deleteTrigger(filePath: string): void {
  try { fs.unlinkSync(filePath); } catch { /* doesn't exist, fine */ }
}

function checkTrigger(dir: string, name: string): string | null {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.toLowerCase() === name.toLowerCase()) {
        const fullPath = path.join(dir, f);
        const content = fs.readFileSync(fullPath, 'utf-8').trim();
        fs.unlinkSync(fullPath);
        return content || name;
      }
    }
  } catch { /* dir doesn't exist yet */ }
  return null;
}

async function waitForTrigger(pollMs: number): Promise<{ type: 'scan' | 'done'; name: string }> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const done = checkTrigger(TRIGGER_DIR, 'DONE');
      if (done) { clearInterval(interval); resolve({ type: 'done', name: 'done' }); return; }

      const scan = checkTrigger(TRIGGER_DIR, 'SCAN');
      if (scan) { clearInterval(interval); resolve({ type: 'scan', name: scan }); return; }
    }, pollMs);
  });
}

// ============================================================================
// REPORT GENERATOR — Compact Code-First Format (v4)
// ============================================================================

function generateReport(scans: any[]): string {
  const timestamp = new Date().toISOString();
  let r = `# Scout Report — DOM Intelligence\n`;
  r += `Generated: ${timestamp}\n`;
  r += `Scans: ${scans.length}\n\n`;

  for (const scan of scans) {
    if (scan.isIframe) {
      r += `## Page: ${scan.pageName} — ${scan.url}\n\n`;
    } else {
      r += `## Page: ${scan.pageName} — ${scan.url}\n\n`;
    }

    if (scan.error) {
      r += `${scan.error}\n\n`;
      continue;
    }

    const libs = scan.libraries.length > 0 ? scan.libraries.join(', ') : 'Native HTML / Unknown';
    r += `LIBRARY: ${libs}\n`;
    r += `ELEMENTS_FOUND: ${scan.elements.length}\n\n`;

    // ── Component lines (code-first format) ──
    // Skip generic buttons/links without library classes to keep report compact
    const meaningful = scan.elements.filter((e: any) =>
      e.componentLibrary !== 'Native HTML / Unknown' ||
      e.category === 'dropdown' || e.category === 'modal' ||
      e.category === 'grid' || e.category === 'tab' ||
      e.dataTestId || e.dataAutomationId
    );

    for (const el of meaningful) {
      const fb = el.fallbacks.length > 0 ? ` | FALLBACKS: ${el.fallbacks.join(', ')}` : '';
      r += `COMPONENT: ${el.componentType} | SELECTOR: ${el.selector} | METHOD: ${el.method}${fb}\n`;
      if (el.interaction) {
        r += `  INTERACTION: ${el.interaction}\n`;
      }
      if (el.hitAreaWarning) {
        r += `  ⚠️ HIT-AREA MISMATCH: ${el.hitAreaWarning}\n`;
      }
    }

    // ── Generic elements with data-testid (always include) ──
    const genericWithTestId = scan.elements.filter((e: any) =>
      e.componentLibrary === 'Native HTML / Unknown' &&
      !['dropdown', 'modal', 'grid', 'tab'].includes(e.category) &&
      (e.dataTestId || e.dataAutomationId)
    );
    if (genericWithTestId.length > 0 && meaningful.length > 0) {
      r += `\n`;
      for (const el of genericWithTestId) {
        const fb = el.fallbacks.length > 0 ? ` | FALLBACKS: ${el.fallbacks.join(', ')}` : '';
        r += `COMPONENT: ${el.componentType} | SELECTOR: ${el.selector} | METHOD: ${el.method}${fb}\n`;
      }
    }

    // ── Warnings ──
    const warnings = scan.elements.filter((e: any) => e.hitAreaWarning);
    if (warnings.length > 0) {
      r += `\nWARNINGS:\n`;
      for (const w of warnings) {
        r += `- HIT-AREA MISMATCH: ${w.componentType} "${w.text || w.ariaLabel || w.selector}" — ${w.hitAreaWarning}\n`;
      }
    }

    // ── Iframes ──
    if (scan.iframes && scan.iframes.length > 0) {
      r += `\nIFRAMES: ${scan.iframes.length}\n`;
      for (const f of scan.iframes) {
        r += `- src: ${f.src || 'about:blank'} | id: ${f.id || 'none'}\n`;
      }
    }

    r += `\n---\n\n`;
  }

  // ── Summary table ──
  r += `## Summary\n\n`;
  r += `| Page | Library | Elements | Dropdowns | Modals | Grids | Iframes |\n`;
  r += `|------|---------|----------|-----------|--------|-------|---------|\n`;
  for (const scan of scans) {
    if (scan.error) {
      r += `| ${scan.pageName} | ERROR | — | — | — | — | — |\n`;
      continue;
    }
    const dd = scan.elements.filter((e: any) => e.category === 'dropdown').length;
    const md = scan.elements.filter((e: any) => e.category === 'modal').length;
    const gr = scan.elements.filter((e: any) => e.category === 'grid').length;
    const ifr = scan.iframes?.length || 0;
    const libs = scan.libraries.length > 0 ? scan.libraries.join(', ') : 'Native';
    r += `| ${scan.pageName} | ${libs} | ${scan.elements.length} | ${dd} | ${md} | ${gr} | ${ifr} |\n`;
  }

  return r;
}

// ============================================================================
// TEST — Interactive Scan Session
// ============================================================================

test.describe('Scout Agent v4', () => {
  test('Interactive scan session', async ({ page }) => {
    test.setTimeout(CFG.sessionTimeout);

    // Ensure output directories exist and clear old triggers
    fs.mkdirSync(CFG.outputDir, { recursive: true });
    fs.mkdirSync(SCOUT_OUTPUT_DIR, { recursive: true });
    deleteTrigger(path.join(TRIGGER_DIR, 'SCAN'));
    deleteTrigger(path.join(TRIGGER_DIR, 'DONE'));

    const allScans: any[] = [];
    let scanCount = 0;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║   🔍 SCOUT AGENT v4 — DOM Reconnaissance                    ║');
    console.log('║                                                              ║');
    console.log('║   7 Libraries: Fluent v8/v9, MUI, Ant, Prime, Bootstrap,    ║');
    console.log('║                Kendo + ARIA fallback                         ║');
    console.log('║   40+ Component Patterns | Iframe Probing | Hit-Area Detect ║');
    console.log('║                                                              ║');
    console.log('║   In Terminal 2, run:  node tools/remote-control.js         ║');
    console.log('║   Press S = scan  |  T = scan in 5s  |  D = done            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Open browser at start URL
    await page.goto(CFG.startUrl, { waitUntil: 'networkidle', timeout: CFG.pageLoadTimeout });
    console.log(`📍 Browser open at: ${CFG.startUrl}`);
    console.log(`⏳ Waiting for triggers from remote-control...\n`);

    // ── Main loop: wait for triggers ──
    while (true) {
      const trigger = await waitForTrigger(CFG.pollInterval);

      if (trigger.type === 'done') {
        console.log('\n📋 DONE signal received. Generating report...');
        break;
      }

      if (trigger.type === 'scan') {
        scanCount++;
        const scanName = trigger.name !== 'scan' && trigger.name !== 'SCAN'
          ? trigger.name
          : `Scan ${scanCount}`;
        console.log(`\n🔍 Scan #${scanCount}: "${scanName}" — ${page.url()}`);

        try {
          // Scan the current page
          const scan = await scanPage(page, scanName);
          allScans.push(scan);

          console.log(`   ✅ Found ${scan.elements.length} interactive elements`);
          console.log(`   📚 Libraries: ${scan.libraries.join(', ') || 'Native HTML'}`);
          const dd = scan.elements.filter((e: any) => e.category === 'dropdown').length;
          const md = scan.elements.filter((e: any) => e.category === 'modal').length;
          const gr = scan.elements.filter((e: any) => e.category === 'grid').length;
          console.log(`   🔽 Dropdowns: ${dd} | 📦 Modals: ${md} | 📊 Grids: ${gr}`);

          // Probe iframes if found
          if (scan.iframes.length > 0) {
            console.log(`   🔲 Iframes detected: ${scan.iframes.length} — probing...`);
            const iframeScans = await probeIframes(page, scan);
            allScans.push(...iframeScans);
            for (const ifs of iframeScans) {
              if (ifs.error) {
                console.log(`   ⚠️ ${ifs.pageName}: ${ifs.error}`);
              } else {
                console.log(`   ✅ ${ifs.pageName}: ${ifs.elements.length} elements, ${ifs.libraries.join(', ') || 'Native'}`);
              }
            }
          }

          // Warnings
          const warnings = scan.elements.filter((e: any) => e.hitAreaWarning);
          if (warnings.length > 0) {
            console.log(`   ⚠️ ${warnings.length} hit-area mismatch(es) detected`);
          }

        } catch (err) {
          console.log(`   ❌ Scan failed: ${err}`);
        }

        console.log(`⏳ Waiting for next trigger...\n`);
      }
    }

    // ── Generate and save reports ──
    if (allScans.length > 0) {
      const md = generateReport(allScans);

      fs.writeFileSync(path.join(SCOUT_OUTPUT_DIR, `${SCOUT_FILE_BASE}.md`), md, 'utf-8');
      fs.writeFileSync(
        path.join(SCOUT_OUTPUT_DIR, `${SCOUT_FILE_BASE.replace('-latest', '')}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`),
        md, 'utf-8'
      );
      fs.writeFileSync(path.join(SCOUT_OUTPUT_DIR, `${SCOUT_FILE_BASE}.json`), JSON.stringify(allScans, null, 2), 'utf-8');

      console.log(`\n📄 Reports saved to: ${path.resolve(SCOUT_OUTPUT_DIR)}/`);
      console.log(`   - ${SCOUT_FILE_BASE}.md`);
      console.log(`   - ${SCOUT_FILE_BASE}.json`);
      console.log(`\n✅ Done! ${allScans.length} scans captured.`);
    } else {
      console.log('\n⚠️ No scans captured.');
    }
  });
});
