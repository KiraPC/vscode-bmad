<!-- webviews/sidebar/src/components/EpicsReadyActions.svelte -->
<!-- Story 3.6: EpicsReadyActions component for epics-ready state -->
<!-- AC #1: Prominent Open Kanban Board button -->
<!-- AC #2: Click handler triggers KanbanProvider -->
<!-- AC #4: Quick action buttons for SM workflows -->
<script lang="ts">
  import type { ProjectSummaryPayload, VsCodeApi } from '../lib/types';
  import ProjectSummary from './ProjectSummary.svelte';

  interface Props {
    summary: ProjectSummaryPayload;
    vscode: VsCodeApi;
  }

  let { summary, vscode }: Props = $props();

  /**
   * AC #2: Open Kanban Board command
   */
  function openKanban() {
    vscode.postMessage({
      type: 'executeCommand',
      payload: { command: 'vscode-bmad.openKanban' },
    });
  }

  /**
   * AC #4: Launch agent with specific workflow
   */
  function launchAgent(agentId: string, command: string) {
    vscode.postMessage({
      type: 'launchAgent',
      payload: { agentId, command },
    });
  }
</script>

<section class="epics-ready">
  <!-- AC #1: Primary Action - Open Kanban Board -->
  <button class="open-kanban" onclick={openKanban}>
    <span class="icon">📋</span>
    <span class="label">Open Kanban Board</span>
    <span class="arrow">→</span>
  </button>

  <!-- AC #3: Project Summary -->
  <ProjectSummary {summary} />

  <!-- AC #4: Quick Actions -->
  <div class="quick-actions">
    <h3>Quick Actions</h3>
    
    <button 
      class="action"
      onclick={() => launchAgent('sm', 'SP')}
    >
      <span class="action-icon">📅</span>
      Sprint Planning
    </button>

    <button 
      class="action"
      onclick={() => launchAgent('sm', 'CS')}
    >
      <span class="action-icon">➕</span>
      Create Next Story
    </button>

    {#if summary.currentSprintStory}
      <button 
        class="action primary"
        onclick={() => launchAgent('dev', `DS ${summary.currentSprintStory}`)}
      >
        <span class="action-icon">💻</span>
        Continue: {summary.currentSprintStory}
      </button>
    {/if}
  </div>
</section>

<style>
  .epics-ready {
    padding: 0;
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

  .open-kanban .arrow {
    font-size: 1.2rem;
  }

  .quick-actions {
    margin-top: 1rem;
  }

  .quick-actions h3 {
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
    margin: 0 0 0.5rem 0;
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
    color: var(--vscode-button-secondaryForeground);
  }

  .action.primary:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  .action-icon {
    font-size: 1rem;
  }
</style>
