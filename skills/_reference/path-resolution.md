# Path Resolution — Canonical File Paths

Every skill that reads or writes files MUST use these canonical path patterns. Resolve paths once at the start of each pipeline stage.

## Input Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `scenario` | Yes | — | Scenario filename without `.md` (e.g., `saucedemo-cart-feature`) |
| `type` | Yes | `web` | `web`, `api`, or `hybrid` |
| `folder` | No | — | Subfolder within `scenarios/{type}/` (e.g., `cart`, `auth`, `purchase`) |

## Scenario Source Files

```
SCENARIO_PATH:
  With folder:    scenarios/{type}/{folder}/{scenario}.md
  Without folder: scenarios/{type}/{scenario}.md

SWAGGER_SPEC (API only):
  With folder:    scenarios/api/{folder}/swagger-specs/{spec-file}.json
  Without folder: scenarios/api/swagger-specs/{spec-file}.json
```

## Pipeline Reports

```
ANALYST_REPORT:
  With folder:    output/{folder}/analyst-report-{scenario}.md
  Without folder: output/analyst-report-{scenario}.md

GENERATOR_REPORT:
  With folder:    output/{folder}/generator-report-{scenario}.md
  Without folder: output/generator-report-{scenario}.md

HEALER_REPORT:
  With folder:    output/{folder}/healer-report-{scenario}.md
  Without folder: output/healer-report-{scenario}.md

REVIEW_SCORECARD:
  With folder:    output/{folder}/review-scorecard-{scenario}.md
  Without folder: output/review-scorecard-{scenario}.md

HEALER_REVIEW_REPORT:
  With folder:    output/{folder}/healer-review-fixes-report-{scenario}.md
  Without folder: output/healer-review-fixes-report-{scenario}.md

PIPELINE_SUMMARY:
  With folder:    output/{folder}/pipeline-summary-{scenario}.md
  Without folder: output/pipeline-summary-{scenario}.md
```

## Generated Framework Files

```
TEST_SPEC:
  Web/Hybrid with folder:    output/tests/web/{folder}/{scenario}.spec.ts
  Web/Hybrid without folder: output/tests/web/{scenario}.spec.ts
  API with folder:           output/tests/api/{folder}/{scenario}.spec.ts
  API without folder:        output/tests/api/{scenario}.spec.ts

LOCATORS:          output/locators/{page-name}.locators.json
PAGE_OBJECTS:      output/pages/{PageName}Page.ts
HELPER_FILES:      output/pages/{PageName}Page.helpers.ts   (team-owned, read-only)

TEST_DATA:
  Scenario-specific: output/test-data/{type}/{scenario}.json
  Shared:            output/test-data/shared/{name}.json
  Datasets:          output/test-data/{dataset-name}.json

CORE_FILES:        output/core/locator-loader.ts
                   output/core/base-page.ts
                   output/core/shared-state.ts
                   output/core/test-data-loader.ts

CONFIG:            output/playwright.config.ts
                   output/package.json
                   output/tsconfig.json
                   output/.env.example
```

## Scout Reports

```
SCOUT_REPORT:
  With folder:    scout-reports/{folder}/{scenario}-page-inventory-latest.md
  Without folder: scout-reports/{scenario}-page-inventory-latest.md
```

## Healer Test Commands

Always run ONLY the current scenario's spec file:

```bash
# With folder:
npx playwright test tests/{type}/{folder}/{scenario}.spec.ts --project=chrome --reporter=list

# Without folder:
npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list
```

Never run `npx playwright test` without a file path — it will execute ALL tests.
