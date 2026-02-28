# Story 3.5: Progressive Panel - In Progress State

Status: completed

## Story

As a **user with an in-progress project**,
I want **to see context-appropriate actions based on my existing artifacts**,
So that **I can continue where I left off**.

## Acceptance Criteria

1. **Given** ConfigService detects BMAD project with some artifacts (e.g., product-brief exists, no PRD)
   **When** sidebar WebView renders
   **Then** context-appropriate actions are shown:
   - If product-brief exists but no PRD: "Create PRD" button prominent
   - If PRD exists but no architecture: "Create Architecture" button prominent
   - Shows which phase the project is in (FR28)

2. **Given** project artifacts change (file created/deleted)
   **When** FileWatcher detects the change
   **Then** sidebar automatically updates to show new appropriate actions

3. **Given** user clicks a workflow action button
   **When** the click handler executes
   **Then** the appropriate agent/workflow is triggered

4. **Given** the in-progress state panel renders
   **When** user views the sidebar
   **Then** a mini workflow progress indicator shows current phase

## Tasks / Subtasks

- [x] Task 1: Extend project state detection for in-progress (AC: #1)
  - [x] 1.1: Add artifact detection logic to ConfigService
  - [x] 1.2: Detect product-brief.md presence
  - [x] 1.3: Detect prd.md presence
  - [x] 1.4: Detect architecture.md presence
  - [x] 1.5: Return detailed state with artifact flags

- [x] Task 2: Create ArtifactProgress type and message (AC: #1, #4)
  - [x] 2.1: Define `ArtifactProgress` interface with artifact flags
  - [x] 2.2: Add to `projectStateChanged` message payload
  - [x] 2.3: Add `currentPhase` field ('brainstorming', 'analysis', 'design', 'ready')

- [x] Task 3: Create InProgressActions Svelte component (AC: #1, #3)
  - [x] 3.1: Create `webviews/sidebar/src/components/InProgressActions.svelte`
  - [x] 3.2: Render context-appropriate buttons based on artifacts
  - [x] 3.3: Highlight the "next step" action prominently
  - [x] 3.4: Show completed steps with checkmarks

- [x] Task 4: Create PhaseIndicator Svelte component (AC: #4)
  - [x] 4.1: Create `webviews/sidebar/src/components/PhaseIndicator.svelte`
  - [x] 4.2: Show workflow phases: Brainstorming → Analysis → Design → Ready
  - [x] 4.3: Highlight current phase
  - [x] 4.4: Use visual indicators (icons, progress dots)

- [x] Task 5: Implement workflow action buttons (AC: #3)
  - [x] 5.1: "Create PRD" button → launches PM agent with PRD workflow
  - [x] 5.2: "Create Architecture" button → launches Architect agent
  - [x] 5.3: "Create Epics" button → launches PM agent with epics workflow
  - [x] 5.4: Connect to launchAgent message type

- [x] Task 6: Add file watching for artifact changes (AC: #2)
  - [x] 6.1: Watch planning_artifacts folder for file changes
  - [x] 6.2: Re-detect project state on change
  - [x] 6.3: Send updated projectStateChanged message
  - [x] 6.4: Debounce rapid changes (200ms)

- [x] Task 7: Update App.svelte for in-progress state (AC: #1-4)
  - [x] 7.1: Import InProgressActions component
  - [x] 7.2: Import PhaseIndicator component
  - [x] 7.3: Conditionally render based on state

- [x] Task 8: Add unit tests (AC: #1-4)
  - [x] 8.1: Test artifact detection logic
  - [x] 8.2: Test correct actions for each artifact combination
  - [x] 8.3: Test phase indicator reflects correct phase

## Dev Notes

### Artifact Detection Logic

```typescript
// ConfigService additions
export interface ArtifactProgress {
  hasProductBrief: boolean;
  hasPrd: boolean;
  hasArchitecture: boolean;
  hasEpics: boolean;
  currentPhase: 'brainstorming' | 'analysis' | 'design' | 'ready';
}

async getArtifactProgress(): Promise<ServiceResult<ArtifactProgress>> {
  const configResult = await this.getConfig();
  if (!configResult.success) {
    return { success: false, error: configResult.error };
  }

  const planningPath = configResult.data.planningArtifacts;
  
  const artifacts = {
    hasProductBrief: await this.fileExists(planningPath, '*product-brief*.md'),
    hasPrd: await this.fileExists(planningPath, '*prd*.md'),
    hasArchitecture: await this.fileExists(planningPath, '*architecture*.md'),
    hasEpics: await this.fileExists(planningPath, '*epic*.md'),
  };

  // Determine current phase
  let currentPhase: ArtifactProgress['currentPhase'];
  if (artifacts.hasEpics) {
    currentPhase = 'ready';
  } else if (artifacts.hasArchitecture) {
    currentPhase = 'design';
  } else if (artifacts.hasPrd) {
    currentPhase = 'analysis';
  } else {
    currentPhase = 'brainstorming';
  }

  return {
    success: true,
    data: { ...artifacts, currentPhase },
  };
}

private async fileExists(basePath: string, pattern: string): Promise<boolean> {
  const uri = vscode.Uri.file(basePath);
  try {
    const files = await vscode.workspace.fs.readDirectory(uri);
    const regex = this.globToRegex(pattern);
    return files.some(([name]) => regex.test(name));
  } catch {
    return false;
  }
}
```

### Extended ProjectStatePayload

```typescript
// Update in src/shared/messages.ts
export interface ProjectStatePayload {
  state: 'no-project' | 'fresh' | 'in-progress' | 'epics-ready';
  hasConfig: boolean;
  artifacts?: ArtifactProgress;
}
```

### InProgressActions Component

```svelte
<!-- webviews/sidebar/src/components/InProgressActions.svelte -->
<script lang="ts">
  import type { ArtifactProgress } from '../lib/types';
  
  export let artifacts: ArtifactProgress;
  
  const vscode = acquireVsCodeApi();

  function launchAgent(agentId: string, command: string) {
    vscode.postMessage({
      type: 'launchAgent',
      payload: { agentId, command },
    });
  }

  // Determine next action based on artifacts
  $: nextAction = getNextAction(artifacts);

  function getNextAction(a: ArtifactProgress): { agent: string; command: string; label: string; icon: string } | null {
    if (!a.hasProductBrief) {
      return { agent: 'analyst', command: 'product-brief', label: 'Create Product Brief', icon: '📋' };
    }
    if (!a.hasPrd) {
      return { agent: 'pm', command: 'create-prd', label: 'Create PRD', icon: '📝' };
    }
    if (!a.hasArchitecture) {
      return { agent: 'architect', command: 'create-architecture', label: 'Create Architecture', icon: '🏗️' };
    }
    if (!a.hasEpics) {
      return { agent: 'pm', command: 'create-epics', label: 'Create Epics & Stories', icon: '📊' };
    }
    return null;
  }
</script>

<section class="in-progress-actions">
  <h2>Continue Your Project</h2>

  <!-- Completed steps -->
  <div class="completed-steps">
    {#if artifacts.hasProductBrief}
      <div class="step completed">
        <span class="icon">✅</span>
        <span>Product Brief</span>
      </div>
    {/if}
    {#if artifacts.hasPrd}
      <div class="step completed">
        <span class="icon">✅</span>
        <span>PRD</span>
      </div>
    {/if}
    {#if artifacts.hasArchitecture}
      <div class="step completed">
        <span class="icon">✅</span>
        <span>Architecture</span>
      </div>
    {/if}
  </div>

  <!-- Next action (prominent) -->
  {#if nextAction}
    <button 
      class="next-action"
      on:click={() => launchAgent(nextAction.agent, nextAction.command)}
    >
      <span class="icon">{nextAction.icon}</span>
      <div class="content">
        <span class="label">{nextAction.label}</span>
        <span class="hint">Recommended next step</span>
      </div>
      <span class="arrow">→</span>
    </button>
  {/if}

  <!-- Secondary actions -->
  <div class="secondary-actions">
    <button 
      class="secondary"
      on:click={() => launchAgent('analyst', 'chat')}
    >
      <span class="codicon codicon-comment-discussion"></span>
      Chat with Analyst
    </button>
  </div>
</section>

<style>
  .in-progress-actions {
    padding: 1rem;
  }

  h2 {
    font-size: 1rem;
    color: var(--vscode-foreground);
    margin-bottom: 1rem;
  }

  .completed-steps {
    margin-bottom: 1rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    color: var(--vscode-descriptionForeground);
    font-size: 0.9rem;
  }

  .step.completed .icon {
    color: var(--vscode-testing-iconPassed);
  }

  .next-action {
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
    text-align: left;
    margin-bottom: 1rem;
  }

  .next-action:hover {
    background: var(--vscode-button-hoverBackground);
  }

  .next-action:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  .next-action .icon {
    font-size: 1.5rem;
  }

  .next-action .content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .next-action .label {
    font-weight: 600;
    font-size: 1rem;
  }

  .next-action .hint {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .next-action .arrow {
    font-size: 1.2rem;
  }

  .secondary-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .secondary {
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
  }

  .secondary:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .secondary:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }
</style>
```

### PhaseIndicator Component

```svelte
<!-- webviews/sidebar/src/components/PhaseIndicator.svelte -->
<script lang="ts">
  export let currentPhase: 'brainstorming' | 'analysis' | 'design' | 'ready';

  const phases = [
    { id: 'brainstorming', label: 'Brainstorm', icon: '🧠' },
    { id: 'analysis', label: 'Analysis', icon: '📝' },
    { id: 'design', label: 'Design', icon: '🏗️' },
    { id: 'ready', label: 'Ready', icon: '🚀' },
  ];

  function getPhaseStatus(phaseId: string): 'completed' | 'current' | 'pending' {
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'current';
    return 'pending';
  }
</script>

<div class="phase-indicator">
  {#each phases as phase, i}
    {@const status = getPhaseStatus(phase.id)}
    <div class="phase {status}">
      <span class="icon">{status === 'completed' ? '✓' : phase.icon}</span>
      <span class="label">{phase.label}</span>
    </div>
    {#if i < phases.length - 1}
      <div class="connector {getPhaseStatus(phases[i + 1].id) !== 'pending' ? 'active' : ''}"></div>
    {/if}
  {/each}
</div>

<style>
  .phase-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--vscode-widget-border);
  }

  .phase {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .phase .icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.9rem;
  }

  .phase.pending .icon {
    background: var(--vscode-input-background);
    color: var(--vscode-descriptionForeground);
  }

  .phase.current .icon {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }

  .phase.completed .icon {
    background: var(--vscode-testing-iconPassed);
    color: white;
  }

  .phase .label {
    font-size: 0.7rem;
    color: var(--vscode-descriptionForeground);
  }

  .phase.current .label {
    color: var(--vscode-foreground);
    font-weight: 600;
  }

  .connector {
    flex: 1;
    height: 2px;
    background: var(--vscode-widget-border);
    margin: 0 0.25rem;
    margin-bottom: 1rem;
  }

  .connector.active {
    background: var(--vscode-testing-iconPassed);
  }
</style>
```

### Updated App.svelte

```svelte
<script lang="ts">
  import ActionButtons from './components/ActionButtons.svelte';
  import InProgressActions from './components/InProgressActions.svelte';
  import PhaseIndicator from './components/PhaseIndicator.svelte';
  import { state, config, artifacts } from './stores/state';
  // ... rest of script
</script>

<main>
  {#if $state === 'in-progress' && $artifacts}
    <PhaseIndicator currentPhase={$artifacts.currentPhase} />
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
  {/if}
</main>
```

### File Watcher Integration

```typescript
// SidebarProvider additions
private setupFileWatcher(): void {
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders![0],
      '_bmad-output/planning-artifacts/**'
    )
  );

  const debouncedRefresh = this.debounce(() => this.refreshProjectState(), 200);

  watcher.onDidCreate(debouncedRefresh);
  watcher.onDidDelete(debouncedRefresh);
  watcher.onDidChange(debouncedRefresh);

  this.disposables.push(watcher);
}

private async refreshProjectState(): Promise<void> {
  const stateResult = await this.configService.getProjectState();
  const artifactsResult = await this.configService.getArtifactProgress();

  if (stateResult.success) {
    this.postMessage({
      type: 'projectStateChanged',
      payload: {
        state: stateResult.data,
        hasConfig: true,
        artifacts: artifactsResult.success ? artifactsResult.data : undefined,
      },
    });
  }
}
```

### Project Structure Notes

- InProgressActions shows context-aware next steps
- PhaseIndicator gives visual progress overview
- File watcher keeps UI in sync with file system
- All agent commands are placeholders until Epic 6

### References

- [Source: epics.md#Story 3.5] - Progressive Panel - In Progress State requirements
- [Source: prd.md#FR28] - Context-appropriate actions for in-progress
- [Source: architecture.md#File Watching Strategy] - FileSystemWatcher + debounce

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Implemented ArtifactProgress type and ProjectPhase type in types.ts
- Added getArtifactProgress() method to ConfigService with checkArtifactExists() and determinePhase() helpers
- Updated ProjectStatePayload in messages.ts to include optional artifacts field
- Updated SidebarProvider._sendProjectState() to fetch and include artifact progress
- Created InProgressActions.svelte with context-aware action buttons and completed steps display
- Created PhaseIndicator.svelte with 4-phase workflow progress indicator
- Updated App.svelte to render InProgressActions and PhaseIndicator for in-progress/epics-ready states
- File watching already implemented in Story 3.4 - reuses existing planning-artifacts watcher
- Added 10 new unit tests for artifact detection and phase indicator logic
- All 119 tests pass

### File List

- src/shared/types.ts (modified: added ArtifactProgress, ProjectPhase types)
- src/shared/messages.ts (modified: added artifacts field to ProjectStatePayload)
- src/services/ConfigService.ts (modified: added getArtifactProgress(), checkArtifactExists(), determinePhase())
- src/providers/SidebarProvider.ts (modified: updated _sendProjectState() to include artifacts)
- webviews/sidebar/src/components/InProgressActions.svelte (new)
- webviews/sidebar/src/components/PhaseIndicator.svelte (new)
- webviews/sidebar/src/App.svelte (modified: integrated InProgressActions and PhaseIndicator)
- tests/unit/services/ConfigService.test.ts (modified: added 10 tests for getArtifactProgress)
- tests/unit/providers/SidebarProvider.test.ts (modified: added mockGetArtifactProgress)
