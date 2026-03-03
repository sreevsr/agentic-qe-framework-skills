# Skill: Review Code Quality (Dimension 5)

## Purpose
Audit TypeScript code quality: types, naming, documentation, imports. Weight: **Low**.

## Scope
All scenario types.

## Checklist

- [ ] Consistent TypeScript — no mixed JS/TS files
- [ ] No `any` types where avoidable
- [ ] Meaningful variable and method names (not `x`, `temp`, `button1`)
- [ ] JSDoc on page object public methods
- [ ] No unused imports
- [ ] Every async method call uses `await` — never use `&&` or `||` on raw Promises
- [ ] `@types/node` is listed in devDependencies
- [ ] `dotenv` is listed in devDependencies

## What to Check

### Type Safety
1. Search for `any` type usage — should be rare and justified
2. Verify no `as any` casts that hide real type issues
3. Check that Promise returns are properly typed

### Await Usage
1. Every `async` function return is `await`ed when the result is used
2. No patterns like `promise1 && promise2` (awaits are missing)
3. No `void` calls on async functions that should be awaited

### Imports
1. No unused imports (imported but never referenced)
2. No duplicate imports
3. Import paths resolve correctly

### Naming
1. Page object methods use business-meaningful names: `login()`, `addToCart()`, not `clickButton()`
2. Variables named descriptively: `cartTotal`, not `val1`
3. Consistent casing: camelCase for variables/methods, PascalCase for classes

### Documentation
1. Public methods on page objects have JSDoc comments
2. Complex logic has inline comments explaining "why" (not "what")

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | No `any`, full JSDoc, no unused imports, all awaits correct, meaningful names |
| 4 | 1-2 minor issues: missing JSDoc on some methods, or 1 unused import |
| 3 | Several minor issues: some `any` types, missing JSDoc, a few naming issues |
| 2 | Significant issues: widespread `any`, missing awaits, poor naming |
| 1 | Major quality issues: mixed JS/TS, no types, no documentation |

## Output
Return: score (1-5), list of issues with file paths and line numbers, key finding summary.
