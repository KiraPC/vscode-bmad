# Story 6.4: CopilotService - Chat Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **a service that launches agents in GitHub Copilot Chat**,
So that **the "Lancia in Chat" button works and users can interact with BMAD agents**.

## Acceptance Criteria

1. **Given** Copilot Chat API is available
   **When** CopilotService.launchAgent({ agent, command, model, prompt }) is called
   **Then** it opens Copilot Chat with:
   - Agent mode pre-selected (via @-mention)
   - Command pre-filled
   - Custom prompt appended (FR22)

2. **Given** Copilot Chat API is NOT available (extension not installed)
   **When** CopilotService.launchAgent() is called
   **Then** it opens standard VS Code Chat with pre-filled text as fallback (FR23)
   **And** logs graceful degradation info via ErrorService

3. **Given** Copilot extension is installed but Chat not available (older version)
   **When** CopilotService attempts to launch
   **Then** it falls back to `workbench.action.chat.open` command
   **And** shows informational message with agent/command instructions

4. **Given** user is notified Copilot is not installed
   **When** notification is shown
   **Then** it includes "Install Copilot" action button that links to extension marketplace (NFR-I2)

5. **Given** custom prompt is provided
   **When** CopilotService constructs the chat message
   **Then** custom prompt is sanitized to prevent command injection (NFR-S3)
   **And** newlines and special characters are properly escaped

6. **Given** CopilotService is initialized
   **When** checking for Copilot availability
   **Then** service uses feature detection at runtime (not compile time)
   **And** caches availability check result for performance

## Tasks / Subtasks

- [x] Task 1: Define CopilotService interfaces and types (AC: #1, #5)
  - [x] 1.1: Create `AgentLaunchRequest` interface in `src/shared/types.ts`
  - [x] 1.2: Add fields: agentId, command, customPrompt, model
  - [x] 1.3: Create `CopilotAvailability` type: 'full' | 'chat-only' | 'none'
  - [x] 1.4: Add `COPILOT_EXTENSION_ID` constant

- [x] Task 2: Create CopilotService class structure (AC: #1)
  - [x] 2.1: Create `src/services/CopilotService.ts`
  - [x] 2.2: Implement singleton pattern matching other services
  - [x] 2.3: Add constructor with ErrorService dependency
  - [x] 2.4: Add availability cache with TTL (5 minutes)

- [x] Task 3: Implement Copilot availability detection (AC: #2, #3, #6)
  - [x] 3.1: Implement `checkAvailability(): CopilotAvailability` method
  - [x] 3.2: Check for `github.copilot-chat` extension via `vscode.extensions.getExtension()`
  - [x] 3.3: Check for `github.copilot` extension as fallback
  - [x] 3.4: Cache result with timestamp, refresh after 5 minutes

- [x] Task 4: Implement full Copilot Chat launch (AC: #1)
  - [x] 4.1: Implement `launchAgent(request: AgentLaunchRequest): Promise<ServiceResult<void>>`
  - [x] 4.2: If availability is 'full', use Chat API to open with @-mention
  - [x] 4.3: Construct message: `@{agentId} /{command} {sanitizedPrompt}`
  - [x] 4.4: Use `vscode.commands.executeCommand('workbench.action.chat.newChat')` to open fresh chat
  - [x] 4.5: Use `vscode.commands.executeCommand('workbench.action.chat.open', { query: message })`

- [x] Task 5: Implement fallback paths (AC: #2, #3)
  - [x] 5.1: If availability is 'chat-only', open chat with info message
  - [x] 5.2: If availability is 'none', show notification with Install action
  - [x] 5.3: Implement `showInstallCopilotPrompt()` helper method
  - [x] 5.4: Use `vscode.commands.executeCommand('workbench.extensions.search', '@id:github.copilot-chat')`

- [x] Task 6: Implement prompt sanitization (AC: #5)
  - [x] 6.1: Create `sanitizePrompt(prompt: string): string` private method
  - [x] 6.2: Escape command-like patterns (/, @, etc.)
  - [x] 6.3: Limit prompt length (max 2000 chars)
  - [x] 6.4: Remove or escape control characters

- [x] Task 7: Integrate with SidebarProvider (AC: #1, #2)
  - [x] 7.1: Update `_launchAgent()` method to use CopilotService
  - [x] 7.2: Replace inline message with CopilotService.launchAgent()
  - [x] 7.3: Handle ServiceResult errors appropriately

- [x] Task 8: Export from services index (AC: #1)
  - [x] 8.1: Add `export { CopilotService, getCopilotService }` to `src/services/index.ts`
  - [x] 8.2: Add JSDoc comments for exported functions

- [x] Task 9: Add unit tests (AC: #1-6)
  - [x] 9.1: Create `tests/unit/services/CopilotService.test.ts`
  - [x] 9.2: Mock `vscode.extensions.getExtension()` for availability tests
  - [x] 9.3: Mock `vscode.commands.executeCommand()` for launch tests
  - [x] 9.4: Test full availability launches with correct @-mention format
  - [x] 9.5: Test fallback when Copilot not installed
  - [x] 9.6: Test prompt sanitization removes dangerous patterns
  - [x] 9.7: Test availability caching behavior

## Dev Notes

### Architecture References

From [architecture.md](../_bmad-output/planning-artifacts/architecture.md):
- **Decision:** Graceful Degradation Hybrid (Try Chat API, Fallback to Commands)
- **Pattern:** Centralized Services pattern with singleton + ErrorService dependency
- **Location:** `src/services/CopilotService.ts`

### Service Pattern

Follow the established singleton pattern from [ErrorService.ts](../src/services/ErrorService.ts) and [AgentParserService.ts](../src/services/AgentParserService.ts):

```typescript
// src/services/CopilotService.ts

import * as vscode from 'vscode';
import { ServiceResult, BmadError, ErrorCodes } from '../shared/types';
import { getErrorService } from './ErrorService';

/**
 * Copilot availability levels
 */
export type CopilotAvailability = 'full' | 'chat-only' | 'none';

/**
 * CopilotService - GitHub Copilot Chat Integration
 * Story 6.4: Chat integration with graceful fallback
 * 
 * FR22: Launch agents in Copilot Chat
 * FR23: Graceful fallback when Copilot unavailable
 * NFR-I2: Graceful degradation if Copilot not installed
 */
export class CopilotService {
    private static instance: CopilotService | null = null;
    
    /** Cache availability check result with timestamp */
    private _availabilityCache: { value: CopilotAvailability; timestamp: number } | null = null;
    
    /** Cache TTL: 5 minutes */
    private readonly CACHE_TTL_MS = 5 * 60 * 1000;
    
    /** Copilot extension IDs */
    private readonly COPILOT_CHAT_ID = 'github.copilot-chat';
    private readonly COPILOT_ID = 'github.copilot';

    private constructor() {}

    public static getInstance(): CopilotService {
        if (!CopilotService.instance) {
            CopilotService.instance = new CopilotService();
        }
        return CopilotService.instance;
    }

    public static resetInstance(): void {
        CopilotService.instance = null;
    }

    // Implementation follows...
}

export function getCopilotService(): CopilotService {
    return CopilotService.getInstance();
}
```

### AgentLaunchRequest Interface

Add to `src/shared/types.ts`:

```typescript
/**
 * Request payload for launching an agent in Copilot Chat
 * Story 6.4: CopilotService - Chat Integration
 */
export interface AgentLaunchRequest {
    /** Agent identifier (e.g., "sm", "pm", "analyst") */
    agentId: string;
    
    /** Optional command code (e.g., "SP", "CP") */
    command?: string;
    
    /** Optional custom prompt text */
    customPrompt?: string;
    
    /** Optional model selector (for future use) */
    model?: string;
}
```

### VS Code Chat Commands (Latest Stable API)

Based on VS Code 1.85+ stable API, available chat commands:

```typescript
// Open chat panel (always available)
vscode.commands.executeCommand('workbench.action.chat.open');

// Open new chat session
vscode.commands.executeCommand('workbench.action.chat.newChat');

// Open chat with pre-filled query (1.87+)
vscode.commands.executeCommand('workbench.action.chat.open', { query: '@agent message' });

// Search for extension in marketplace
vscode.commands.executeCommand('workbench.extensions.search', '@id:github.copilot-chat');
```

### Message Format for Agent Launch

The chat message should be formatted as:

```
@{agentId} /{command} {customPrompt}
```

Examples:
- `@sm /SP` - Launch Scrum Master with Sprint Planning command
- `@analyst /brainstorm Help me brainstorm features for a task manager`
- `@pm /CP Please create a PRD for my project idea`

### Prompt Sanitization (NFR-S3)

```typescript
/**
 * Sanitize user-provided prompt to prevent command injection
 * NFR-S3: Input sanitization for security
 */
private sanitizePrompt(prompt: string | undefined): string {
    if (!prompt) return '';
    
    // Remove or escape command prefixes that could inject commands
    let sanitized = prompt
        .replace(/^[@/]/gm, '') // Remove leading @ or / at line starts
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim();
    
    // Limit length to prevent token overflow
    const MAX_PROMPT_LENGTH = 2000;
    if (sanitized.length > MAX_PROMPT_LENGTH) {
        sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH) + '...';
    }
    
    return sanitized;
}
```

### Availability Detection

```typescript
/**
 * Check Copilot Chat availability
 * Uses feature detection at runtime per architecture decision
 */
public checkAvailability(): CopilotAvailability {
    // Check cache first
    if (this._availabilityCache && 
        Date.now() - this._availabilityCache.timestamp < this.CACHE_TTL_MS) {
        return this._availabilityCache.value;
    }
    
    // Check for Copilot Chat extension
    const chatExtension = vscode.extensions.getExtension(this.COPILOT_CHAT_ID);
    if (chatExtension) {
        this._availabilityCache = { value: 'full', timestamp: Date.now() };
        return 'full';
    }
    
    // Check for base Copilot extension (limited functionality)
    const baseExtension = vscode.extensions.getExtension(this.COPILOT_ID);
    if (baseExtension) {
        this._availabilityCache = { value: 'chat-only', timestamp: Date.now() };
        return 'chat-only';
    }
    
    this._availabilityCache = { value: 'none', timestamp: Date.now() };
    return 'none';
}
```

### SidebarProvider Integration

Update the existing `_launchAgent` method in [SidebarProvider.ts](../src/providers/SidebarProvider.ts#L214-L231):

```typescript
// BEFORE (current implementation)
private _launchAgent(agentId: string, command: string): void {
    this._errorService.info(`Launching agent: ${agentId}, command: ${command}`);
    const message = workflowMessages[command] ?? `Agent workflow: ${command}`;
    vscode.window.showInformationMessage(message, 'Open Chat').then(selection => {
        if (selection === 'Open Chat') {
            vscode.commands.executeCommand('workbench.action.chat.open');
        }
    });
}

// AFTER (using CopilotService)
private async _launchAgent(agentId: string, command: string, customPrompt?: string): Promise<void> {
    const copilotService = getCopilotService();
    const result = await copilotService.launchAgent({
        agentId,
        command,
        customPrompt,
    });
    
    if (!result.success) {
        this._errorService.handleError(result.error);
    }
}
```

### Project Structure Notes

- **File location:** `src/services/CopilotService.ts`
- **Export location:** `src/services/index.ts`
- **Type definitions:** `src/shared/types.ts`
- **Test file:** `tests/unit/services/CopilotService.test.ts`

### Dependencies

- `vscode` (VS Code API)
- `ErrorService` (for logging and error handling)
- No external npm dependencies required

### Test Fixtures Needed

Create mock extensions for testing:

```typescript
// tests/fixtures/vscode-mocks.ts

export const mockCopilotChatExtension = {
    id: 'github.copilot-chat',
    extensionUri: {} as vscode.Uri,
    extensionPath: '/path/to/extension',
    isActive: true,
    packageJSON: { name: 'github.copilot-chat' },
    exports: {},
    activate: vi.fn(),
    extensionKind: 1,
};

export const mockCopilotExtension = {
    id: 'github.copilot',
    extensionUri: {} as vscode.Uri,
    extensionPath: '/path/to/extension',
    isActive: true,
    packageJSON: { name: 'github.copilot' },
    exports: {},
    activate: vi.fn(),
    extensionKind: 1,
};
```

### References

- [Source: architecture.md#CopilotService] - Graceful degradation decision
- [Source: epics.md#Story-6.4] - Original story requirements
- [Source: SidebarProvider.ts#L229] - Existing chat open pattern
- [Source: ErrorService.ts] - Service pattern reference
- [Source: AgentParserService.ts] - Singleton pattern reference
- [Source: messages.ts#LaunchAgentPayload] - Existing message payload structure

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (GitHub Copilot)

### Debug Log References

None - all tests pass 100%.

### Completion Notes List

- **Task 1**: Added `AgentLaunchRequest` interface, `CopilotAvailability` type, and `CopilotExtensionIds` constants to `src/shared/types.ts`
- **Task 2-6**: Created `CopilotService.ts` with singleton pattern, availability detection with 5-minute cache, full Copilot Chat launch with @-mention format, chat-only and no-Copilot fallback paths, and prompt sanitization (removes @, /, control chars; limits to 2000 chars)
- **Task 7**: Updated `SidebarProvider._launchAgent()` to use `CopilotService.launchAgent()` instead of inline message handling
- **Task 8**: Exported `CopilotService` and `getCopilotService` from `src/services/index.ts`
- **Task 9**: Created comprehensive test suite with 30 tests covering singleton pattern, availability detection, full launch, fallbacks, prompt sanitization, and error handling. Also updated `SidebarProvider.test.ts` mock to include `vscode.extensions` and `showWarningMessage`.

### File List

- `src/shared/types.ts` (modified) - Added CopilotAvailability, AgentLaunchRequest, CopilotExtensionIds
- `src/services/CopilotService.ts` (created) - New service with 270 lines
- `src/services/index.ts` (modified) - Added CopilotService export
- `src/providers/SidebarProvider.ts` (modified) - Updated _launchAgent to use CopilotService
- `tests/unit/services/CopilotService.test.ts` (created) - 30 unit tests
- `tests/unit/providers/SidebarProvider.test.ts` (modified) - Added vscode.extensions and showWarningMessage mocks

