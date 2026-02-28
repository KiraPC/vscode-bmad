<!-- webviews/sidebar/src/App.svelte -->
<!-- Story 3.3: Updated Svelte App with PostMessage communication -->
<!-- Story 3.4: Progressive panel with ActionButtons component -->
<!-- Story 3.5: In-progress state with InProgressActions and PhaseIndicator -->
<!-- Story 3.6: Epics-ready state with EpicsReadyActions and ProjectSummary -->
<!-- Story 3.7: Artifact file tree display -->
<!-- Story 6.3: Agent Launcher integration -->
<!-- Story 6.5: Model Selector integration -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ActionButtons from './components/ActionButtons.svelte';
  import InProgressActions from './components/InProgressActions.svelte';
  import EpicsReadyActions from './components/EpicsReadyActions.svelte';
  import PhaseIndicator from './components/PhaseIndicator.svelte';
  import FileTree from './components/FileTree.svelte';
  import AgentLauncher from './components/AgentLauncher.svelte';
  import WorkflowTracker from './components/WorkflowTracker.svelte';
  import type { ExtensionMessage, ConfigPayload, ProjectStatePayload, ArtifactProgress, ProjectSummaryPayload, FilesLoadedPayload, Agent, ModelOption, WorkflowProgress } from './lib/types';

  // Task 6.1: Initialize VS Code API (declared in vscode.d.ts)
  const vscode = acquireVsCodeApi();

  // Reactive state
  let config: ConfigPayload | null = $state(null);
  let projectState: ProjectStatePayload | null = $state(null);
  let artifacts: ArtifactProgress | null = $state(null);
  let summary: ProjectSummaryPayload | null = $state(null);
  let files: FilesLoadedPayload | null = $state(null);
  let loading = $state(true);
  let errorMessage: string | null = $state(null);

  // Story 6.3 Task 11.2: Agents state for Agent Launcher
  let agents: Agent[] = $state([]);
  let agentLauncherRef: AgentLauncher | null = $state(null);

  // Story 6.5 Task 11.1: Models state for Model Selector with default fallback
  let models: ModelOption[] = $state([{ id: 'default', displayName: 'Default', vendor: 'auto', family: 'auto' }]);

  // Story 6.7 Task 6.2: Workflow progress state for WorkflowTracker
  let workflowProgress: WorkflowProgress | null = $state(null);

  // Task 6.3: Handle messages from extension
  function handleMessage(event: MessageEvent<ExtensionMessage>) {
    const message = event.data;

    switch (message.type) {
      case 'configLoaded':
        config = message.payload;
        loading = false;
        break;
      case 'projectStateChanged':
        projectState = message.payload;
        // Story 3.5: Extract artifacts from payload
        artifacts = message.payload.artifacts ?? null;
        // Story 3.6: Extract summary from payload
        summary = message.payload.summary ?? null;
        // Story 6.7 Task 6.3: Extract workflow progress from payload
        workflowProgress = message.payload.workflowProgress ?? null;
        loading = false;
        break;
      case 'filesLoaded':
        // Story 3.7 AC #1: Handle file tree data
        files = message.payload;
        break;
      case 'dataLoaded':
        // Will be handled in later stories
        break;
      case 'agentsLoaded':
        // Story 6.3 Task 11.3: Handle agents loaded message
        agents = message.payload.agents;
        break;
      case 'commandsLoaded':
        // Story 6.3 Task 11.3: Forward commands to AgentLauncher
        if (agentLauncherRef) {
          agentLauncherRef.setCommands(message.payload.agentId, message.payload.commands);
        }
        break;
      case 'modelsLoaded':
        // Story 6.5 Task 11.2, 11.3: Handle models loaded message
        models = message.payload.models;
        break;
      case 'error':
        errorMessage = message.payload.message;
        loading = false;
        break;
    }
  }

  onMount(() => {
    // Task 6.3: Add message listener for extension messages
    window.addEventListener('message', handleMessage);

    // Task 6.2: Send ready message on component mount
    vscode.postMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });
</script>

<main>
  {#if loading}
    <div class="loading">
      <p>Loading...</p>
    </div>
  {:else if errorMessage}
    <div class="error">
      <p>{errorMessage}</p>
    </div>
  {:else}
    <!-- Story 3.5 AC #4: Show phase indicator for in-progress state -->
    {#if projectState && (projectState.state === 'in-progress' || projectState.state === 'epics-ready') && artifacts}
      <PhaseIndicator currentPhase={artifacts.currentPhase} />
    {/if}

    <!-- Show header with user greeting when config is available -->
    {#if config}
      <div class="header">
        <h1>👋 {config.userName}</h1>
        <p class="project-name">{config.projectName}</p>
      </div>
    {/if}
    
    <!-- Story 3.4/3.5/3.6: Progressive panel based on project state -->
    {#if projectState}
      <!-- ActionButtons handles no-project and fresh states -->
      {#if projectState.state === 'no-project' || projectState.state === 'fresh'}
        <ActionButtons {projectState} {vscode} />
      {:else if projectState.state === 'epics-ready' && summary}
        <!-- Story 3.6 AC #1-4: Epics-ready state with Kanban button and project summary -->
        <EpicsReadyActions {summary} {vscode} />
      {:else if projectState.state === 'in-progress' && artifacts}
        <!-- Story 3.5 AC #1: In-progress state with context-appropriate actions -->
        <InProgressActions {artifacts} {vscode} />
      {/if}
    {/if}

    <!-- Story 3.7 AC #1: Show file tree when files are available -->
    {#if files}
      <FileTree {files} {vscode} />
    {/if}

    <!-- Story 6.7 Task 6.4, 6.5: Show WorkflowTracker for in-progress and epics-ready states -->
    {#if projectState && (projectState.state === 'in-progress' || projectState.state === 'epics-ready')}
      <WorkflowTracker progress={workflowProgress} />
    {/if}

    <!-- Story 6.3 Task 11.4: Show AgentLauncher in epics-ready or in-progress state -->
    <!-- Story 6.5 Task 11.4: Pass models to AgentLauncher -->
    {#if projectState && (projectState.state === 'epics-ready' || projectState.state === 'in-progress')}
      <AgentLauncher bind:this={agentLauncherRef} {agents} {models} {vscode} />
    {/if}
  {/if}
</main>

<style>
  main {
    padding: 1rem;
    color: var(--vscode-foreground);
    font-family: var(--vscode-font-family);
  }

  .header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--vscode-widget-border);
  }

  h1 {
    font-size: 1.2rem;
    margin: 0 0 0.25rem 0;
    color: var(--vscode-foreground);
  }

  .project-name {
    color: var(--vscode-descriptionForeground);
    font-size: 0.9rem;
    margin: 0;
  }

  .loading, .error {
    color: var(--vscode-descriptionForeground);
  }

  .error {
    color: var(--vscode-errorForeground);
  }
</style>
