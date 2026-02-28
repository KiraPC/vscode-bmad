# Story 5.3: Story Card Component

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see story cards with key information**,
So that **I can quickly understand each story's context**.

## Acceptance Criteria

1. **Given** a story with title, epic, assignee, and status
   **When** StoryCard Svelte component renders
   **Then** it displays:
   - Story title prominently
   - Epic badge/tag showing parent epic
   - Assignee name (if present)
   - Visual status indicator (FR11)

2. **Given** user navigates with keyboard
   **When** user tabs to a story card
   **Then** card receives visible focus indicator (NFR-A2)

3. **Given** a screen reader is active
   **When** story card is focused
   **Then** ARIA labels announce story title, epic, status, and assignee (NFR-A3)

4. **Given** VS Code theme changes
   **When** component re-renders
   **Then** card uses appropriate VS Code theme colors

5. **Given** story has no assignee
   **When** component renders
   **Then** assignee section is hidden gracefully (no "undefined" or empty placeholder)

## Tasks / Subtasks

- [ ] Task 1: Create StoryCard.svelte component (AC: #1, #4)
  - [ ] 1.1: Create `webviews/kanban/src/components/StoryCard.svelte`
  - [ ] 1.2: Define Props interface: `story: Story`
  - [ ] 1.3: Render story title in prominent heading element
  - [ ] 1.4: Apply VS Code CSS variables for theme integration

- [ ] Task 2: Implement Epic badge/tag (AC: #1, #4)
  - [ ] 2.1: Create epic badge showing `Epic {epicId}` or epic title
  - [ ] 2.2: Style badge with VS Code badge variables
  - [ ] 2.3: Position badge below or beside title

- [ ] Task 3: Implement Status indicator (AC: #1, #4)
  - [ ] 3.1: Create visual status indicator (colored dot or badge)
  - [ ] 3.2: Map status to appropriate colors:
    - `backlog`/`ready-for-dev`: neutral/blue
    - `in-progress`: yellow/orange
    - `review`: purple
    - `done`: green
  - [ ] 3.3: Position indicator in card header area

- [ ] Task 4: Implement Assignee display (AC: #1, #5)
  - [ ] 4.1: Conditionally render assignee section using `{#if story.assignee}`
  - [ ] 4.2: Display assignee name with user icon (codicon-person)
  - [ ] 4.3: Ensure graceful hiding when no assignee

- [ ] Task 5: Keyboard accessibility (AC: #2)
  - [ ] 5.1: Add `tabindex="0"` to card container
  - [ ] 5.2: Style `:focus` and `:focus-visible` states with outline
  - [ ] 5.3: Ensure focus is visually distinct

- [ ] Task 6: Screen reader accessibility (AC: #3)
  - [ ] 6.1: Add `role="article"` or `role="listitem"` to card
  - [ ] 6.2: Add `aria-label` combining story title, epic, and status
  - [ ] 6.3: Add `aria-describedby` for additional details if needed

- [ ] Task 7: Integrate into KanbanColumn (AC: all)
  - [ ] 7.1: Import StoryCard into KanbanColumn.svelte
  - [ ] 7.2: Replace placeholder `<div class="story-card-placeholder">` with `<StoryCard {story} />`
  - [ ] 7.3: Ensure each block uses story.id as key

- [ ] Task 8: Testing and verification (AC: all)
  - [ ] 8.1: Create `tests/unit/webviews/kanban/StoryCard.test.ts`
  - [ ] 8.2: Test renders all story properties correctly
  - [ ] 8.3: Test conditional assignee rendering
  - [ ] 8.4: Test status color mapping
  - [ ] 8.5: Verify component in Extension Development Host
  - [ ] 8.6: Verify keyboard navigation works across cards

## Dev Notes

### Architecture Compliance

**Decision: Hybrid Provider + Services Pattern**
- StoryCard is a pure presentation component
- Data comes from Svelte stores populated via PostMessage
- No direct service calls from component

**Decision: Extension Host as Single Source of Truth**
- Story data originates from ParserService (Epic 4)
- WebView receives data via `dataLoaded` message
- Cards display data, don't modify it (yet - click handling is Story 5.6)

### Code Patterns to Follow

**Svelte 5 Runes (from Story 5.2):**
```typescript
// Use $props() for component props
interface Props {
  story: Story;
}
let { story }: Props = $props();

// Use $derived for computed values
let statusColor = $derived(getStatusColor(story.status));
```

**Named Exports Only:**
```typescript
// ✅ Types can be imported from @shared/models
import type { Story, StoryStatus } from '@shared/models';
```

**VS Code Theme Variables (from KanbanColumn.svelte):**
```css
/* Primary colors */
--vscode-foreground
--vscode-editor-background
--vscode-sideBar-background
--vscode-panel-border

/* Badge colors */
--vscode-badge-background
--vscode-badge-foreground

/* Status accent colors */
--vscode-textLink-foreground (blue)
--vscode-editorWarning-foreground (yellow/orange)
--vscode-editorInfo-foreground (blue)
--vscode-gitDecoration-modifiedResourceForeground (yellow)
--vscode-testing-iconPassed (green)
```

### Status Color Mapping

Based on VS Code theme variables for consistency:

| Status | Color Variable | Fallback |
|--------|---------------|----------|
| `backlog` | `--vscode-descriptionForeground` | gray |
| `ready-for-dev` | `--vscode-textLink-foreground` | blue |
| `in-progress` | `--vscode-editorWarning-foreground` | orange |
| `review` | `--vscode-charts-purple` | purple |
| `done` | `--vscode-testing-iconPassed` | green |

### Accessibility Requirements (NFR-A2, NFR-A3)

**Keyboard Navigation:**
- Cards must be focusable via Tab key
- Focus indicator must be visible (2px outline recommended)
- Focus order follows DOM order within column

**ARIA Implementation:**
```svelte
<article
  class="story-card"
  tabindex="0"
  role="article"
  aria-label="{story.title} - Epic {story.epicId} - Status: {story.status}"
  aria-describedby="story-{story.id}-details"
>
```

### Project Structure Notes

**Files to create:**
- `webviews/kanban/src/components/StoryCard.svelte`
- `tests/unit/webviews/kanban/StoryCard.test.ts`

**Files to modify:**
- `webviews/kanban/src/components/KanbanColumn.svelte` - replace placeholder with StoryCard

**Integration Point (from Story 5.2):**
```svelte
<!-- Current placeholder in KanbanColumn.svelte (lines 37-41) -->
{#each stories as story (story.id)}
  <div class="story-card-placeholder">
    <span class="story-id">{story.id}</span>
    <span class="story-title">{story.title}</span>
  </div>
{/each}

<!-- Replace with -->
{#each stories as story (story.id)}
  <StoryCard {story} />
{/each}
```

### Dependencies

**Required imports in StoryCard.svelte:**
```typescript
import type { Story, StoryStatus } from '@shared/models';
```

**Codicons available (from @vscode/codicons):**
- `codicon-person` - for assignee
- `codicon-circle-filled` - for status indicator
- `codicon-bookmark` or `codicon-tag` - for epic badge

### Performance Considerations (NFR-P1)

- Keep component lightweight (<100 lines preferred)
- Use `$derived` for computed values (status color)
- Keyed `{#each}` blocks already implemented in KanbanColumn
- Avoid inline style calculations - use CSS classes with variables

### Previous Story Learnings (from Story 5.2)

1. **Svelte store subscription**: Cannot use `$store` syntax inside `{#each}` block - use `$props` instead
2. **Build verification**: Always verify both TypeScript compilation and webview build
3. **Testing**: Use Vitest with component testing for Svelte components

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3: Story Card Component]
- [Source: webviews/kanban/src/components/KanbanColumn.svelte] - placeholder to replace
- [Source: webviews/kanban/src/components/KanbanBoard.svelte] - parent component pattern
- [Source: src/shared/models.ts] - Story interface definition
- [Source: _bmad-output/implementation-artifacts/5-2-kanban-column-layout.md] - previous story patterns

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

(to be filled during implementation)

### Completion Notes List

(to be filled on completion)

### File List

- [ ] `webviews/kanban/src/components/StoryCard.svelte` - To create
- [ ] `webviews/kanban/src/components/KanbanColumn.svelte` - To modify
- [ ] `tests/unit/webviews/kanban/StoryCard.test.ts` - To create

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-14 | Story created with full context | SM Agent |
