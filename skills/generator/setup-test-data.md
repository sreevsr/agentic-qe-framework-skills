# Skill: Setup Test Data

## Purpose
Create test data JSON files — both shared reference data (reusable across scenarios) and scenario-specific data. Manage the separation between shared and scenario-specific values.

## References
- `skills/_shared/output-structure.md` — test-data directory structure
- `skills/_shared/guardrails.md` — shared data protection rules

## Process

### Step 1: Check Existing Shared Data

Read `output/test-data/shared/` to see what reference data already exists. Common files:
- `users.json` — user personas and credentials
- `products.json` — product catalog with prices
- `customers.json` — customer info for checkout forms
- `api-entities.json` — API request body templates

**If a shared file already exists, do NOT overwrite it.** Another scenario already created it.

### Step 2: Create Shared Data (if needed)

Create shared data files ONLY if the data is genuinely reusable (not scenario-specific expected values).

**When to create:**
- User personas / login credentials → `test-data/shared/users.json`
- Product catalogs / item lists → `test-data/shared/products.json`
- Common customer info → `test-data/shared/customers.json`
- API entity templates → `test-data/shared/api-entities.json`

**Format:**
```json
{
  "standard": {
    "username": "standard_user",
    "password": "secret_sauce"
  },
  "locked_out": {
    "username": "locked_out_user",
    "password": "secret_sauce"
  }
}
```

Shared data files go in `output/test-data/shared/` — flat structure, no nesting by type.

### Step 3: Create Scenario-Specific Data

Create `output/test-data/{type}/{scenario}.json` with values unique to THIS scenario:
- Expected calculation results and assertion values
- Scenario-specific product selections or quantities
- Any value that another scenario would NOT reuse as-is

**Do NOT duplicate** values that already exist in shared data files. If `shared/users.json` has the standard user credentials, the scenario JSON should NOT repeat them.

### Step 4: Create Dataset Files (if DATASETS keyword used)

If the scenario has a DATASETS markdown table, create a JSON array:

```json
[
  { "username": "standard_user", "password": "secret_sauce", "expectedResult": "success" },
  { "username": "locked_out_user", "password": "secret_sauce", "expectedResult": "locked" },
  { "username": "", "password": "secret_sauce", "expectedResult": "error" }
]
```

Save as `output/test-data/{dataset-name}.json`.

### Step 5: Import Pattern Determination

Based on what was created, determine the correct import pattern for the spec:

**With SHARED_DATA keyword:**
```typescript
import { loadTestData } from '../../core/test-data-loader';
const testData = loadTestData('web/{scenario}', ['users', 'products']);
```

**Without SHARED_DATA (backward compatible):**
```typescript
import testData from '../../test-data/web/{scenario}.json';
```

**DATASETS:**
```typescript
import testData from '../../test-data/{dataset-name}.json';
```

## Quality Checks
- [ ] Shared files not overwritten if already existing
- [ ] Scenario JSON does not duplicate values from shared files
- [ ] DATASETS produce JSON arrays with all rows from the markdown table
- [ ] No hardcoded credentials in test data — use `process.env` references
- [ ] File naming follows conventions from `output-structure.md`
