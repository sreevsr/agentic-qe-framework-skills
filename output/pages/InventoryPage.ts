import { Page } from '@playwright/test';
import { BasePage } from '../core/base-page';

/**
 * InventoryPage — Page Object for Saucedemo inventory/products screen
 */
export class InventoryPage extends BasePage {
  constructor(page: Page) {
    super(page, 'inventory-page');
  }

  /**
   * Click the "Add to cart" button for Sauce Labs Backpack
   */
  async addBackpackToCart(): Promise<void> {
    await this.click('addToCartBackpack');
  }

  /**
   * Click the "Add to cart" button for Sauce Labs Bike Light
   */
  async addBikeLightToCart(): Promise<void> {
    await this.click('addToCartBikeLight');
  }

  /**
   * Get the current cart badge count
   */
  async getCartBadgeCount(): Promise<string> {
    return await this.getText('cartBadge');
  }

  /**
   * Click the shopping cart link to navigate to cart page
   */
  async goToCart(): Promise<void> {
    await this.click('cartLink');
    await this.page.waitForURL('**/cart.html');
  }

  /**
   * Get the current page URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Check if the Products heading is visible
   */
  async isProductsHeadingVisible(): Promise<boolean> {
    return await this.isVisible('productsHeading');
  }
}
