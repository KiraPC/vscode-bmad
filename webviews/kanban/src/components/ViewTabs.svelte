<!--
  ViewTabs.svelte - Dual-View Tab Navigation Component
  Story 5.4: Dual-View Tab Navigation

  Task 1: Create ViewTabs component with tab buttons
  Task 3: Visual active indicator with VS Code theme colors
  Task 4: Keyboard accessibility (ArrowLeft/Right, Enter/Space)
  Task 5: ARIA accessibility (tablist, tab roles)
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Task 1.2: Props interface with activeView
  interface Props {
    activeView: 'stories' | 'epics';
  }

  let { activeView }: Props = $props();

  // Event dispatcher for view changes
  const dispatch = createEventDispatcher<{
    viewChange: { view: 'stories' | 'epics' };
  }>();

  // Task 1.3: Derived values for active state
  let isEpicsActive = $derived(activeView === 'epics');
  let isStoriesActive = $derived(activeView === 'stories');

  // Tab button references for focus management
  let epicsTabRef: HTMLButtonElement | undefined = $state();
  let storiesTabRef: HTMLButtonElement | undefined = $state();

  // Task 2.4: Handle tab click
  function handleTabClick(view: 'stories' | 'epics'): void {
    dispatch('viewChange', { view });
  }

  // Task 4.4-4.6: Keyboard navigation handler
  function handleKeydown(event: KeyboardEvent, currentView: 'stories' | 'epics'): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const newView = currentView === 'stories' ? 'epics' : 'stories';
      dispatch('viewChange', { view: newView });
      
      // Focus the new active tab
      if (newView === 'epics') {
        epicsTabRef?.focus();
      } else {
        storiesTabRef?.focus();
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch('viewChange', { view: currentView });
    }
  }
</script>

<!-- Task 4.1-4.2, 5.1-5.3: Tab bar with ARIA attributes -->
<div class="view-tabs" role="tablist" aria-label="View selection">
  <button
    bind:this={epicsTabRef}
    id="tab-epics"
    role="tab"
    aria-selected={isEpicsActive}
    aria-controls="panel-epics"
    tabindex={isEpicsActive ? 0 : -1}
    class:active={isEpicsActive}
    onclick={() => handleTabClick('epics')}
    onkeydown={(e) => handleKeydown(e, 'epics')}
  >
    Epics
  </button>
  <button
    bind:this={storiesTabRef}
    id="tab-stories"
    role="tab"
    aria-selected={isStoriesActive}
    aria-controls="panel-stories"
    tabindex={isStoriesActive ? 0 : -1}
    class:active={isStoriesActive}
    onclick={() => handleTabClick('stories')}
    onkeydown={(e) => handleKeydown(e, 'stories')}
  >
    Stories
  </button>
</div>

<!-- Task 1.4, 3.2-3.4: VS Code theme integration -->
<style>
  .view-tabs {
    display: flex;
    gap: 0;
    padding: 0 8px;
    background-color: var(--vscode-sideBarSectionHeader-background);
    border-bottom: 1px solid var(--vscode-panel-border, var(--vscode-widget-border));
  }

  button {
    position: relative;
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: var(--vscode-foreground);
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.1s ease;
  }

  button:hover {
    background-color: var(--vscode-list-hoverBackground, var(--vscode-tab-hoverBackground));
    opacity: 1;
  }

  button:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  button.active {
    opacity: 1;
  }

  /* Task 3.2-3.3: Active indicator with accent color */
  button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--vscode-focusBorder, var(--vscode-tab-activeBorder));
  }
</style>
