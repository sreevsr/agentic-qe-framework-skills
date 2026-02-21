import { Page } from '@playwright/test';
import { BasePage } from '../core/base-page';

/**
 * LoginPage — Page Object for Saucedemo login screen
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page, 'login-page');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('https://www.saucedemo.com');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Enter username into the username field
   */
  async fillUsername(username: string): Promise<void> {
    await this.fill('username', username);
  }

  /**
   * Enter password into the password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.fill('password', password);
  }

  /**
   * Click the Login button to submit credentials
   */
  async clickLogin(): Promise<void> {
    await this.click('loginButton');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Complete the full login flow
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }
}
