import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.resolve(__dirname, '..', 'test-data', 'shared-state.json');

/**
 * Save a value to shared state for use by other test scenarios.
 * @param key - The key to store the value under
 * @param value - The value to store
 */
export function saveState(key: string, value: string): void {
  let state: Record<string, string> = {};

  // Ensure test-data directory exists
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing state
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }

  state[key] = value;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Load a value from shared state that was saved by a previous scenario.
 * @param key - The key to retrieve
 * @returns The stored value
 * @throws Error if the key doesn't exist
 */
export function loadState(key: string): string {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      `Shared state file not found at ${STATE_FILE}. ` +
      `Run the dependent scenario first.`
    );
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

  if (!(key in state)) {
    throw new Error(
      `Key "${key}" not found in shared state. ` +
      `Available keys: ${Object.keys(state).join(', ')}. ` +
      `Run the dependent scenario first.`
    );
  }

  return state[key];
}
