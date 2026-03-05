import { MobileLocatorLoader } from './locator-loader-mobile';

/** Default timeout for all mobile element interactions (ms). */
const DEFAULT_TIMEOUT = 15000;

/**
 * BaseScreen — Parent class for all mobile Screen Objects.
 *
 * Provides common interaction methods that use MobileLocatorLoader
 * for automatic selector resolution with fallbacks across strategies
 * (accessibility_id → id → xpath → uiautomator/class_chain).
 *
 * Rules:
 * - Never use raw selectors (driver.$('selector')) in Screen Objects
 * - Never use driver.pause() — use waitForElement() instead
 * - All element access goes through this.loc.get('key')
 */
export class BaseScreen {
  protected loc: MobileLocatorLoader;

  constructor(
    protected driver: WebdriverIO.Browser,
    screenName: string,
  ) {
    this.loc = new MobileLocatorLoader(driver, screenName);
  }

  // ════════════════════════════════════════════════════════════════════
  // BASIC ELEMENT INTERACTIONS
  // ════════════════════════════════════════════════════════════════════

  /** Tap (click) an element by its key in the locator JSON. */
  async tap(elementKey: string): Promise<void> {
    const el = await this.loc.get(elementKey);
    await el.click();
  }

  /** Type text into an element (clears it first). */
  async typeText(elementKey: string, text: string): Promise<void> {
    const el = await this.loc.get(elementKey);
    await el.clearValue();
    await el.setValue(text);
  }

  /** Get the visible text of an element. */
  async getText(elementKey: string): Promise<string> {
    const el = await this.loc.get(elementKey);
    return (await el.getText()) ?? '';
  }

  /** Get an element attribute value. */
  async getAttribute(elementKey: string, attribute: string): Promise<string> {
    const el = await this.loc.get(elementKey);
    return (await el.getAttribute(attribute)) ?? '';
  }

  /** Check if an element is currently visible on screen. */
  async isVisible(elementKey: string): Promise<boolean> {
    try {
      const el = await this.loc.get(elementKey);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Wait for an element to reach a specific state.
   * Uses a retry loop because MobileLocatorLoader.get() throws if the element
   * doesn't exist yet — we need to retry the lookup until the element appears.
   */
  async waitForElement(
    elementKey: string,
    state: 'displayed' | 'hidden' | 'exist' | 'not exist' = 'displayed',
    timeout = DEFAULT_TIMEOUT,
  ): Promise<void> {
    const interval = 500;
    const deadline = Date.now() + timeout;
    let lastError: Error | undefined;

    while (Date.now() < deadline) {
      try {
        const el = await this.loc.get(elementKey);
        switch (state) {
          case 'displayed':
            await el.waitForDisplayed({ timeout: Math.max(deadline - Date.now(), 1000) });
            return;
          case 'hidden':
            await el.waitForDisplayed({ timeout: Math.max(deadline - Date.now(), 1000), reverse: true });
            return;
          case 'exist':
            await el.waitForExist({ timeout: Math.max(deadline - Date.now(), 1000) });
            return;
          case 'not exist':
            await el.waitForExist({ timeout: Math.max(deadline - Date.now(), 1000), reverse: true });
            return;
        }
      } catch (err) {
        lastError = err as Error;
        if (Date.now() >= deadline) break;
        await this.driver.pause(interval);
      }
    }
    throw lastError ?? new Error(`Element "${elementKey}" did not reach state "${state}" within ${timeout}ms`);
  }

  // ════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ════════════════════════════════════════════════════════════════════

  /** Press the device back button (Android) or navigate back (iOS). */
  async goBack(): Promise<void> {
    const caps = this.driver.capabilities as Record<string, unknown>;
    const platform = (caps['platformName'] as string || '').toLowerCase();

    if (platform.includes('ios')) {
      await this.driver.executeScript('mobile: pressButton', [{ name: 'back' }]);
    } else {
      await this.driver.back();
    }
  }

  /** Press the home button. */
  async goHome(): Promise<void> {
    const caps = this.driver.capabilities as Record<string, unknown>;
    const platform = (caps['platformName'] as string || '').toLowerCase();

    if (platform.includes('ios')) {
      await this.driver.executeScript('mobile: pressButton', [{ name: 'home' }]);
    } else {
      await this.driver.pressKeyCode(3); // Android HOME
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // GESTURES
  // ════════════════════════════════════════════════════════════════════

  /** Swipe in a direction. */
  async swipe(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    const positions = {
      up:    { startX: 200, startY: 500, endX: 200, endY: 200 },
      down:  { startX: 200, startY: 200, endX: 200, endY: 500 },
      left:  { startX: 350, startY: 400, endX: 50,  endY: 400 },
      right: { startX: 50,  startY: 400, endX: 350, endY: 400 },
    };
    const { startX, startY, endX, endY } = positions[direction];

    await this.driver.action('pointer')
      .move({ duration: 0, origin: 'viewport', x: startX, y: startY })
      .down({ button: 0 })
      .pause(100)
      .move({ duration: 600, origin: 'viewport', x: endX, y: endY })
      .up({ button: 0 })
      .perform();
  }

  /** Scroll down until the given element key is visible (max 10 attempts). */
  async scrollToElement(elementKey: string, direction: 'down' | 'up' = 'down', maxScrolls = 10): Promise<void> {
    for (let i = 0; i < maxScrolls; i++) {
      if (await this.isVisible(elementKey)) return;
      await this.swipe(direction);
      await this.driver.pause(300);
    }
    throw new Error(`Element "${elementKey}" not visible after ${maxScrolls} scrolls.`);
  }

  /** Long-press an element. */
  async longPress(elementKey: string, durationMs = 1500): Promise<void> {
    const el = await this.loc.get(elementKey);
    const location = await el.getLocation();
    const size = await el.getSize();
    const x = Math.round(location.x + size.width / 2);
    const y = Math.round(location.y + size.height / 2);

    await this.driver.action('pointer')
      .move({ duration: 0, origin: 'viewport', x, y })
      .down({ button: 0 })
      .pause(durationMs)
      .up({ button: 0 })
      .perform();
  }

  // ════════════════════════════════════════════════════════════════════
  // EVIDENCE
  // ════════════════════════════════════════════════════════════════════

  /** Take a screenshot and save it to test-results/screenshots/{name}.png */
  async takeScreenshot(name: string): Promise<string> {
    const base64 = await this.driver.takeScreenshot();
    const filePath = `test-results/screenshots/${name}.png`;

    const fs = await import('fs');
    const path = await import('path');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

    return filePath;
  }
}
