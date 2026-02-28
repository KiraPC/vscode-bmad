# Story 5.2: Kanban Column Layout

Status: done

## Story

As a **user**,
I want **to see stories organized in four status columns**,
So that **I can visualize workflow at a glance**.

## Acceptance Criteria

1. **Given** Kanban WebView is loaded with story data
   **When** Stories view is rendered
   **Then** four columns appear: Backlog | In Progress | Review | Done (FR8)
   **And** each column has a header with column name
   **And** columns are horizontally scrollable if content overflows

2. **Given** stories exist with various statuses
   **When** columns render
   **Then** each story appears in the correct column based on status

3. **And** renders in <500ms for 50 stories (NFR-P1)
   **And** column headers show story counts (FR16)

## Tasks / Subtasks

- [x] Task 1: Create Svelte stores for Kanban data
  - [x] 1.1: Create `webviews/kanban/src/stores/kanbanStore.ts` with stories and epics writable stores
  - [x] 1.2: Add message listener to update stores on `dataLoaded` message from extension
  - [x] 1.3: Create derived stores for stories grouped by status column
  - [x] 1.4: Add loading state store for initial render

- [x] Task 2: Create KanbanColumn component (AC: #1)
  - [x] 2.1: Create `webviews/kanban/src/components/KanbanColumn.svelte`
  - [x] 2.2: Accept props: `title: string`, `status: StoryStatus`, `stories: Story[]`
  - [x] 2.3: Render column header with title and story count badge (FR16)
  - [x] 2.4: Render scrollable container for story cards
  - [x] 2.5: Style with VS Code theme variables

- [x] Task 3: Create KanbanBoard component (AC: #1, #2, #3)
  - [x] 3.1: Create `webviews/kanban/src/components/KanbanBoard.svelte`
  - [x] 3.2: Import and consume kanbanStore derived stores
  - [x] 3.3: Render four KanbanColumn components with correct statuses
  - [x] 3.4: Apply horizontal scroll container for column overflow
  - [x] 3.5: Map story status to column (backlog+ready-for-dev→Backlog, etc.)

- [x] Task 4: Integrate into App.svelte (AC: all)
  - [x] 4.1: Import KanbanBoard into App.svelte
  - [x] 4.2: Initialize message listener on mount
  - [x] 4.3: Send 'ready' message to trigger data load
  - [x] 4.4: Render loading state while data loads

- [x] Task 5: Testing and verification (AC: all)
  - [x] 5.1: Create `tests/unit/webviews/kanban/kanbanStore.test.ts`
  - [x] 5.2: Test store updates on dataLoaded message
  - [x] 5.3: Test derived store grouping logic
  - [x] 5.4: Verify columns render correctly in Extension Development Host
  - [x] 5.5: Test horizontal scroll behavior

## Dev Notes

### Column Status Mapping

| Column | StoryStatus values |
|--------|-------------------|
| Backlog | `backlog`, `ready-for-dev` |
| In Progress | `in-progress` |
| Review | `review` |
| Done | `done` |

### Performance Requirements

- NFR-P1: Kanban board renders in <500ms for up to 50 stories
- Use Svelte reactivity for efficient updates
- Minimize DOM operations with keyed each blocks

### Code Patterns

**Svelte 5 Runes:**
```typescript
// Use $state for reactive state
let stories = $state<Story[]>([]);

// Use $derived for computed values
let backlogStories = $derived(stories.filter(s => ['backlog', 'ready-for-dev'].includes(s.status)));
```

**Store Pattern:**
```typescript
// writable stores with typed updates
import { writable } from 'svelte/store';
export const stories = writable<Story[]>([]);
```

## File List

- [x] `webviews/kanban/src/stores/kanbanStore.ts` - Created
- [x] `webviews/kanban/src/components/KanbanColumn.svelte` - Created
- [x] `webviews/kanban/src/components/KanbanBoard.svelte` - Created
- [x] `webviews/kanban/src/App.svelte` - Modified to integrate KanbanBoard
- [x] `tests/unit/webviews/kanban/kanbanStore.test.ts` - Created
- [x] `src/providers/KanbanProvider.ts` - Modified to load and send data
- [x] `src/extension.ts` - Modified to pass parsers to KanbanProvider

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-13 | Story created | Dev Agent |
| 2026-02-13 | Implementation complete | Dev Agent |

## Dev Agent Record

### Debug Log
- Fixed Svelte store subscription error: Cannot use `$store` syntax inside `{#each}` block. Resolved by inlining column components instead of iterating over column configuration array.

### Completion Notes
Story 5.2 implemented with:
- **kanbanStore.ts**: Svelte writable stores for stories/epics, derived stores for column grouping (backlogStories, inProgressStories, reviewStories, doneStories), loading state management
- **KanbanColumn.svelte**: Reusable column component with header, story count badge, scrollable card container, VS Code theme styling, status-specific color accents
- **KanbanBoard.svelte**: Four-column layout with horizontal scroll, loading spinner, error state handling
- **App.svelte**: Integration with message listeners, ready message on mount
- **KanbanProvider.ts**: Enhanced to use EpicsParser and StoryParser, sends dataLoaded message with real data
- **Unit tests**: 12 tests for column grouping logic, all passing
- Build verified: Extension compiles, webviews build successfully
