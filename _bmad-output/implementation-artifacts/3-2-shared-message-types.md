# Story 3.2: Shared Message Types

Status: done

## Story

As a **developer**,
I want **typed message interfaces shared between extension and WebView**,
So that **PostMessage communication is type-safe**.

## Acceptance Criteria

1. **Given** the architecture specifies typed PostMessage protocol
   **When** I create shared types in `src/shared/messages.ts`
   **Then** the file contains:
   - `ExtensionMessage` union type with all message types from extension to WebView
   - `WebViewMessage` union type with all message types from WebView to extension
   - Each message has `type` discriminator and `payload` object

2. **Given** the shared types are created
   **When** types are imported in extension code
   **Then** TypeScript compiler validates message structure

3. **Given** the shared types are created
   **When** types are imported in WebView code via path alias
   **Then** TypeScript compiler validates message structure

4. **Given** a developer sends a message with wrong structure
   **When** TypeScript compiles
   **Then** it reports a type error

## Tasks / Subtasks

- [x] Task 1: Create base message type definitions (AC: #1)
  - [x] 1.1: Create `src/shared/messages.ts` file
  - [x] 1.2: Define base `ExtensionMessage` union type
  - [x] 1.3: Define base `WebViewMessage` union type
  - [x] 1.4: Ensure all messages have `type` discriminator and `payload` wrapper

- [x] Task 2: Define extension-to-WebView messages (AC: #1)
  - [x] 2.1: Add `configLoaded` message type for config data
  - [x] 2.2: Add `projectStateChanged` message type for state updates
  - [x] 2.3: Add `error` message type for error notifications
  - [x] 2.4: Add `dataLoaded` message type for epics/stories data

- [x] Task 3: Define WebView-to-extension messages (AC: #1)
  - [x] 3.1: Add `ready` message type for WebView initialization
  - [x] 3.2: Add `openFile` message type for file open requests
  - [x] 3.3: Add `executeCommand` message type for command invocations
  - [x] 3.4: Add `launchAgent` message type for agent launch requests

- [x] Task 4: Create message helper utilities (AC: #2, #3)
  - [x] 4.1: Create typed `postMessage` wrapper for WebView
  - [x] 4.2: Create typed message handler pattern for extension
  - [x] 4.3: Export helpers from `src/shared/index.ts`

- [x] Task 5: Update WebView type imports (AC: #3)
  - [x] 5.1: Update `webviews/sidebar/src/lib/types.ts` to re-export message types
  - [x] 5.2: Update `webviews/kanban/src/lib/types.ts` to re-export message types
  - [x] 5.3: Verify path alias `@shared/*` resolves correctly

- [x] Task 6: Add unit tests for type safety (AC: #4)
  - [x] 6.1: Create `src/shared/messages.test.ts`
  - [x] 6.2: Test that message type narrowing works with switch statements
  - [x] 6.3: Verify exhaustive switch pattern catches all message types

## Dev Notes

### Message Type Architecture

Per architecture.md, all PostMessage communication uses a typed protocol with:
- `type` discriminator field for message routing
- `payload` object containing message data
- Union types for compile-time exhaustiveness checking

### ExtensionMessage Types

```typescript
// src/shared/messages.ts

// Extension → WebView messages
export type ExtensionMessage =
  | { type: 'configLoaded'; payload: ConfigPayload }
  | { type: 'projectStateChanged'; payload: ProjectStatePayload }
  | { type: 'dataLoaded'; payload: DataLoadedPayload }
  | { type: 'error'; payload: ErrorPayload };

export interface ConfigPayload {
  projectName: string;
  userName: string;
  communicationLanguage: string;
  planningArtifacts: string;
  implementationArtifacts: string;
}

export interface ProjectStatePayload {
  state: 'fresh' | 'in-progress' | 'epics-ready';
  hasConfig: boolean;
  hasEpics: boolean;
  hasStories: boolean;
}

export interface DataLoadedPayload {
  epics: Epic[];
  stories: Story[];
}

export interface ErrorPayload {
  code: string;
  message: string;
  recoverable: boolean;
}
```

### WebViewMessage Types

```typescript
// WebView → Extension messages
export type WebViewMessage =
  | { type: 'ready'; payload: ReadyPayload }
  | { type: 'openFile'; payload: OpenFilePayload }
  | { type: 'executeCommand'; payload: ExecuteCommandPayload }
  | { type: 'launchAgent'; payload: LaunchAgentPayload };

export interface ReadyPayload {
  webviewId: 'sidebar' | 'kanban';
}

export interface OpenFilePayload {
  filePath: string;
}

export interface ExecuteCommandPayload {
  command: string;
  args?: unknown[];
}

export interface LaunchAgentPayload {
  agentId: string;
  command?: string;
  customPrompt?: string;
  model?: string;
}
```

### Message Helper for WebView

```typescript
// src/shared/messaging.ts
import type { WebViewMessage, ExtensionMessage } from './messages';

// Type-safe postMessage wrapper for WebView
export function postMessage(vscode: VsCodeApi, message: WebViewMessage): void {
  vscode.postMessage(message);
}

// Type guard for extension messages
export function isExtensionMessage(msg: unknown): msg is ExtensionMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'payload' in msg
  );
}

// VS Code API interface for typing
export interface VsCodeApi {
  postMessage(message: WebViewMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

// Declare global for acquireVsCodeApi
declare global {
  function acquireVsCodeApi(): VsCodeApi;
}
```

### Message Handler Pattern for Extension

```typescript
// Pattern for use in Providers
private handleMessage(message: WebViewMessage): void {
  switch (message.type) {
    case 'ready':
      this.handleReady(message.payload);
      break;
    case 'openFile':
      this.handleOpenFile(message.payload);
      break;
    case 'executeCommand':
      this.handleExecuteCommand(message.payload);
      break;
    case 'launchAgent':
      this.handleLaunchAgent(message.payload);
      break;
    default:
      // Exhaustive check - TypeScript error if case missed
      const _exhaustive: never = message;
      this.errorService.logWarning(`Unknown message type: ${(message as any).type}`);
  }
}
```

### Re-export Pattern for WebViews

```typescript
// webviews/sidebar/src/lib/types.ts
export type {
  ExtensionMessage,
  WebViewMessage,
  ConfigPayload,
  ProjectStatePayload,
  ErrorPayload,
} from '@shared/messages';

export type { Epic, Story, BmadConfig } from '@shared/models';
```

### Integration with Existing Types

The shared message types depend on:
- `Epic` and `Story` types from `src/shared/models.ts` (Story 4.1)
- `BmadError` type from `src/shared/types.ts` (already exists from Epic 1)

For now, use simplified payload types until Story 4.1 adds full data models.

### Index Barrel Export

```typescript
// src/shared/index.ts
export * from './types';
export * from './messages';
```

### Testing Type Safety

```typescript
// src/shared/messages.test.ts
import { describe, it, expect } from 'vitest';
import type { ExtensionMessage, WebViewMessage } from './messages';

describe('messages', () => {
  describe('ExtensionMessage', () => {
    it('should narrow type with switch statement', () => {
      const message: ExtensionMessage = {
        type: 'configLoaded',
        payload: {
          projectName: 'test',
          userName: 'user',
          communicationLanguage: 'en',
          planningArtifacts: '/path',
          implementationArtifacts: '/path',
        },
      };

      switch (message.type) {
        case 'configLoaded':
          // TypeScript knows payload is ConfigPayload here
          expect(message.payload.projectName).toBe('test');
          break;
        case 'projectStateChanged':
        case 'dataLoaded':
        case 'error':
          break;
        default:
          const _exhaustive: never = message;
      }
    });
  });

  describe('WebViewMessage', () => {
    it('should require payload wrapper', () => {
      const message: WebViewMessage = {
        type: 'ready',
        payload: { webviewId: 'sidebar' },
      };
      expect(message.payload.webviewId).toBe('sidebar');
    });
  });
});
```

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG: Flat message structure
{ type: 'storySelected', storyId: '001' }

// ✅ CORRECT: Nested payload
{ type: 'storySelected', payload: { storyId: '001' } }

// ❌ WRONG: Union without discriminator
type Message = ConfigMessage | ErrorMessage;

// ✅ CORRECT: Discriminated union with type field
type Message = 
  | { type: 'config'; payload: ConfigPayload }
  | { type: 'error'; payload: ErrorPayload };
```

### Project Structure Notes

- Messages are shared between extension and WebView contexts
- Path alias `@shared/*` must be configured in both:
  - Root `tsconfig.json` for extension
  - WebView `tsconfig.json` for Svelte components
- All messages follow the same `{ type, payload }` pattern

### References

- [Source: architecture.md#WebView ↔ Extension Communication Protocol] - Typed message protocol decision
- [Source: architecture.md#Format Patterns] - PostMessage format with payload wrapper
- [Source: architecture.md#Communication Patterns] - Handler patterns
- [Source: architecture.md#Anti-Patterns to Avoid] - Flat message anti-pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Completion Notes List

- Created `src/shared/messages.ts` with full typed message protocol
- ExtensionMessage union: configLoaded, projectStateChanged, dataLoaded, error
- WebViewMessage union: ready, openFile, executeCommand, launchAgent
- Added type guards: `isExtensionMessage()`, `isWebViewMessage()`
- Added typed helper: `postMessage()` wrapper for WebViews
- Added type extractors: `ExtensionMessagePayload<T>`, `WebViewMessagePayload<T>`
- Updated barrel exports in `src/shared/index.ts`
- WebView types re-export from `webviews/sidebar/src/lib/types.ts` and `webviews/kanban/src/lib/types.ts`
- DataLoadedPayload uses `unknown[]` for epics/stories until Story 4.1 adds full data models
- 38 unit tests covering type narrowing, exhaustive switch patterns, type guards, and payloads

### File List

- `src/shared/messages.ts` (created)
- `src/shared/index.ts` (modified)
- `webviews/sidebar/src/lib/types.ts` (modified)
- `webviews/kanban/src/lib/types.ts` (modified)
- `tests/unit/shared/messages.test.ts` (created)
