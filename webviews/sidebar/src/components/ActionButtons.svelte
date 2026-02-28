<!-- webviews/sidebar/src/components/ActionButtons.svelte -->
<!-- Story 3.4: ActionButtons component for fresh project state -->
<script lang="ts">
  import type { ProjectStatePayload, VsCodeApi } from '../lib/types';

  interface Props {
    projectState: ProjectStatePayload;
    vscode: VsCodeApi;
  }

  let { projectState, vscode }: Props = $props();

  // Track loading state for init button
  let isInitializing = $state(false);

  /**
   * AC #3: Handle "Start New BMAD Project" button click
   * Executes npx bmad-method install via TerminalService
   */
  function handleInitProject() {
    isInitializing = true;
    vscode.postMessage({
      type: 'executeCommand',
      payload: {
        command: 'vscode-bmad.initProject',
      },
    });
    // Reset after delay - actual state change will come from extension
    setTimeout(() => {
      isInitializing = false;
    }, 5000);
  }

  /**
   * AC #4: Handle Brainstorm button click
   * Launches brainstorming workflow via agent
   */
  function handleBrainstorm() {
    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: 'analyst',
        command: 'brainstorm',
      },
    });
  }

  /**
   * AC #4: Handle "Ho un'idea" button click
   * Launches idea capture workflow
   */
  function handleIdea() {
    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: 'analyst',
        command: 'idea',
      },
    });
  }

  /**
   * AC #4: Handle "Ho docs" button click
   * Launches document import workflow (FR27)
   */
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

{#if projectState.state === 'no-project'}
  <!-- AC #1: No _bmad/ folder - show Start New Project button -->
  <section class="action-buttons">
    <h2>Get Started</h2>
    <p class="description">No BMAD project detected in this workspace.</p>
    <button 
      class="primary" 
      onclick={handleInitProject}
      disabled={isInitializing}
    >
      {#if isInitializing}
        <span class="loading-spinner"></span>
        <span>Initializing...</span>
      {:else}
        <span class="icon">🚀</span>
        <span>Start New BMAD Project</span>
      {/if}
    </button>
  </section>

{:else if projectState.state === 'fresh'}
  <!-- AC #2: Fresh BMAD project - show three workflow buttons -->
  <section class="action-buttons">
    <h2>What would you like to do?</h2>
    
    <button class="action" onclick={handleBrainstorm}>
      <span class="icon">🧠</span>
      <div class="button-content">
        <span class="label">Brainstorm</span>
        <span class="desc">Explore and develop ideas freely</span>
      </div>
    </button>
    
    <button class="action" onclick={handleIdea}>
      <span class="icon">💡</span>
      <div class="button-content">
        <span class="label">Ho un'idea</span>
        <span class="desc">Capture a specific product idea</span>
      </div>
    </button>
    
    <button class="action" onclick={handleDocs}>
      <span class="icon">📄</span>
      <div class="button-content">
        <span class="label">Ho docs</span>
        <span class="desc">Import existing documentation</span>
      </div>
    </button>
  </section>
{/if}

<style>
  .action-buttons {
    padding: 0.5rem 0;
  }

  h2 {
    font-size: 0.9rem;
    color: var(--vscode-foreground);
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }

  .description {
    color: var(--vscode-descriptionForeground);
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
  }

  /* Primary button (Start New Project) */
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
    font-size: 0.9rem;
    font-family: inherit;
  }

  button.primary:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
  }

  button.primary:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  button.primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Action buttons (workflow buttons) */
  button.action {
    width: 100%;
    padding: 0.75rem;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
    margin-bottom: 0.5rem;
    font-family: inherit;
  }

  button.action:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-focusBorder);
  }

  button.action:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  button.action:last-child {
    margin-bottom: 0;
  }

  .icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .button-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .label {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--vscode-foreground);
  }

  .desc {
    font-size: 0.8rem;
    color: var(--vscode-descriptionForeground);
  }

  /* Loading spinner */
  .loading-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--vscode-button-foreground);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
