# Output Structure — Directory Tree Contract

All scenarios share a single `output/` project. Each scenario adds its files to the shared structure. Do NOT create a separate project folder per scenario.

## Directory Tree

```
output/
├── playwright.config.ts          # Shared config — one per project
├── package.json                  # Shared dependencies — one per project
├── tsconfig.json                 # TypeScript config — one per project
├── .env.example                  # Environment variable template
├── core/                         # Framework infrastructure (from templates/core/)
│   ├── locator-loader.ts         # Resilient selector engine with fallback chain
│   ├── base-page.ts              # Base page object class
│   ├── shared-state.ts           # Cross-scenario state management
│   └── test-data-loader.ts       # Shared data merge utility
├── locators/                     # Per-page JSON locator files
│   └── {page-name}.locators.json # Primary + fallbacks per element
├── pages/                        # Per-page Page Object classes
│   ├── {PageName}Page.ts         # Pipeline-owned (Generator creates/updates)
│   └── {PageName}Page.helpers.ts # Team-owned (NEVER touched by pipeline)
├── tests/
│   ├── web/                      # Web UI test specs
│   │   ├── {scenario}.spec.ts
│   │   └── {folder}/             # When folder parameter is used
│   │       └── {scenario}.spec.ts
│   └── api/                      # API test specs
│       ├── {scenario}.spec.ts
│       └── {folder}/
│           └── {scenario}.spec.ts
├── test-data/
│   ├── shared/                   # Cross-scenario reference data (team-owned)
│   │   ├── users.json            # User personas and credentials
│   │   ├── products.json         # Product catalog with prices
│   │   └── customers.json        # Customer info for forms
│   ├── web/
│   │   └── {scenario}.json       # Scenario-specific overrides
│   ├── api/
│   │   └── {scenario}.json       # Scenario-specific overrides
│   └── {dataset-name}.json       # DATASETS rows (if used)
├── api-services/                 # API service classes (if API tests exist)
│   └── {ServiceName}Service.ts
├── tools/                        # Standalone tools — NOT part of the test suite
│   ├── scout-agent-v4.spec.ts   # Scout DOM reconnaissance scanner
│   └── remote-control.js        # Scout session remote control (Terminal 2)
└── scout-reports/                # Scout DOM inventory reports (gitignored, app-specific)
    ├── {scenario}-page-inventory-latest.md   # Without folder param
    ├── {scenario}-page-inventory-latest.json
    └── {folder}/                             # With folder param
        ├── {scenario}-page-inventory-latest.md
        └── {scenario}-page-inventory-latest.json
```

## File Creation Rules

| File Type | When to Create | When to Skip |
|-----------|---------------|--------------|
| `playwright.config.ts` | Always | Never skip |
| `package.json` | Always | Never skip |
| `tsconfig.json` | Always | Never skip |
| `.env.example` | Always | Never skip |
| `core/*.ts` | Copy from `templates/core/` on first run | If already exists, do NOT overwrite |
| `locators/*.json` | Per page discovered in analyst report | — |
| `pages/*.ts` | Per page discovered in analyst report | — |
| `tests/{type}/*.spec.ts` | Per scenario | — |
| `test-data/shared/*.json` | If data is genuinely reusable AND file doesn't exist | If file already exists |
| `test-data/{type}/{scenario}.json` | If scenario has unique test data | If no scenario-specific data |
| `core/shared-state.ts` | Copy from `templates/core/` on first run | If already exists, do NOT overwrite |
| `core/test-data-loader.ts` | Copy from `templates/core/` on first run | If already exists, do NOT overwrite |
| `tools/` | Pre-existing — do NOT create or modify | — |
| `scout-reports/` | Created automatically by Scout tool | Never created by pipeline |

## File Naming Conventions

- Locator files: lowercase kebab-case matching the page name → `cart-page.locators.json`
- Page objects: PascalCase → `CartPage.ts`
- Helper files: PascalCase with `.helpers.ts` suffix → `CartPage.helpers.ts`
- Test specs: kebab-case matching scenario name → `saucedemo-cart-feature.spec.ts`
- Test data: kebab-case matching scenario name → `saucedemo-cart-feature.json`
- Shared data: lowercase descriptive name → `users.json`, `products.json`
