<!--
  EpicCard.svelte - Epic card component for Kanban board
  Story 5.5: Epic Card Component
  
  Displays epic information including title, description (truncated),
  status badge, and story progress with full keyboard and screen reader accessibility.
  
  Props:
  - epic: Epic object with all epic metadata
  
  Clicking the card navigates to Stories view with epic filter applied.
-->

<script lang="ts">
  import type { Epic, EpicStatus } from '@shared/models';
  import { stories, setActiveView, setEpicFilter } from '../stores/kanbanStore';

  // Task 1.2: Component props
  interface Props {
    epic: Epic;
  }

  let { epic }: Props = $props();

  // Task 2.2-2.4: Derived story progress calculations
  let epicStories = $derived($stories.filter(s => s.epicId === epic.id));
  let doneCount = $derived(epicStories.filter(s => s.status === 'done').length);
  let totalCount = $derived(epicStories.length);
  let progressText = $derived(`${doneCount}/${totalCount} stories done`);

  // Task 3.1: Status color mapping using VS Code theme variables
  function getStatusColor(status: EpicStatus): string {
    const colorMap: Record<EpicStatus, string> = {
      'backlog': 'var(--vscode-descriptionForeground)',
      'in-progress': 'var(--vscode-charts-blue, #75beff)',
      'done': 'var(--vscode-testing-iconPassed, #89d185)'
    };
    return colorMap[status] ?? colorMap['backlog'];
  }

  // Task 3.2: Derived status color
  let statusColor = $derived(getStatusColor(epic.status));

  // Task 3.3: Format status text for display
  function formatStatus(status: EpicStatus): string {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Task 6.1: Computed ARIA label for screen readers
  let ariaLabel = $derived(
    `${epic.title} - ${formatStatus(epic.status)} - ${progressText}`
  );

  // Task 4.3: Handle card click - set filter and switch view
  function handleClick(): void {
    setEpicFilter(epic.id);
    setActiveView('stories');
  }

  // Task 5.4: Handle keyboard activation
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<!-- Task 5 & 6: Card with keyboard focus and ARIA accessibility -->
<div
  class="epic-card"
  tabindex="0"
  role="button"
  aria-label={ariaLabel}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <!-- Task 3: Status indicator and Epic ID row -->
  <div class="card-header">
    <span 
      class="status-indicator" 
      style="--status-color: {statusColor}"
      aria-hidden="true"
    ></span>
    <span class="epic-id">Epic {epic.id}</span>
    <span class="status-badge" style="--status-color: {statusColor}">
      {formatStatus(epic.status)}
    </span>
  </div>

  <!-- Task 1.3: Epic title in prominent heading -->
  <h3 class="epic-title">{epic.title}</h3>

  <!-- Task 1.4: Description with line-clamp truncation -->
  <p class="epic-description">{epic.description}</p>

  <!-- Card footer: Story progress -->
  <div class="card-footer">
    <span class="progress-badge">
      <i class="codicon codicon-checklist" aria-hidden="true"></i>
      {progressText}
    </span>
  </div>
</div>

<style>
  /* Task 1.5: VS Code theme integration */
  .epic-card {
    padding: 16px;
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;
  }

  .epic-card:hover {
    background-color: var(--vscode-list-hoverBackground);
  }

  /* Task 5.5: Focus states for keyboard navigation */
  .epic-card:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: -2px;
  }

  .epic-card:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: -2px;
    box-shadow: 0 0 0 3px var(--vscode-focusBorder, rgba(0, 122, 204, 0.3));
  }

  /* Card header: status indicator + epic ID + badge */
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  /* Task 3.1: Status indicator (colored dot) */
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--status-color);
    flex-shrink: 0;
  }

  .epic-id {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-textLink-foreground);
  }

  /* Task 3.2: Status badge */
  .status-badge {
    margin-left: auto;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    border-radius: 10px;
    background-color: var(--status-color);
    color: var(--vscode-editor-background);
  }

  /* Task 1.3: Prominent epic title */
  .epic-title {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
    line-height: 1.3;
  }

  /* Task 1.4: Description with line-clamp */
  .epic-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 12px 0;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    line-height: 1.5;
  }

  /* Card footer with progress badge */
  .card-footer {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .progress-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 500;
    background-color: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 3px;
  }

  .progress-badge i {
    font-size: 12px;
  }
</style>
