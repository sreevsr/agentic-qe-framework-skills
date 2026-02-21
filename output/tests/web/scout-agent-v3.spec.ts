/**
 * SCOUT AGENT v3 — File-Triggered DOM Reconnaissance
 * ====================================================
 * Use with remote-control.js for single-keypress scanning.
 * 
 * Terminal 1:  npx playwright test tests/web/scout-agent-v3.spec.ts --project=chrome --headed --reporter=list
 * Terminal 2:  node remote-control.js
 */
import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const CFG = {
  startUrl: 'https://devunify.ars.com/unify',
  outputDir: './scout-reports',
  pageLoadTimeout: 30000,
  pollInterval: 500,
  sessionTimeout: 900000,
};

const TRIGGER_DIR = CFG.outputDir;

// === LIBRARIES ===
const LIBS: any[] = [
  { name:'Microsoft Fluent UI', ids:[/^ms-/], comps:[
    { cp:/ms-ComboBox(?!-option)/, ct:'Fluent UI ComboBox', cat:'dropdown', conf:'high', ip:'Click button.ms-ComboBox-CaretDown-button to open\nWait for .ms-Callout [role="option"]\nClick matching [role="option"]\nOr type in input.ms-ComboBox-Input to filter' },
    { cp:/ms-Dropdown/, ct:'Fluent UI Dropdown', cat:'dropdown', conf:'high', ip:'Click div.ms-Dropdown\nWait for [role="listbox"] [role="option"]\nClick matching [role="option"]' },
    { cp:/ms-ContextualMenu/, ct:'Fluent UI ContextualMenu', cat:'dropdown', conf:'high', ip:'Click trigger button\nWait for [role="menu"]\ngetByRole("menuitem", { name: "Option" })' },
    { cp:/ms-DetailsList/, ct:'Fluent UI DetailsList', cat:'grid', conf:'high', ip:'Rows: [role="row"] — first is header\nCells: [role="gridcell"]\nClick row to select' },
    { cp:/ms-Panel/, ct:'Fluent UI Panel', cat:'modal', conf:'high', ip:'Wait for .ms-Panel to be visible\nClose: button[aria-label="Close"] or Escape' },
    { cp:/ms-Modal|ms-Dialog/, ct:'Fluent UI Modal/Dialog', cat:'modal', conf:'high', ip:'Wait for [role="dialog"]\nClose: button[aria-label="Close"] or Escape' },
    { cp:/ms-Callout/, ct:'Fluent UI Callout', cat:'modal', conf:'high', ip:'Wait for .ms-Callout\nCloses on outside click or Escape' },
    { cp:/ms-Tooltip/, ct:'Fluent UI Tooltip', cat:'modal', conf:'high', ip:'Hover to trigger\nContent inside .ms-Tooltip' },
    { cp:/ms-Nav\b/, ct:'Fluent UI Nav', cat:'navigation', conf:'high', ip:'page.click(\'a.ms-Nav-link:has-text("Link")\')' },
    { cp:/ms-Pivot/, ct:'Fluent UI Pivot (Tabs)', cat:'tab', conf:'high', ip:'page.click(\'button.ms-Pivot-link:has-text("Tab")\')' },
    { cp:/ms-CommandBar/, ct:'Fluent UI CommandBar', cat:'navigation', conf:'high', ip:'page.click(\'button.ms-CommandBarItem-link:has-text("Cmd")\')' },
    { cp:/ms-SearchBox/, ct:'Fluent UI SearchBox', cat:'input', conf:'high', ip:'page.fill(\'.ms-SearchBox-field\', "text")' },
    { cp:/ms-TextField/, ct:'Fluent UI TextField', cat:'input', conf:'high', ip:'page.fill(\'input.ms-TextField-field\', "value")' },
    { cp:/ms-Toggle/, ct:'Fluent UI Toggle', cat:'button', conf:'high', ip:'page.click(\'button.ms-Toggle-button\')' },
    { cp:/ms-Checkbox/, ct:'Fluent UI Checkbox', cat:'button', conf:'high', ip:'page.click(\'input.ms-Checkbox-input\')' },
    { cp:/ms-Button/, ct:'Fluent UI Button', cat:'button', conf:'medium', ip:'page.click(\'button.ms-Button:has-text("Text")\')' },
  ]},
  { name:'Material UI (MUI)', ids:[/^Mui/], comps:[
    { cp:/MuiSelect/, ct:'MUI Select', cat:'dropdown', conf:'high', ip:'Click div.MuiSelect-select\nWait [role="listbox"]\nClick [role="option"]' },
    { cp:/MuiAutocomplete/, ct:'MUI Autocomplete', cat:'dropdown', conf:'high', ip:'Click input, type to filter\nWait [role="listbox"]\nClick [role="option"]' },
    { cp:/MuiDataGrid/, ct:'MUI DataGrid', cat:'grid', conf:'high', ip:'[role="row"] → [role="gridcell"]' },
    { cp:/MuiDialog/, ct:'MUI Dialog', cat:'modal', conf:'high', ip:'Wait [role="dialog"]. Close button or Escape.' },
    { cp:/MuiDrawer/, ct:'MUI Drawer', cat:'modal', conf:'high', ip:'.MuiDrawer-root. Backdrop click or toggle.' },
    { cp:/MuiTooltip/, ct:'MUI Tooltip', cat:'modal', conf:'high', ip:'Hover to trigger. Content in .MuiTooltip-tooltip' },
    { cp:/MuiTab\b/, ct:'MUI Tab', cat:'tab', conf:'high', ip:'getByRole("tab", { name: "Tab" })' },
    { cp:/MuiTextField|MuiInput|MuiOutlinedInput/, ct:'MUI TextField', cat:'input', conf:'high', ip:'page.fill(\'input.MuiInputBase-input\', "val")' },
    { cp:/MuiButton/, ct:'MUI Button', cat:'button', conf:'medium', ip:'page.click(\'button.MuiButton-root:has-text("T")\')' },
  ]},
  { name:'Ant Design', ids:[/^ant-/], comps:[
    { cp:/ant-select(?!-)/, ct:'Ant Select', cat:'dropdown', conf:'high', ip:'Click .ant-select-selector\nWait .ant-select-dropdown\nClick option' },
    { cp:/ant-table/, ct:'Ant Table', cat:'grid', conf:'high', ip:'.ant-table-row' },
    { cp:/ant-modal/, ct:'Ant Modal', cat:'modal', conf:'high', ip:'.ant-modal-close or Escape' },
    { cp:/ant-drawer/, ct:'Ant Drawer', cat:'modal', conf:'high', ip:'.ant-drawer-close' },
    { cp:/ant-tooltip/, ct:'Ant Tooltip', cat:'modal', conf:'high', ip:'Hover to trigger. Content in .ant-tooltip-inner' },
    { cp:/ant-tabs/, ct:'Ant Tabs', cat:'tab', conf:'high', ip:'.ant-tabs-tab:has-text("Tab")' },
    { cp:/ant-input/, ct:'Ant Input', cat:'input', conf:'high', ip:'page.fill(\'.ant-input\', "val")' },
    { cp:/ant-btn/, ct:'Ant Button', cat:'button', conf:'medium', ip:'.ant-btn:has-text("T")' },
  ]},
  { name:'PrimeNG', ids:[/^p-/], comps:[
    { cp:/p-dropdown/, ct:'Prime Dropdown', cat:'dropdown', conf:'high', ip:'Click .p-dropdown\n.p-dropdown-panel\n.p-dropdown-item' },
    { cp:/p-datatable/, ct:'Prime DataTable', cat:'grid', conf:'high', ip:'tr.p-datatable-row' },
    { cp:/p-dialog/, ct:'Prime Dialog', cat:'modal', conf:'high', ip:'.p-dialog-header-close' },
    { cp:/p-button/, ct:'Prime Button', cat:'button', conf:'medium', ip:'.p-button:has-text("T")' },
  ]},
  { name:'Bootstrap', ids:[/^btn-/,/^form-control/], comps:[
    { cp:/form-select|dropdown-toggle/, ct:'Bootstrap Dropdown', cat:'dropdown', conf:'medium', ip:'.dropdown-toggle then .dropdown-item' },
    { cp:/modal-dialog/, ct:'Bootstrap Modal', cat:'modal', conf:'high', ip:'.modal.show → [data-bs-dismiss="modal"]' },
    { cp:/btn-primary|btn-secondary|btn-danger/, ct:'Bootstrap Button', cat:'button', conf:'medium', ip:'.btn:has-text("T")' },
  ]},
  { name:'Kendo UI', ids:[/^k-/], comps:[
    { cp:/k-dropdown|k-combobox/, ct:'Kendo DropDown', cat:'dropdown', conf:'high', ip:'.k-dropdown-wrap\n.k-animation-container\n.k-item' },
    { cp:/k-grid\b/, ct:'Kendo Grid', cat:'grid', conf:'high', ip:'tr.k-master-row' },
    { cp:/k-dialog|k-window/, ct:'Kendo Dialog', cat:'modal', conf:'high', ip:'.k-dialog-close' },
    { cp:/k-button/, ct:'Kendo Button', cat:'button', conf:'medium', ip:'.k-button:has-text("T")' },
  ]},
];

// === DETECTION ===
function detectLib(cls: string[]): string { const s=cls.join(' '); for (const l of LIBS) for (const i of l.ids) if (i.test(s)) return l.name; return 'Unknown'; }
function detectComp(el: any): any { const s=el.classes.join(' '); for (const l of LIBS) for (const c of l.comps) if (c.cp.test(s)) return {componentType:c.ct,interactionPattern:c.ip,confidence:c.conf,category:c.cat};
  if ((el.tag==='button'||el.role==='button')&&el.ariaHasPopup) return {componentType:'Button (opens popup)',interactionPattern:`Click, wait [role="${el.ariaHasPopup==='true'?'menu':el.ariaHasPopup}"]`,confidence:'medium',category:'dropdown'};
  if (el.role==='combobox') return {componentType:'ComboBox',interactionPattern:'Click, wait, select',confidence:'medium',category:'dropdown'};
  if (el.role==='menu') return {componentType:'Menu',interactionPattern:'[role="menuitem"]',confidence:'medium',category:'dropdown'};
  if (el.role==='grid') return {componentType:'Data Grid',interactionPattern:'[role="row"]',confidence:'medium',category:'grid'};
  if (el.role==='dialog'||el.role==='alertdialog') return {componentType:'Dialog',interactionPattern:'Close via button or Escape',confidence:'medium',category:'modal'};
  if (el.role==='tablist') return {componentType:'Tabs',interactionPattern:'[role="tab"]',confidence:'medium',category:'tab'};
  if (el.role==='navigation') return {componentType:'Navigation',interactionPattern:'Click links',confidence:'medium',category:'navigation'};
  if (el.tag==='select') return {componentType:'Native Select',interactionPattern:'page.selectOption()',confidence:'high',category:'dropdown'};
  if (el.tag==='button'||el.role==='button') return {componentType:'Button',interactionPattern:'page.click()',confidence:'low',category:'button'};
  if (el.tag==='input') return {componentType:`Input (${el.type||'text'})`,interactionPattern:'page.fill()',confidence:'low',category:'input'};
  if (el.tag==='a') return {componentType:'Link',interactionPattern:'page.click()',confidence:'low',category:'navigation'};
  return {componentType:'Unknown',interactionPattern:'Inspect manually',confidence:'low',category:'other'}; }
function genSel(el: any): string { const p=el.inShadowDom&&el.shadowHost?`${el.shadowHost} >> `:'';
  if (el.dataTestId) return `${p}[data-testid="${el.dataTestId}"]`; if (el.dataAutomationId) return `${p}[data-automation-id="${el.dataAutomationId}"]`;
  if (el.id) return `${p}#${el.id}`; if (el.role&&el.ariaLabel) return `${p}[role="${el.role}"][aria-label="${el.ariaLabel}"]`;
  const cc=el.classes.find((c:string)=>/^ms-|^Mui|^ant-|^p-|^k-/.test(c)&&!/--|__/.test(c)); if (cc) return `${p}${el.tag}.${cc}`;
  if (el.role) return `${p}[role="${el.role}"]`; if (el.classes.length) return `${p}${el.tag}.${el.classes[0]}`; return `${p}${el.tag}`; }

const SEL = ['button','a[href]','input','select','textarea',
  '[role="button"]','[role="combobox"]','[role="listbox"]','[role="menu"]','[role="menubar"]','[role="menuitem"]',
  '[role="tab"]','[role="tablist"]','[role="grid"]','[role="treegrid"]','[role="dialog"]','[role="alertdialog"]',
  '[role="navigation"]','[role="search"]','[role="switch"]','[role="slider"]','[role="tooltip"]',
  '[class*="ms-ComboBox"]','[class*="ms-Dropdown"]','[class*="ms-Button"]','[class*="ms-TextField"]',
  '[class*="ms-DetailsList"]','[class*="ms-Pivot"]','[class*="ms-ContextualMenu"]','[class*="ms-Nav"]',
  '[class*="ms-Modal"]','[class*="ms-Dialog"]','[class*="ms-Panel"]','[class*="ms-CommandBar"]',
  '[class*="ms-SearchBox"]','[class*="ms-Toggle"]','[class*="ms-Checkbox"]','[class*="ms-Callout"]',
  '[class*="ms-Tooltip"]','[class*="Mui"]','[class*="MuiTooltip"]',
  '[class*="ant-select"]','[class*="ant-btn"]','[class*="ant-input"]','[class*="ant-table"]',
  '[class*="ant-modal"]','[class*="ant-drawer"]','[class*="ant-menu"]','[class*="ant-tabs"]','[class*="ant-tooltip"]',
  '[class*="p-dropdown"]','[class*="p-button"]','[class*="p-datatable"]','[class*="p-dialog"]',
  '[class*="btn-"]','.form-control','.form-select','.dropdown-toggle','.modal-dialog','.nav-tabs',
  '[class*="k-dropdown"]','[class*="k-grid"]','[class*="k-button"]','[class*="k-dialog"]','[class*="k-combobox"]',
  '[onclick]','[data-testid]','[data-automation-id]','[aria-haspopup]','[aria-expanded]',
  '[class*="tooltip"]','[class*="Tooltip"]','[class*="popover"]','[class*="Popover"]'];

// === SCANNER (Two-Pass: no freeze) ===
// Pass 1: Grab raw DOM data inside page.evaluate() — NO getComputedStyle, NO getBoundingClientRect
//         This is instant and never blocks the UI thread.
// Pass 2: Use Playwright's locator().boundingBox() for visible elements — async CDP calls,
//         non-blocking, browser stays fully responsive.

async function scanDOM(page: Page, name: string) {
  const url = page.url();
  const title = await page.title().catch(() => 'Unknown');

  // ── PASS 1: Lightweight DOM extraction (no layout reflow) ──────────
  const { rawElements, iframes, shadowRoots } = await page.evaluate((sels: string[]) => {
    const seen = new Set<Element>();
    const res: any[] = [];

    function extract(el: Element, inShadow: boolean, host: string | null) {
      if (seen.has(el)) return;
      seen.add(el);
      const h = el as HTMLElement;
      // Only read attributes — NO getComputedStyle, NO getBoundingClientRect
      let t = '';
      for (const c of Array.from(h.childNodes)) {
        if (c.nodeType === Node.TEXT_NODE) t += c.textContent?.trim() || '';
      }
      if (!t) t = h.getAttribute('aria-label') || '';
      if (!t) t = h.textContent?.trim().substring(0, 150) || '';

      res.push({
        tag: h.tagName.toLowerCase(),
        role: h.getAttribute('role'),
        type: h.getAttribute('type'),
        classes: Array.from(h.classList),
        id: h.id || null,
        name: h.getAttribute('name'),
        ariaLabel: h.getAttribute('aria-label'),
        ariaHasPopup: h.getAttribute('aria-haspopup'),
        ariaExpanded: h.getAttribute('aria-expanded'),
        placeholder: h.getAttribute('placeholder'),
        textContent: t.substring(0, 200),
        dataTestId: h.getAttribute('data-testid'),
        dataAutomationId: h.getAttribute('data-automation-id'),
        childCount: h.children.length,
        inShadowDom: inShadow,
        shadowHost: host,
        // Hidden check using only attribute/inline style (cheap, no reflow)
        ariaHidden: h.getAttribute('aria-hidden'),
        inlineDisplay: h.style.display,
        inlineVisibility: h.style.visibility,
        offsetParentExists: h.offsetParent !== null || h.tagName === 'BODY',
      });
    }

    // Scan main document
    for (const sel of sels) {
      try { document.querySelectorAll(sel).forEach(el => extract(el, false, null)); } catch {}
    }

    // Scan shadow roots
    let sr = 0;
    function findSR(root: Document | ShadowRoot) {
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot && el.shadowRoot.mode === 'open') {
          sr++;
          const h = el as HTMLElement;
          let hs = h.tagName.toLowerCase();
          if (h.id) hs = `#${h.id}`;
          else if (h.classList.length) hs = `${hs}.${h.classList[0]}`;
          el.shadowRoot.querySelectorAll(
            'button,a[href],input,select,textarea,[role="button"],[role="combobox"],[role="dialog"],[role="menu"],[role="menuitem"],[role="tab"],[role="grid"],[role="slider"],[role="switch"]'
          ).forEach(sEl => extract(sEl, true, hs));
          findSR(el.shadowRoot);
        }
      }
    }
    findSR(document);

    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src || '', id: f.id || null, name: f.name || null,
    }));

    return { rawElements: res, iframes, shadowRoots: sr };
  }, SEL);

  // Deduplicate
  const seenKeys = new Set<string>();
  const uniqueElements: any[] = [];
  for (const el of rawElements) {
    const key = `${el.tag}_${el.id || ''}_${(el.classes || []).join(',').substring(0, 60)}_${el.role || ''}_${el.textContent?.substring(0, 20) || ''}`;
    if (!seenKeys.has(key)) { seenKeys.add(key); uniqueElements.push(el); }
  }

  // Quick visibility pre-filter (using cheap attributes from Pass 1)
  const likelyVisible = uniqueElements.filter(el =>
    el.ariaHidden !== 'true' &&
    el.inlineDisplay !== 'none' &&
    el.inlineVisibility !== 'hidden' &&
    el.offsetParentExists
  );

  // ── PASS 2: Bounding boxes via Playwright locator API (non-blocking) ──
  // Each call is async CDP — browser stays fully responsive.
  const totalToCheck = likelyVisible.length;
  let checked = 0;
  for (const el of likelyVisible) {
    try {
      // Build the best unique selector for this specific element
      let selector: string;
      if (el.dataTestId) {
        selector = `[data-testid="${el.dataTestId}"]`;
      } else if (el.dataAutomationId) {
        selector = `[data-automation-id="${el.dataAutomationId}"]`;
      } else if (el.id) {
        selector = `#${el.id}`;
      } else if (el.role && el.ariaLabel) {
        selector = `[role="${el.role}"][aria-label="${el.ariaLabel}"]`;
      } else if (el.role && el.textContent && el.textContent.length > 0 && el.textContent.length < 50) {
        selector = `${el.tag}[role="${el.role}"]:has-text("${el.textContent.substring(0, 40)}")`;
      } else {
        const compClass = (el.classes || []).find((c: string) => /^ms-|^Mui|^ant-|^p-|^k-/.test(c) && !/--|__/.test(c));
        if (compClass) selector = `${el.tag}.${compClass}`;
        else if (el.role) selector = `[role="${el.role}"]`;
        else selector = el.tag;
      }

      const locator = page.locator(selector).first();
      const box = await locator.boundingBox({ timeout: 200 });
      if (box && box.width > 0 && box.height > 0) {
        el.isVisible = true;
        el.boundingBox = {
          x: Math.round(box.x), y: Math.round(box.y),
          width: Math.round(box.width), height: Math.round(box.height),
        };
      } else {
        el.isVisible = false;
        el.boundingBox = null;
      }
    } catch {
      el.isVisible = false;
      el.boundingBox = null;
    }
    checked++;
  }

  // Mark elements that weren't checked as not visible
  for (const el of uniqueElements) {
    if (el.isVisible === undefined) {
      el.isVisible = false;
      el.boundingBox = null;
    }
  }

  // Enrich with component detection
  const enriched = uniqueElements.map((el: any) => {
    const { ariaHidden, inlineDisplay, inlineVisibility, offsetParentExists, ...rest } = el;
    return {
      ...rest,
      componentLibrary: detectLib(el.classes),
      ...detectComp(el),
      recommendedSelector: genSel(el),
    };
  });

  // ── NOISE FILTER: Remove structural/wrapper elements ──────────────
  // These are internal parts of UI components — never the right thing to click/interact with
  const NOISE_CLASSES = [
    // Fluent UI internal wrappers
    /^ms-Button-flexContainer$/, /^ms-Button-textContainer$/, /^ms-Button-label$/,
    /^ms-Callout-beak$/, /^ms-Callout-beakCurtain$/, /^ms-Callout-main$/,
    /^ms-Panel-main$/, /^ms-Panel-contentInner$/, /^ms-Panel-scrollableContent$/,
    /^ms-Panel-commands$/, /^ms-Panel-navigation$/, /^ms-Panel-content$/,
    /^ms-Panel-footer$/, /^ms-Panel-footerInner$/,
    /^ms-Nav-group$/, /^ms-Nav-groupContent$/, /^ms-Nav-navItems$/,
    /^ms-Nav-navItem$/, /^ms-Nav-compositeLink$/,
    /^ms-DetailsList-headerWrapper$/, /^ms-DetailsList-contentWrapper$/,
    /^ms-ComboBox-container$/, /^ms-ComboBox-Input$/,
    /^ms-OverflowSet$/, /^ms-FocusZone$/,
    /^ms-SearchBox$/, // keep the input #SearchBox20, not the wrapper div.ms-SearchBox
    // MUI wrappers
    /^MuiButtonBase-root$/, /^MuiInputBase-root$/,
    // Ant wrappers
    /^ant-select-selector$/, /^ant-btn-icon$/,
    // Bootstrap wrappers
    /^dropdown-menu$/,
    // Kendo wrappers
    /^k-dropdown-wrap$/,
  ];

  const isNoise = (el: any): boolean => {
    // Skip elements that are only structural wrappers
    for (const cls of el.classes || []) {
      for (const noise of NOISE_CLASSES) {
        if (noise.test(cls)) return true;
      }
    }
    // Skip span/div elements that are children of buttons (wrapper spans inside buttons)
    if ((el.tag === 'span' || el.tag === 'div') && el.classes?.some((c: string) =>
      /flexContainer|textContainer|label|icon/.test(c))) return true;
    return false;
  };

  const filtered = enriched.filter((el: any) => !isNoise(el));

  // ── SMART DEDUP: Same text + same category → keep best selector ────
  // When "Change Photo" appears as button, span, and role="button",
  // keep only the actual interactive element (button or [role="button"])
  const deduped: any[] = [];
  const textSeen = new Map<string, any>(); // key: "text::category" → best element

  for (const el of filtered) {
    if (!el.isVisible) { deduped.push(el); continue; }
    const text = (el.textContent || '').trim();
    if (!text || text.length > 100) { deduped.push(el); continue; }
    const key = `${text}::${el.category}`;
    const existing = textSeen.get(key);
    if (!existing) {
      textSeen.set(key, el);
      deduped.push(el);
    } else {
      // Keep the one with better selector priority:
      // data-testid > data-automation-id > id > button/a tag > role > class
      const score = (e: any) => {
        if (e.dataTestId) return 100;
        if (e.dataAutomationId) return 90;
        if (e.id) return 80;
        if (e.tag === 'button' || e.tag === 'a' || e.tag === 'input') return 70;
        if (e.role === 'button' || e.role === 'combobox' || e.role === 'tab') return 60;
        return 10;
      };
      if (score(el) > score(existing)) {
        // Replace existing with better one
        const idx = deduped.indexOf(existing);
        if (idx !== -1) deduped[idx] = el;
        // Check for hit-area mismatch
        if (existing.boundingBox && el.boundingBox) {
          const dx = Math.abs(existing.boundingBox.x - el.boundingBox.x);
          const dy = Math.abs(existing.boundingBox.y - el.boundingBox.y);
          const dw = Math.abs(existing.boundingBox.width - el.boundingBox.width);
          const dh = Math.abs(existing.boundingBox.height - el.boundingBox.height);
          if (dx > 5 || dy > 5 || dw > 10 || dh > 10) {
            el.hitAreaMismatch = true;
            el.hitAreaNote = `Visual element at (${existing.boundingBox.x},${existing.boundingBox.y} ${existing.boundingBox.width}x${existing.boundingBox.height}) vs clickable at (${el.boundingBox.x},${el.boundingBox.y} ${el.boundingBox.width}x${el.boundingBox.height})`;
          }
        }
        textSeen.set(key, el);
      }
      // else: existing is better, skip this one (already in deduped)
    }
  }

  return {
    pageName: name, url, title, elements: deduped, iframes, shadowRoots,
    libraries: [...new Set(deduped.map((e: any) => e.componentLibrary).filter((l: string) => l !== 'Unknown'))],
  };
}

// === TRIGGER HELPERS ===
function findTrigger(): 'scan'|'done'|null {
  try {
    const files = fs.readdirSync(TRIGGER_DIR);
    for (const f of files) {
      const lower = f.toLowerCase();
      if (lower === 'done') { try{fs.unlinkSync(path.join(TRIGGER_DIR,f));}catch{} return 'done'; }
      if (lower === 'scan') { return 'scan'; }
    }
  } catch {}
  return null;
}
function deleteScanTrigger() {
  try {
    const files = fs.readdirSync(TRIGGER_DIR);
    for (const f of files) { if (f.toLowerCase() === 'scan') { try{fs.unlinkSync(path.join(TRIGGER_DIR,f));}catch{} } }
  } catch {}
}
function readScanFile(): string {
  try {
    const files = fs.readdirSync(TRIGGER_DIR);
    for (const f of files) { if (f.toLowerCase() === 'scan') { try { return fs.readFileSync(path.join(TRIGGER_DIR,f),'utf-8').trim(); } catch { return ''; } } }
  } catch {}
  return '';
}
function waitTrigger(ms:number):Promise<'scan'|'done'>{return new Promise(res=>{const iv=setInterval(()=>{const t=findTrigger();if(t){clearInterval(iv);res(t);}},ms);});}

// === REPORT ===
function genReport(scans:any[]):string{
  let r=`# Scout Agent v3 — DOM Inventory Report\n\n**Generated:** ${new Date().toISOString()}\n**Scans:** ${scans.length}\n\n---\n\n`;
  for(const s of scans){
    const vis=s.elements.filter((e:any)=>e.isVisible);
    const shad=s.elements.filter((e:any)=>e.inShadowDom);
    r+=`## Scan: ${s.pageName}\n\n- **URL:** ${s.url}\n- **Title:** ${s.title}\n- **Libraries:** ${s.libraries.join(', ')||'None'}\n`;
    r+=`- **Elements:** ${s.elements.length} total (${vis.length} visible)\n`;
    if(shad.length)r+=`- **Shadow DOM:** ${s.shadowRoots} roots, ${shad.length} elements\n`;
    r+=`- **IFrames:** ${s.iframes.length?s.iframes.map((f:any)=>f.src||f.id||'unnamed').join(', '):'None'}\n\n`;
    const bd:Record<string,number>={};for(const e of vis)bd[e.componentType]=(bd[e.componentType]||0)+1;
    r+=`### Component Breakdown\n\n| Type | Count |\n|---|---|\n`;
    for(const[t,c]of Object.entries(bd).sort((a:any,b:any)=>b[1]-a[1]))r+=`| ${t} | ${c} |\n`;r+=`\n`;

    // Dropdowns
    const dd=vis.filter((e:any)=>e.category==='dropdown');
    if(dd.length){r+=`### 🔽 Dropdowns (${dd.length})\n\n> **CRITICAL — use these interaction patterns.**\n\n`;
      for(const e of dd){r+=`#### ${e.ariaLabel||e.textContent||e.recommendedSelector}${e.inShadowDom?' ⚡SHADOW':''}\n`;
        r+=`- **Type:** ${e.componentType} | **Library:** ${e.componentLibrary} | **Confidence:** ${e.confidence}\n`;
        r+=`- **Selector:** \`${e.recommendedSelector}\` | **Classes:** \`${e.classes.join(' ')}\`\n`;
        r+=`- **ARIA:** role="${e.role||'none'}" haspopup="${e.ariaHasPopup||'none'}" | **Text:** "${e.textContent}"\n`;
        if(e.boundingBox)r+=`- **Pos:** x:${e.boundingBox.x} y:${e.boundingBox.y} (${e.boundingBox.width}x${e.boundingBox.height})\n`;
        if(e.hitAreaMismatch)r+=`- **⚠️ HIT-AREA MISMATCH:** ${e.hitAreaNote}\n`;
        r+=`- **Interaction:**\n  \`\`\`\n  ${e.interactionPattern}\n  \`\`\`\n\n`;}}

    // Modals & Panels (skip persistent Callouts that appear on every page)
    const mo=vis.filter((e:any)=>e.category==='modal' && 
      !(e.componentType==='Fluent UI Callout' && (e.textContent||'').includes('Sign out')));
    if(mo.length){r+=`### 📦 Modals & Panels (${mo.length})\n\n`;
      for(const e of mo){r+=`#### ${e.ariaLabel||e.textContent||e.recommendedSelector}\n`;
        r+=`- **Type:** ${e.componentType} | **Selector:** \`${e.recommendedSelector}\`\n`;
        if(e.boundingBox)r+=`- **Pos:** x:${e.boundingBox.x} y:${e.boundingBox.y} (${e.boundingBox.width}x${e.boundingBox.height})\n`;
        r+=`- **Interaction:**\n  \`\`\`\n  ${e.interactionPattern}\n  \`\`\`\n\n`;}}

    // Grids
    const gr=vis.filter((e:any)=>e.category==='grid');
    if(gr.length){r+=`### 📊 Grids (${gr.length})\n\n`;for(const e of gr)r+=`- **${e.ariaLabel||e.recommendedSelector}** — ${e.componentType} | \`${e.recommendedSelector}\`\n  - ${e.interactionPattern.split('\n')[0]}\n\n`;}

    // Inputs
    const inp=vis.filter((e:any)=>e.category==='input');
    if(inp.length){r+=`### ✏️ Inputs (${inp.length})\n\n`;for(const e of inp)r+=`- **${e.ariaLabel||e.placeholder||e.recommendedSelector}** — ${e.componentType} | \`${e.recommendedSelector}\`\n`;r+=`\n`;}

    // Buttons
    const btn=vis.filter((e:any)=>e.category==='button');
    if(btn.length){r+=`### 🔘 Buttons (${btn.length})\n\n`;
      for(const e of btn){
        r+=`- **"${e.textContent||e.ariaLabel||'unnamed'}"** — \`${e.recommendedSelector}\` (${e.componentType})`;
        if(e.hitAreaMismatch)r+=` ⚠️ HIT-AREA MISMATCH`;
        r+=`\n`;
        if(e.hitAreaMismatch)r+=`  - ⚠️ ${e.hitAreaNote}\n`;
      }r+=`\n`;}

    // Navigation
    const nav=vis.filter((e:any)=>e.category==='navigation');
    if(nav.length){r+=`### 🧭 Navigation (${nav.length})\n\n`;for(const e of nav)r+=`- **"${e.textContent||e.ariaLabel||'unnamed'}"** — ${e.componentType} | \`${e.recommendedSelector}\`\n`;r+=`\n`;}

    // Shadow DOM
    const sv=shad.filter((e:any)=>e.isVisible);
    if(sv.length){r+=`### ⚡ Shadow DOM (${sv.length} visible)\n\n> Playwright pierces open shadow roots. Use \`>>\` selector.\n\n`;
      for(const e of sv)r+=`- **"${e.textContent||e.ariaLabel||'unnamed'}"** — ${e.componentType} | \`${e.recommendedSelector}\` | Host: \`${e.shadowHost}\`\n`;r+=`\n`;}
    r+=`---\n\n`;}

  // Scenario annotations (filtered)
  r+=`## 📝 Scenario Annotations\n\n\`\`\`markdown\n`;
  for(const s of scans)for(const e of s.elements.filter((e:any)=>e.isVisible&&(e.category==='dropdown'||e.category==='modal')&&e.confidence!=='low'
    && !(e.componentType==='Fluent UI Callout' && (e.textContent||'').includes('Sign out'))))
    r+=`## ${e.ariaLabel||e.textContent||e.recommendedSelector} (${s.pageName})\n- Component: ${e.componentType}\n- Selector: ${e.recommendedSelector}\n- Interaction:\n  ${e.interactionPattern.split('\n').join('\n  ')}\n\n`;
  r+=`\`\`\`\n\n`;

  // Risk analysis (filtered + hit-area warnings)
  r+=`## ⚠️ Risk Analysis\n\n`;const risks:string[]=[];
  for(const s of scans){for(const e of s.elements.filter((e:any)=>e.isVisible)){
    if(e.category==='dropdown'&&/ComboBox|ContextualMenu|Autocomplete/.test(e.componentType))risks.push(`| ${s.pageName} | ${e.textContent||e.recommendedSelector} | Custom dropdown — multi-step interaction |`);
    if(e.category==='modal' && !(e.componentType==='Fluent UI Callout' && (e.textContent||'').includes('Sign out')))
      risks.push(`| ${s.pageName} | ${e.textContent||e.recommendedSelector} | Dynamic UI — only in DOM after trigger |`);
    if(e.hitAreaMismatch)risks.push(`| ${s.pageName} | ${e.textContent||e.recommendedSelector} | ⚠️ HIT-AREA MISMATCH — click target offset from visible element |`);
    if(e.inShadowDom)risks.push(`| ${s.pageName} | ${e.textContent||e.recommendedSelector} | Shadow DOM — use piercing selector |`);}
    for(const f of s.iframes)risks.push(`| ${s.pageName} | iframe (${f.src||'blank'}) | frameLocator needed |`);}
  r+=risks.length?`| Page | Element | Risk |\n|---|---|---|\n${risks.join('\n')}\n`:`✅ No risks.\n`;return r;}

// === TEST ===
test.describe('Scout Agent v3',()=>{
  test('Interactive scan session',async({page})=>{
    test.setTimeout(CFG.sessionTimeout);
    fs.mkdirSync(CFG.outputDir,{recursive:true});
    deleteScanTrigger();
    try{const files=fs.readdirSync(TRIGGER_DIR);for(const f of files)if(f.toLowerCase()==='done')fs.unlinkSync(path.join(TRIGGER_DIR,f));}catch{}
    const scans:any[]=[];let n=0;
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║   🔍 SCOUT AGENT v3                                         ║');
    console.log('║                                                              ║');
    console.log('║   Browse your app freely in the browser.                     ║');
    console.log('║   In Terminal 2, run:  node remote-control.js                ║');
    console.log('║                                                              ║');
    console.log('║   Press S = scan  |  T = scan in 5s  |  D = done            ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    await page.goto(CFG.startUrl,{waitUntil:'networkidle',timeout:CFG.pageLoadTimeout});
    console.log(`📍 Browser open at: ${CFG.startUrl}`);
    console.log(`⏳ Waiting for triggers from remote-control...\n`);
    while(true){
      const t=await waitTrigger(CFG.pollInterval);
      if(t==='done'){console.log('\n📋 DONE signal received.');break;}
      n++;const customName=readScanFile();deleteScanTrigger();
      const scanName=customName||`Scan ${n}: ${await page.title().catch(()=>page.url())}`;
      console.log(`🔍 Scan #${n}: "${scanName}"`);
      try{const scan=await scanDOM(page,scanName);scans.push(scan);
        const v=scan.elements.filter((e:any)=>e.isVisible);
        console.log(`   ✅ ${v.length} visible | 🔽 ${v.filter((e:any)=>e.category==='dropdown').length} dropdowns | 📦 ${v.filter((e:any)=>e.category==='modal').length} modals | 🔘 ${v.filter((e:any)=>e.category==='button').length} buttons`);
        if(scan.shadowRoots)console.log(`   ⚡ ${scan.shadowRoots} shadow roots`);
      }catch(e){console.log(`   ❌ Failed: ${e}`);}
      console.log(`   👉 Continue browsing.\n`);}
    if(scans.length){const md=genReport(scans);
      fs.writeFileSync(path.join(CFG.outputDir,'page-inventory-latest.md'),md,'utf-8');
      fs.writeFileSync(path.join(CFG.outputDir,`page-inventory-${new Date().toISOString().replace(/[:.]/g,'-')}.md`),md,'utf-8');
      fs.writeFileSync(path.join(CFG.outputDir,'page-inventory-latest.json'),JSON.stringify(scans,null,2),'utf-8');
      console.log(`\n📄 Reports: ${path.resolve(CFG.outputDir)}/`);
      console.log(`✅ ${scans.length} scans captured.`);
    }else console.log('\n⚠️ No scans.');
  });
});
