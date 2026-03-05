import { remote, Browser } from 'webdriverio';

let _driver: Browser | null = null;

/**
 * Returns the active WebdriverIO/Appium driver session.
 * Throws if no session has been started yet (call launch_app first).
 */
export function getDriver(): Browser {
  if (!_driver) {
    throw new Error('No active Appium session. Call launch_app first.');
  }
  return _driver;
}

/**
 * Creates a new Appium session with the given capabilities.
 * If a session already exists, it is closed before creating a new one.
 */
export async function createSession(caps: Record<string, unknown>): Promise<Browser> {
  if (_driver) {
    try {
      await _driver.deleteSession();
    } catch {
      // session may already be dead
    }
    _driver = null;
  }

  _driver = await remote({
    hostname: process.env.APPIUM_HOST || 'localhost',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    path: '/',
    capabilities: caps as WebdriverIO.Capabilities,
    logLevel: 'warn',
    connectionRetryCount: 3,
    connectionRetryTimeout: 30000,
  });

  return _driver;
}

/**
 * Closes the active Appium session and clears the driver reference.
 */
export async function closeSession(): Promise<void> {
  if (_driver) {
    try {
      await _driver.deleteSession();
    } catch {
      // ignore cleanup errors
    }
    _driver = null;
  }
}

/**
 * Returns true if there is an active session.
 */
export function hasSession(): boolean {
  return _driver !== null;
}
