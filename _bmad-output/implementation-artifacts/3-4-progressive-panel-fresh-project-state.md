# Story 3.4: Progressive Panel - Fresh Project State

Status: done

## Story

As a **user in a fresh project (no artifacts)**,
I want **to see action buttons that guide me on what to do first**,
So that **I know how to start my BMAD workflow**.

## Acceptance Criteria

1. **Given** ConfigService detects no BMAD project (no `_bmad/` folder)
   **When** sidebar WebView renders
   **Then** "Start New BMAD Project" button is prominently displayed

2. **Given** ConfigService detects fresh BMAD project (config exists, no artifacts)
   **When** sidebar WebView renders
   **Then** three buttons are displayed:
   - [🧠 Brainstorm] - launches brainstorming workflow
   - [💡 Ho un'idea] - launches idea capture workflow  
   - [📄 Ho docs] - launches document import workflow (FR27)

3. **Given** user clicks "Start New BMAD Project" button
   **When** the click handler executes
   **Then** `npx bmad-method install` is executed via TerminalService
   **And** sidebar refreshes when `_bmad/` folder is created

4. **Given** user clicks any of the workflow action buttons
   **When** the click handler executes
   **Then** the appropriate agent/workflow is triggered via command

5. **Given** the project state changes (artifacts created)
   **When** extension detects the change
   **Then** sidebar UI updates to show appropriate state (Story 3.5)

## Tasks / Subtasks

- [x] Task 1: Add project state detection to extension (AC: #1, #2)
  - [x] 1.1: Add `getProjectState()` method to ConfigService
  - [x] 1.2: Return 'no-project' | 'fresh' | 'in-progress' | 'epics-ready'
  - [x] 1.3: Check for `_bmad/` folder existence
  - [x] 1.4: Check for artifact files (prd.md, architecture.md, epics.md)

- [x] Task 2: Create ProjectState message flow (AC: #1, #2)
  - [x] 2.1: Add `projectStateChanged` message in StoryProvider.onWebViewReady()
  - [x] 2.2: Send state to WebView after config is loaded
  - [x] 2.3: Create `state` Svelte store for project state

- [x] Task 3: Create ActionButtons Svelte component (AC: #1, #2)
  - [x] 3.1: Create `webviews/sidebar/src/components/ActionButtons.svelte`
  - [x] 3.2: Render different buttons based on project state
  - [x] 3.3: Use VS Code button styling from webview-ui-toolkit
  - [x] 3.4: Add icons using codicons

- [x] Task 4: Implement "Start New Project" button (AC: #3)
  - [x] 4.1: Send `executeCommand` message with `vscode-bmad.initProject`
  - [x] 4.2: Connect to existing initProject command from Story 2-3
  - [x] 4.3: Show loading state while command executes

- [x] Task 5: Implement workflow action buttons (AC: #4)
  - [x] 5.1: Create command definitions for each workflow
  - [x] 5.2: Register commands in extension.ts
  - [x] 5.3: Connect buttons to send appropriate messages
  - [x] 5.4: Implement placeholder handlers (agent launch in Epic 6)

- [x] Task 6: Add state refresh mechanism (AC: #5)
  - [x] 6.1: Watch for `_bmad/` folder changes
  - [x] 6.2: Watch for artifact file changes
  - [x] 6.3: Re-send projectStateChanged when changes detected
  - [x] 6.4: Add debouncing to prevent rapid updates

- [x] Task 7: Update App.svelte to show fresh state UI (AC: #1, #2)
  - [x] 7.1: Import ActionButtons component
  - [x] 7.2: Conditionally render based on state store
  - [x] 7.3: Add transitions for smooth state changes

- [x] Task 8: Add unit tests (AC: #1-5)
  - [x] 8.1: Test getProjectState() detection logic
  - [x] 8.2: Test correct buttons rendered for each state
  - [x] 8.3: Test button click handlers send correct messages

## Dev Notes

### Project State Detection Logic

```typescript
// ConfigService additions
export type ProjectState = 'no-project' | 'fresh' | 'in-progress' | 'epics-ready';

async getProjectState(): Promise<ServiceResult<ProjectState>> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return { success: true, data: 'no-project' };
  }

  const bmadPath = vscode.Uri.joinPath(workspaceFolder.uri, '_bmad');
  
  try {
    await vscode.workspace.fs.stat(bmadPath);
  } catch {
    // _bmad/ folder doesn't exist
    return { success: true, data: 'no-project' };
  }

  // Check for epics.md
  const configResult = await this.getConfig();
  if (!configResult.success) {
    return { success: true, data: 'fresh' };
  }

  const planningPath = configResult.data.planningArtifacts;
  const epicsPath = vscode.Uri.joinPath(
    vscode.Uri.file(planningPath),
    'epics.md'
  );

  try {
    await vscode.workspace.fs.stat(epicsPath);
    return { success: true, data: 'epics-ready' };
  } catch {
    // No epics.md - check for other artifacts
    const prdPath = vscode.Uri.joinPath(
      vscode.Uri.file(planningPath),
      'prd.md'
    );
    try {
      await vscode.workspace.fs.stat(prdPath);
      return { success: true, data: 'in-progress' };
    } catch {
      return { success: true, data: 'fresh' };
    }
  }
}
```

### ActionButtons Svelte Component

```svelte
<!-- webviews/sidebar/src/components/ActionButtons.svelte -->
<script lang="ts">
  import { state } from '../stores/state';
  import type { ProjectState } from '../lib/types';

  const vscode = acquireVsCodeApi();

  function handleInitProject() {
    vscode.postMessage({
      type: 'executeCommand',
      payload: {
        command: 'vscode-bmad.initProject',
      },
    });
  }

  function handleBrainstorm() {
    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: 'analyst',
        command: 'brainstorm',
      },
    });
  }

  function handleIdea() {
    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: 'analyst',
        command: 'idea',
      },
    });
  }

  function handleDocs() {
    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: 'analyst',
        command: 'import-docs',
      },
    });
  }
</script>

{#if $state === 'no-project'}
  <section class="action-buttons">
    <h2>Get Started</h2>
    <button class="primary" on:click={handleInitProject}>
      <span class="codicon codicon-rocket"></span>
      Start New BMAD Project
    </button>
  </section>

{:else if $state === 'fresh'}
  <section class="action-buttons">
    <h2>What would you like to do?</h2>
    
    <button class="action" on:click={handleBrainstorm}>
      <span class="icon">🧠</span>
      <span class="label">Brainstorm</span>
      <span class="desc">Explore and develop ideas</span>
    </button>
    
    <button class="action" on:click={handleIdea}>
      <span class="icon">💡</span>
      <span class="label">Ho un'idea</span>
      <span class="desc">Capture a specific idea</span>
    </button>
    
    <button class="action" on:click={handleDocs}>
      <span class="icon">📄</span>
      <span class="label">Ho docs</span>
      <span class="desc">Import existing documentation</span>
    </button>
  </section>
{/if}

<style>
  .action-buttons {
    padding: 1rem;
  }

  h2 {
    font-size: 1rem;
    color: var(--vscode-foreground);
    margin-bottom: 1rem;
  }

  button.primary {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
  }

  button.primary:hover {
    background: var(--vscode-button-hoverBackground);
  }

  button.primary:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  button.action {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    margin-bottom: 0.5rem;
  }

  button.action:hover {
    background: var(--vscode-list-hoverBackground);
  }

  button.action:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  .icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .label {
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .desc {
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
  }
</style>
```

### State Store

```typescript
// webviews/sidebar/src/stores/state.ts
import { writable } from 'svelte/store';
import type { ProjectState } from '../lib/types';

export const state = writable<ProjectState>('no-project');
export const config = writable<ConfigPayload | null>(null);
```

### Updated App.svelte

```svelte
<!-- webviews/sidebar/src/App.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ActionButtons from './components/ActionButtons.svelte';
  import { state, config } from './stores/state';
  import type { ExtensionMessage } from './lib/types';

  const vscode = acquireVsCodeApi();

  onMount(() => {
    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });
    
    return () => window.removeEventListener('message', handleMessage);
  });

  function handleMessage(event: MessageEvent<ExtensionMessage>) {
    const message = event.data;
    
    switch (message.type) {
      case 'configLoaded':
        config.set(message.payload);
        break;
      case 'projectStateChanged':
        state.set(message.payload.state);
        break;
      case 'error':
        console.error('Extension error:', message.payload);
        break;
    }
  }
</script>

<main>
  {#if $config}
    <header>
      <h1>👋 {$config.userName}</h1>
      <p class="project-name">{$config.projectName}</p>
    </header>
  {/if}

  <ActionButtons />
</main>

<style>
  main {
    padding: 0;
  }

  header {
    padding: 1rem;
    border-bottom: 1px solid var(--vscode-widget-border);
  }

  h1 {
    font-size: 1.2rem;
    margin-bottom: 0.25rem;
    color: var(--vscode-foreground);
  }

  .project-name {
    color: var(--vscode-descriptionForeground);
    font-size: 0.9rem;
    margin: 0;
  }
</style>
```

### Commands to Register

```typescript
// extension.ts
const commands = [
  vscode.commands.registerCommand('vscode-bmad.brainstorm', () => {
    // Placeholder - will integrate with CopilotService in Epic 6
    vscode.window.showInformationMessage('Brainstorm workflow coming soon!');
  }),
  vscode.commands.registerCommand('vscode-bmad.idea', () => {
    vscode.window.showInformationMessage('Idea capture workflow coming soon!');
  }),
  vscode.commands.registerCommand('vscode-bmad.importDocs', () => {
    vscode.window.showInformationMessage('Document import workflow coming soon!');
  }),
];

context.subscriptions.push(...commands);
```

### Accessibility Notes (NFR-A2, NFR-A4)

- All buttons are keyboard navigable via Tab
- Focus indicators use `var(--vscode-focusBorder)`
- Button labels are descriptive for screen readers
- Icons are decorative (emoji or codicons), meaning is in text

### Button Labels in user's language

From config.yaml, `communication_language: Italiano`:
- "Ho un'idea" is already Italian
- Consider making all button labels configurable based on language setting

### Project Structure Notes

- ActionButtons component handles the fresh state UI
- State store is reactive - UI updates automatically
- Commands are placeholders until Epic 6 (Agent Launcher)

### References

- [Source: epics.md#Story 3.4] - Progressive Panel - Fresh Project State requirements
- [Source: prd.md#FR27] - Three initial action buttons
- [Source: architecture.md#Svelte Component Organization] - Component structure
- [Source: architecture.md#Svelte Store Naming] - Store patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Task 1: Added `ProjectState` type to shared/types.ts and implemented `getProjectState()` method in ConfigService with full detection logic for no-project, fresh, in-progress, and epics-ready states
- Task 2: Updated SidebarProvider to use getProjectState() and send projectStateChanged message to WebView; fixed _onWebViewReady to send state before config
- Task 3: Created ActionButtons.svelte component with 'no-project' (init button) and 'fresh' (3 workflow buttons) states
- Task 4-5: Buttons integrated with executeCommand and launchAgent message types; initProject command from Story 2-3 reused
- Task 6: Added FileSystemWatcher for _bmad/ and planning-artifacts with 500ms debounce; proper cleanup in dispose()
- Task 7: Updated App.svelte to import and conditionally render ActionButtons based on projectState
- Task 8: Created ConfigService.test.ts with 7 tests for getProjectState(); updated SidebarProvider.test.ts with 4 new tests for Story 3.4

### File List

- src/shared/types.ts - Added ProjectState type
- src/shared/messages.ts - Added 'no-project' to ProjectStatePayload state union
- src/services/ConfigService.ts - Added getProjectState() method (~60 LOC)
- src/providers/SidebarProvider.ts - Updated _sendProjectState(), _onWebViewReady(), added file watchers (~50 LOC)
- webviews/sidebar/src/components/ActionButtons.svelte - New component (~200 LOC)
- webviews/sidebar/src/App.svelte - Integrated ActionButtons, updated styles
- tests/unit/services/ConfigService.test.ts - New test file (~220 LOC)
- tests/unit/providers/SidebarProvider.test.ts - Added Story 3.4 tests, updated mocks
