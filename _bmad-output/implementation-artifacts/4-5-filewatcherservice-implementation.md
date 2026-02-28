# Story 4.5: FileWatcherService Implementation

Status: ready-for-dev

## Story

As a **user**,
I want **the extension to detect when files change**,
So that **the Kanban board stays up-to-date automatically**.

## Acceptance Criteria

1. **Given** a BMAD project is detected
   **When** FileWatcherService is initialized
   **Then** it creates watchers for:
   - `_bmad/bmm/config.yaml`
   - `{planning_artifacts}/epics.md`
   - `{implementation_artifacts}/**/*.md` (FR36)

2. **Given** a watched file changes (created, modified, deleted)
   **When** the change event fires
   **Then** FileWatcherService debounces events (200ms window) (FR37)
   **And** emits a single consolidated "files-changed" event
   **And** the event includes list of changed files

3. **Given** user is on SSH, WSL, or Dev Container workspace
   **When** FileWatcherService is initialized
   **Then** watchers work correctly (NFR-I3)

4. **Given** watcher encounters an error
   **When** error is detected
   **Then** FileWatcherService automatically recovers with retry logic (NFR-R3)

5. **Given** multiple rapid file changes occur (git pull, batch operations)
   **When** changes are detected
   **Then** only one consolidated callback fires after 200ms quiet period

## Tasks / Subtasks

- [ ] Task 1: Design FileWatcherService interface (AC: #1, #2)
  - [ ] 1.1: Define callback types for change notifications
  - [ ] 1.2: Define file change event payload

- [ ] Task 2: Create FileWatcherService class (AC: #1)
  - [ ] 2.1: Create `src/services/FileWatcherService.ts`
  - [ ] 2.2: Implement singleton pattern
  - [ ] 2.3: Accept ConfigService dependency for artifact paths

- [ ] Task 3: Implement watcher creation (AC: #1, #3)
  - [ ] 3.1: Use `vscode.workspace.createFileSystemWatcher`
  - [ ] 3.2: Create watcher for config.yaml
  - [ ] 3.3: Create watcher for epics.md
  - [ ] 3.4: Create watcher for implementation_artifacts/**/*.md

- [ ] Task 4: Implement debounce logic (AC: #2, #5)
  - [ ] 4.1: Create debounce utility function
  - [ ] 4.2: Collect changed files during debounce window
  - [ ] 4.3: Fire single callback with consolidated changes
  - [ ] 4.4: Use 200ms debounce delay per NFR-P7

- [ ] Task 5: Implement event consolidation (AC: #2)
  - [ ] 5.1: Define FileChangeEvent interface
  - [ ] 5.2: Track create/modify/delete types
  - [ ] 5.3: Deduplicate same-file multiple events

- [ ] Task 6: Implement error recovery (AC: #4)
  - [ ] 6.1: Wrap watcher operations in try/catch
  - [ ] 6.2: Implement retry logic with exponential backoff
  - [ ] 6.3: Log errors to ErrorService

- [ ] Task 7: Implement subscription management (AC: #1)
  - [ ] 7.1: Allow subscribers to register callbacks
  - [ ] 7.2: Return disposable for cleanup
  - [ ] 7.3: Dispose all watchers on extension deactivation

- [ ] Task 8: Register in service exports (AC: #1)
  - [ ] 8.1: Export from `src/services/index.ts`
  - [ ] 8.2: Add getFileWatcherService() factory function

- [ ] Task 9: Add unit tests (AC: #1-5)
  - [ ] 9.1: Create `tests/unit/services/FileWatcherService.test.ts`
  - [ ] 9.2: Test watcher creation
  - [ ] 9.3: Test debounce consolidation
  - [ ] 9.4: Test event payload structure
  - [ ] 9.5: Test error recovery

## Dev Notes

### Architecture Pattern

From architecture.md:
```typescript
// FileWatcherService.ts
class FileWatcherService {
  private debounceMs = 200;
  private watchers: vscode.FileSystemWatcher[] = [];
  
  watchArtifacts(callback: () => void): void {
    // Watch config.yaml, epics.md, implementation-artifacts/**
    // Debounce multiple rapid changes into single callback
  }
}
```

### FileWatcherService Interface

```typescript
// src/services/FileWatcherService.ts

export type FileChangeType = 'created' | 'changed' | 'deleted';

export interface FileChangeEvent {
  /** Files that were changed */
  files: FileChange[];
  /** Timestamp of the consolidated event */
  timestamp: number;
}

export interface FileChange {
  /** Absolute file path */
  path: string;
  /** Type of change */
  type: FileChangeType;
}

export type FileChangeCallback = (event: FileChangeEvent) => void;

export class FileWatcherService {
  private static instance: FileWatcherService | null = null;
  private watchers: vscode.FileSystemWatcher[] = [];
  private subscribers: FileChangeCallback[] = [];
  private pendingChanges: Map<string, FileChangeType> = new Map();
  private debounceTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 200;

  static getInstance(): FileWatcherService {
    if (!FileWatcherService.instance) {
      FileWatcherService.instance = new FileWatcherService();
    }
    return FileWatcherService.instance;
  }

  async initialize(configService: ConfigService): Promise<void> {
    // Setup watchers based on config paths
  }

  subscribe(callback: FileChangeCallback): vscode.Disposable {
    // Add subscriber and return disposable
  }

  dispose(): void {
    // Cleanup all watchers and subscribers
  }
}
```

### VS Code FileSystemWatcher API

```typescript
const watcher = vscode.workspace.createFileSystemWatcher(
  new vscode.RelativePattern(workspaceFolder, '**/implementation-artifacts/**/*.md'),
  false, // ignoreCreateEvents
  false, // ignoreChangeEvents
  false  // ignoreDeleteEvents
);

watcher.onDidCreate(uri => this.handleChange(uri, 'created'));
watcher.onDidChange(uri => this.handleChange(uri, 'changed'));
watcher.onDidDelete(uri => this.handleChange(uri, 'deleted'));
```

### Debounce Implementation

```typescript
private handleChange(uri: vscode.Uri, type: FileChangeType): void {
  this.pendingChanges.set(uri.fsPath, type);
  
  if (this.debounceTimeout) {
    clearTimeout(this.debounceTimeout);
  }
  
  this.debounceTimeout = setTimeout(() => {
    this.flushChanges();
  }, this.DEBOUNCE_MS);
}

private flushChanges(): void {
  const files: FileChange[] = Array.from(this.pendingChanges.entries())
    .map(([path, type]) => ({ path, type }));
  
  this.pendingChanges.clear();
  
  const event: FileChangeEvent = {
    files,
    timestamp: Date.now()
  };
  
  this.subscribers.forEach(callback => callback(event));
}
```

### Glob Patterns for Watchers

```typescript
// config.yaml - exact path
'_bmad/bmm/config.yaml'

// epics.md - in planning artifacts
'{planningArtifacts}/epics.md'

// Story files - glob pattern
'{implementationArtifacts}/**/*.md'
```

### Error Recovery Strategy

- Use try/catch around watcher operations
- On error: log to ErrorService, attempt re-initialization after 5 seconds
- Maximum 3 retry attempts before giving up
- Show user notification if watchers fail permanently

### Disposable Pattern

```typescript
subscribe(callback: FileChangeCallback): vscode.Disposable {
  this.subscribers.push(callback);
  return {
    dispose: () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    }
  };
}
```

### Project Structure Notes

- File location: `src/services/FileWatcherService.ts`
- Depends on: ConfigService (for artifact paths), ErrorService (for error logging)
- Test location: `tests/unit/services/FileWatcherService.test.ts`
- Must be disposed on extension deactivation

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#File Watching Strategy]
- [Source: _bmad-output/planning-artifacts/prd.md#FR36, FR37] - File watching requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR-P7] - 200ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR-R3] - Retry logic
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR-I3] - Workspace compatibility

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

