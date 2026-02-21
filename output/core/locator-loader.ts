import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface LocatorEntry {
  primary: string;
  fallbacks: string[];
  type?: string;
}

interface LocatorFile {
  [elementName: string]: LocatorEntry;
}

/**
 * LocatorLoader — Loads element selectors from JSON files.
 * Tries primary selector first, then fallbacks in order.
 * All selector changes happen in JSON — zero code changes needed.
 */
export class LocatorLoader {
  private locators: LocatorFile;
  private pageName: string;

  constructor(private page: Page, pageName: string) {
    this.pageName = pageName;
    this.locators = this.loadLocators(pageName);
  }

  private loadLocators(pageName: string): LocatorFile {
    const locatorPath = path.resolve(__dirname, '..', 'locators', `${pageName}.locators.json`);
    if (!fs.existsSync(locatorPath)) {
      throw new Error(`Locator file not found: ${locatorPath}`);
    }
    const raw = fs.readFileSync(locatorPath, 'utf-8');
    return JSON.parse(raw) as LocatorFile;
  }

  /**
   * Get a Playwright Locator for the named element.
   * Tries primary selector first. If it finds zero matches,
   * tries each fallback in order.
   */
  async get(elementName: string): Promise<Locator> {
    const entry = this.locators[elementName];
    if (!entry) {
      throw new Error(`Element "${elementName}" not found in ${this.pageName}.locators.json`);
    }

    const selectors = [entry.primary, ...entry.fallbacks];

    for (const selector of selectors) {
      try {
        const locator = this.resolve(selector);
        const count = await locator.count();
        if (count > 0) {
          return locator;
        }
      } catch {
        // Selector invalid or not found, try next
        continue;
      }
    }

    throw new Error(
      `All selectors failed for "${elementName}" on page "${this.pageName}". ` +
      `Tried: ${selectors.join(', ')}`
    );
  }

  /**
   * Resolve a selector string to a Playwright Locator.
   * Supports role= prefix for getByRole convenience.
   */
  private resolve(selector: string): Locator {
    // Role-based: "role=button[name='Submit']"
    if (selector.startsWith('role=')) {
      const match = selector.match(/^role=(\w+)\[name='(.+)'\]$/);
      if (match) {
        return this.page.getByRole(match[1] as any, { name: match[2] });
      }
    }

    // Label-based: "label=Email"
    if (selector.startsWith('label=')) {
      return this.page.getByLabel(selector.replace('label=', ''));
    }

    // Placeholder-based: "placeholder=Enter email"
    if (selector.startsWith('placeholder=')) {
      return this.page.getByPlaceholder(selector.replace('placeholder=', ''));
    }

    // Text-based: "text=Welcome"
    if (selector.startsWith('text=')) {
      return this.page.getByText(selector.replace('text=', ''));
    }

    // TestId-based: "testid=submit-btn"
    if (selector.startsWith('testid=')) {
      return this.page.getByTestId(selector.replace('testid=', ''));
    }

    // Default: CSS selector or XPath
    return this.page.locator(selector);
  }
}
