import * as fs from 'fs';
import * as path from 'path';

/**
 * Supported Appium locator strategies.
 * Priority: accessibility_id > id > xpath > uiautomator (Android) > class_chain (iOS) > predicate_string (iOS)
 */
export type MobileStrategy =
  | 'accessibility_id'
  | 'id'
  | 'xpath'
  | 'uiautomator'
  | 'class_chain'
  | 'predicate_string';

export interface MobileLocatorEntry {
  accessibility_id?: string;
  id?: string;
  xpath?: string;
  uiautomator?: string;
  class_chain?: string;
  predicate_string?: string;
  description?: string;
}

export type MobileLocatorMap = Record<string, MobileLocatorEntry>;

/** Priority order for strategy resolution */
const STRATEGY_PRIORITY: MobileStrategy[] = [
  'accessibility_id',
  'id',
  'xpath',
  'uiautomator',
  'class_chain',
  'predicate_string',
];

/**
 * Converts a strategy + value pair to a WebdriverIO selector string.
 */
export function buildMobileSelector(strategy: MobileStrategy, value: string): string {
  switch (strategy) {
    case 'accessibility_id':
      return `~${value}`;
    case 'id':
      // Full Android resource-id form (e.g. "com.example:id/username") → id= prefix
      return value.includes(':id/') ? `id=${value}` : `~${value}`;
    case 'xpath':
      return value;
    case 'uiautomator':
      return `android=${value}`;
    case 'class_chain':
      return `-ios class chain:${value}`;
    case 'predicate_string':
      return `-ios predicate string:${value}`;
    default:
      return value;
  }
}

/**
 * MobileLocatorLoader — resolves named elements from a locator JSON file
 * for a given screen, trying strategies in priority order.
 *
 * Locator JSON files live at: output/locators/mobile/{screenName}.locators.json
 */
export class MobileLocatorLoader {
  private locators: MobileLocatorMap;

  constructor(
    private driver: WebdriverIO.Browser,
    private screenName: string,
    private locatorsBasePath = path.join(process.cwd(), 'locators', 'mobile'),
  ) {
    this.locators = this.loadLocators();
  }

  private loadLocators(): MobileLocatorMap {
    const filePath = path.join(this.locatorsBasePath, `${this.screenName}.locators.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Locator file not found: ${filePath}\n` +
        `Expected at: locators/mobile/${this.screenName}.locators.json`
      );
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MobileLocatorMap;
  }

  /**
   * Resolves an element by key, trying strategies in priority order.
   * Returns the first WebdriverIO element that exists in the current UI.
   *
   * @throws if the element key is unknown or no strategy resolves to an existing element
   */
  async get(elementKey: string): Promise<WebdriverIO.Element> {
    const entry = this.locators[elementKey];
    if (!entry) {
      throw new Error(
        `Unknown element key "${elementKey}" on screen "${this.screenName}".\n` +
        `Available keys: ${Object.keys(this.locators).join(', ')}`
      );
    }

    const errors: string[] = [];

    for (const strategy of STRATEGY_PRIORITY) {
      const value = entry[strategy];
      if (!value) continue;

      try {
        const selector = buildMobileSelector(strategy, value);
        const el = await this.driver.$(selector);
        if (await el.isExisting()) {
          return el;
        }
        errors.push(`${strategy}="${value}" → element not found in UI`);
      } catch (err) {
        errors.push(`${strategy}="${value}" → ${(err as Error).message}`);
      }
    }

    throw new Error(
      `Element "${elementKey}" on screen "${this.screenName}" could not be resolved.\n` +
      `Tried:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  /**
   * Returns all known element keys for this screen.
   */
  getKeys(): string[] {
    return Object.keys(this.locators);
  }
}
