# Story 2.2: Terminal Command Execution

Status: done

## Story

As a **developer**,
I want **a service to execute commands in VS Code's integrated terminal**,
So that **users can see command output in real-time**.

## Acceptance Criteria

1. **Given** ShellService from Story 2.1 is available
   **When** TerminalService.executeCommand("npx bmad-method install") is called
   **Then** a new VS Code terminal is created with name "BMAD"
   **And** the command is executed in that terminal
   **And** the terminal becomes visible to the user (FR5)

2. **Given** a command is on the allowed whitelist
   **When** TerminalService.executeCommand() is called
   **Then** the command executes

3. **Given** a command is NOT on the allowed whitelist
   **When** TerminalService.executeCommand() is called
   **Then** it returns error and does not execute (NFR-S2)

## Tasks / Subtasks

- [x] Task 1: Create TerminalService class structure (AC: #1)
  - [x] 1.1: Create `src/services/TerminalService.ts`
  - [x] 1.2: Inject ShellService dependency
  - [x] 1.3: Define command whitelist constant
  - [x] 1.4: Export from `src/services/index.ts`

- [x] Task 2: Implement command whitelist (AC: #2, #3)
  - [x] 2.1: Define ALLOWED_COMMANDS array with permitted commands
  - [x] 2.2: Include `npx bmad-method install` in whitelist
  - [x] 2.3: Implement `isCommandAllowed(command: string)` method
  - [x] 2.4: Return error for non-whitelisted commands

- [x] Task 3: Implement terminal creation and execution (AC: #1)
  - [x] 3.1: Use `vscode.window.createTerminal()` API
  - [x] 3.2: Configure terminal with name "BMAD"
  - [x] 3.3: Set shell path from ShellService.getDefaultShell()
  - [x] 3.4: Call `terminal.show()` to make visible
  - [x] 3.5: Call `terminal.sendText(command)` to execute

- [x] Task 4: Add error handling and logging (AC: #3)
  - [x] 4.1: Use ErrorService for logging execution attempts
  - [x] 4.2: Log blocked command attempts as warnings
  - [x] 4.3: Return Result type indicating success/failure

- [x] Task 5: Add unit tests
  - [x] 5.1: Create `tests/unit/services/TerminalService.test.ts`
  - [x] 5.2: Test whitelist validation passes for allowed commands
  - [x] 5.3: Test whitelist validation blocks unauthorized commands
  - [x] 5.4: Mock vscode.window.createTerminal() for terminal tests

## Dev Notes

### Command Whitelist (NFR-S2)

```typescript
const ALLOWED_COMMANDS = [
  'npx bmad-method install',
  'npx bmad-method update',
] as const;

// Can extend with pattern matching if needed
function isCommandAllowed(command: string): boolean {
  return ALLOWED_COMMANDS.some(allowed => 
    command.startsWith(allowed) || command === allowed
  );
}
```

### VS Code Terminal API

```typescript
import * as vscode from 'vscode';

const terminal = vscode.window.createTerminal({
  name: 'BMAD',
  shellPath: shellService.getDefaultShell(),
  cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
});

terminal.show(true); // true = preserve focus
terminal.sendText(command);
```

### Interface Definition

```typescript
export interface ITerminalService {
  executeCommand(command: string): Promise<Result<void, TerminalError>>;
  isCommandAllowed(command: string): boolean;
}

export type TerminalError = 
  | { code: 'COMMAND_NOT_ALLOWED'; command: string }
  | { code: 'NO_WORKSPACE'; message: string }
  | { code: 'TERMINAL_ERROR'; message: string };
```

### Security Considerations

- Never execute user-provided strings directly
- Whitelist approach prevents command injection (NFR-S2)
- Log all execution attempts for audit trail

## Requirements Traceability

| Requirement | Coverage |
|-------------|----------|
| FR1 | One-click BMAD project initialization (partial) |
| FR5 | Project init progress visible in terminal |
| NFR-S2 | Terminal commands validated against whitelist |
| FR43 | Platform-specific shell execution |

## Dependencies

- ShellService (from story 2-1) for shell detection
- ErrorService (from story 1-2) for error logging

## Dev Agent Record

### Implementation Summary
- Created TerminalService singleton with command whitelist security
- Whitelist includes: npx bmad-method install, update, base command
- Terminal created with name "BMAD" using VS Code API
- Shell path obtained from ShellService.getDefaultShell()
- Terminal reuse logic - keeps same terminal if still open
- 16 unit tests covering whitelist validation and terminal execution

### File List
- src/services/TerminalService.ts (created)
- tests/unit/services/TerminalService.test.ts (created)
- src/services/index.ts (modified - added exports)
- src/shared/types.ts (modified - added error codes)

### Test Results
All 16 tests pass (vitest)
