# Story 2.1: Shell Detection Service

Status: done

## Story

As a **developer**,
I want **a service that detects the appropriate shell for the current platform**,
So that **terminal commands work correctly on macOS, Windows, and Linux**.

## Acceptance Criteria

1. **Given** the extension is running on macOS or Linux
   **When** ShellService.getDefaultShell() is called
   **Then** it returns `/bin/bash` or `/bin/zsh` based on system default

2. **Given** the extension is running on Windows
   **When** ShellService.getDefaultShell() is called
   **Then** it returns `powershell.exe` or `cmd.exe` based on availability

3. **And** the service uses `os.platform()` for detection
   **And** unit tests cover all three platforms (FR43)

## Tasks / Subtasks

- [x] Task 1: Create ShellService class structure (AC: #1, #2, #3)
  - [x] 1.1: Create `src/services/ShellService.ts`
  - [x] 1.2: Implement `getDefaultShell()` method that returns shell path
  - [x] 1.3: Implement platform detection using `os.platform()`
  - [x] 1.4: Export from `src/services/index.ts`

- [x] Task 2: Implement macOS/Linux shell detection (AC: #1)
  - [x] 2.1: Check SHELL environment variable first
  - [x] 2.2: Fallback to `/bin/zsh` on macOS (default since Catalina)
  - [x] 2.3: Fallback to `/bin/bash` on Linux
  - [x] 2.4: Return shell path string

- [x] Task 3: Implement Windows shell detection (AC: #2)
  - [x] 3.1: Check for PowerShell availability first
  - [x] 3.2: Fallback to cmd.exe if PowerShell unavailable
  - [x] 3.3: Use `process.env.ComSpec` for cmd.exe path
  - [x] 3.4: Return shell executable name

- [x] Task 4: Add unit tests (AC: #3)
  - [x] 4.1: Create `tests/unit/services/ShellService.test.ts`
  - [x] 4.2: Test macOS detection returns zsh/bash
  - [x] 4.3: Test Linux detection returns bash
  - [x] 4.4: Test Windows detection returns powershell/cmd
  - [x] 4.5: Mock `os.platform()` for cross-platform testing

## Dev Notes

### Platform Detection

```typescript
import * as os from 'os';

const platform = os.platform();
// Returns: 'darwin' | 'linux' | 'win32' | ...
```

### Shell Resolution Logic

| Platform | Primary | Fallback |
|----------|---------|----------|
| macOS (darwin) | `$SHELL` or `/bin/zsh` | `/bin/bash` |
| Linux | `$SHELL` or `/bin/bash` | `/bin/sh` |
| Windows (win32) | `powershell.exe` | `%ComSpec%` (cmd.exe) |

### Interface Definition

```typescript
export interface IShellService {
  getDefaultShell(): string;
  getPlatform(): 'darwin' | 'linux' | 'win32' | 'unknown';
}
```

### Error Handling

Use ErrorService for logging if shell detection fails, but always return a sensible default to avoid blocking user operations.

## Requirements Traceability

| Requirement | Coverage |
|-------------|----------|
| FR43 | Platform-specific shell execution - core implementation |
| NFR-C3 | Terminal command execution adapts shell selection to platform |

## Dependencies

- ErrorService (from story 1-2) for error logging

## Dev Agent Record

### Implementation Summary
- Created ShellService singleton class with platform detection
- Implemented getDefaultShell() for macOS, Linux, and Windows
- macOS: checks $SHELL env, defaults to /bin/zsh
- Linux: checks $SHELL env, defaults to /bin/bash  
- Windows: uses PowerShell path, falls back to ComSpec
- 14 unit tests covering all platforms with mocked os.platform()

### File List
- src/services/ShellService.ts (created)
- tests/unit/services/ShellService.test.ts (created)
- src/services/index.ts (modified - added exports)

### Test Results
All 14 tests pass (vitest)
