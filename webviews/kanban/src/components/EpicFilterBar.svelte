<!--
  EpicFilterBar.svelte - Epic filter controls for Stories view
  Story 5.9: Epic Filter in Stories View
  
  Provides:
  - Dropdown to select epic filter (AC #4)
  - Badge showing active filter with epic title (AC #3)
  - Clear button to remove filter (AC #2, #3)
  - Keyboard accessibility (AC #6)
  - ARIA accessibility for screen readers (AC #7)
  
  Uses kanbanStore for filter state management.
-->

<script lang="ts">
  import { 
    epics, 
    epicFilter, 
    setEpicFilter, 
    clearEpicFilter, 
    activeFilterEpicTitle 
  } from '../stores/kanbanStore';
  
  /**
   * Handle dropdown selection change
   * Task 3.5: Bind selected value to reactive handler
   */
  function handleSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    setEpicFilter(value === '' ? null : value);
  }

  /**
   * Handle keyboard events on clear button
   * Task 4.3: Enter/Space activates clear
   */
  function handleClearKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      clearEpicFilter();
    }
  }
</script>

<!-- Task 5.2: aria-live for screen reader announcements -->
<div class="filter-bar" aria-live="polite">
  <!-- Task 3.3, 3.4: Dropdown with All Epics and epic options -->
  <label class="filter-label" for="epic-filter-select">
    <span class="label-text">Filter:</span>
  </label>
  <select 
    id="epic-filter-select"
    class="epic-select"
    value={$epicFilter ?? ''}
    onchange={handleSelectChange}
    aria-label="Filter stories by epic"
  >
    <option value="">All Epics</option>
    {#each $epics as epic (epic.id)}
      <option value={epic.id}>{epic.id}: {epic.title}</option>
    {/each}
  </select>

  <!-- Task 3.6, 3.7: Active filter badge with clear button -->
  {#if $activeFilterEpicTitle}
    <div class="filter-badge" role="status">
      <span class="badge-text">
        <span class="visually-hidden">Currently filtering by: </span>
        {$activeFilterEpicTitle}
      </span>
      <button 
        class="clear-button" 
        onclick={clearEpicFilter}
        onkeydown={handleClearKeydown}
        tabindex="0"
        aria-label="Clear epic filter"
        type="button"
      >
        <span class="clear-icon" aria-hidden="true">✕</span>
        <span class="clear-text">Clear</span>
      </button>
    </div>
  {/if}
</div>

<style>
  /* Task 3.8: VS Code theme variables */
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background-color: var(--vscode-sideBarSectionHeader-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-wrap: wrap;
  }

  .filter-label {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }

  .label-text {
    margin-right: 4px;
  }

  /* Task 3.3: Dropdown select styling */
  .epic-select {
    padding: 4px 8px;
    min-width: 180px;
    background-color: var(--vscode-input-background);
    color: var(--vscode-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  }

  /* Task 4.4: Visible focus indicator */
  .epic-select:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 1px var(--vscode-focusBorder);
  }

  .epic-select:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 1px;
  }

  /* Task 3.6: Filter badge styling */
  .filter-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px 2px 10px;
    background-color: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 12px;
    font-size: 12px;
  }

  .badge-text {
    font-weight: 500;
  }

  /* Task 3.7: Clear button styling */
  .clear-button {
    display: flex;
    align-items: center;
    gap: 2px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    color: var(--vscode-badge-foreground);
    font-size: 11px;
    opacity: 0.8;
    border-radius: 4px;
    transition: opacity 0.15s ease, background-color 0.15s ease;
  }

  .clear-button:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }

  /* Task 4.4: Visible focus for clear button */
  .clear-button:focus {
    outline: none;
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.15);
  }

  .clear-button:focus-visible {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 1px;
  }

  .clear-icon {
    font-size: 12px;
    line-height: 1;
  }

  .clear-text {
    font-size: 11px;
  }

  /* Task 5.4: Visually hidden text for screen readers */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
