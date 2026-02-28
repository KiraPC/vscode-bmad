<!-- webviews/sidebar/src/components/PhaseIndicator.svelte -->
<!-- Story 3.5 Task 4: PhaseIndicator component -->
<!-- AC #4: Mini workflow progress indicator showing current phase -->
<script lang="ts">
  import type { ProjectPhase } from '../lib/types';

  interface Props {
    currentPhase: ProjectPhase;
  }

  let { currentPhase }: Props = $props();

  const phases = [
    { id: 'brainstorming', label: 'Brainstorm', icon: '🧠' },
    { id: 'analysis', label: 'Analysis', icon: '📝' },
    { id: 'design', label: 'Design', icon: '🏗️' },
    { id: 'ready', label: 'Ready', icon: '🚀' },
  ] as const;

  type PhaseStatus = 'completed' | 'current' | 'pending';

  function getPhaseStatus(phaseId: string): PhaseStatus {
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
      {@const nextStatus = getPhaseStatus(phases[i + 1].id)}
      <div class="connector {nextStatus !== 'pending' ? 'active' : ''}"></div>
    {/if}
  {/each}
</div>

<style>
  .phase-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    margin-bottom: 1rem;
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
    font-size: 0.65rem;
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
