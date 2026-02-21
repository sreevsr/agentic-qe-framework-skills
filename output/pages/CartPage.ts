import { Page } from '@playwright/test';
import { BasePage } from '../core/base-page';

/**
 * CartPage — Page Object for Saucedemo shopping cart screen
 */
export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page, 'cart-page');
  }

  /**
   * Check if Sauce Labs Backpack is visible in the cart
   */
  async isBackpackInCart(): Promise<boolean> {
    try {
      const locator = await this.loc.get('backpackLink');
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if Sauce Labs Bike Light is visible in the cart
   */
  async isBikeLightInCart(): Promise<boolean> {
    try {
      const locator = await this.loc.get('bikeLightLink');
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get the number of items currently in the cart
   */
  async getItemCount(): Promise<number> {
    const cartTable = await this.loc.get('cartTable');
    // Count cart item rows (excluding header)
    const rows = this.page.locator('.cart_item');
    return await rows.count();
  }

  /**
   * Click the "Remove" button for Sauce Labs Backpack
   */
  async removeBackpack(): Promise<void> {
    await this.click('removeBackpack');
  }

  /**
   * Click the "Remove" button for Sauce Labs Bike Light
   */
  async removeBikeLight(): Promise<void> {
    await this.click('removeBikeLight');
  }

  /**
   * Click the "Continue Shopping" button
   */
  async continueShopping(): Promise<void> {
    await this.click('continueShoppingButton');
    await this.page.waitForURL('**/inventory.html');
  }

  /**
   * Click the "Checkout" button
   */
  async checkout(): Promise<void> {
    await this.click('checkoutButton');
  }

  /**
   * Check if cart is empty (no item rows visible)
   */
  async isCartEmpty(): Promise<boolean> {
    const itemCount = await this.getItemCount();
    return itemCount === 0;
  }

  /**
   * Check if the "Your Cart" heading is visible
   */
  async isCartHeadingVisible(): Promise<boolean> {
    return await this.isVisible('cartHeading');
  }

  /**
   * Get the current page URL
   */
  getUrl(): string {
    return this.page.url();
  }
}
