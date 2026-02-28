<!-- webviews/sidebar/src/components/ProjectSummary.svelte -->
<!-- Story 3.6: ProjectSummary component for project status display -->
<!-- AC #3: Display epic count, story counts by status, progress indicator -->
<script lang="ts">
  import type { ProjectSummaryPayload } from '../lib/types';

  interface Props {
    summary: ProjectSummaryPayload;
  }

  let { summary }: Props = $props();

  // Compute completion percentage reactively
  let completionPercent = $derived(
    summary.storyCount.total > 0
      ? Math.round((summary.storyCount.done / summary.storyCount.total) * 100)
      : 0
  );
</script>

<div class="project-summary">
  <!-- AC #3: Visual progress indicator -->
  <div class="progress-bar">
    <div class="fill" style="width: {completionPercent}%"></div>
  </div>
  <div class="progress-label">
    {completionPercent}% Complete ({summary.storyCount.done}/{summary.storyCount.total} stories)
  </div>

  <!-- AC #3: Stats grid with epic/story counts -->
  <div class="stats">
    <div class="stat">
      <span class="value">{summary.epicCount}</span>
      <span class="label">Epics</span>
    </div>
    <div class="stat">
      <span class="value">{summary.storyCount.backlog}</span>
      <span class="label">Backlog</span>
    </div>
    <div class="stat">
      <span class="value">{summary.storyCount.inProgress}</span>
      <span class="label">In Progress</span>
    </div>
    <div class="stat">
      <span class="value">{summary.storyCount.done}</span>
      <span class="label">Done</span>
    </div>
  </div>
</div>

<style>
  .project-summary {
    padding: 1rem;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 6px;
  }

  .progress-bar {
    height: 8px;
    background: var(--vscode-progressBar-background);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar .fill {
    height: 100%;
    background: var(--vscode-testing-iconPassed);
    transition: width 0.3s ease;
  }

  .progress-label {
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
    margin-top: 0.5rem;
    text-align: center;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
    overflow: hidden;
  }

  .stat {
    text-align: center;
    padding: 0.5rem;
    background: var(--vscode-input-background);
    border-radius: 4px;
  }

  .stat .value {
    display: block;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .stat .label {
    font-size: 0.7rem;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
  }
</style>
