# Story 5.5: Epic Card Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see epic cards showing epic progress**,
So that **I can understand overall project progress at a glance**.

## Acceptance Criteria

1. **Given** Epics view is active in the Kanban board
   **When** EpicCard Svelte components render
   **Then** each epic displays:
   - Epic title prominently
   - Description (truncated to ~2 lines)
   - Status badge (derived from stories: backlog, in-progress, done)
   - Story count summary (e.g., "4/7 stories done") (FR10)

2. **Given** an epic has mixed story statuses
   **When** the status badge renders
   **Then** it shows the derived status:
   - All stories 'done' → Epic is 'done' (green badge)
   - All stories 'backlog' → Epic is 'backlog' (gray badge)
   - Otherwise → Epic is 'in-progress' (blue badge)

3. **Given** user clicks an epic card
   **When** click handler executes
   **Then** view switches to Stories view with epic filter applied (FR12)
   **And** only stories from the clicked epic are visible

4. **Given** user navigates with keyboard
   **When** focus reaches an epic card
   **Then** card displays visible focus indicator
   **And** Enter/Space triggers the click action (NFR-A2)

5. **Given** a screen reader is active
   **When** epic card is focused
   **Then** ARIA attributes announce epic title, status, and progress (NFR-A3)

6. **Given** VS Code theme changes
   **When** component re-renders
   **Then** epic card uses appropriate VS Code theme colors (NFR-A1)

## Tasks / Subtasks

- [x] Task 1: Create EpicCard.svelte component (AC: #1, #6)
  - [x] 1.1: Create `webviews/kanban/src/components/EpicCard.svelte`
  - [x] 1.2: Define Props interface with `epic: Epic` prop using `$props()`
  - [x] 1.3: Display epic title in prominent heading (h3)
  - [x] 1.4: Display description with CSS line-clamp (max 2 lines)
  - [x] 1.5: Apply VS Code CSS variables for theme integration

- [x] Task 2: Implement story progress calculation (AC: #1, #2)
  - [x] 2.1: Import `stories` store from kanbanStore
  - [x] 2.2: Create derived `$derived` for stories belonging to this epic
  - [x] 2.3: Calculate total stories count from epic.storyIds
  - [x] 2.4: Calculate done stories count (status === 'done')
  - [x] 2.5: Display progress as "X/Y stories done" badge

- [x] Task 3: Implement status badge styling (AC: #2, #6)
  - [x] 3.1: Create `getStatusColor()` function mapping EpicStatus to VS Code variables
  - [x] 3.2: Apply status color to visual indicator (dot or badge)
  - [x] 3.3: Display status text (Backlog, In Progress, Done)
  - [x] 3.4: Use consistent patterns from StoryCard.svelte

- [x] Task 4: Implement click handler with epic filter (AC: #3)
  - [x] 4.1: Add `epicFilter` writable store to kanbanStore.ts
  - [x] 4.2: Create `setEpicFilter(epicId: string | null)` function
  - [x] 4.3: On card click: call `setEpicFilter(epic.id)` and `setActiveView('stories')`
  - [x] 4.4: Update derived column stores to respect `epicFilter`

- [x] Task 5: Keyboard accessibility (AC: #4)
  - [x] 5.1: Add `tabindex="0"` to card container
  - [x] 5.2: Add `role="button"` to card
  - [x] 5.3: Handle `onclick` event for click
  - [x] 5.4: Handle `onkeydown` for Enter/Space activation
  - [x] 5.5: Add visible `:focus` and `:focus-visible` styles

- [x] Task 6: ARIA accessibility (AC: #5)
  - [x] 6.1: Create computed `ariaLabel` with epic title, status, progress
  - [x] 6.2: Add `aria-label` to card container
  - [x] 6.3: Add `aria-hidden="true"` to decorative elements (icons, status dots)

- [x] Task 7: Update EpicsView.svelte to render EpicCard grid (AC: all)
  - [x] 7.1: Import EpicCard and `$epics` store
  - [x] 7.2: Replace placeholder with grid layout
  - [x] 7.3: Use `{#each $epics as epic (epic.id)}` to render cards
  - [x] 7.4: Style grid with responsive columns (2-3 per row)

- [x] Task 8: Update filtered column stores (AC: #3)
  - [x] 8.1: Modify `backlogStories`, `inProgressStories`, etc. to filter by `epicFilter`
  - [x] 8.2: When `epicFilter` is set, apply `.filter(s => s.epicId === $epicFilter)`
  - [x] 8.3: Add "Clear Filter" button in Stories view header when filter active
  - [x] 8.4: Create `clearEpicFilter()` function

- [x] Task 9: Testing and verification (AC: all)
  - [x] 9.1: Create `tests/unit/webviews/kanban/EpicCard.test.ts`
  - [x] 9.2: Test card renders with correct epic information
  - [x] 9.3: Test story progress calculation
  - [x] 9.4: Test click dispatches correct actions
  - [x] 9.5: Test keyboard navigation (Enter/Space)
  - [x] 9.6: Test ARIA attributes
  - [x] 9.7: Verify component in Extension Development Host
  - [x] 9.8: Test theme compatibility in light/dark/high contrast

## Dev Notes

### Architecture Compliance

**Decision: Hybrid Provider + Services Pattern**
- EpicCard is a pure presentation component
- Epic data comes from extension via PostMessage → Svelte store
- Epic filter is UI-only state managed in WebView (no PostMessage needed)
- Click action triggers local store updates (setActiveView + setEpicFilter)

**Decision: Extension Host as Single Source of Truth**
- Epic/Story data lives in extension, synced to WebView stores
- Filter state is local WebView state (not persisted to extension)
- No file writes needed for epic card interactions

### Code Patterns to Follow

**Svelte 5 Runes (established in Story 5.2, 5.3, 5.4):**
```typescript
// Props
interface Props {
  epic: Epic;
}
let { epic }: Props = $props();

// Derived values
let epicStories = $derived($stories.filter(s => s.epicId === epic.id));
let doneCount = $derived(epicStories.filter(s => s.status === 'done').length);
let totalCount = $derived(epicStories.length);
let progressText = $derived(`${doneCount}/${totalCount} stories done`);
```

**Event Handling (no createEventDispatcher in Svelte 5 for simple cases):**
```typescript
import { setActiveView, setEpicFilter } from '../stores/kanbanStore';

function handleClick() {
  setEpicFilter(epic.id);
  setActiveView('stories');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
}
```

**Named Exports Only (architecture requirement):**
```typescript
// ✅ Correct
import type { Epic, EpicStatus } from '@shared/models';
import { epics, stories, setActiveView, setEpicFilter } from '../stores/kanbanStore';

// ❌ Wrong
export default EpicCard;
```

**VS Code Theme Variables (consistent with StoryCard.svelte, KanbanColumn.svelte):**
```css
/* Card backgrounds */
--vscode-editor-background
--vscode-sideBar-background
--vscode-list-hoverBackground

/* Borders */
--vscode-panel-border
--vscode-focusBorder

/* Status colors - same as StoryCard */
--vscode-descriptionForeground     /* backlog */
--vscode-charts-blue               /* in-progress */
--vscode-testing-iconPassed        /* done */

/* Text */
--vscode-foreground
--vscode-badge-foreground
--vscode-badge-background
```

### Epic Status Color Mapping

```typescript
function getStatusColor(status: EpicStatus): string {
  const colorMap: Record<EpicStatus, string> = {
    'backlog': 'var(--vscode-descriptionForeground)',
    'in-progress': 'var(--vscode-charts-blue, #75beff)',
    'done': 'var(--vscode-testing-iconPassed, #89d185)'
  };
  return colorMap[status] ?? colorMap['backlog'];
}
```

### Store Extensions for Epic Filter

**Add to kanbanStore.ts:**
```typescript
// ============================================================================
// Task 5.5.4: Epic filter for Stories view
// ============================================================================

/** Currently active epic filter (null = no filter) */
export const epicFilter = writable<string | null>(null);

/** Set epic filter - used when clicking epic card */
export function setEpicFilter(epicId: string | null): void {
  epicFilter.set(epicId);
}

/** Clear epic filter */
export function clearEpicFilter(): void {
  epicFilter.set(null);
}

// ============================================================================
// Update column stores to respect epicFilter
// ============================================================================

/** Filtered backlog stories (respects epicFilter) */
export const backlogStories: Readable<Story[]> = derived(
  [stories, epicFilter],
  ([$stories, $epicFilter]) =>
    $stories.filter((s) => 
      (s.status === 'backlog' || s.status === 'ready-for-dev') &&
      ($epicFilter === null || s.epicId === $epicFilter)
    )
);

// Apply same pattern to inProgressStories, reviewStories, doneStories
```

### EpicCard Component Structure

```svelte
<script lang="ts">
  import type { Epic, EpicStatus } from '@shared/models';
  import { stories, setActiveView, setEpicFilter } from '../stores/kanbanStore';

  interface Props {
    epic: Epic;
  }
  let { epic }: Props = $props();

  // Derived values
  let epicStories = $derived($stories.filter(s => s.epicId === epic.id));
  let doneCount = $derived(epicStories.filter(s => s.status === 'done').length);
  let totalCount = $derived(epicStories.length);
  let progressText = $derived(`${doneCount}/${totalCount} stories done`);
  let statusColor = $derived(getStatusColor(epic.status));

  // ARIA label for accessibility
  let ariaLabel = $derived(
    `${epic.title} - ${formatStatus(epic.status)} - ${progressText}`
  );

  function handleClick() {
    setEpicFilter(epic.id);
    setActiveView('stories');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div
  class="epic-card"
  tabindex="0"
  role="button"
  aria-label={ariaLabel}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <!-- Status indicator + Epic ID -->
  <div class="card-header">
    <span class="status-indicator" style="--status-color: {statusColor}" aria-hidden="true"></span>
    <span class="epic-id">Epic {epic.id}</span>
    <span class="status-badge" style="--status-color: {statusColor}">
      {formatStatus(epic.status)}
    </span>
  </div>

  <!-- Title -->
  <h3 class="epic-title">{epic.title}</h3>

  <!-- Description (truncated) -->
  <p class="epic-description">{epic.description}</p>

  <!-- Footer with progress -->
  <div class="card-footer">
    <span class="progress-badge">
      <i class="codicon codicon-checklist" aria-hidden="true"></i>
      {progressText}
    </span>
  </div>
</div>

<style>
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

  .epic-card:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: -2px;
  }

  .epic-card:focus-visible {
    box-shadow: 0 0 0 3px var(--vscode-focusBorder, rgba(0, 122, 204, 0.3));
  }

  .epic-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    margin: 8px 0;
    line-height: 1.4;
  }

  /* Additional styles... */
</style>
```

### EpicsView Grid Layout Update

**Update webviews/kanban/src/components/EpicsView.svelte:**
```svelte
<script lang="ts">
  import EpicCard from './EpicCard.svelte';
  import { epics } from '../stores/kanbanStore';
</script>

<div class="epics-view" id="panel-epics" role="tabpanel" aria-labelledby="tab-epics">
  <div class="epics-grid">
    {#each $epics as epic (epic.id)}
      <EpicCard {epic} />
    {/each}

    {#if $epics.length === 0}
      <div class="empty-state">
        <p>No epics found.</p>
        <p>Parse epics.md to populate this view.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .epics-view {
    height: 100%;
    overflow-y: auto;
    padding: 16px;
  }

  .epics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
</style>
```

### Filter Indicator in Stories View

**Add to KanbanBoard.svelte header (when epicFilter is active):**
```svelte
{#if $epicFilter}
  <div class="filter-indicator">
    <span>Filtering: Epic {$epicFilter}</span>
    <button onclick={clearEpicFilter} class="clear-filter">
      <i class="codicon codicon-close"></i>
      Clear
    </button>
  </div>
{/if}
```

### Project Structure Notes

**Files to create:**
- `webviews/kanban/src/components/EpicCard.svelte`
- `tests/unit/webviews/kanban/EpicCard.test.ts`

**Files to modify:**
- `webviews/kanban/src/stores/kanbanStore.ts` - add epicFilter, update column stores
- `webviews/kanban/src/components/EpicsView.svelte` - render EpicCard grid
- `webviews/kanban/src/components/KanbanBoard.svelte` - add filter indicator

### Dependencies

**Import from @shared/models:**
- `Epic` - type for epic prop
- `EpicStatus` - type for status mapping

**Import from stores:**
- `stories` - for calculating story progress
- `setActiveView` - from Story 5.4
- New: `setEpicFilter`, `epicFilter`, `clearEpicFilter`

### Performance Considerations (NFR-P1)

- Progress calculation happens client-side (no round-trip)
- Grid uses CSS `auto-fill` for responsive layout without JS resize listeners
- Keep `$derived()` values simple to avoid expensive recalculations
- Filter switching is instant (filter applied to existing data)

### Previous Story Learnings (from Story 5.4)

1. **Svelte 5 Runes**: Use `$props()` and `$derived()` syntax consistently
2. **Build verification**: Run both `npm run compile` AND `npm run build:kanban`
3. **Theme testing**: Test in light, dark, and high contrast modes
4. **Accessibility**: ARIA implementation is critical - test with screen reader
5. **Store patterns**: Use simple functions like `setActiveView()` not event dispatchers

### Testing Strategy

**Unit Tests (EpicCard.test.ts):**
```typescript
import { render, fireEvent } from '@testing-library/svelte';
import EpicCard from '../components/EpicCard.svelte';
import { epics, stories, epicFilter, activeView } from '../stores/kanbanStore';
import { get } from 'svelte/store';
import type { Epic, Story } from '@shared/models';

describe('EpicCard', () => {
  const mockEpic: Epic = {
    id: '1',
    title: 'Test Epic',
    description: 'This is a test epic description',
    status: 'in-progress',
    storyIds: ['1-1', '1-2', '1-3']
  };

  const mockStories: Story[] = [
    { id: '1-1', title: 'Story 1', status: 'done', epicId: '1', filePath: '' },
    { id: '1-2', title: 'Story 2', status: 'in-progress', epicId: '1', filePath: '' },
    { id: '1-3', title: 'Story 3', status: 'backlog', epicId: '1', filePath: '' }
  ];

  beforeEach(() => {
    stories.set(mockStories);
    epicFilter.set(null);
  });

  it('renders epic title and description', () => {
    const { getByRole, getByText } = render(EpicCard, { props: { epic: mockEpic } });
    expect(getByRole('heading', { name: 'Test Epic' })).toBeDefined();
    expect(getByText(/test epic description/i)).toBeDefined();
  });

  it('displays correct story progress', () => {
    const { getByText } = render(EpicCard, { props: { epic: mockEpic } });
    expect(getByText('1/3 stories done')).toBeDefined();
  });

  it('sets epic filter and switches view on click', async () => {
    const { getByRole } = render(EpicCard, { props: { epic: mockEpic } });
    await fireEvent.click(getByRole('button'));
    
    expect(get(epicFilter)).toBe('1');
    expect(get(activeView)).toBe('stories');
  });

  it('has correct ARIA attributes', () => {
    const { getByRole } = render(EpicCard, { props: { epic: mockEpic } });
    const card = getByRole('button');
    expect(card).toHaveAttribute('aria-label');
    expect(card.getAttribute('aria-label')).toContain('Test Epic');
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5: Epic Card Component]
- [Source: webviews/kanban/src/components/StoryCard.svelte] - card styling patterns
- [Source: webviews/kanban/src/components/KanbanColumn.svelte] - column/theme patterns
- [Source: webviews/kanban/src/stores/kanbanStore.ts] - store patterns
- [Source: src/shared/models.ts] - Epic and EpicStatus types
- [Source: _bmad-output/implementation-artifacts/5-4-dual-view-tab-navigation.md] - ViewTabs and activeView patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Debug Log References

N/A - Clean implementation without blocking issues

### Completion Notes List

- Created EpicCard.svelte with Svelte 5 runes ($props, $derived)
- Implemented story progress calculation using derived stores
- Status badge with getStatusColor() mapping to VS Code theme variables
- Click handler sets epicFilter and switches to Stories view
- Full keyboard accessibility with Enter/Space activation
- ARIA label includes epic title, status, and progress text
- aria-hidden on decorative elements (icons, status indicator)
- Updated EpicsView.svelte with responsive grid layout (auto-fill minmax)
- Added epicFilter, setEpicFilter(), clearEpicFilter() to kanbanStore.ts
- Modified backlogStories, inProgressStories, reviewStories, doneStories to respect epicFilter
- Added filter indicator banner in KanbanBoard.svelte with Clear button
- Created 28 unit tests covering status colors, progress calculation, ARIA labels, filter logic, keyboard nav
- All 379 project tests pass; kanban webview builds successfully

### File List

- [x] `webviews/kanban/src/components/EpicCard.svelte` - Created
- [x] `webviews/kanban/src/components/EpicsView.svelte` - Modified (replaced placeholder with grid)
- [x] `webviews/kanban/src/stores/kanbanStore.ts` - Modified (added epicFilter, updated column stores)
- [x] `webviews/kanban/src/components/KanbanBoard.svelte` - Modified (added filter indicator)
- [x] `tests/unit/webviews/kanban/EpicCard.test.ts` - Created

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-14 | Story created with full developer context | SM Agent |
| 2026-02-14 | Implementation complete, all 28 tests pass | Dev Agent |
