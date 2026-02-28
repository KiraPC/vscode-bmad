# Story 5.4: Dual-View Tab Navigation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to switch between Epics view and Stories view with tab navigation**,
So that **I can see either high-level epic progress or detailed stories**.

## Acceptance Criteria

1. **Given** Kanban board is open
   **When** user views the tab bar
   **Then** two tabs are visible: [Epics] and [Stories] (FR9)

2. **Given** user clicks [Epics] tab
   **When** view switches
   **Then** Epic cards are displayed (placeholder for Story 5.5)
   **And** [Epics] tab shows active indicator

3. **Given** user clicks [Stories] tab
   **When** view switches
   **Then** Story columns are displayed (existing KanbanBoard)
   **And** [Stories] tab shows active indicator

4. **Given** user navigates with keyboard
   **When** user tabs to tab bar
   **Then** Arrow Left/Right switches between tabs
   **And** Enter/Space activates the focused tab (NFR-A2)

5. **Given** a screen reader is active
   **When** tab bar is focused
   **Then** ARIA attributes announce tab role and selected state (NFR-A3)

6. **Given** VS Code theme changes
   **When** component re-renders
   **Then** tabs use appropriate VS Code theme colors (NFR-A1)

## Tasks / Subtasks

- [x] Task 1: Create ViewTabs.svelte component (AC: #1, #6)
  - [x] 1.1: Create `webviews/kanban/src/components/ViewTabs.svelte`
  - [x] 1.2: Define Props interface with `activeView` and event dispatcher
  - [x] 1.3: Render two tab buttons: "Epics" and "Stories"
  - [x] 1.4: Apply VS Code CSS variables for theme integration
  - [x] 1.5: Position tabs above the main content area

- [x] Task 2: Manage active view state (AC: #2, #3)
  - [x] 2.1: Add `activeView` writable store to kanbanStore.ts: `'stories' | 'epics'`
  - [x] 2.2: Default to `'stories'` view on initial load
  - [x] 2.3: Create `setActiveView(view)` function in store
  - [x] 2.4: Dispatch `click` events from ViewTabs that call setActiveView

- [x] Task 3: Implement visual active indicator (AC: #2, #3, #6)
  - [x] 3.1: Add `aria-selected` attribute based on active state
  - [x] 3.2: Style active tab with border-bottom accent color
  - [x] 3.3: Use `--vscode-focusBorder` for active indicator
  - [x] 3.4: Apply hover states using `--vscode-list-hoverBackground`

- [x] Task 4: Keyboard accessibility (AC: #4)
  - [x] 4.1: Add `role="tablist"` to container
  - [x] 4.2: Add `role="tab"` to each tab button
  - [x] 4.3: Add `tabindex="0"` to active tab, `tabindex="-1"` to inactive
  - [x] 4.4: Handle `keydown` for ArrowLeft/ArrowRight navigation
  - [x] 4.5: Handle Enter/Space to activate tab
  - [x] 4.6: Manage focus with `bind:this` and `.focus()`

- [x] Task 5: ARIA accessibility (AC: #5)
  - [x] 5.1: Add `aria-selected="true"` to active tab
  - [x] 5.2: Add `aria-controls` pointing to content panel id
  - [x] 5.3: Add `id` attributes for tabs: `tab-epics`, `tab-stories`
  - [x] 5.4: Add `aria-labelledby` to content panels

- [x] Task 6: Create EpicsView placeholder component (AC: #2)
  - [x] 6.1: Create `webviews/kanban/src/components/EpicsView.svelte`
  - [x] 6.2: Display placeholder message: "Epics view coming soon (Story 5.5)"
  - [x] 6.3: Subscribe to `$epics` store for future use
  - [x] 6.4: Style consistently with KanbanBoard

- [x] Task 7: Integrate into App.svelte (AC: all)
  - [x] 7.1: Import ViewTabs and EpicsView components
  - [x] 7.2: Import `activeView` store
  - [x] 7.3: Render ViewTabs above content area
  - [x] 7.4: Conditionally render KanbanBoard or EpicsView based on `$activeView`
  - [x] 7.5: Add `role="tabpanel"` with `aria-labelledby` to content sections

- [x] Task 8: Testing and verification (AC: all)
  - [x] 8.1: Create `tests/unit/webviews/kanban/ViewTabs.test.ts`
  - [x] 8.2: Test tab renders with correct labels
  - [x] 8.3: Test click switches active state
  - [x] 8.4: Test keyboard navigation (ArrowLeft/Right)
  - [x] 8.5: Test ARIA attributes are correct
  - [x] 8.6: Verify component in Extension Development Host
  - [x] 8.7: Test theme compatibility in light/dark/high contrast

## Dev Notes

### Architecture Compliance

**Decision: Hybrid Provider + Services Pattern**
- ViewTabs is a pure presentation component
- Active view state lives in Svelte store (UI state per architecture)
- No PostMessage needed for tab switching (local UI state)

**Decision: Extension Host as Single Source of Truth**
- Stories/Epics data continues to come from extension
- Tab selection is UI-only state managed in WebView

### Code Patterns to Follow

**Svelte 5 Runes (from Story 5.2, 5.3):**
```typescript
// Use $props() for component props
interface Props {
  activeView: 'stories' | 'epics';
}
let { activeView }: Props = $props();

// Use $derived for computed values
let isStoriesActive = $derived(activeView === 'stories');
let isEpicsActive = $derived(activeView === 'epics');
```

**Event Dispatching:**
```typescript
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher<{
  viewChange: { view: 'stories' | 'epics' };
}>();

function handleTabClick(view: 'stories' | 'epics') {
  dispatch('viewChange', { view });
}
```

**Named Exports Only:**
```typescript
// ✅ Types can be imported from @shared/models
import type { Story, Epic } from '@shared/models';
```

**VS Code Theme Variables (consistent with KanbanColumn.svelte):**
```css
/* Tab bar colors */
--vscode-foreground
--vscode-editor-background
--vscode-sideBarSectionHeader-background

/* Active/focus indicators */
--vscode-focusBorder
--vscode-tab-activeBorder
--vscode-tab-activeBackground

/* Hover states */
--vscode-list-hoverBackground
--vscode-tab-hoverBackground
```

### Tab Accessibility Implementation (WAI-ARIA Tabs Pattern)

**Tab Structure:**
```svelte
<div class="view-tabs" role="tablist" aria-label="View selection">
  <button
    id="tab-epics"
    role="tab"
    aria-selected={isEpicsActive}
    aria-controls="panel-epics"
    tabindex={isEpicsActive ? 0 : -1}
    class:active={isEpicsActive}
    onclick={() => handleTabClick('epics')}
    onkeydown={handleKeydown}
  >
    Epics
  </button>
  <button
    id="tab-stories"
    role="tab"
    aria-selected={isStoriesActive}
    aria-controls="panel-stories"
    tabindex={isStoriesActive ? 0 : -1}
    class:active={isStoriesActive}
    onclick={() => handleTabClick('stories')}
    onkeydown={handleKeydown}
  >
    Stories
  </button>
</div>
```

**Keyboard Handler:**
```typescript
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    const newView = activeView === 'stories' ? 'epics' : 'stories';
    dispatch('viewChange', { view: newView });
  }
}
```

### Store Extension Pattern

**Add to kanbanStore.ts:**
```typescript
// ============================================================================
// Task 5.4.2: Active view state for dual-view navigation
// ============================================================================

export type ViewType = 'stories' | 'epics';

/** Currently active view tab */
export const activeView = writable<ViewType>('stories');

/** Switch active view */
export function setActiveView(view: ViewType): void {
  activeView.set(view);
}
```

### Project Structure Notes

**Files to create:**
- `webviews/kanban/src/components/ViewTabs.svelte`
- `webviews/kanban/src/components/EpicsView.svelte`
- `tests/unit/webviews/kanban/ViewTabs.test.ts`

**Files to modify:**
- `webviews/kanban/src/stores/kanbanStore.ts` - add activeView state
- `webviews/kanban/src/App.svelte` - integrate tabs and conditional rendering

**CSS Layout Structure (in App.svelte):**
```svelte
<main>
  <ViewTabs {activeView} on:viewChange={(e) => setActiveView(e.detail.view)} />
  
  {#if $activeView === 'stories'}
    <div id="panel-stories" role="tabpanel" aria-labelledby="tab-stories">
      <KanbanBoard />
    </div>
  {:else}
    <div id="panel-epics" role="tabpanel" aria-labelledby="tab-epics">
      <EpicsView />
    </div>
  {/if}
</main>
```

### Dependencies

**Required imports in ViewTabs.svelte:**
```typescript
import { createEventDispatcher } from 'svelte';
```

**Codicons available (optional for icons):**
- `codicon-list-tree` - for epics view icon
- `codicon-checklist` - for stories view icon

### Performance Considerations (NFR-P1)

- Tab switching should be instantaneous (no data re-fetch)
- Use `{#if}` conditional rendering (not `display: none`)
- EpicsView keeps data subscribed for instant switch back
- No PostMessage round-trip for tab changes

### Previous Story Learnings (from Story 5.3)

1. **Svelte 5 Runes**: Use `$props()` and `$derived()` syntax consistently
2. **Build verification**: Always verify both TypeScript compilation AND webview build
3. **Theme testing**: Test in light, dark, and high contrast modes
4. **Accessibility**: Screen reader testing essential for ARIA implementations

### Testing Strategy

**Unit Tests (ViewTabs.test.ts):**
```typescript
import { render, fireEvent } from '@testing-library/svelte';
import ViewTabs from '../components/ViewTabs.svelte';

describe('ViewTabs', () => {
  it('renders both tab buttons', () => {
    const { getByRole } = render(ViewTabs, { props: { activeView: 'stories' } });
    expect(getByRole('tab', { name: 'Epics' })).toBeDefined();
    expect(getByRole('tab', { name: 'Stories' })).toBeDefined();
  });

  it('shows Stories as active by default', () => {
    const { getByRole } = render(ViewTabs, { props: { activeView: 'stories' } });
    expect(getByRole('tab', { name: 'Stories' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches active tab on click', async () => {
    const { getByRole, component } = render(ViewTabs, { props: { activeView: 'stories' } });
    const mockHandler = vi.fn();
    component.$on('viewChange', mockHandler);
    
    await fireEvent.click(getByRole('tab', { name: 'Epics' }));
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      detail: { view: 'epics' }
    }));
  });

  it('supports keyboard navigation', async () => {
    const { getByRole, component } = render(ViewTabs, { props: { activeView: 'stories' } });
    const mockHandler = vi.fn();
    component.$on('viewChange', mockHandler);
    
    await fireEvent.keyDown(getByRole('tab', { name: 'Stories' }), { key: 'ArrowLeft' });
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4: Dual-View Tab Navigation]
- [Source: webviews/kanban/src/App.svelte] - main entry to modify
- [Source: webviews/kanban/src/stores/kanbanStore.ts] - store to extend
- [Source: webviews/kanban/src/components/KanbanBoard.svelte] - existing stories view
- [Source: _bmad-output/implementation-artifacts/5-3-story-card-component.md] - previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Debug Log References

N/A - Implementation verified as already complete

### Completion Notes List

- ViewTabs.svelte component created with Svelte 5 runes ($props, $derived, $state)
- Full WAI-ARIA tabs pattern implemented (role=tablist/tab, aria-selected, aria-controls)
- Keyboard accessibility with ArrowLeft/Right navigation and Enter/Space activation
- VS Code theme integration with CSS custom properties
- EpicsView.svelte placeholder component created with epic count display
- kanbanStore.ts extended with activeView state and setActiveView function
- App.svelte integrated with conditional rendering of KanbanBoard or EpicsView
- 14 unit tests covering rendering, click handling, keyboard navigation, and ARIA
- Build successful, all tests pass

### File List

- [x] `webviews/kanban/src/components/ViewTabs.svelte` - Created
- [x] `webviews/kanban/src/components/EpicsView.svelte` - Created
- [x] `webviews/kanban/src/stores/kanbanStore.ts` - Modified
- [x] `webviews/kanban/src/App.svelte` - Modified
- [x] `tests/unit/webviews/kanban/ViewTabs.test.ts` - Created

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-14 | Story created with full context | SM Agent |
| 2026-02-14 | Implementation verified complete, status updated to done | Dev Agent |
