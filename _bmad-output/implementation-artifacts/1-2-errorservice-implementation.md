# Story 1.2: ErrorService Implementation

Status: done

## Story

As a **developer**,
I want **a centralized error handling service**,
So that **all extension components handle errors consistently with user-friendly messages**.

## Acceptance Criteria

1. **Given** the extension project from Story 1.1
   **When** I create ErrorService following the architecture patterns
   **Then** the service:
   - Has a VS Code OutputChannel named "BMAD Extension"
   - Implements `BmadError` type with `code`, `message`, `userMessage`, `recoverable`, `actions` properties
   - Implements `handleError(error: BmadError)` method that logs to OutputChannel
   - Shows VS Code notification when `shouldNotify` is true
   - Returns `ServiceResult<T>` pattern (`{ success: true, data: T } | { success: false, error: BmadError }`)

2. **Given** ErrorService is implemented
   **When** extension activates
   **Then** ErrorService is registered in `extension.ts` during activation

3. **Given** ErrorService is available
   **When** unit tests run
   **Then** tests verify error logging and notification behavior

## Tasks / Subtasks

- [ ] Task 1: Create BmadError type definitions (AC: #1)
  - [ ] 1.1: Create `src/shared/errors.ts` file
  - [ ] 1.2: Define `BmadError` interface with: code, message, userMessage, recoverable, actions, shouldNotify
  - [ ] 1.3: Define error code constants (CONFIG_PARSE_ERROR, FILE_NOT_FOUND, etc.)
  - [ ] 1.4: Export types via `src/shared/index.ts`

- [ ] Task 2: Create ServiceResult type (AC: #1)
  - [ ] 2.1: Add `ServiceResult<T>` type to `src/shared/errors.ts`
  - [ ] 2.2: Implement success and failure variants as discriminated union

- [ ] Task 3: Implement ErrorService class (AC: #1)
  - [ ] 3.1: Create `src/services/ErrorService.ts`
  - [ ] 3.2: Create VS Code OutputChannel named "BMAD Extension" in constructor
  - [ ] 3.3: Implement `log(message: string)` private method
  - [ ] 3.4: Implement `handleError(error: BmadError): void` method
  - [ ] 3.5: Implement notification display when `shouldNotify` is true
  - [ ] 3.6: Export ErrorService via `src/services/index.ts`

- [ ] Task 4: Register ErrorService in extension activation (AC: #2)
  - [ ] 4.1: Import ErrorService in `src/extension.ts`
  - [ ] 4.2: Instantiate ErrorService in `activate()` function
  - [ ] 4.3: Store reference in extension context or module scope
  - [ ] 4.4: Dispose OutputChannel in `deactivate()` function

- [ ] Task 5: Write unit tests (AC: #3)
  - [ ] 5.1: Create `src/services/ErrorService.test.ts`
  - [ ] 5.2: Test handleError logs to OutputChannel
  - [ ] 5.3: Test notification shown when shouldNotify is true
  - [ ] 5.4: Test notification NOT shown when shouldNotify is false/undefined
  - [ ] 5.5: Test ServiceResult patterns work correctly

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

From Architecture Decision Document:

**Error Handling Pattern:**
```typescript
// Centralized Error Service + VS Code OutputChannel
// Per NFR-R4, all critical errors logged to "BMAD Extension" output channel
class ErrorService {
  private outputChannel: vscode.OutputChannel;
  
  handleError(error: BmadError): void {
    this.log(error);
    if (error.shouldNotify) {
      vscode.window.showErrorMessage(error.userMessage, ...error.actions);
    }
  }
}
```

**Service Result Pattern:**
```typescript
// All service methods return Result-like structure
type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: BmadError };
```

### BmadError Interface Definition

```typescript
// src/shared/errors.ts
export interface BmadError {
  code: string;           // 'CONFIG_PARSE_ERROR', 'FILE_NOT_FOUND'
  message: string;        // Technical message for logging
  userMessage: string;    // Human-friendly message for notifications
  recoverable: boolean;   // Can user retry?
  shouldNotify?: boolean; // Show VS Code notification?
  actions?: string[];     // Button labels for notification
}

export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: BmadError };

// Error code constants
export const ErrorCodes = {
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  CONFIG_PARSE_ERROR: 'CONFIG_PARSE_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  STORY_PARSE_ERROR: 'STORY_PARSE_ERROR',
  EPIC_PARSE_ERROR: 'EPIC_PARSE_ERROR',
} as const;
```

### ErrorService Implementation

```typescript
// src/services/ErrorService.ts
import * as vscode from 'vscode';
import { BmadError } from '../shared/errors';

export class ErrorService {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('BMAD Extension');
  }

  handleError(error: BmadError): void {
    // Always log to output channel
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] [${error.code}] ${error.message}`);
    
    // Show notification if requested
    if (error.shouldNotify) {
      if (error.actions && error.actions.length > 0) {
        vscode.window.showErrorMessage(error.userMessage, ...error.actions);
      } else {
        vscode.window.showErrorMessage(error.userMessage);
      }
    }
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }

  show(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
```

### Integration in extension.ts

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { ErrorService } from './services/ErrorService';

let errorService: ErrorService;

export function activate(context: vscode.ExtensionContext) {
  // Initialize ErrorService first - all other services depend on it
  errorService = new ErrorService();
  errorService.log('BMAD Extension is now active');
  
  // Register for cleanup
  context.subscriptions.push({
    dispose: () => errorService.dispose()
  });
  
  // Other services will be registered here...
}

export function deactivate() {
  // Cleanup handled by context.subscriptions
}
```

### Naming Conventions

- **Named exports only** (no default exports)
- **Async/await** for all service methods that might be async later
- **Interface** for contracts: `BmadError`
- **Type** for unions: `ServiceResult<T>`

### Testing Strategy

Use vitest for unit testing. Mock `vscode.window` and `vscode.OutputChannel`:

```typescript
// src/services/ErrorService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorService } from './ErrorService';
import { BmadError } from '../shared/errors';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })),
    showErrorMessage: vi.fn(),
  },
}));

describe('ErrorService', () => {
  let errorService: ErrorService;

  beforeEach(() => {
    errorService = new ErrorService();
  });

  it('should log errors to output channel', () => {
    const error: BmadError = {
      code: 'TEST_ERROR',
      message: 'Technical message',
      userMessage: 'User-friendly message',
      recoverable: true,
    };
    
    errorService.handleError(error);
    
    // Assert outputChannel.appendLine was called
  });

  it('should show notification when shouldNotify is true', () => {
    const error: BmadError = {
      code: 'TEST_ERROR',
      message: 'Technical message',
      userMessage: 'User-friendly message',
      recoverable: true,
      shouldNotify: true,
    };
    
    errorService.handleError(error);
    
    // Assert vscode.window.showErrorMessage was called with userMessage
  });
});
```

### Cross-Story Dependencies

- **Depends on:** Story 1.1 (Extension Project Setup)
- **Required by:** ALL subsequent stories (ErrorService is foundation for error handling)

### Project Structure Notes

Files to create:
```
src/
├── shared/
│   ├── errors.ts      ← NEW
│   └── index.ts       ← UPDATE (add exports)
├── services/
│   ├── ErrorService.ts      ← NEW
│   ├── ErrorService.test.ts ← NEW
│   └── index.ts             ← UPDATE (add exports)
└── extension.ts             ← UPDATE (register ErrorService)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling-Logging]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Service-Method-Pattern]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled with created/modified files_
