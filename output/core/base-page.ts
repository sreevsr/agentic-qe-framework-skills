import { Page, Locator, expect } from '@playwright/test';
import { LocatorLoader } from './locator-loader';

/** Default timeout for all component interactions (ms). Change this one value to adjust globally. */
const DEFAULT_TIMEOUT = 15000;

/**
 * BasePage — Parent class for all page objects.
 * Provides common interaction methods that use LocatorLoader
 * for automatic selector resolution with fallbacks.
 *
 * Includes component-library-aware methods for multi-step interactions
 * (dropdowns, panels, modals, grids) across Fluent UI, MUI, Ant Design,
 * PrimeNG, Bootstrap, and Kendo UI.
 */
export class BasePage {
  protected loc: LocatorLoader;

  constructor(protected page: Page, pageName: string) {
    this.loc = new LocatorLoader(page, pageName);
  }

  // ════════════════════════════════════════════════════════════════════
  // BASIC ELEMENT INTERACTIONS (existing — unchanged)
  // ════════════════════════════════════════════════════════════════════

  /** Click an element by its name in the locator JSON. */
  async click(elementName: string): Promise<void> {
    const locator = await this.loc.get(elementName);
    await locator.click();
  }

  /** Fill a text input by its name in the locator JSON. */
  async fill(elementName: string, value: string): Promise<void> {
    const locator = await this.loc.get(elementName);
    await locator.fill(value);
  }

  /** Get visible text content of an element. */
  async getText(elementName: string): Promise<string> {
    const locator = await this.loc.get(elementName);
    return (await locator.textContent()) ?? '';
  }

  /** Check if an element is visible on the page. */
  async isVisible(elementName: string): Promise<boolean> {
    try {
      const locator = await this.loc.get(elementName);
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /** Select an option from a native HTML <select>. */
  async selectOption(elementName: string, value: string): Promise<void> {
    const locator = await this.loc.get(elementName);
    await locator.selectOption(value);
  }

  /** Check a checkbox or radio button. */
  async check(elementName: string): Promise<void> {
    const locator = await this.loc.get(elementName);
    await locator.check();
  }

  /** Uncheck a checkbox. */
  async uncheck(elementName: string): Promise<void> {
    const locator = await this.loc.get(elementName);
    await locator.uncheck();
  }

  /** Hover over an element. */
  async hover(elementName: string): Promise<void> {
    const locator = await this.loc.get(elementName);
    await locator.hover();
  }

  /** Get an element locator for advanced usage. */
  async getElement(elementName: string): Promise<Locator> {
    return await this.loc.get(elementName);
  }

  /** Wait for an element to reach a specific state. */
  async waitForElement(elementName: string, state: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible', timeout = 30000): Promise<void> {
    const locator = await this.loc.get(elementName);
    await locator.waitFor({ state, timeout });
  }

  /** Navigate to a URL and wait for load. */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    try {
      await this.page.waitForLoadState('networkidle');
    } catch {
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /** Wait for page to finish loading. */
  async waitForPageLoad(): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle');
    } catch {
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /** Get the current page URL. */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /** Take a screenshot with a descriptive name. */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  // ════════════════════════════════════════════════════════════════════
  // FLUENT UI — Multi-step component interactions
  // ════════════════════════════════════════════════════════════════════

  /**
   * Fluent UI ComboBox — select an option.
   * Pattern: click caret → wait for callout options → click matching option → wait for reload
   *
   * @param wrapperSelector - The ComboBox wrapper (e.g., '#ComboBox21wrapper' or '.ms-ComboBox')
   * @param optionText - Visible text of the option to select
   * @param options - useTypeToFilter: type in input instead of clicking caret
   */
  async fluentComboBoxSelect(
    wrapperSelector: string,
    optionText: string,
    options: { timeout?: number; useTypeToFilter?: boolean } = {}
  ): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;

    if (options.useTypeToFilter) {
      const input = this.page.locator(`${wrapperSelector} input.ms-ComboBox-Input`);
      await input.click();
      await input.fill('');
      await input.fill(optionText);
    } else {
      const caret = this.page.locator(`${wrapperSelector} button.ms-ComboBox-CaretDown-button`);
      await caret.click();
    }

    await this.page.waitForSelector('.ms-Callout [role="option"]', { timeout });
    await this.page.locator(`[role="option"]:has-text("${optionText}")`).first().click();
    await this.waitForPageLoad();
  }

  /**
   * Fluent UI Dropdown — select from a standard dropdown.
   * Pattern: click container → wait for listbox → click option
   */
  async fluentDropdownSelect(
    dropdownSelector: string,
    optionText: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(dropdownSelector).click();
    await this.page.waitForSelector('[role="listbox"] [role="option"]', { timeout });
    await this.page.locator(`[role="option"]:has-text("${optionText}")`).first().click();
    await this.waitForPageLoad();
  }

  /**
   * Fluent UI ContextualMenu — select a menu item.
   * Pattern: click trigger → wait for menu → click menuitem
   */
  async fluentMenuSelect(
    triggerSelector: string,
    menuItemText: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(triggerSelector).click();
    await this.page.waitForSelector('[role="menu"]', { timeout });
    await this.page.getByRole('menuitem', { name: menuItemText }).click();
  }

  /**
   * Fluent UI CommandBar button — click a command bar item, then select from its menu.
   * CommandBar menus may use role="option", role="menuitem", role="menuitemcheckbox",
   * role="menuitemradio", or Fluent-specific .ms-ContextualMenu-link elements.
   * This method tries all variants.
   */
  async fluentCommandBarSelect(
    buttonText: string,
    menuItemText: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(`button.ms-Button:has-text("${buttonText}")`).click();

    // CommandBar menus can use different ARIA roles — try all common ones
    const optionLocator = this.page.locator([
      `[role="option"]:has-text("${menuItemText}")`,
      `[role="menuitem"]:has-text("${menuItemText}")`,
      `[role="menuitemcheckbox"]:has-text("${menuItemText}")`,
      `[role="menuitemradio"]:has-text("${menuItemText}")`,
      `.ms-ContextualMenu-link:has-text("${menuItemText}")`,
      `.ms-Callout button:has-text("${menuItemText}")`,
    ].join(', ')).first();

    await optionLocator.waitFor({ state: 'visible', timeout });
    await optionLocator.click();
    await this.waitForPageLoad();
  }

  /**
   * Fluent UI Panel — wait for panel to open.
   */
  async fluentWaitForPanel(options: { timeout?: number; headerText?: string } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const panel = this.page.locator('div.ms-Panel');
    await panel.waitFor({ state: 'visible', timeout });
    if (options.headerText) {
      await this.page.locator(`div.ms-Panel-header:has-text("${options.headerText}")`).waitFor({ state: 'visible', timeout });
    }
    return panel;
  }

  /**
   * Fluent UI Panel — close via Close button or Escape.
   */
  async fluentClosePanel(): Promise<void> {
    const closeBtn = this.page.locator('div.ms-Panel button[aria-label="Close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.page.locator('div.ms-Panel').waitFor({ state: 'hidden', timeout: DEFAULT_TIMEOUT });
  }

  /**
   * Fluent UI Modal/Dialog — wait for it to appear.
   */
  async fluentWaitForDialog(options: { timeout?: number } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout });
    return dialog;
  }

  /**
   * Fluent UI Modal/Dialog — close.
   */
  async fluentCloseDialog(): Promise<void> {
    const closeBtn = this.page.locator('[role="dialog"] button[aria-label="Close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Fluent UI DetailsList — click a row by text content.
   */
  async fluentGridClickRow(
    gridSelector: string,
    rowText: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const row = this.page.locator(`${gridSelector} [role="row"]:has-text("${rowText}")`);
    await row.waitFor({ state: 'visible', timeout });
    await row.click();
  }

  /**
   * Fluent UI DetailsList — count data rows (excludes header).
   */
  async fluentGridRowCount(gridSelector: string): Promise<number> {
    const rows = this.page.locator(`${gridSelector} [role="row"]`);
    const total = await rows.count();
    return Math.max(0, total - 1);
  }

  /**
   * Fluent UI Nav — click a navigation link by text.
   */
  async fluentNavClick(linkText: string): Promise<void> {
    await this.page.locator(`a.ms-Nav-link:has-text("${linkText}")`).click();
  }

  /**
   * Fluent UI SearchBox — type into search and submit.
   */
  async fluentSearchBoxFill(searchSelector: string, text: string): Promise<void> {
    const input = this.page.locator(`${searchSelector} input, ${searchSelector}`).first();
    await input.fill(text);
    await input.press('Enter');
  }

  // ════════════════════════════════════════════════════════════════════
  // MATERIAL UI (MUI)
  // ════════════════════════════════════════════════════════════════════

  /** MUI Select — click select → wait listbox → click option */
  async muiSelectOption(selectSelector: string, optionText: string, options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(`${selectSelector} div.MuiSelect-select, ${selectSelector}`).first().click();
    await this.page.waitForSelector('[role="listbox"]', { timeout });
    await this.page.locator(`[role="option"]:has-text("${optionText}")`).first().click();
    await this.waitForPageLoad();
  }

  /** MUI Autocomplete — type and select */
  async muiAutocompleteSelect(autocompleteSelector: string, optionText: string, options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const input = this.page.locator(`${autocompleteSelector} input`);
    await input.click();
    await input.fill(optionText);
    await this.page.waitForSelector('[role="listbox"]', { timeout });
    await this.page.locator(`[role="option"]:has-text("${optionText}")`).first().click();
  }

  /** MUI Dialog — wait for it */
  async muiWaitForDialog(options: { timeout?: number } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout });
    return dialog;
  }

  /** MUI Dialog — close */
  async muiCloseDialog(): Promise<void> {
    const closeBtn = this.page.locator('[role="dialog"] button[aria-label="close"]');
    if (await closeBtn.isVisible()) { await closeBtn.click(); } else { await this.page.keyboard.press('Escape'); }
  }

  // ════════════════════════════════════════════════════════════════════
  // ANT DESIGN
  // ════════════════════════════════════════════════════════════════════

  /** Ant Select — click selector → wait dropdown → click option */
  async antSelectOption(selectSelector: string, optionText: string, options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(`${selectSelector} .ant-select-selector, ${selectSelector}`).first().click();
    await this.page.waitForSelector('.ant-select-dropdown', { timeout });
    await this.page.locator(`.ant-select-item-option:has-text("${optionText}")`).first().click();
    await this.waitForPageLoad();
  }

  /** Ant Modal — wait */
  async antWaitForModal(options: { timeout?: number } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const modal = this.page.locator('.ant-modal');
    await modal.waitFor({ state: 'visible', timeout });
    return modal;
  }

  /** Ant Modal — close */
  async antCloseModal(): Promise<void> { await this.page.locator('.ant-modal-close').click(); }

  /** Ant Drawer — wait */
  async antWaitForDrawer(options: { timeout?: number } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const drawer = this.page.locator('.ant-drawer');
    await drawer.waitFor({ state: 'visible', timeout });
    return drawer;
  }

  /** Ant Drawer — close */
  async antCloseDrawer(): Promise<void> { await this.page.locator('.ant-drawer-close').click(); }

  // ════════════════════════════════════════════════════════════════════
  // PRIMENG / PRIMEREACT
  // ════════════════════════════════════════════════════════════════════

  /** Prime Dropdown — click → wait panel → click item */
  async primeDropdownSelect(dropdownSelector: string, optionText: string, options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(dropdownSelector).click();
    await this.page.waitForSelector('.p-dropdown-panel', { timeout });
    await this.page.locator(`.p-dropdown-item:has-text("${optionText}")`).first().click();
  }

  /** Prime Dialog — wait and close */
  async primeWaitForDialog(options: { timeout?: number } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const dialog = this.page.locator('.p-dialog');
    await dialog.waitFor({ state: 'visible', timeout });
    return dialog;
  }

  async primeCloseDialog(): Promise<void> { await this.page.locator('.p-dialog-header-close').click(); }

  // ════════════════════════════════════════════════════════════════════
  // BOOTSTRAP
  // ════════════════════════════════════════════════════════════════════

  /** Bootstrap Dropdown — click toggle → wait menu → click item */
  async bootstrapDropdownSelect(toggleSelector: string, itemText: string, options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(toggleSelector).click();
    await this.page.waitForSelector('.dropdown-menu.show', { timeout });
    await this.page.locator(`.dropdown-item:has-text("${itemText}")`).first().click();
  }

  /** Bootstrap Modal — wait and close */
  async bootstrapWaitForModal(options: { timeout?: number } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const modal = this.page.locator('.modal.show');
    await modal.waitFor({ state: 'visible', timeout });
    return modal;
  }

  async bootstrapCloseModal(): Promise<void> { await this.page.locator('[data-bs-dismiss="modal"]').first().click(); }

  // ════════════════════════════════════════════════════════════════════
  // KENDO UI
  // ════════════════════════════════════════════════════════════════════

  /** Kendo DropDown — click wrap → wait animation → click item */
  async kendoDropdownSelect(dropdownSelector: string, itemText: string, options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    await this.page.locator(`${dropdownSelector} .k-dropdown-wrap, ${dropdownSelector}`).first().click();
    await this.page.waitForSelector('.k-animation-container', { timeout });
    await this.page.locator(`.k-item:has-text("${itemText}")`).first().click();
  }

  /** Kendo ComboBox — select with optional type-to-filter */
  async kendoComboBoxSelect(comboboxSelector: string, itemText: string, options: { timeout?: number; useTypeToFilter?: boolean } = {}): Promise<void> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    if (options.useTypeToFilter) {
      const input = this.page.locator(`${comboboxSelector} input`);
      await input.click();
      await input.fill(itemText);
    } else {
      await this.page.locator(`${comboboxSelector} .k-dropdown-wrap, ${comboboxSelector}`).first().click();
    }
    await this.page.waitForSelector('.k-animation-container', { timeout });
    await this.page.locator(`.k-item:has-text("${itemText}")`).first().click();
  }

  /** Kendo Dialog — wait and close */
  async kendoWaitForDialog(options: { timeout?: number } = {}): Promise<Locator> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const dialog = this.page.locator('.k-dialog');
    await dialog.waitFor({ state: 'visible', timeout });
    return dialog;
  }

  async kendoCloseDialog(): Promise<void> { await this.page.locator('.k-dialog-close').click(); }
}
