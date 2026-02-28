<!--
  StoryCard.svelte - Story card component for Kanban board
  Story 5.3: Story Card Component
  Story 5.6: Story Card Click - Markdown Preview
  
  Displays story information including title, epic badge, status indicator,
  and optional assignee with full keyboard and screen reader accessibility.
  Clicking the card opens the story markdown file in preview mode.
  
  Props:
  - story: Story object with all story metadata
-->

<script lang="ts">
  import type { Story, StoryStatus } from '@shared/models';

  // Story 5.6 Task 1.1: Access vscode API from window (injected by webview)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vscode = (window as any).vscode;

  // Task 1.2: Component props
  interface Props {
    story: Story;
  }

  let { story }: Props = $props();

  // Story 5.6 Task 1.2: Click handler sends openFile PostMessage with preview=true
  function handleClick(): void {
    if (!story.filePath) {
      console.warn('Story has no filePath');
      return;
    }
    vscode?.postMessage({
      type: 'openFile',
      payload: { 
        filePath: story.filePath,
        preview: true  // Request markdown preview
      }
    });
  }

  // Story 5.6 Task 1.3: Keyboard handler for Enter/Space activation (AC #4)
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  // Task 3: Status color mapping using VS Code theme variables
  function getStatusColor(status: StoryStatus): string {
    const colorMap: Record<StoryStatus, string> = {
      'backlog': 'var(--vscode-descriptionForeground)',
      'ready-for-dev': 'var(--vscode-textLink-foreground)',
      'in-progress': 'var(--vscode-editorWarning-foreground)',
      'review': 'var(--vscode-charts-purple, #b180d7)',
      'done': 'var(--vscode-testing-iconPassed, #89d185)'
    };
    return colorMap[status] ?? colorMap['backlog'];
  }

  // Task 3: Derived status color
  let statusColor = $derived(getStatusColor(story.status));

  // Task 3: Format status text for display
  function formatStatus(status: StoryStatus): string {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Task 6: Computed ARIA label for screen readers
  let ariaLabel = $derived(() => {
    const parts = [
      story.title,
      `Epic ${story.epicId}`,
      `Status: ${formatStatus(story.status)}`
    ];
    if (story.assignee) {
      parts.push(`Assignee: ${story.assignee}`);
    }
    return parts.join(' - ');
  });
</script>

<!-- Task 5 & 6: Card with keyboard focus and ARIA accessibility -->
<!-- Story 5.6 Task 1.4 & 1.5: Added onclick and onkeydown handlers -->
<div
  class="story-card"
  tabindex="0"
  role="button"
  aria-label={ariaLabel()}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <!-- Task 3: Status indicator and story ID row -->
  <div class="card-header">
    <span 
      class="status-indicator" 
      style="--status-color: {statusColor}"
      aria-hidden="true"
    ></span>
    <span class="story-id">{story.id}</span>
  </div>

  <!-- Task 1.3: Story title in prominent heading -->
  <h3 class="story-title">{story.title}</h3>

  <!-- Card footer: Epic badge and assignee -->
  <div class="card-footer">
    <!-- Task 2: Epic badge -->
    <span class="epic-badge">
      <i class="codicon codicon-bookmark" aria-hidden="true"></i>
      Epic {story.epicId}
    </span>

    <!-- Task 4: Conditional assignee display -->
    {#if story.assignee}
      <span class="assignee">
        <i class="codicon codicon-person" aria-hidden="true"></i>
        {story.assignee}
      </span>
    {/if}
  </div>
</div>

<style>
  /* Task 1.4: VS Code theme integration */
  .story-card {
    padding: 12px;
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;
  }

  .story-card:hover {
    background-color: var(--vscode-list-hoverBackground);
  }

  /* Task 5.2 & 5.3: Focus states for keyboard navigation */
  .story-card:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: -2px;
  }

  .story-card:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: -2px;
    box-shadow: 0 0 0 3px var(--vscode-focusBorder, rgba(0, 122, 204, 0.3));
  }

  /* Card header: status indicator + story ID */
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

  .story-id {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-textLink-foreground);
  }

  /* Task 1.3: Prominent story title */
  .story-title {
    margin: 0 0 10px 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--vscode-foreground);
    line-height: 1.4;
  }

  /* Card footer: badges container */
  .card-footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
  }

  /* Task 2.2: Epic badge styling */
  .epic-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    background-color: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 3px;
    font-weight: 500;
  }

  /* Task 4.2: Assignee styling */
  .assignee {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--vscode-descriptionForeground);
  }

  /* Codicon sizing */
  .codicon {
    font-size: 12px;
  }
</style>
