# Story 3.6: Progressive Panel - Epics Ready State

Status: done

## Story

As a **user with epics created**,
I want **a prominent button to open the Kanban board**,
So that **I can quickly access my story management view**.

## Acceptance Criteria

1. **Given** ConfigService detects epics.md exists in planning_artifacts
   **When** sidebar WebView renders
   **Then** [Open Kanban Board] button is prominently displayed (FR29)

2. **Given** user clicks [Open Kanban Board]
   **When** the click handler executes
   **Then** KanbanProvider opens the Kanban WebView in an editor tab

3. **Given** the epics-ready state panel renders
   **When** user views the sidebar
   **Then** a summary of project status is shown:
   - Total epics count
   - Stories by status (backlog, in-progress, done)
   - Quick links to launch Scrum Master agent

4. **Given** user is in epics-ready state
   **When** user wants to work on stories
   **Then** quick action buttons are available:
   - [Sprint Planning] - launches SM agent
   - [Create Story] - launches SM create-story workflow
   - [Dev Story] - launches Dev agent for current story

## Tasks / Subtasks

- [x] Task 1: Add epics-ready state detection (AC: #1)
  - [x] 1.1: Update ConfigService.getProjectState() to return 'epics-ready'
  - [x] 1.2: Parse epics.md to get epic count
  - [x] 1.3: Scan implementation-artifacts for story count

- [x] Task 2: Create openKanban command (AC: #2)
  - [x] 2.1: Register `vscode-bmad.openKanban` command
  - [x] 2.2: Command triggers KanbanProvider (placeholder until Epic 5)
  - [x] 2.3: Handle case where Kanban not yet implemented

- [x] Task 3: Create EpicsReadyActions Svelte component (AC: #1, #3, #4)
  - [x] 3.1: Create `webviews/sidebar/src/components/EpicsReadyActions.svelte`
  - [x] 3.2: Prominent "Open Kanban Board" button
  - [x] 3.3: Project summary section (epics, stories)
  - [x] 3.4: Quick action buttons for SM workflows

- [x] Task 4: Create ProjectSummary Svelte component (AC: #3)
  - [x] 4.1: Create `webviews/sidebar/src/components/ProjectSummary.svelte`
  - [x] 4.2: Display epic count
  - [x] 4.3: Display story counts by status
  - [x] 4.4: Visual progress indicator

- [x] Task 5: Add story count parsing (AC: #3)
  - [x] 5.1: Parse sprint-status.yaml to get story statuses
  - [x] 5.2: Count stories per status category
  - [x] 5.3: Add to projectStateChanged message payload

- [x] Task 6: Implement SM workflow buttons (AC: #4)
  - [x] 6.1: "Sprint Planning" → launches SM agent with SP command
  - [x] 6.2: "Create Story" → launches SM agent with CS command
  - [x] 6.3: "Dev Story" → launches Dev agent with current story

- [x] Task 7: Update App.svelte for epics-ready state (AC: #1-4)
  - [x] 7.1: Import EpicsReadyActions component
  - [x] 7.2: Import ProjectSummary component
  - [x] 7.3: Conditionally render for epics-ready state

- [x] Task 8: Add unit tests (AC: #1-4)
  - [x] 8.1: Test epics-ready state detection
  - [x] 8.2: Test Open Kanban button sends correct message
  - [x] 8.3: Test project summary calculations

## Dev Notes

### Project Summary Data Structure

```typescript
// Add to src/shared/messages.ts
export interface ProjectSummaryPayload {
  epicCount: number;
  storyCount: {
    total: number;
    backlog: number;
    inProgress: number;
    review: number;
    done: number;
  };
  currentSprintStory?: string;  // e.g., "3-1-webview-build-pipeline"
}
```

### Extended ProjectStatePayload

```typescript
export interface ProjectStatePayload {
  state: 'no-project' | 'fresh' | 'in-progress' | 'epics-ready';
  hasConfig: boolean;
  artifacts?: ArtifactProgress;
  summary?: ProjectSummaryPayload;  // Only present for epics-ready
}
```

### Sprint Status Parsing

```typescript
// ConfigService additions
async getProjectSummary(): Promise<ServiceResult<ProjectSummaryPayload>> {
  const configResult = await this.getConfig();
  if (!configResult.success) {
    return { success: false, error: configResult.error };
  }

  const sprintStatusPath = vscode.Uri.joinPath(
    vscode.Uri.file(configResult.data.implementationArtifacts),
    'sprint-status.yaml'
  );

  try {
    const content = await vscode.workspace.fs.readFile(sprintStatusPath);
    const yaml = this.parseYaml(content.toString());
    
    const status = yaml.development_status || {};
    const storyCount = {
      total: 0,
      backlog: 0,
      inProgress: 0,
      review: 0,
      done: 0,
    };
    
    let epicCount = 0;
    let currentStory: string | undefined;

    for (const [key, value] of Object.entries(status)) {
      if (key.startsWith('epic-') && !key.includes('retrospective')) {
        epicCount++;
      } else if (key.match(/^\d+-\d+/)) {
        // Story key pattern: "1-2-story-title"
        storyCount.total++;
        
        switch (value) {
          case 'backlog':
            storyCount.backlog++;
            break;
          case 'ready-for-dev':
          case 'in-progress':
            storyCount.inProgress++;
            if (!currentStory && value === 'in-progress') {
              currentStory = key;
            }
            break;
          case 'review':
            storyCount.review++;
            break;
          case 'done':
            storyCount.done++;
            break;
        }
      }
    }

    return {
      success: true,
      data: {
        epicCount,
        storyCount,
        currentSprintStory: currentStory,
      },
    };
  } catch {
    // No sprint-status.yaml yet
    return {
      success: true,
      data: {
        epicCount: 0,
        storyCount: { total: 0, backlog: 0, inProgress: 0, review: 0, done: 0 },
      },
    };
  }
}
```

### EpicsReadyActions Component

```svelte
<!-- webviews/sidebar/src/components/EpicsReadyActions.svelte -->
<script lang="ts">
  import type { ProjectSummaryPayload } from '../lib/types';
  import ProjectSummary from './ProjectSummary.svelte';

  export let summary: ProjectSummaryPayload;

  const vscode = acquireVsCodeApi();

  function openKanban() {
    vscode.postMessage({
      type: 'executeCommand',
      payload: { command: 'vscode-bmad.openKanban' },
    });
  }

  function launchAgent(agentId: string, command: string) {
    vscode.postMessage({
      type: 'launchAgent',
      payload: { agentId, command },
    });
  }
</script>

<section class="epics-ready">
  <!-- Primary Action: Open Kanban -->
  <button class="open-kanban" on:click={openKanban}>
    <span class="icon">📋</span>
    <span class="label">Open Kanban Board</span>
    <span class="codicon codicon-arrow-right"></span>
  </button>

  <!-- Project Summary -->
  <ProjectSummary {summary} />

  <!-- Quick Actions -->
  <div class="quick-actions">
    <h3>Quick Actions</h3>
    
    <button 
      class="action"
      on:click={() => launchAgent('sm', 'SP')}
    >
      <span class="codicon codicon-calendar"></span>
      Sprint Planning
    </button>

    <button 
      class="action"
      on:click={() => launchAgent('sm', 'CS')}
    >
      <span class="codicon codicon-add"></span>
      Create Next Story
    </button>

    {#if summary.currentSprintStory}
      <button 
        class="action primary"
        on:click={() => launchAgent('dev', summary.currentSprintStory)}
      >
        <span class="codicon codicon-code"></span>
        Continue: {summary.currentSprintStory}
      </button>
    {/if}
  </div>
</section>

<style>
  .epics-ready {
    padding: 1rem;
  }

  .open-kanban {
    width: 100%;
    padding: 1rem;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .open-kanban:hover {
    background: var(--vscode-button-hoverBackground);
  }

  .open-kanban:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  .open-kanban .icon {
    font-size: 1.5rem;
  }

  .open-kanban .label {
    flex: 1;
    text-align: left;
  }

  .quick-actions {
    margin-top: 1rem;
  }

  .quick-actions h3 {
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .action {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: transparent;
    color: var(--vscode-foreground);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .action:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .action:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  .action.primary {
    background: var(--vscode-button-secondaryBackground);
    border-color: var(--vscode-button-secondaryBackground);
  }
</style>
```

### ProjectSummary Component

```svelte
<!-- webviews/sidebar/src/components/ProjectSummary.svelte -->
<script lang="ts">
  import type { ProjectSummaryPayload } from '../lib/types';

  export let summary: ProjectSummaryPayload;

  $: completionPercent = summary.storyCount.total > 0
    ? Math.round((summary.storyCount.done / summary.storyCount.total) * 100)
    : 0;
</script>

<div class="project-summary">
  <div class="progress-bar">
    <div class="fill" style="width: {completionPercent}%"></div>
  </div>
  <div class="progress-label">
    {completionPercent}% Complete ({summary.storyCount.done}/{summary.storyCount.total} stories)
  </div>

  <div class="stats">
    <div class="stat">
      <span class="value">{summary.epicCount}</span>
      <span class="label">Epics</span>
    </div>
    <div class="stat">
      <span class="value">{summary.storyCount.backlog}</span>
      <span class="label">Backlog</span>
    </div>
    <div class="stat">
      <span class="value">{summary.storyCount.inProgress}</span>
      <span class="label">In Progress</span>
    </div>
    <div class="stat">
      <span class="value">{summary.storyCount.done}</span>
      <span class="label">Done</span>
    </div>
  </div>
</div>

<style>
  .project-summary {
    padding: 1rem;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 6px;
  }

  .progress-bar {
    height: 8px;
    background: var(--vscode-progressBar-background);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar .fill {
    height: 100%;
    background: var(--vscode-testing-iconPassed);
    transition: width 0.3s ease;
  }

  .progress-label {
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
    margin-top: 0.5rem;
    text-align: center;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .stat {
    text-align: center;
    padding: 0.5rem;
    background: var(--vscode-input-background);
    border-radius: 4px;
  }

  .stat .value {
    display: block;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .stat .label {
    font-size: 0.7rem;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
  }
</style>
```

### Open Kanban Command

```typescript
// extension.ts
context.subscriptions.push(
  vscode.commands.registerCommand('vscode-bmad.openKanban', () => {
    // Placeholder until Epic 5 implements KanbanProvider
    vscode.window.showInformationMessage(
      'Kanban Board coming in Epic 5! For now, check implementation-artifacts/sprint-status.yaml'
    );
  })
);
```

### Updated App.svelte

```svelte
<script lang="ts">
  import ActionButtons from './components/ActionButtons.svelte';
  import InProgressActions from './components/InProgressActions.svelte';
  import EpicsReadyActions from './components/EpicsReadyActions.svelte';
  import PhaseIndicator from './components/PhaseIndicator.svelte';
  import { state, config, artifacts, summary } from './stores/state';
  // ... rest of script
</script>

<main>
  {#if $state === 'in-progress' && $artifacts}
    <PhaseIndicator currentPhase={$artifacts.currentPhase} />
  {:else if $state === 'epics-ready'}
    <PhaseIndicator currentPhase="ready" />
  {/if}

  {#if $config}
    <header>
      <h1>👋 {$config.userName}</h1>
      <p class="project-name">{$config.projectName}</p>
    </header>
  {/if}

  {#if $state === 'no-project' || $state === 'fresh'}
    <ActionButtons />
  {:else if $state === 'in-progress' && $artifacts}
    <InProgressActions artifacts={$artifacts} />
  {:else if $state === 'epics-ready' && $summary}
    <EpicsReadyActions summary={$summary} />
  {/if}
</main>
```

### State Store Updates

```typescript
// webviews/sidebar/src/stores/state.ts
import { writable } from 'svelte/store';
import type { ProjectState, ConfigPayload, ArtifactProgress, ProjectSummaryPayload } from '../lib/types';

export const state = writable<ProjectState>('no-project');
export const config = writable<ConfigPayload | null>(null);
export const artifacts = writable<ArtifactProgress | null>(null);
export const summary = writable<ProjectSummaryPayload | null>(null);
```

### Project Structure Notes

- EpicsReadyActions is the main component for this state
- ProjectSummary shows progress at a glance
- Quick actions provide one-click access to common workflows
- Kanban button is placeholder until Epic 5

### References

- [Source: epics.md#Story 3.6] - Progressive Panel - Epics Ready State requirements
- [Source: prd.md#FR29] - Open Kanban Board button when epics ready
- [Source: architecture.md#WebView ↔ Extension Communication Protocol] - Message patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Task 1.1 was already implemented in Story 3.4 (ConfigService.getProjectState() returns 'epics-ready')
- Added ProjectSummaryPayload and StoryCount interfaces to shared/types.ts
- Implemented getProjectSummary() in ConfigService to parse sprint-status.yaml
- Extended ProjectStatePayload with optional summary field
- Created openKanban command as placeholder until Epic 5
- Updated SidebarProvider._sendProjectState() to include summary for epics-ready state
- Created EpicsReadyActions.svelte with prominent Kanban button and quick action buttons
- Created ProjectSummary.svelte with progress bar and stats grid
- Updated App.svelte to conditionally render EpicsReadyActions for epics-ready state
- Added 5 new unit tests for getProjectSummary() in ConfigService.test.ts
- Updated existing epics-ready test in SidebarProvider.test.ts to include summary mock
- All 124 tests passing; build successful

### File List

- src/shared/types.ts (modified: added ProjectSummaryPayload, StoryCount interfaces)
- src/shared/messages.ts (modified: added ProjectSummaryPayload to ProjectStatePayload)
- src/services/ConfigService.ts (modified: added getProjectSummary() method)
- src/providers/SidebarProvider.ts (modified: send summary in _sendProjectState())
- src/extension.ts (modified: added vscode-bmad.openKanban command)
- webviews/sidebar/src/App.svelte (modified: import EpicsReadyActions, handle epics-ready state)
- webviews/sidebar/src/components/EpicsReadyActions.svelte (created)
- webviews/sidebar/src/components/ProjectSummary.svelte (created)
- tests/unit/services/ConfigService.test.ts (modified: added getProjectSummary tests)
- tests/unit/providers/SidebarProvider.test.ts (modified: added mockGetProjectSummary, updated epics-ready test)
