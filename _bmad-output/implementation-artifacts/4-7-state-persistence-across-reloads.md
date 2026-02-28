# Story 4.7: State Persistence Across Reloads

Status: ready-for-dev

## Story

As a **user**,
I want **extension state to persist across VS Code window reloads**,
So that **I don't lose my view state**.

## Acceptance Criteria

1. **Given** extension stores state (last view, scroll position, Kanban filters)
   **When** VS Code window is reloaded
   **Then** the state is restored from `context.workspaceState` (NFR-R6)

2. **Given** state storage fails (corruption, quota)
   **When** restoration is attempted
   **Then** graceful fallback to default state (no crash)

3. **Given** Kanban board was open with specific filters
   **When** window reloads and Kanban is opened
   **Then** previous filters and view (Epics/Stories) are restored

4. **Given** sidebar was expanded to a specific section
   **When** window reloads
   **Then** section expansion state is preserved

## Tasks / Subtasks

- [ ] Task 1: Design state persistence interface (AC: #1)
  - [ ] 1.1: Define PersistentState interface
  - [ ] 1.2: Identify all state to persist

- [ ] Task 2: Create StateService class (AC: #1, #2)
  - [ ] 2.1: Create `src/services/StateService.ts`
  - [ ] 2.2: Accept ExtensionContext in constructor
  - [ ] 2.3: Implement singleton pattern

- [ ] Task 3: Implement state save methods (AC: #1)
  - [ ] 3.1: Use `context.workspaceState.update()` for workspace-specific state
  - [ ] 3.2: Use `context.globalState.update()` for global preferences
  - [ ] 3.3: Serialize state to JSON

- [ ] Task 4: Implement state load methods (AC: #1, #2)
  - [ ] 4.1: Use `context.workspaceState.get()` to retrieve state
  - [ ] 4.2: Validate state structure matches expected interface
  - [ ] 4.3: Return defaults if state missing or invalid

- [ ] Task 5: Implement graceful fallback (AC: #2)
  - [ ] 5.1: Wrap load/save in try/catch
  - [ ] 5.2: Log errors to ErrorService
  - [ ] 5.3: Return default state on any failure

- [ ] Task 6: Define specific state keys (AC: #3, #4)
  - [ ] 6.1: Kanban view mode (epics/stories)
  - [ ] 6.2: Selected epic filter
  - [ ] 6.3: Scroll position (if feasible)
  - [ ] 6.4: Sidebar expanded sections

- [ ] Task 7: Integrate with providers (AC: #1)
  - [ ] 7.1: SidebarProvider saves/loads sidebar state
  - [ ] 7.2: KanbanProvider saves/loads kanban state

- [ ] Task 8: Register in service exports (AC: #1)
  - [ ] 8.1: Export from `src/services/index.ts`
  - [ ] 8.2: Initialize in extension.ts with context

- [ ] Task 9: Add unit tests (AC: #1-4)
  - [ ] 9.1: Create `tests/unit/services/StateService.test.ts`
  - [ ] 9.2: Test state save/load
  - [ ] 9.3: Test fallback on invalid state
  - [ ] 9.4: Test default values

## Dev Notes

### PersistentState Interface

```typescript
// src/services/StateService.ts

export interface KanbanState {
  /** Current view mode: 'epics' or 'stories' */
  viewMode: 'epics' | 'stories';
  /** Currently selected epic filter (null = all) */
  selectedEpicId: string | null;
  /** Last known scroll position */
  scrollPosition?: number;
}

export interface SidebarState {
  /** Expanded sections in sidebar */
  expandedSections: string[];
}

export interface PersistentState {
  kanban: KanbanState;
  sidebar: SidebarState;
  /** Timestamp of last save */
  lastUpdated: number;
}

export const DEFAULT_STATE: PersistentState = {
  kanban: {
    viewMode: 'stories',
    selectedEpicId: null,
    scrollPosition: 0
  },
  sidebar: {
    expandedSections: ['artifacts', 'actions']
  },
  lastUpdated: 0
};
```

### StateService Implementation

```typescript
export class StateService {
  private static instance: StateService | null = null;
  private context: vscode.ExtensionContext;
  private readonly STATE_KEY = 'bmad.persistentState';

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static initialize(context: vscode.ExtensionContext): StateService {
    if (!StateService.instance) {
      StateService.instance = new StateService(context);
    }
    return StateService.instance;
  }

  static getInstance(): StateService {
    if (!StateService.instance) {
      throw new Error('StateService not initialized. Call initialize() first.');
    }
    return StateService.instance;
  }

  async getState(): Promise<PersistentState> {
    try {
      const state = this.context.workspaceState.get<PersistentState>(this.STATE_KEY);
      if (state && this.isValidState(state)) {
        return state;
      }
    } catch (error) {
      getErrorService().logError({
        code: 'STATE_LOAD_ERROR',
        message: String(error),
        userMessage: 'Failed to load saved state',
        recoverable: true
      });
    }
    return { ...DEFAULT_STATE };
  }

  async saveState(state: Partial<PersistentState>): Promise<void> {
    try {
      const current = await this.getState();
      const updated = {
        ...current,
        ...state,
        lastUpdated: Date.now()
      };
      await this.context.workspaceState.update(this.STATE_KEY, updated);
    } catch (error) {
      getErrorService().logError({
        code: 'STATE_SAVE_ERROR',
        message: String(error),
        userMessage: 'Failed to save state',
        recoverable: true
      });
    }
  }

  private isValidState(state: unknown): state is PersistentState {
    // Type guard to validate state structure
    return (
      typeof state === 'object' &&
      state !== null &&
      'kanban' in state &&
      'sidebar' in state
    );
  }
}
```

### VS Code Extension Context APIs

- `context.workspaceState`: Per-workspace storage (survives reloads)
- `context.globalState`: Global storage (survives across workspaces)
- Both use key-value storage with `get<T>()` and `update(key, value)`

### Partial Updates

Support partial state updates to avoid overwriting unrelated state:

```typescript
// Update only kanban state
await stateService.saveState({
  kanban: { viewMode: 'epics', selectedEpicId: '4' }
});
```

### WebView State vs Service State

- **WebView State**: `vscode.getState()` / `vscode.setState()` in WebView
  - Survives WebView hide/show
  - Lost on window reload
  
- **WorkspaceState**: `context.workspaceState`
  - Survives window reload
  - Per-workspace

Strategy: Use WorkspaceState for cross-reload persistence, WebView state for temporary UI state.

### Integration Points

1. **Extension Activation**: Initialize StateService with context
2. **Provider Initialization**: Load initial state
3. **State Changes**: Save state on view/filter changes
4. **WebView postMessage**: Sync state between WebView and extension

### Project Structure Notes

- File location: `src/services/StateService.ts`
- Must receive ExtensionContext during initialization
- Test location: `tests/unit/services/StateService.test.ts`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Strategy]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-R6] - State persistence requirement
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR-R5] - Maintain scroll position
- [Source: src/extension.ts] - ExtensionContext available here

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

