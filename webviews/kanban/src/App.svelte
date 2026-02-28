<!--
  App.svelte - Kanban WebView Root Component
  Story 5.1: KanbanProvider Base Implementation
  Story 5.2: Kanban Column Layout
  Story 5.4: Dual-View Tab Navigation
  Story 5.8: Workflow Progress Bar
  
  Task 4: Main entry point for Kanban WebView
  - Initializes message listener for extension communication
  - Sends 'ready' message on mount
  - Task 7: Renders ViewTabs and conditionally KanbanBoard or EpicsView
  - Story 5.8: Renders WorkflowProgressBar above ViewTabs
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import KanbanBoard from './components/KanbanBoard.svelte';
  import ViewTabs from './components/ViewTabs.svelte';
  import EpicsView from './components/EpicsView.svelte';
  import WorkflowProgressBar from './components/WorkflowProgressBar.svelte';
  import { handleExtensionMessage, startLoading, activeView, setActiveView, workflowProgress } from './stores/kanbanStore';
  import type { ExtensionMessage } from '@shared/messages';

  // VS Code WebView API (exposed on window by main.ts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vscode = (window as any).vscode;

  // Task 4.2: Initialize message listener on mount
  onMount(() => {
    // Task 4.4: Set loading state
    startLoading();

    // Listen for messages from extension
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      handleExtensionMessage(event.data);
    };

    window.addEventListener('message', handleMessage);

    // Task 4.3: Send 'ready' message to trigger data load
    vscode.postMessage({ type: 'ready', payload: { webviewId: 'kanban' } });

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });

  // Task 7.2: Handle view change from ViewTabs
  function handleViewChange(event: CustomEvent<{ view: 'stories' | 'epics' }>): void {
    setActiveView(event.detail.view);
  }
</script>

<!-- Task 7.3-7.5: Render ViewTabs and conditional content -->
<!-- Story 5.8 Task 7: WorkflowProgressBar above ViewTabs -->
<main>
  <WorkflowProgressBar progress={$workflowProgress} />
  <ViewTabs activeView={$activeView} on:viewChange={handleViewChange} />
  
  {#if $activeView === 'stories'}
    <div id="panel-stories" class="panel" role="tabpanel" aria-labelledby="tab-stories">
      <KanbanBoard />
    </div>
  {:else}
    <div id="panel-epics" class="panel" role="tabpanel" aria-labelledby="tab-epics">
      <EpicsView />
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: var(--vscode-editor-background);
  }

  .panel {
    flex: 1;
    overflow: hidden;
  }
</style>
