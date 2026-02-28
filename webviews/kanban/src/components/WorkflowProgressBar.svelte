<!--
  WorkflowProgressBar.svelte - BMAD Workflow Progress Bar Component
  Story 5.8: Workflow Progress Bar

  AC #1: Display phases Planning | Solutioning | Implementation | Testing
  AC #3: Display above ViewTabs with VS Code theme variables
  AC #1: Visual indicators - completed (✓), current (highlighted), future (dimmed)
-->

<script lang="ts">
  import type { WorkflowProgress, PhaseStatus } from '../../../../src/shared/types';

  // Props using Svelte 5 runes syntax
  interface Props {
    progress: WorkflowProgress | null;
  }

  let { progress }: Props = $props();

  // Define the phases for display
  const phases = [
    { key: 'planning', label: 'Planning' },
    { key: 'solutioning', label: 'Solutioning' },
    { key: 'implementation', label: 'Implementation' },
    { key: 'testing', label: 'Testing' },
  ] as const;

  // Get status for a phase, defaulting to 'future' if no progress data
  function getPhaseStatus(key: string): PhaseStatus {
    if (!progress) return 'future';
    return progress[key as keyof WorkflowProgress] as PhaseStatus;
  }

  // Derive ARIA value for the progress bar
  let currentPhaseIndex = $derived(
    progress ? phases.findIndex(p => p.key === progress.currentPhase) : 0
  );
  let ariaValueNow = $derived(currentPhaseIndex + 1);
</script>

<!-- Story 5.8 Task 5.6: ARIA labels for accessibility (NFR-A3) -->
<div 
  class="workflow-progress" 
  role="progressbar" 
  aria-label="BMAD workflow progress"
  aria-valuemin={1}
  aria-valuemax={4}
  aria-valuenow={ariaValueNow}
  aria-valuetext={progress ? `Current phase: ${progress.currentPhase}` : 'Loading'}
>
  {#each phases as phase, index}
    {@const status = getPhaseStatus(phase.key)}
    <div 
      class="phase {status}"
      aria-label="{phase.label}: {status}"
    >
      {#if status === 'completed'}
        <span class="checkmark" aria-hidden="true">✓</span>
      {/if}
      <span class="label">{phase.label}</span>
    </div>
    {#if index < phases.length - 1}
      {@const nextStatus = getPhaseStatus(phases[index + 1].key)}
      <div class="connector {nextStatus === 'future' ? 'future' : 'active'}" aria-hidden="true"></div>
    {/if}
  {/each}
</div>

<style>
  /* Story 5.8 Task 5.4: Use CSS with VS Code theme variables */
  .workflow-progress {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    gap: 0;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .phase {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  /* Story 5.8 AC #1: Completed phases show checkmark and success color */
  .phase.completed {
    color: var(--vscode-testing-iconPassed, #4caf50);
    background: var(--vscode-diffEditor-insertedTextBackground);
  }

  /* Story 5.8 AC #1: Current phase is highlighted and bold */
  .phase.current {
    color: var(--vscode-focusBorder);
    background: var(--vscode-list-activeSelectionBackground);
    font-weight: 600;
  }

  /* Story 5.8 AC #1: Future phases are dimmed */
  .phase.future {
    color: var(--vscode-disabledForeground);
    opacity: 0.6;
  }

  .checkmark {
    font-weight: bold;
  }

  /* Story 5.8 Task 5.5: Horizontal connectors between phases */
  .connector {
    width: 24px;
    height: 2px;
    background: var(--vscode-disabledForeground);
  }

  .connector.active {
    background: var(--vscode-focusBorder);
  }

  .connector.future {
    opacity: 0.4;
  }
</style>
