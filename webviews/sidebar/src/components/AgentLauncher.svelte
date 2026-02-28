<!-- webviews/sidebar/src/components/AgentLauncher.svelte -->
<!-- Story 6.3: Agent Launcher UI Component -->
<!-- Story 6.5: Model Info Display (read-only) -->
<!-- AC #1: Dropdowns and controls for agent launching -->
<!-- AC #2: Command dropdown populated from selected agent -->
<!-- AC #3: PostMessage communication for launch -->
<!-- AC #4: VS Code styling -->
<!-- AC #5: Keyboard accessibility -->
<!-- AC #6: Error/empty state handling -->
<script lang="ts">
  import type { Agent, AgentCommand, ModelOption, VsCodeApi } from '../lib/types';

  interface Props {
    agents: Agent[];
    models: ModelOption[];  // Story 6.5: Available models (info only)
    vscode: VsCodeApi;
  }

  let { agents, models, vscode }: Props = $props();

  // Task 3.2: Reactive state
  let selectedAgentId = $state<string>('');
  let commands = $state<AgentCommand[]>([]);
  let selectedCommandCode = $state<string>('');
  let customPrompt = $state<string>('');

  // Computed: first model name for display
  let modelDisplayName = $derived(
    models.length > 0 ? models[0].displayName : 'Default'
  );

  // Task 3.4: Loading and error states
  let loadingCommands = $state<boolean>(false);

  // Computed: selected agent object
  let selectedAgent = $derived(agents.find(a => a.id === selectedAgentId) ?? null);

  // Computed: can launch if agent selected
  let canLaunch = $derived(selectedAgentId !== '');

  // Task 4.4: Handler for agent selection change
  function onAgentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedAgentId = select.value;
    selectedCommandCode = '';
    commands = [];

    if (selectedAgentId && selectedAgent) {
      loadingCommands = true;
      vscode.postMessage({
        type: 'requestCommands',
        payload: { agentFilePath: selectedAgent.filePath }
      });
    }
  }

  // Task 5.2: Handler for receiving commands
  export function setCommands(agentId: string, newCommands: AgentCommand[]) {
    if (agentId === selectedAgentId) {
      commands = newCommands;
      loadingCommands = false;
    }
  }

  // Task 8.3: Handler for launch button
  function launchAgent() {
    if (!selectedAgentId) return;

    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: selectedAgentId,
        command: selectedCommandCode || undefined,
        customPrompt: customPrompt || undefined
        // Note: model selection not supported via API - user selects in chat
      }
    });
  }
</script>

<section class="agent-launcher">
  <h3 class="section-title">Agent Launcher</h3>

  <!-- Task 10: Error/empty state when no agents -->
  {#if !agents || agents.length === 0}
    <div class="empty-state">
      <p class="empty-title">No agents found</p>
      <p class="empty-help">Check that <code>_bmad/bmm/agents/</code> folder exists and contains agent files.</p>
    </div>
  {:else}
    <!-- Task 4: Agent dropdown (AC #1, #2) -->
    <div class="field">
      <label for="agent-select" class="field-label">Agent</label>
      <select
        id="agent-select"
        class="dropdown"
        value={selectedAgentId}
        onchange={onAgentChange}
        aria-label="Select agent"
      >
        <option value="">Select an agent...</option>
        {#each agents as agent (agent.id)}
          <option value={agent.id}>
            {agent.icon ? `${agent.icon} ` : ''}{agent.displayName}
          </option>
        {/each}
      </select>
    </div>

    <!-- Task 5: Command dropdown (AC #2) -->
    <div class="field">
      <label for="command-select" class="field-label">Command</label>
      <select
        id="command-select"
        class="dropdown"
        bind:value={selectedCommandCode}
        disabled={!selectedAgentId || loadingCommands}
        aria-label="Select command"
      >
        {#if loadingCommands}
          <option value="">Loading commands...</option>
        {:else if !selectedAgentId}
          <option value="">Select an agent first</option>
        {:else if commands.length === 0}
          <option value="">No commands available</option>
        {:else}
          <option value="">Optional: select a command</option>
          {#each commands as cmd (cmd.code)}
            <option value={cmd.code}>[{cmd.code}] {cmd.description}</option>
          {/each}
        {/if}
      </select>
    </div>

    <!-- Story 6.5: Model info (read-only) -->
    <div class="field">
      <span class="field-label">Model</span>
      <div class="model-info" title="Seleziona il modello nella chat di Copilot">
        <span class="model-badge">{modelDisplayName}</span>
        <span class="model-hint">ⓘ seleziona in chat</span>
      </div>
    </div>

    <!-- Task 7: Custom prompt textarea (AC #1) -->
    <div class="field">
      <label for="custom-prompt" class="field-label">Custom Prompt</label>
      <textarea
        id="custom-prompt"
        class="prompt-field"
        bind:value={customPrompt}
        placeholder="Additional context for agent..."
        rows={4}
        aria-label="Custom prompt"
      ></textarea>
    </div>

    <!-- Task 8: Launch button (AC #3) -->
    <button
      class="launch-button"
      onclick={launchAgent}
      disabled={!canLaunch}
      aria-label="Launch agent in chat"
    >
      <span class="rocket-icon">🚀</span>
      Lancia in Chat
    </button>
  {/if}
</section>

<style>
  .agent-launcher {
    padding: 0;
    margin-top: 1rem;
  }

  .section-title {
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field {
    margin-bottom: 0.75rem;
  }

  .field-label {
    display: block;
    font-size: 0.8rem;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 0.25rem;
  }

  /* Task 4.1 / AC #4: Dropdown styling */
  .dropdown {
    width: 100%;
    padding: 6px 8px;
    background: var(--vscode-dropdown-background);
    color: var(--vscode-dropdown-foreground);
    border: 1px solid var(--vscode-dropdown-border);
    border-radius: 2px;
    font-size: 13px;
    font-family: var(--vscode-font-family);
  }

  /* Task 9.2: Focus styles for accessibility */
  .dropdown:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  .dropdown:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Task 7.1 / AC #4: Textarea styling */
  .prompt-field {
    width: 100%;
    padding: 6px 8px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 2px;
    resize: vertical;
    min-height: 60px;
    font-family: var(--vscode-font-family);
    font-size: 13px;
    box-sizing: border-box;
  }

  .prompt-field:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  /* Task 8.1 / AC #4: Button styling */
  .launch-button {
    width: 100%;
    padding: 8px 16px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .launch-button:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
  }

  .launch-button:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  .launch-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .rocket-icon {
    font-size: 1rem;
  }

  /* Task 10: Empty state styling */
  .empty-state {
    padding: 1rem;
    background: var(--vscode-inputValidation-warningBackground);
    border: 1px solid var(--vscode-inputValidation-warningBorder);
    border-radius: 4px;
  }

  .empty-title {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .empty-help {
    margin: 0;
    font-size: 0.9rem;
    color: var(--vscode-descriptionForeground);
  }

  .empty-help code {
    background: var(--vscode-textCodeBlock-background);
    padding: 0.1rem 0.3rem;
    border-radius: 2px;
    font-size: 0.85rem;
  }

  /* Story 6.5: Model info (read-only display) */
  .model-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 6px 8px;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    border-radius: 2px;
    cursor: help;
  }

  .model-badge {
    font-size: 13px;
    color: var(--vscode-foreground);
  }

  .model-hint {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    margin-left: auto;
  }
</style>
