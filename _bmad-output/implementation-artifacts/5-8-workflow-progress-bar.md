# Story 5.8: Workflow Progress Bar

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see a workflow progress bar above the Kanban board**,
So that **I know where I am in the overall BMAD process**.

## Acceptance Criteria

1. **Given** Kanban board is open
   **When** the header section renders
   **Then** a progress bar shows BMAD phases: Planning | Solutioning | Implementation | Testing (FR15)
   **And** visual indicators show completed (✓), current (highlighted), and future (dimmed) phases

2. **Given** planning artifacts exist (brainstorming, product-brief)
   **And** solutioning artifacts exist (prd.md, architecture.md)
   **And** implementation artifacts exist (epics.md, stories)
   **When** progress is calculated
   **Then** appropriate phases are marked as complete or in-progress (FR25)

3. **Given** the progress bar is rendered
   **When** user views it
   **Then** it displays above the ViewTabs (above [Epics]/[Stories] tabs)
   **And** uses VS Code theme variables for consistent styling

4. **Given** progress bar is visible
   **When** FileWatcherService detects artifact file changes
   **Then** progress bar state is recalculated and re-rendered

5. **Given** all phases are complete (all artifacts exist)
   **When** progress is calculated
   **Then** all phase indicators show completed state (✓)

## Tasks / Subtasks

- [x] Task 1: Add WorkflowPhase type and WorkflowProgress interface (AC: #1, #2)
  - [x] 1.1: In `src/shared/types.ts`, add `WorkflowPhase = 'planning' | 'solutioning' | 'implementation' | 'testing'`
  - [x] 1.2: Add `WorkflowProgress` interface with phase status map and currentPhase field
  - [x] 1.3: Export types for use in services and WebView

- [x] Task 2: Add workflow progress to DataLoadedPayload (AC: #4)
  - [x] 2.1: In `src/shared/messages.ts`, extend `DataLoadedPayload` to include `workflowProgress: WorkflowProgress`
  - [x] 2.2: Update any existing payload generation to include default/empty progress

- [x] Task 3: Create WorkflowProgressService (AC: #2)
  - [x] 3.1: Create `src/services/WorkflowProgressService.ts`
  - [x] 3.2: Implement `calculateProgress(config: BmadConfig): Promise<WorkflowProgress>`
  - [x] 3.3: Detect planning artifacts: brainstorming session files in `_bmad-output/brainstorming/`
  - [x] 3.4: Detect solutioning artifacts: prd.md + architecture.md in `planning_artifacts/`
  - [x] 3.5: Detect implementation artifacts: epics.md (required), any stories in `implementation_artifacts/`
  - [x] 3.6: Detect testing: story files with status='done' or test files (simplified for MVP)
  - [x] 3.7: Calculate current phase based on which artifacts exist
  - [x] 3.8: Export singleton getter `getWorkflowProgressService()`
  - [x] 3.9: Add to `src/services/index.ts` exports

- [x] Task 4: Integrate WorkflowProgressService into KanbanProvider (AC: #2, #4)
  - [x] 4.1: Import WorkflowProgressService in KanbanProvider.ts
  - [x] 4.2: In `_loadAndSendData()`, call `workflowProgressService.calculateProgress(config)`
  - [x] 4.3: Include `workflowProgress` in `dataLoaded` message payload
  - [x] 4.4: Recalculate on file watcher refresh events

- [x] Task 5: Create WorkflowProgressBar Svelte component (AC: #1, #3)
  - [x] 5.1: Create `webviews/kanban/src/components/WorkflowProgressBar.svelte`
  - [x] 5.2: Display 4 phase items: Planning | Solutioning | Implementation | Testing
  - [x] 5.3: Style phases: completed (checkmark, success color), current (highlighted, bold), future (dimmed)
  - [x] 5.4: Use CSS with VS Code theme variables (`--vscode-*`)
  - [x] 5.5: Add horizontal layout with connectors between phases
  - [x] 5.6: Add ARIA labels for accessibility (AC from NFR-A3)

- [x] Task 6: Add workflowProgress to Kanban store (AC: #4)
  - [x] 6.1: In `webviews/kanban/src/stores/kanbanStore.ts`, add `workflowProgress` writable store
  - [x] 6.2: Update `handleExtensionMessage()` to extract and set workflow progress from `dataLoaded`
  - [x] 6.3: Export workflowProgress for component access

- [x] Task 7: Integrate WorkflowProgressBar into App.svelte (AC: #3)
  - [x] 7.1: Import WorkflowProgressBar component
  - [x] 7.2: Import workflowProgress store
  - [x] 7.3: Render WorkflowProgressBar above ViewTabs
  - [x] 7.4: Pass $workflowProgress as prop

- [x] Task 8: Unit tests (AC: all)
  - [x] 8.1: Create `tests/unit/services/WorkflowProgressService.test.ts`
  - [x] 8.2: Test planning phase detection (only brainstorming files)
  - [x] 8.3: Test solutioning phase detection (prd + architecture, no epics)
  - [x] 8.4: Test implementation phase detection (epics exist, stories in progress)
  - [x] 8.5: Test testing phase detection (most stories done)
  - [x] 8.6: Test phase status calculation (completed, current, future)

## Dev Notes

### Architecture Compliance

**Decision: Hybrid Provider + Services Pattern**
- WorkflowProgressService is a new singleton service following existing patterns
- Service handles all file detection logic (keeps Provider thin)
- KanbanProvider calls service and passes data via PostMessage

**Decision: Extension Host as Single Source of Truth**
- Phase calculation happens in Extension Host (WorkflowProgressService)
- WebView receives calculated state via PostMessage
- No file system access from WebView

**Decision: Typed Message Protocol with Shared Interfaces**
- Extend existing `DataLoadedPayload` to include workflow progress
- Type-safe from service → provider → message → store → component

### Phase Detection Logic (FR25)

Based on artifact file presence in BMAD project structure:

```typescript
type PhaseStatus = 'completed' | 'current' | 'future';

interface WorkflowProgress {
  planning: PhaseStatus;      // brainstorming/*.md OR product-brief*.md exists
  solutioning: PhaseStatus;   // prd.md AND architecture.md exist
  implementation: PhaseStatus; // epics.md exists AND stories in progress
  testing: PhaseStatus;       // stories with status='done' OR percentage threshold
  currentPhase: WorkflowPhase;
}

// Detection rules:
// - Planning: COMPLETED when any file in _bmad-output/brainstorming/ OR *product-brief*.md
// - Solutioning: COMPLETED when prd.md AND architecture.md exist in planning_artifacts
// - Implementation: CURRENT when epics.md exists; COMPLETED when >90% stories 'done'
// - Testing: CURRENT when some stories 'done'; COMPLETED when all stories 'done'
```

### File Paths to Check

From config.yaml paths via ConfigService:
- `{planning_artifacts}/prd.md`
- `{planning_artifacts}/architecture.md`
- `{planning_artifacts}/epics.md`
- `{implementation_artifacts}/*.md` (story files)

Hardcoded BMAD structure:
- `{project-root}/_bmad-output/brainstorming/*.md`
- `{project-root}/_bmad-output/planning-artifacts/*product-brief*.md`

### Project Structure Notes

Files to create:
- [src/services/WorkflowProgressService.ts](src/services/WorkflowProgressService.ts) - NEW
- [webviews/kanban/src/components/WorkflowProgressBar.svelte](webviews/kanban/src/components/WorkflowProgressBar.svelte) - NEW

Files to modify:
- [src/shared/types.ts](src/shared/types.ts) - Add WorkflowPhase, WorkflowProgress types
- [src/shared/messages.ts](src/shared/messages.ts) - Extend DataLoadedPayload
- [src/services/index.ts](src/services/index.ts) - Export new service
- [src/providers/KanbanProvider.ts](src/providers/KanbanProvider.ts) - Integrate service
- [webviews/kanban/src/stores/kanbanStore.ts](webviews/kanban/src/stores/kanbanStore.ts) - Add workflowProgress store
- [webviews/kanban/src/App.svelte](webviews/kanban/src/App.svelte) - Add progress bar to layout

### Code Patterns to Follow

**WorkflowProgressService pattern (similar to ConfigService):**
```typescript
// src/services/WorkflowProgressService.ts
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import type { BmadConfig, ServiceResult, WorkflowProgress, WorkflowPhase } from '../shared/types';

type PhaseStatus = 'completed' | 'current' | 'future';

interface WorkflowProgressInternal {
    planning: PhaseStatus;
    solutioning: PhaseStatus;
    implementation: PhaseStatus;
    testing: PhaseStatus;
    currentPhase: WorkflowPhase;
}

export class WorkflowProgressService {
    private static instance: WorkflowProgressService;

    public static getInstance(): WorkflowProgressService {
        if (!WorkflowProgressService.instance) {
            WorkflowProgressService.instance = new WorkflowProgressService();
        }
        return WorkflowProgressService.instance;
    }

    public async calculateProgress(
        config: BmadConfig,
        stories: import('../shared/models').Story[]
    ): Promise<ServiceResult<WorkflowProgress>> {
        // 1. Check planning artifacts
        const planningComplete = await this.checkPlanningPhase(config);
        
        // 2. Check solutioning artifacts  
        const solutioningComplete = await this.checkSolutioningPhase(config);
        
        // 3. Check implementation artifacts
        const implementationComplete = this.checkImplementationPhase(stories);
        
        // 4. Check testing phase
        const testingComplete = this.checkTestingPhase(stories);

        // 5. Determine current phase and statuses
        const progress = this.determinePhaseStatuses(
            planningComplete, 
            solutioningComplete, 
            implementationComplete,
            testingComplete
        );

        return { success: true, data: progress };
    }

    private async checkPlanningPhase(config: BmadConfig): Promise<boolean> {
        // Check for brainstorming files or product-brief
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) return false;

        const brainstormPath = `${workspaceFolder}/_bmad-output/brainstorming`;
        try {
            const files = await fs.readdir(brainstormPath);
            return files.filter(f => f.endsWith('.md')).length > 0;
        } catch {
            // Also check for product-brief in planning artifacts
            try {
                const planningFiles = await fs.readdir(config.planningArtifacts);
                return planningFiles.some(f => f.toLowerCase().includes('product-brief'));
            } catch {
                return false;
            }
        }
    }

    private async checkSolutioningPhase(config: BmadConfig): Promise<boolean> {
        try {
            // PRD and Architecture must both exist
            await fs.access(`${config.planningArtifacts}/prd.md`);
            await fs.access(`${config.planningArtifacts}/architecture.md`);
            return true;
        } catch {
            return false;
        }
    }

    private checkImplementationPhase(stories: import('../shared/models').Story[]): boolean {
        // Implementation complete when >90% stories are 'done'
        if (stories.length === 0) return false;
        const doneCount = stories.filter(s => s.status === 'done').length;
        return (doneCount / stories.length) >= 0.9;
    }

    private checkTestingPhase(stories: import('../shared/models').Story[]): boolean {
        // Testing complete when ALL stories are 'done'
        if (stories.length === 0) return false;
        return stories.every(s => s.status === 'done');
    }

    private determinePhaseStatuses(
        planningDone: boolean,
        solutioningDone: boolean,
        implementationDone: boolean,
        testingDone: boolean
    ): WorkflowProgress {
        // Simple linear progression
        let currentPhase: WorkflowPhase;
        let statuses: Record<WorkflowPhase, PhaseStatus>;

        if (!planningDone) {
            currentPhase = 'planning';
            statuses = {
                planning: 'current',
                solutioning: 'future',
                implementation: 'future',
                testing: 'future'
            };
        } else if (!solutioningDone) {
            currentPhase = 'solutioning';
            statuses = {
                planning: 'completed',
                solutioning: 'current',
                implementation: 'future',
                testing: 'future'
            };
        } else if (!implementationDone) {
            currentPhase = 'implementation';
            statuses = {
                planning: 'completed',
                solutioning: 'completed',
                implementation: 'current',
                testing: 'future'
            };
        } else if (!testingDone) {
            currentPhase = 'testing';
            statuses = {
                planning: 'completed',
                solutioning: 'completed',
                implementation: 'completed',
                testing: 'current'
            };
        } else {
            currentPhase = 'testing';
            statuses = {
                planning: 'completed',
                solutioning: 'completed',
                implementation: 'completed',
                testing: 'completed'
            };
        }

        return { ...statuses, currentPhase };
    }
}

export function getWorkflowProgressService(): WorkflowProgressService {
    return WorkflowProgressService.getInstance();
}
```

**WorkflowProgressBar.svelte component:**
```svelte
<!-- webviews/kanban/src/components/WorkflowProgressBar.svelte -->
<script lang="ts">
  import type { WorkflowProgress } from '@shared/types';

  export let progress: WorkflowProgress | null = null;

  const phases = [
    { key: 'planning', label: 'Planning' },
    { key: 'solutioning', label: 'Solutioning' },
    { key: 'implementation', label: 'Implementation' },
    { key: 'testing', label: 'Testing' }
  ] as const;

  function getStatusClass(status: 'completed' | 'current' | 'future'): string {
    return status;
  }
</script>

<div class="workflow-progress" role="progressbar" aria-label="BMAD workflow progress">
  {#each phases as phase, index}
    <div 
      class="phase {getStatusClass(progress?.[phase.key] ?? 'future')}"
      aria-label="{phase.label}: {progress?.[phase.key] ?? 'future'}"
    >
      {#if progress?.[phase.key] === 'completed'}
        <span class="checkmark">✓</span>
      {/if}
      <span class="label">{phase.label}</span>
    </div>
    {#if index < phases.length - 1}
      <div class="connector {progress?.[phases[index + 1].key] === 'future' ? 'future' : 'active'}"></div>
    {/if}
  {/each}
</div>

<style>
  .workflow-progress {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    gap: 0;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .phase {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .phase.completed {
    color: var(--vscode-testing-iconPassed, #4caf50);
    background: var(--vscode-diffEditor-insertedTextBackground);
  }

  .phase.current {
    color: var(--vscode-focusBorder);
    background: var(--vscode-list-activeSelectionBackground);
    font-weight: 600;
  }

  .phase.future {
    color: var(--vscode-disabledForeground);
    opacity: 0.6;
  }

  .checkmark {
    font-weight: bold;
  }

  .connector {
    width: 24px;
    height: 2px;
    background: var(--vscode-disabledForeground);
  }

  .connector.active {
    background: var(--vscode-focusBorder);
  }

  .connector.future {
    opacity: 0.4;
  }
</style>
```

**Updating App.svelte:**
```svelte
<script lang="ts">
  // ... existing imports ...
  import WorkflowProgressBar from './components/WorkflowProgressBar.svelte';
  import { workflowProgress } from './stores/kanbanStore';
</script>

<main>
  <!-- NEW: Workflow progress bar above tabs -->
  <WorkflowProgressBar progress={$workflowProgress} />
  
  <ViewTabs activeView={$activeView} on:viewChange={handleViewChange} />
  <!-- ... rest of content ... -->
</main>
```

### Type Additions to shared/types.ts

```typescript
// Add to src/shared/types.ts

/**
 * BMAD workflow phases for progress tracking
 * Story 5.8: Workflow Progress Bar (FR15, FR25)
 */
export type WorkflowPhase = 'planning' | 'solutioning' | 'implementation' | 'testing';

/**
 * Status of each phase in the workflow
 */
export type PhaseStatus = 'completed' | 'current' | 'future';

/**
 * Workflow progress state for progress bar display
 * FR15: Show progress bar above Kanban columns
 * FR25: Derive state from artifact files
 */
export interface WorkflowProgress {
    planning: PhaseStatus;
    solutioning: PhaseStatus;
    implementation: PhaseStatus;
    testing: PhaseStatus;
    currentPhase: WorkflowPhase;
}
```

### Message Payload Extension

```typescript
// Update in src/shared/messages.ts

import type { WorkflowProgress } from './types';

export interface DataLoadedPayload {
    epics: Epic[];
    stories: Story[];
    workflowProgress?: WorkflowProgress;  // NEW - optional for backward compatibility
}
```

### Performance Considerations

- Artifact detection uses `fs.access()` (fast, no content read)
- Progress calculation happens during existing `_loadAndSendData()` flow
- No additional file system watches needed (reuses existing FileWatcherService)
- Svelte reactivity handles UI updates efficiently

### Edge Cases

1. **No artifacts exist:** All phases marked 'future', currentPhase = 'planning'
2. **Only partial solutioning (prd but no architecture):** Solutioning remains 'future'
3. **Empty stories array:** Implementation and testing marked 'future'
4. **All stories done:** All phases 'completed'
5. **WebView loads before data:** Show skeleton/empty progress bar

### Accessibility (NFR-A3, NFR-A2)

- Use `role="progressbar"` on container
- Add `aria-label` on each phase element with status
- Ensure keyboard focus is not needed (visual indicator only)
- Support high contrast themes via VS Code CSS variables

### Previous Story Learnings

From [5-7-kanban-auto-refresh.md](5-7-kanban-auto-refresh.md):
- FileWatcherService subscription pattern works well for auto-refresh
- Svelte stores update reactively - no manual DOM manipulation needed
- `_loadAndSendData()` is the right place to add new data calculations
- Disposable pattern for cleanup is critical

From [5-3-story-card-component.md](5-3-story-card-component.md):
- VS Code theme variables work well for consistent styling
- Component isolation keeps code maintainable

### References

- [Source: epics.md#Story-5.8](/_bmad-output/planning-artifacts/epics.md#story-58-workflow-progress-bar)
- [Source: prd.md#FR15](/_bmad-output/planning-artifacts/prd.md) - Workflow progress bar requirement
- [Source: prd.md#FR25](/_bmad-output/planning-artifacts/prd.md) - Derive state from artifacts
- [Source: architecture.md](/_bmad-output/planning-artifacts/architecture.md) - Hybrid Provider + Services pattern
- [Source: KanbanProvider.ts](src/providers/KanbanProvider.ts) - Existing provider structure
- [Source: kanbanStore.ts](webviews/kanban/src/stores/kanbanStore.ts) - Store patterns
- [Source: App.svelte](webviews/kanban/src/App.svelte) - Layout structure

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1**: Added `WorkflowPhase`, `PhaseStatus`, and `WorkflowProgress` types to `src/shared/types.ts`
- **Task 2**: Extended `DataLoadedPayload` in `src/shared/messages.ts` with optional `workflowProgress` field
- **Task 3**: Created `WorkflowProgressService` singleton with artifact detection logic for all 4 phases
- **Task 4**: Integrated service into `KanbanProvider` - calculates progress in `_loadAndSendData()` and includes in payload
- **Task 5**: Created `WorkflowProgressBar.svelte` with VS Code theme variables, ARIA labels, and connector styling
- **Task 6**: Added `workflowProgress` store to `kanbanStore.ts` with reactive updates from messages
- **Task 7**: Integrated progress bar into `App.svelte` above `ViewTabs`
- **Task 8**: Created comprehensive unit tests (15 tests) covering all phase detection scenarios

### File List

**New Files:**
- `src/services/WorkflowProgressService.ts` - Workflow progress calculation service
- `webviews/kanban/src/components/WorkflowProgressBar.svelte` - Progress bar Svelte component
- `tests/unit/services/WorkflowProgressService.test.ts` - Unit tests (15 tests)

**Modified Files:**
- `src/shared/types.ts` - Added WorkflowPhase, PhaseStatus, WorkflowProgress types
- `src/shared/messages.ts` - Extended DataLoadedPayload with workflowProgress
- `src/services/index.ts` - Added WorkflowProgressService export
- `src/providers/KanbanProvider.ts` - Integrated WorkflowProgressService
- `src/extension.ts` - Added workflowProgressService to KanbanProvider constructor
- `webviews/kanban/src/stores/kanbanStore.ts` - Added workflowProgress store
- `webviews/kanban/src/App.svelte` - Added WorkflowProgressBar component
