<!-- webviews/sidebar/src/components/InProgressActions.svelte -->
<!-- Story 3.5: InProgressActions component for in-progress state -->
<!-- AC #1: Context-appropriate actions based on artifacts -->
<!-- AC #3: Workflow action button handlers -->
<script lang="ts">
  import type { ArtifactProgress, VsCodeApi } from '../lib/types';

  interface Props {
    artifacts: ArtifactProgress;
    vscode: VsCodeApi;
  }

  let { artifacts, vscode }: Props = $props();

  /**
   * AC #3: Launch agent with specific workflow
   */
  function launchAgent(agentId: string, command: string) {
    vscode.postMessage({
      type: 'launchAgent',
      payload: { agentId, command },
    });
  }

  /**
   * Determine next action based on artifact state
   * AC #1: Show context-appropriate buttons
   */
  interface NextAction {
    agent: string;
    command: string;
    label: string;
    icon: string;
  }

  function getNextAction(a: ArtifactProgress): NextAction | null {
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

  // Reactive next action
  let nextAction = $derived(getNextAction(artifacts));
</script>

<section class="in-progress-actions">
  <h2>Continue Your Project</h2>

  <!-- Completed steps with checkmarks (AC #1) -->
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
    {#if artifacts.hasEpics}
      <div class="step completed">
        <span class="icon">✅</span>
        <span>Epics & Stories</span>
      </div>
    {/if}
  </div>

  <!-- Next action button (prominent) - AC #1, #3 -->
  {#if nextAction}
    <button 
      class="next-action"
      onclick={() => launchAgent(nextAction!.agent, nextAction!.command)}
    >
      <span class="action-icon">{nextAction.icon}</span>
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
      onclick={() => launchAgent('analyst', 'chat')}
    >
      <span class="codicon codicon-comment-discussion"></span>
      Chat with Analyst
    </button>
  </div>
</section>

<style>
  .in-progress-actions {
    padding: 0;
  }

  h2 {
    font-size: 1rem;
    color: var(--vscode-foreground);
    margin: 0 0 1rem 0;
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

  .next-action .action-icon {
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
