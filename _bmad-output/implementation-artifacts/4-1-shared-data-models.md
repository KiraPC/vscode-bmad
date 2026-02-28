# Story 4.1: Shared Data Models

Status: done

## Story

As a **developer**,
I want **TypeScript interfaces for Epic, Story, and BmadConfig**,
So that **data structures are consistent across the codebase**.

## Acceptance Criteria

1. **Given** the architecture specifies data models
   **When** I create `src/shared/models.ts`
   **Then** it contains:
   - `Epic` type with: id, title, description, status, storyIds
   - `Story` type with: id, title, status, epicId, assignee, content, filePath
   - `BmadConfig` type with: projectName, planningArtifacts, implementationArtifacts, userName, etc.
   - `StoryStatus` enum: 'backlog' | 'in-progress' | 'review' | 'done'
   - `EpicStatus` enum: 'backlog' | 'in-progress' | 'done'

2. **Given** Story/Epic types are defined
   **When** they are imported in both extension and WebView code
   **Then** types compile without errors in both build pipelines

3. **Given** the message types file has placeholder `unknown[]` types
   **When** shared models are created
   **Then** `DataLoadedPayload` can be updated to use `Epic[]` and `Story[]`

4. **Given** types are created
   **When** I check named export conventions
   **Then** all types use named exports (no default exports)

## Tasks / Subtasks

- [x] Task 1: Create Epic and Story status types (AC: #1)
  - [x] 1.1: Define `StoryStatus` type union
  - [x] 1.2: Define `EpicStatus` type union

- [x] Task 2: Create Story interface (AC: #1)
  - [x] 2.1: Define `Story` interface with required fields
  - [x] 2.2: Include id, title, status, epicId, assignee, content, filePath
  - [x] 2.3: Make assignee and content optional

- [x] Task 3: Create Epic interface (AC: #1)
  - [x] 3.1: Define `Epic` interface with required fields
  - [x] 3.2: Include id, title, description, status, storyIds
  - [x] 3.3: Ensure status references EpicStatus type

- [x] Task 4: Review existing BmadConfig (AC: #1)
  - [x] 4.1: Verify BmadConfig in types.ts has all needed fields
  - [x] 4.2: Add any missing fields referenced in PRD

- [x] Task 5: Create models.ts barrel file (AC: #2, #4)
  - [x] 5.1: Create `src/shared/models.ts`
  - [x] 5.2: Re-export types from types.ts as needed
  - [x] 5.3: Ensure models are usable in WebView code

- [x] Task 6: Update DataLoadedPayload (AC: #3)
  - [x] 6.1: Import Epic and Story types in messages.ts
  - [x] 6.2: Replace `unknown[]` with proper types

- [x] Task 7: Add unit tests (AC: #1, #2)
  - [x] 7.1: Create `tests/unit/shared/models.test.ts`
  - [x] 7.2: Test type guards if needed
  - [x] 7.3: Verify exports work correctly

## Dev Notes

### Architecture Patterns

- **Export Conventions**: Named exports only, no default exports
- **Interface vs Type**: Use `type` for data models (Epic, Story), interfaces for contracts
- **Location**: `src/shared/` for cross-boundary types (extension + WebView)
- **Service Pattern**: Types should align with ServiceResult pattern

### Existing Code Analysis

**Already in `src/shared/types.ts`:**
- `BmadConfig` interface with projectName, planningArtifacts, implementationArtifacts, userName etc.
- `StoryCount` with total, backlog, inProgress, review, done
- `ServiceResult<T>` pattern
- `LoadingState` type
- `ProjectState` type

**In `src/shared/messages.ts`:**
- `DataLoadedPayload` currently has `epics: unknown[]`, `stories: unknown[]`
- Needs updating to use proper types after this story

### Story/Epic Status Values

Must align with sprint-status.yaml format:
- **Story statuses**: backlog, ready-for-dev, in-progress, review, done
- **Epic statuses**: backlog, in-progress, done

### Type Definitions Required

```typescript
// src/shared/models.ts

/**
 * Status values for stories - aligned with sprint-status.yaml
 */
export type StoryStatus = 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';

/**
 * Status values for epics
 */
export type EpicStatus = 'backlog' | 'in-progress' | 'done';

/**
 * Represents a user story from implementation-artifacts
 * FR35: Parse story files for metadata
 */
export interface Story {
  /** Story identifier (e.g., "4-1") */
  id: string;
  /** Story title */
  title: string;
  /** Current status */
  status: StoryStatus;
  /** Parent epic identifier (e.g., "4") */
  epicId: string;
  /** Assignee name (optional) */
  assignee?: string;
  /** Story file content (optional, for preview) */
  content?: string;
  /** Absolute file path */
  filePath: string;
}

/**
 * Represents an epic from epics.md
 * FR33: Parse epics.md for epic list
 */
export interface Epic {
  /** Epic identifier (e.g., "1", "2") */
  id: string;
  /** Epic title */
  title: string;
  /** Epic description/goal */
  description: string;
  /** Derived status based on child stories - FR38 */
  status: EpicStatus;
  /** IDs of stories belonging to this epic */
  storyIds: string[];
}
```

### Project Structure Notes

- Types in `src/shared/` are compiled by both esbuild (extension) and Vite (WebView)
- Import paths must work for both build systems
- Consider re-exporting from `src/shared/index.ts` for clean imports

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- [Source: src/shared/types.ts] - Existing types to align with
- [Source: src/shared/messages.ts#DataLoadedPayload] - Target for type update

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (GitHub Copilot)

### Debug Log References

- models.test.ts: 15/15 tests passed
- npm run compile: OK (dist/extension.js 294.9kb)
- Note: SidebarProvider.test.ts has 1 pre-existing failing test (launchAgent) - unrelated to this story

### Completion Notes List

- Created `src/shared/models.ts` with StoryStatus, EpicStatus types and Story, Epic interfaces
- Added isStoryStatus and isEpicStatus type guards for runtime validation
- Updated `src/shared/messages.ts` DataLoadedPayload to use Epic[] and Story[] instead of unknown[]
- Updated `src/shared/index.ts` to export models.ts
- Created comprehensive unit tests in `tests/unit/shared/models.test.ts`
- BmadConfig in types.ts already has all required fields

### File List

- `src/shared/models.ts` (created)
- `src/shared/messages.ts` (modified - DataLoadedPayload types)
- `src/shared/index.ts` (modified - added models export)
- `tests/unit/shared/models.test.ts` (created)

