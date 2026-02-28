# Bug: ConfigService.test.ts Heap Memory OOM

Status: **RESOLVED** ✅
Priority: medium
Discovered: 2026-02-13 (during Story 3.7 implementation)
Resolved: 2026-02-14

## Root Cause

The test "should sort folders before files, both alphabetically" used `folderPath.includes('planning-artifacts')` in its mock implementation for `fs.promises.readdir`. When scanning subfolders like `alpha-folder`, the full path `/test/workspace/_bmad-output/planning-artifacts/alpha-folder` still contained "planning-artifacts", causing the mock to return the same folders recursively → **infinite recursion** → OOM.

## Solution

Changed the mock condition from:
```javascript
if (folderPath.includes('planning-artifacts'))
```
to:
```javascript
if (folderPath.endsWith('planning-artifacts'))
```

This ensures the mock only returns folder contents for the exact `planning-artifacts` directory, not when recursively scanning its subfolders.

## Additional Fix

Also changed `vi.clearAllMocks()` → `vi.resetAllMocks()` in `beforeEach` to fully reset mock implementations between tests (good practice but not the root cause).

---

## Original Problem

Running `ConfigService.test.ts` causes Node.js to crash with "JavaScript heap out of memory" error, even with `--max-old-space-size=8192`.

## Symptoms

```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

The crash occurs during test execution, specifically during string operations (`Builtins_StringSlowFlatten`, `Builtins_StringIndexOf` in stack trace).

## Observations

1. Tests pass when running other test files individually (e.g., `SidebarProvider.test.ts` - 21 tests pass)
2. The issue appears to be related to `ConfigService.test.ts` specifically
3. Memory increases to ~4GB before crash
4. Issue is **not related to Story 3.7 changes** - the new `getArtifactFiles` tests were added but the OOM was occurring before they could run

## Environment

- Node.js v24.13.0
- Vitest v4.0.18
- macOS

## Potential Causes

1. **Infinite recursion in mocks** - fs.promises.readdir mock may be creating circular structures
2. **Memory leak in singleton reset** - `(ConfigService as any).instance = null` pattern may not be cleaning up properly
3. **Large test data accumulation** - Tests may be accumulating data across runs
4. **Mock implementation issue** - fs.promises mocks may be retaining references

## Investigation Steps

- [ ] Run tests with `--no-threads` to isolate worker thread issues
- [ ] Add `afterEach` cleanup for all mocks
- [ ] Check if singleton pattern is leaking state
- [ ] Profile memory usage during specific tests
- [ ] Try running tests in smaller batches to identify problematic test

## Workaround

Run tests by file to avoid OOM:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npx vitest run tests/unit/providers/SidebarProvider.test.ts
NODE_OPTIONS="--max-old-space-size=4096" npx vitest run tests/unit/shared/messages.test.ts
```

## Related Files

- tests/unit/services/ConfigService.test.ts
- src/services/ConfigService.ts
