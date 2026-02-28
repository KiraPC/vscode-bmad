<!--
  EpicsView.svelte - Epics Grid View Component
  Story 5.5: Epic Card Component
  
  Task 7: Renders a grid of EpicCard components
  - Displays all epics from the kanbanStore
  - Responsive grid layout (2-3 cards per row)
  - Shows empty state when no epics available
-->

<script lang="ts">
  import { epics } from '../stores/kanbanStore';
  import EpicCard from './EpicCard.svelte';
</script>

<!-- Task 7.2-7.4: Epic cards grid layout -->
<div class="epics-view">
  {#if $epics.length > 0}
    <div class="epics-grid">
      {#each $epics as epic (epic.id)}
        <EpicCard {epic} />
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <span class="icon">📋</span>
      <h2>No Epics Found</h2>
      <p>Parse epics.md to populate this view.</p>
      <p class="hint">Use the Scrum Master agent to create epics from your PRD.</p>
    </div>
  {/if}
</div>

<style>
  .epics-view {
    height: 100%;
    overflow-y: auto;
    padding: 16px;
    background-color: var(--vscode-editor-background);
  }

  /* Task 7.4: Responsive grid with 2-3 cards per row */
  .epics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 32px;
    opacity: 0.8;
  }

  .empty-state .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-state h2 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
    color: var(--vscode-descriptionForeground);
  }

  .empty-state .hint {
    margin-top: 16px;
    font-size: 12px;
    opacity: 0.7;
  }
</style>
