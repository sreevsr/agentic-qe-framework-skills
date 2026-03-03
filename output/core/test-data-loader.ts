import * as fs from 'fs';
import * as path from 'path';

const TEST_DATA_DIR = path.resolve(__dirname, '..', 'test-data');
const SHARED_DIR = path.join(TEST_DATA_DIR, 'shared');

/**
 * Load and merge test data from shared and scenario-specific sources.
 *
 * Resolution order (last wins):
 *   1. Shared data files (test-data/shared/*.json) — reusable across scenarios
 *   2. Scenario-specific file (test-data/{type}/{scenario}.json) — overrides shared values
 *
 * @param scenarioPath - Relative path under test-data/, e.g. "web/saucedemo-checkout"
 * @param sharedFiles  - Names of shared data files to load (without .json), e.g. ["users", "products"]
 * @returns Merged test data object with scenario values overriding shared values
 *
 * @example
 * // Load shared users + products, then overlay scenario-specific data
 * const data = loadTestData('web/saucedemo-checkout', ['users', 'products']);
 * // data.testUsers comes from shared/users.json (unless scenario overrides it)
 * // data.expectedCalculations comes from scenario JSON only
 *
 * @example
 * // No shared data — behaves exactly like a direct JSON import
 * const data = loadTestData('api/posts-crud');
 */
export function loadTestData(scenarioPath: string, sharedFiles: string[] = []): Record<string, any> {
  let merged: Record<string, any> = {};

  // Layer 1: Load shared data files (if they exist)
  for (const name of sharedFiles) {
    const sharedFile = path.join(SHARED_DIR, `${name}.json`);
    if (fs.existsSync(sharedFile)) {
      const data = JSON.parse(fs.readFileSync(sharedFile, 'utf-8'));
      merged = { ...merged, ...data };
    }
  }

  // Layer 2: Load scenario-specific data (overrides shared values)
  const scenarioFile = path.join(TEST_DATA_DIR, `${scenarioPath}.json`);
  if (fs.existsSync(scenarioFile)) {
    const data = JSON.parse(fs.readFileSync(scenarioFile, 'utf-8'));
    merged = { ...merged, ...data };
  }

  return merged;
}

/**
 * Load a single shared data file by name.
 *
 * @param name - Shared data file name without .json (e.g. "users", "products")
 * @returns Parsed JSON contents
 * @throws Error if the shared data file doesn't exist
 *
 * @example
 * const users = loadSharedData('users');
 * // users.standard.username → "standard_user"
 */
export function loadSharedData(name: string): Record<string, any> {
  const filePath = path.join(SHARED_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Shared data file not found: ${filePath}. ` +
      `Create it in test-data/shared/${name}.json`
    );
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
