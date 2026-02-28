# Story 6.7: Workflow Progress Tracker

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see a "you are here" indicator in the BMAD workflow**,
So that **I always know what phase my project is in**.

## Acceptance Criteria

1. **Given** sidebar panel is open
   **When** workflow tracker section renders
   **Then** it shows BMAD workflow phases:
   - Planning
   - Solutioning
   - Implementation
   - Testing (FR24)
   **And** the current phase is visually highlighted with a "you are here" indicator

2. **Given** project has brainstorming or product-brief artifacts
   **When** state is derived
   **Then** "Planning" phase shows as completed (✓)
   **And** the next incomplete phase is highlighted as current

3. **Given** project has prd.md AND architecture.md in planning-artifacts
   **When** state is derived
   **Then** "Solutioning" phase shows as completed
   **And** state derivation uses file presence detection (FR25)

4. **Given** project has epics.md and stories exist
   **When** >90% of stories have status='done'
   **Then** "Implementation" phase shows as completed

5. **Given** all stories have status='done'
   **When** workflow tracker renders
   **Then** "Testing" phase shows as current or completed

6. **Given** artifacts change on disk (via git pull, agent modifications, or manual edits)
   **When** FileWatcherService detects change
   **Then** tracker updates automatically to reflect new state (via FileWatcherService subscription)
   **And** updates occur within 300ms of file change (NFR-P3)

7. **Given** workflow tracker is displayed
   **When** user navigates via keyboard
   **Then** component is accessible with ARIA labels (NFR-A3)

## Tasks / Subtasks

- [x] Task 1: Add workflowProgress to ProjectStatePayload (AC: #1, #6)
  - [x] 1.1: In `src/shared/messages.ts`, add `workflowProgress?: WorkflowProgress` to `ProjectStatePayload` interface
  - [x] 1.2: Import `WorkflowProgress` type if not already imported

- [x] Task 2: Wire WorkflowProgressService to SidebarProvider (AC: #2, #3, #4, #5)
  - [x] 2.1: In `src/providers/SidebarProvider.ts`, import `WorkflowProgressService`
  - [x] 2.2: In `_sendProjectState()`, call `WorkflowProgressService.getInstance().calculateProgress(config, stories)`
  - [x] 2.3: Add `workflowProgress` to the `projectStateChanged` payload
  - [x] 2.4: Handle case where no stories exist yet (pass empty array)

- [x] Task 3: Create WorkflowTracker.svelte component (AC: #1, #7)
  - [x] 3.1: Create `webviews/sidebar/src/components/WorkflowTracker.svelte`
  - [x] 3.2: Define props interface with `progress: WorkflowProgress | null`
  - [x] 3.3: Define phases array with 4 BMAD phases: Planning, Solutioning, Implementation, Testing
  - [x] 3.4: Implement `getPhaseStatus(key)` function returning 'completed' | 'current' | 'future'
  - [x] 3.5: Create horizontal layout with phase circles/badges and connectors

- [x] Task 4: Style WorkflowTracker with VS Code theme variables (AC: #1)
  - [x] 4.1: Use `--vscode-testing-iconPassed` for completed phases (green checkmark)
  - [x] 4.2: Use `--vscode-focusBorder` and `--vscode-list-activeSelectionBackground` for current phase highlight
  - [x] 4.3: Use `--vscode-disabledForeground` with opacity for future phases
  - [x] 4.4: Add "You are here" visual indicator (arrow or pulse animation) on current phase
  - [x] 4.5: Style connectors between phases (solid for completed, dimmed for future)

- [x] Task 5: Add ARIA accessibility attributes (AC: #7)
  - [x] 5.1: Add `role="progressbar"` to container
  - [x] 5.2: Add `aria-valuemin="1"`, `aria-valuemax="4"`, `aria-valuenow` based on current phase
  - [x] 5.3: Add `aria-label` to each phase element showing status
  - [x] 5.4: Add `aria-valuetext` showing current phase name

- [x] Task 6: Integrate WorkflowTracker into App.svelte (AC: #1)
  - [x] 6.1: Import WorkflowTracker component
  - [x] 6.2: Add `workflowProgress` state variable extracted from projectState
  - [x] 6.3: Update `handleMessage` to extract `workflowProgress` from `projectStateChanged` payload
  - [x] 6.4: Render WorkflowTracker in appropriate position (above AgentLauncher, below header)
  - [x] 6.5: Show for both 'in-progress' and 'epics-ready' states

- [x] Task 7: Wire FileWatcherService for auto-refresh (AC: #6)
  - [x] 7.1: In SidebarProvider, subscribe to FileWatcherService changes
  - [x] 7.2: On file change callback, recalculate workflow progress
  - [x] 7.3: Send updated `projectStateChanged` message to WebView
  - [x] 7.4: Ensure debounce is respected (200ms from FileWatcherService)

- [x] Task 8: Import StoryParser for story data (AC: #4, #5)
  - [x] 8.1: In SidebarProvider constructor, get reference to StoryParser service
  - [x] 8.2: In `_sendProjectState()`, call StoryParser to get current stories
  - [x] 8.3: Pass stories array to WorkflowProgressService.calculateProgress()
  - [x] 8.4: Handle parsing errors gracefully (pass empty array)

- [x] Task 9: Add unit tests for WorkflowTracker (AC: #1, #7)
  - [x] 9.1: Create `tests/unit/webviews/sidebar/WorkflowTracker.test.ts`
  - [x] 9.2: Test renders all 4 phases with correct labels
  - [x] 9.3: Test completed phase shows checkmark
  - [x] 9.4: Test current phase is highlighted
  - [x] 9.5: Test future phases are dimmed
  - [x] 9.6: Test ARIA attributes are present
  - [x] 9.7: Test null progress shows all phases as future

- [x] Task 10: Add integration test for workflow update flow (AC: #6)
  - [x] 10.1: In existing SidebarProvider tests or new file
  - [x] 10.2: Test `_sendProjectState` includes workflowProgress
  - [x] 10.3: Test workflowProgress recalculates on file watcher callback

## Dev Notes

### Existing Infrastructure - CRITICAL: USE THESE, DON'T RECREATE

**WorkflowProgressService ALREADY EXISTS** at [src/services/WorkflowProgressService.ts](src/services/WorkflowProgressService.ts):
```typescript
// Story 5.8 already implemented this service!
import { WorkflowProgressService } from '../services/WorkflowProgressService';

// Usage:
const service = WorkflowProgressService.getInstance();
const result = await service.calculateProgress(config, stories);
if (result.success) {
    const progress: WorkflowProgress = result.data;
    // progress.currentPhase: 'planning' | 'solutioning' | 'implementation' | 'testing'
    // progress.planning: 'completed' | 'current' | 'future'
    // etc.
}
```

**WorkflowProgress type ALREADY EXISTS** at [src/shared/types.ts](src/shared/types.ts#L190-L217):
```typescript
export type WorkflowPhase = 'planning' | 'solutioning' | 'implementation' | 'testing';
export type PhaseStatus = 'completed' | 'current' | 'future';

export interface WorkflowProgress {
    planning: PhaseStatus;
    solutioning: PhaseStatus;
    implementation: PhaseStatus;
    testing: PhaseStatus;
    currentPhase: WorkflowPhase;
}
```

**WorkflowProgressBar.svelte in Kanban** at [webviews/kanban/src/components/WorkflowProgressBar.svelte](webviews/kanban/src/components/WorkflowProgressBar.svelte):
- This is the reference implementation for the Kanban board
- The sidebar version should be similar but with "You are here" emphasis
- Copy styling patterns but adapt for sidebar width constraints

**PhaseIndicator.svelte** at [webviews/sidebar/src/components/PhaseIndicator.svelte](webviews/sidebar/src/components/PhaseIndicator.svelte):
- This is a DIFFERENT component showing 4 different phases (Brainstorm, Analysis, Design, Ready)
- Do NOT modify this - create a new WorkflowTracker component
- Can reuse some CSS patterns

### Phase Detection Logic (from WorkflowProgressService)

The service already implements FR25 detection logic:
- **Planning**: brainstorming/*.md OR *product-brief*.md exists → completed
- **Solutioning**: prd.md AND architecture.md exist → completed
- **Implementation**: epics.md exists; >90% stories 'done' → completed
- **Testing**: ALL stories 'done' → completed

### Key Patterns to Follow

**Message payload structure** (add to existing ProjectStatePayload):
```typescript
// src/shared/messages.ts - UPDATE THIS
export interface ProjectStatePayload {
    state: 'no-project' | 'fresh' | 'in-progress' | 'epics-ready';
    hasConfig: boolean;
    hasEpics: boolean;
    hasStories: boolean;
    artifacts?: ArtifactProgress;
    summary?: ProjectSummaryPayload;
    workflowProgress?: WorkflowProgress;  // ADD THIS
}
```

**SidebarProvider update pattern**:
```typescript
// In _sendProjectState() method
import { WorkflowProgressService } from '../services/WorkflowProgressService';
import { StoryParser } from '../services/StoryParser';

private async _sendProjectState(): Promise<void> {
    const stateResult = await this._configService.getProjectState();
    if (!stateResult.success) return;

    // Get stories for workflow calculation
    let stories: Story[] = [];
    const configResult = await this._configService.getConfig();
    if (configResult.success) {
        const storyParser = StoryParser.getInstance();
        const storiesResult = await storyParser.parseStories(configResult.data.implementationArtifacts);
        if (storiesResult.success) {
            stories = storiesResult.data;
        }
    }

    // Calculate workflow progress
    let workflowProgress: WorkflowProgress | undefined;
    if (configResult.success && (state === 'in-progress' || state === 'epics-ready')) {
        const progressResult = await WorkflowProgressService.getInstance()
            .calculateProgress(configResult.data, stories);
        if (progressResult.success) {
            workflowProgress = progressResult.data;
        }
    }

    this.postMessage({
        type: 'projectStateChanged',
        payload: { ...existingPayload, workflowProgress }
    });
}
```

**FileWatcher subscription** (add to SidebarProvider._setupFileWatchers):
```typescript
// Already has file watcher setup - just ensure it calls _sendProjectState
private _setupFileWatchers(): void {
    const fileWatcher = FileWatcherService.getInstance();
    fileWatcher.subscribe((event) => {
        // Debounce is handled by FileWatcherService
        this._sendProjectState(); // This will recalculate workflow progress
    });
}
```

### Svelte 5 Runes Syntax

Use the same patterns as other sidebar components:
```svelte
<script lang="ts">
  import type { WorkflowProgress, PhaseStatus } from '../lib/types';

  interface Props {
    progress: WorkflowProgress | null;
  }

  let { progress }: Props = $props();

  const phases = [
    { key: 'planning', label: 'Planning', icon: '📋' },
    { key: 'solutioning', label: 'Solutioning', icon: '🏗️' },
    { key: 'implementation', label: 'Implementation', icon: '💻' },
    { key: 'testing', label: 'Testing', icon: '🧪' },
  ] as const;

  function getPhaseStatus(key: string): PhaseStatus {
    if (!progress) return 'future';
    return progress[key as keyof WorkflowProgress] as PhaseStatus;
  }
</script>
```

### "You Are Here" Indicator Design

Add visual emphasis on current phase:
```css
.phase.current {
    position: relative;
}

.phase.current::before {
    content: '▶';
    position: absolute;
    left: -16px;
    color: var(--vscode-focusBorder);
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

Or use a "You are here" label:
```svelte
{#if status === 'current'}
    <span class="here-indicator">← You are here</span>
{/if}
```

### Project Structure Notes

- Alignment with unified project structure: ✅
- All paths use VS Code Uri API per NFR-C2
- Component goes in `webviews/sidebar/src/components/`
- Tests go in `tests/unit/webviews/sidebar/`

### References

- [Source: src/services/WorkflowProgressService.ts] - Phase calculation logic
- [Source: src/shared/types.ts#L190-L217] - WorkflowPhase, WorkflowProgress types
- [Source: webviews/kanban/src/components/WorkflowProgressBar.svelte] - Reference UI implementation
- [Source: webviews/sidebar/src/App.svelte] - Integration point
- [Source: src/providers/SidebarProvider.ts] - Provider to update
- [Source: src/shared/messages.ts] - Message types to extend
- [Source: _bmad-output/planning-artifacts/epics.md#FR24-FR25] - Original requirements

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- All 595 tests pass (including 21 new WorkflowTracker tests and 4 SidebarProvider integration tests)
- Build completes successfully for extension and sidebar webview

### Completion Notes List

- Task 7 FileWatcher integration already existed via `_debouncedStateRefresh()` calling `_sendProjectState()`
- WorkflowProgress type and WorkflowProgressService were pre-existing from Story 5.8
- Created vertical layout for WorkflowTracker (sidebar width constraints) vs horizontal in Kanban
- Reused styling patterns from PhaseIndicator and WorkflowProgressBar components

### File List

**Created:**
- [webviews/sidebar/src/components/WorkflowTracker.svelte](webviews/sidebar/src/components/WorkflowTracker.svelte) - Workflow tracker component with ARIA
- [tests/unit/webviews/sidebar/WorkflowTracker.test.ts](tests/unit/webviews/sidebar/WorkflowTracker.test.ts) - 21 component logic tests

**Modified:**
- [src/shared/messages.ts](src/shared/messages.ts) - Added workflowProgress to ProjectStatePayload
- [src/providers/SidebarProvider.ts](src/providers/SidebarProvider.ts) - Wire WorkflowProgressService and StoryParser
- [webviews/sidebar/src/App.svelte](webviews/sidebar/src/App.svelte) - Integrate WorkflowTracker component
- [tests/unit/providers/SidebarProvider.test.ts](tests/unit/providers/SidebarProvider.test.ts) - Added 4 integration tests for workflowProgress