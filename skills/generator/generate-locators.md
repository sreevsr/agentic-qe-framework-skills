# Skill: Generate Locators

## Purpose
Create JSON locator files for each page discovered in the analyst report. Every interactive element gets a primary selector and at least 2 fallbacks.

## References
- `skills/_shared/output-structure.md` — file naming conventions
- `skills/_shared/path-resolution.md` — `LOCATORS` path

## Input
- Analyst report (`analyst-report-{scenario}.md`) — page map with discovered elements
- Scout report — check `output/scout-reports/{folder}/{scenario}-page-inventory-latest.md` first.
  If the file exists, it MUST be used: Scout's SELECTOR fields are authoritative for any element it identifies.
  If the file does not exist, proceed with analyst report alone.

## Process

### Step 1: Read Page Map

From the analyst report, extract all pages and their elements. Each element should have:
- Element name/role
- data-testid (if present)
- id (if present)
- name attribute (if present)
- Visible text
- Element type (input, button, link, select, checkbox)

### Step 2: Create Locator JSON per Page

For each page, create `output/locators/{page-name}.locators.json`:

```json
{
  "elementName": {
    "primary": "[data-testid='value']",
    "fallbacks": [
      "#element-id",
      "[name='value']",
      "role=button[name='Text']"
    ],
    "type": "input|button|link|select|checkbox",
    "description": "Human-readable description"
  }
}
```

### Step 3: Selector Priority

For each element, choose the primary selector using this priority order:

1. `data-testid` → `[data-testid='value']`
2. `id` → `#element-id`
3. `name` → `[name='value']`
4. `role` → `role=button[name='Text']`
5. CSS class → `.class-name` (last resort)

### Step 4: Fallback Requirements

**Minimum 2 fallbacks per element.** Use different selector strategies for resilience:

| Primary Strategy | Good Fallbacks |
|-----------------|----------------|
| data-testid | id, role, text selector |
| id | data-testid, name, role |
| name | id, role, text selector |
| role | id, data-testid, CSS |

### Step 5: Scout Report Enhancement (MANDATORY if Scout report exists)

If a Scout report exists, you MUST use its DOM inventory to:
- **Override** analyst-inferred selectors with Scout-discovered selectors (Scout is authoritative)
- Verify all selectors against the Scout DOM snapshot
- Note interaction patterns (e.g., Fluent UI ComboBox needs specific click sequence) — these are consumed by `generate-pages` skill

## Prohibited Selectors
- No `nth-child` or positional selectors
- No deep CSS paths (more than 2 levels)
- No auto-generated IDs (e.g., `#react-select-12345`)
- No XPath selectors

## Quality Checks
- [ ] Every element has primary + at least 2 fallbacks
- [ ] Primary locators prefer data-testid or id over CSS classes
- [ ] No fragile selectors (nth-child, deep CSS paths, auto-generated IDs)
- [ ] JSON is valid (no trailing commas, proper escaping)
- [ ] File naming: lowercase kebab-case → `{page-name}.locators.json`
