<!--
  KanbanColumn.svelte - Single column for Kanban board
  Story 5.2: Kanban Column Layout
  
  Task 2: Displays a single status column with header and story cards
  
  Props:
  - title: Column display name
  - stories: Array of stories to display in this column
  - status: Column status for styling
-->

<script lang="ts">
  import type { Story, StoryStatus } from '@shared/models';
  import StoryCard from './StoryCard.svelte';

  // Task 2.2: Component props
  interface Props {
    title: string;
    stories: Story[];
    status: StoryStatus;
  }

  let { title, stories, status }: Props = $props();

  // Task 2.3: Story count for header badge
  let storyCount = $derived(stories.length);
</script>

<!-- Task 2.1, 2.4, 2.5: Column container -->
<div class="kanban-column" data-status={status}>
  <!-- Task 2.3: Column header with title and count badge -->
  <div class="column-header">
    <span class="column-title">{title}</span>
    <span class="story-count" class:has-stories={storyCount > 0}>{storyCount}</span>
  </div>

  <!-- Task 2.4: Scrollable card container -->
  <div class="column-content">
    {#each stories as story (story.id)}
      <StoryCard {story} />
    {/each}

    {#if storyCount === 0}
      <div class="empty-column">
        <span class="empty-text">No stories</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Task 2.5: VS Code theme variables */
  .kanban-column {
    display: flex;
    flex-direction: column;
    min-width: 250px;
    max-width: 300px;
    flex-shrink: 0;
    background-color: var(--vscode-sideBar-background);
    border-radius: 4px;
    border: 1px solid var(--vscode-panel-border);
    height: 100%;
    overflow: hidden;
  }

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: var(--vscode-sideBarSectionHeader-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
  }

  .column-title {
    font-weight: 600;
    font-size: 13px;
    color: var(--vscode-foreground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Task 2.3: Story count badge (FR16) */
  .story-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    background-color: var(--vscode-badge-background);
    border-radius: 10px;
  }

  .story-count.has-stories {
    color: var(--vscode-badge-foreground);
    background-color: var(--vscode-badge-background);
  }

  /* Task 2.4: Scrollable content area */
  .column-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-column {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    flex: 1;
  }

  .empty-text {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    opacity: 0.7;
  }

  /* Status-specific styling */
  [data-status="done"] .column-header {
    border-left: 3px solid var(--vscode-testing-iconPassed, #89d185);
  }

  [data-status="in-progress"] .column-header {
    border-left: 3px solid var(--vscode-charts-blue, #75beff);
  }

  [data-status="review"] .column-header {
    border-left: 3px solid var(--vscode-charts-yellow, #cca700);
  }

  [data-status="backlog"] .column-header,
  [data-status="ready-for-dev"] .column-header {
    border-left: 3px solid var(--vscode-descriptionForeground);
  }
</style>
