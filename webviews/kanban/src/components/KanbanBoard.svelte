<!--
  KanbanBoard.svelte - Main Kanban board with four columns
  Story 5.2: Kanban Column Layout
  Story 5.5: Epic Card Component (filter indicator)
  Story 5.9: Epic Filter in Stories View (EpicFilterBar integration)
  
  Task 3: Renders four-column layout for story management
  - Backlog (backlog + ready-for-dev)
  - In Progress
  - Review
  - Done
  
  Task 6: EpicFilterBar with dropdown selector above columns
  
  FR8: Four status columns
  FR12: Epic filter functionality
  FR16: Story counts in column headers
  NFR-P1: Renders in <500ms for 50 stories
-->

<script lang="ts">
  import KanbanColumn from './KanbanColumn.svelte';
  import EpicFilterBar from './EpicFilterBar.svelte';
  import {
    backlogStories,
    inProgressStories,
    reviewStories,
    doneStories,
    loadingState,
    errorMessage
  } from '../stores/kanbanStore';

  // Task 3.2: Subscribe to derived stores with $store syntax
</script>

<!-- Task 3.1, 3.4: Horizontal scroll container -->
<div class="kanban-board">
  <!-- Story 5.9 Task 6: EpicFilterBar with dropdown selector -->
  <EpicFilterBar />

  {#if $loadingState === 'loading'}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading stories...</span>
    </div>
  {:else if $loadingState === 'error'}
    <div class="error-container">
      <span class="error-icon codicon codicon-error"></span>
      <span class="error-text">{$errorMessage ?? 'Failed to load stories'}</span>
    </div>
  {:else}
    <!-- Task 3.3: Render four KanbanColumn components -->
    <div class="columns-container">
      <KanbanColumn
        title="Backlog"
        status="backlog"
        stories={$backlogStories}
      />
      <KanbanColumn
        title="In Progress"
        status="in-progress"
        stories={$inProgressStories}
      />
      <KanbanColumn
        title="Review"
        status="review"
        stories={$reviewStories}
      />
      <KanbanColumn
        title="Done"
        status="done"
        stories={$doneStories}
      />
    </div>
  {/if}
</div>

<style>
  .kanban-board {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: var(--vscode-editor-background);
  }

  /* Task 3.4: Horizontal scroll for column overflow */
  .columns-container {
    display: flex;
    flex-direction: row;
    gap: 16px;
    padding: 16px;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }

  /* Custom scrollbar styling */
  .columns-container::-webkit-scrollbar {
    height: 8px;
  }

  .columns-container::-webkit-scrollbar-track {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 4px;
  }

  .columns-container::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-hoverBackground);
    border-radius: 4px;
  }

  .columns-container::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-activeBackground);
  }

  /* Loading state */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--vscode-progressBar-background);
    border-top-color: var(--vscode-textLink-foreground);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 14px;
    color: var(--vscode-descriptionForeground);
  }

  /* Error state */
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
  }

  .error-icon {
    font-size: 32px;
    color: var(--vscode-errorForeground);
  }

  .error-text {
    font-size: 14px;
    color: var(--vscode-errorForeground);
    text-align: center;
    max-width: 300px;
  }
</style>
