<!--
  WorkflowTracker.svelte - BMAD Workflow "You Are Here" Tracker
  Story 6.7: Workflow Progress Tracker for Sidebar

  AC #1: Shows BMAD workflow phases with "you are here" indicator
  AC #7: Accessible with ARIA labels (NFR-A3)
-->

<script lang="ts">
  import type { WorkflowProgress, PhaseStatus } from '../lib/types';

  // Task 3.2: Props interface with progress
  interface Props {
    progress: WorkflowProgress | null;
  }

  let { progress }: Props = $props();

  // Task 3.3: Define 4 BMAD phases (FR24)
  const phases = [
    { key: 'planning', label: 'Planning', icon: '📋' },
    { key: 'solutioning', label: 'Solutioning', icon: '🏗️' },
    { key: 'implementation', label: 'Implementation', icon: '💻' },
    { key: 'testing', label: 'Testing', icon: '🧪' },
  ] as const;

  // Task 3.4: Get phase status from progress data
  function getPhaseStatus(key: string): PhaseStatus {
    if (!progress) return 'future';
    return progress[key as keyof WorkflowProgress] as PhaseStatus;
  }

  // Task 5.2, 5.4: Derive ARIA values for progressbar
  let currentPhaseIndex = $derived(
    progress ? phases.findIndex(p => p.key === progress.currentPhase) : 0
  );
  let ariaValueNow = $derived(currentPhaseIndex + 1);
  let ariaValueText = $derived(
    progress ? `Current phase: ${phases[currentPhaseIndex]?.label ?? 'Planning'}` : 'Loading workflow progress'
  );
</script>

<!-- Task 5.1, 5.2, 5.3, 5.4: ARIA accessibility container -->
<div 
  class="workflow-tracker"
  role="progressbar"
  aria-label="BMAD workflow phases"
  aria-valuemin={1}
  aria-valuemax={4}
  aria-valuenow={ariaValueNow}
  aria-valuetext={ariaValueText}
>
  <div class="tracker-header">
    <span class="section-label">Workflow</span>
  </div>
  
  <!-- Task 3.5: Horizontal layout with phase badges and connectors -->
  <div class="phases-container">
    {#each phases as phase, index}
      {@const status = getPhaseStatus(phase.key)}
      
      <div 
        class="phase {status}"
        aria-label="{phase.label}: {status}"
      >
        <span class="phase-indicator" aria-hidden="true">
          {#if status === 'completed'}
            <span class="checkmark">✓</span>
          {:else if status === 'current'}
            <span class="current-marker">▶</span>
          {:else}
            <span class="icon">{phase.icon}</span>
          {/if}
        </span>
        <span class="phase-label">{phase.label}</span>
        
        <!-- Task 4.4: "You are here" indicator for current phase -->
        {#if status === 'current'}
          <span class="here-indicator">← You are here</span>
        {/if}
      </div>

      <!-- Task 4.5: Connectors between phases -->
      {#if index < phases.length - 1}
        {@const nextStatus = getPhaseStatus(phases[index + 1].key)}
        <div 
          class="connector {nextStatus === 'future' ? 'future' : 'active'}" 
          aria-hidden="true"
        ></div>
      {/if}
    {/each}
  </div>
</div>

<style>
  /* Task 4: VS Code theme variables styling */
  .workflow-tracker {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    border: 1px solid var(--vscode-widget-border);
    border-radius: 4px;
    background: var(--vscode-editor-background);
  }

  .tracker-header {
    margin-bottom: 0.5rem;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--vscode-descriptionForeground);
    letter-spacing: 0.5px;
  }

  .phases-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .phase {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    position: relative;
    transition: all 0.2s ease;
  }

  .phase-indicator {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 10px;
  }

  .phase-label {
    font-size: 12px;
    flex: 1;
  }

  /* Task 4.1: Completed phases - green checkmark */
  .phase.completed {
    color: var(--vscode-testing-iconPassed, #4caf50);
  }

  .phase.completed .phase-indicator {
    background: var(--vscode-testing-iconPassed, #4caf50);
    color: var(--vscode-editor-background);
  }

  .phase.completed .checkmark {
    font-weight: bold;
  }

  /* Task 4.2: Current phase - highlighted */
  .phase.current {
    background: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
    font-weight: 600;
  }

  .phase.current .phase-indicator {
    background: var(--vscode-focusBorder);
    color: var(--vscode-editor-background);
  }

  /* Task 4.4: "You are here" indicator with pulse animation */
  .phase.current .current-marker {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .here-indicator {
    font-size: 10px;
    color: var(--vscode-focusBorder);
    font-style: italic;
    margin-left: auto;
  }

  /* Task 4.3: Future phases - dimmed */
  .phase.future {
    color: var(--vscode-disabledForeground);
    opacity: 0.6;
  }

  .phase.future .phase-indicator {
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-widget-border);
  }

  /* Task 4.5: Connectors between phases */
  .connector {
    width: 2px;
    height: 8px;
    margin-left: 9px;
    background: var(--vscode-disabledForeground);
    opacity: 0.4;
  }

  .connector.active {
    background: var(--vscode-focusBorder);
    opacity: 1;
  }
</style>
