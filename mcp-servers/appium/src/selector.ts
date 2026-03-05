/**
 * Supported Appium locator strategies.
 *
 * Priority order for element resolution (highest reliability first):
 *   accessibility_id > id > xpath > uiautomator (Android) > class_chain (iOS) > predicate_string (iOS)
 */
export type Strategy =
  | 'accessibility_id'
  | 'id'
  | 'xpath'
  | 'uiautomator'
  | 'class_chain'
  | 'predicate_string';

/**
 * Converts a strategy + value pair into a WebdriverIO selector string.
 *
 * WebdriverIO selector prefixes:
 *   ~value              → accessibility id (cross-platform)
 *   //xpath             → XPath (passed as-is)
 *   android=selector    → Android UIAutomator2 selector
 *   -ios class chain:   → iOS XCUITest class chain
 *   -ios predicate string: → iOS predicate string
 *   id=resource-id      → Android resource-id (full qualified form)
 */
export function buildSelector(strategy: Strategy, value: string): string {
  switch (strategy) {
    case 'accessibility_id':
      return `~${value}`;

    case 'id':
      // Android resource-id is in format "com.package:id/element_id"
      // WebdriverIO accepts it directly via id= prefix
      return value.includes(':id/') ? `id=${value}` : `~${value}`;

    case 'xpath':
      return value;

    case 'uiautomator':
      // value should be a UIAutomator expression, e.g.: new UiSelector().text("Login")
      return `android=${value}`;

    case 'class_chain':
      // value should be a class chain expression, e.g.: **/XCUIElementTypeButton[`label == "Login"`]
      return `-ios class chain:${value}`;

    case 'predicate_string':
      // value should be a predicate expression, e.g.: label == "Login"
      return `-ios predicate string:${value}`;

    default:
      return value;
  }
}
