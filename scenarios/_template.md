# Scenario Templates — Type Routing Guide

This framework supports three scenario types. Use the correct template for your type.

## Types

| Type | Template | Pipeline | Fixtures | When to Use |
|------|----------|----------|----------|-------------|
| `web` | [scenarios/web/_template.md](web/_template.md) | Analyst → Generator → Healer → Reviewer | `{ page }` | Browser-only UI tests |
| `api` | [scenarios/api/_template.md](api/_template.md) | Generator → Healer → Reviewer | `{ request }` | REST API tests (no browser) |
| `hybrid` | Use the web template with API steps mixed in | Analyst → Generator → Healer → Reviewer | `{ page, request }` | Tests that combine UI actions and API calls |

## Invocation

```
scenario={name} type={web|api|hybrid} [folder={subfolder}]
```

## Placement

- Web scenarios → `scenarios/web/` or `scenarios/web/{folder}/`
- API scenarios → `scenarios/api/` or `scenarios/api/{folder}/`
- Hybrid scenarios → `scenarios/web/` or `scenarios/web/{folder}/` (they include browser interaction)

## Keyword Quick Reference

All types share the same keyword system. See the type-specific templates for full details.

| Keyword | Purpose | Web | API | Hybrid |
|---------|---------|-----|-----|--------|
| Plain step | Action (click, fill, navigate) | Yes | — | Yes |
| `VERIFY:` | Assertion checkpoint | Yes | Yes | Yes |
| `CAPTURE:` | Store a runtime value | Yes | Yes | Yes |
| `CALCULATE:` | Math on captured values | Yes | Yes | Yes |
| `SCREENSHOT:` | Visual evidence | Yes | — | Yes |
| `REPORT:` | Print to test output | Yes | Yes | Yes |
| `SAVE:` | Persist to shared-state.json | Yes | Yes | Yes |
| `SHARED_DATA:` | Load shared reference data | Yes | Yes | Yes |
| `USE_HELPER:` | Call team helper method | Yes | — | Yes |
| `API GET/POST/PUT/PATCH/DELETE:` | REST API call | — | Yes | Yes |
| `DATASETS` | Data-driven test rows | Yes | Yes | Yes |
