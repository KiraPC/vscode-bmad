# Story 4.6: Derived Epic Status

Status: ready-for-dev

## Story

As a **user**,
I want **epic status to be calculated from child story statuses**,
So that **I can see overall epic progress without manual updates**.

## Acceptance Criteria

1. **Given** an epic has multiple stories
   **When** epic status is derived
   **Then**:
   - If all stories are 'backlog' → epic is 'backlog'
   - If all stories are 'done' → epic is 'done'
   - Otherwise → epic is 'in-progress' (FR38)

2. **Given** an epic has no stories
   **When** epic status is derived
   **Then** epic status is 'backlog'

3. **Given** stories change status
   **When** derivation is recalculated
   **Then** epic status updates accordingly

4. **Given** epics are parsed and stories are available
   **When** data is prepared for Kanban board
   **Then** each epic has correct derived status and storyIds populated

## Tasks / Subtasks

- [ ] Task 1: Design status derivation function (AC: #1, #2)
  - [ ] 1.1: Define deriveEpicStatus(stories: Story[]): EpicStatus
  - [ ] 1.2: Handle all edge cases (no stories, mixed statuses)

- [ ] Task 2: Add to ParserService or dedicated module (AC: #1)
  - [ ] 2.1: Create derivation utility function
  - [ ] 2.2: Add to `src/services/ParserService.ts` or create `src/utils/statusDerivation.ts`

- [ ] Task 3: Implement status derivation logic (AC: #1, #2)
  - [ ] 3.1: Check if all stories are 'backlog' → return 'backlog'
  - [ ] 3.2: Check if all stories are 'done' → return 'done'
  - [ ] 3.3: Otherwise → return 'in-progress'
  - [ ] 3.4: Handle empty story array → return 'backlog'

- [ ] Task 4: Create epic enrichment function (AC: #4)
  - [ ] 4.1: Create enrichEpicsWithStories(epics, stories)
  - [ ] 4.2: Match stories to epics by epicId
  - [ ] 4.3: Populate storyIds array on each epic
  - [ ] 4.4: Calculate derived status for each epic

- [ ] Task 5: Integrate with StoryParser/EpicsParser (AC: #3, #4)
  - [ ] 5.1: Create combined data service or orchestrator
  - [ ] 5.2: Call enrichment after parsing both files

- [ ] Task 6: Add unit tests (AC: #1-4)
  - [ ] 6.1: Create tests in appropriate test file
  - [ ] 6.2: Test all-backlog → backlog
  - [ ] 6.3: Test all-done → done
  - [ ] 6.4: Test mixed → in-progress
  - [ ] 6.5: Test no stories → backlog
  - [ ] 6.6: Test story matching to epics

## Dev Notes

### Status Derivation Logic

```typescript
// src/utils/statusDerivation.ts

import type { Story, EpicStatus, StoryStatus } from '../shared/models';

/**
 * Derive epic status from child story statuses
 * FR38: Derive epic status by aggregating child story statuses
 */
export function deriveEpicStatus(stories: Story[]): EpicStatus {
  if (stories.length === 0) {
    return 'backlog';
  }

  const allBacklog = stories.every(s => s.status === 'backlog');
  if (allBacklog) {
    return 'backlog';
  }

  const allDone = stories.every(s => s.status === 'done');
  if (allDone) {
    return 'done';
  }

  return 'in-progress';
}
```

### Epic Enrichment Function

```typescript
/**
 * Enrich epics with their child stories and derived status
 */
export function enrichEpicsWithStories(
  epics: Epic[],
  stories: Story[]
): Epic[] {
  return epics.map(epic => {
    const epicStories = stories.filter(s => s.epicId === epic.id);
    return {
      ...epic,
      storyIds: epicStories.map(s => s.id),
      status: deriveEpicStatus(epicStories)
    };
  });
}
```

### Story Status Values vs Epic Status

**Story statuses** (from sprint-status.yaml):
- backlog
- ready-for-dev
- in-progress
- review
- done

**Epic statuses** (simpler):
- backlog
- in-progress
- done

The derivation maps story statuses to epic status:
- 'backlog', 'ready-for-dev' = not started work
- 'in-progress', 'review' = work in progress
- 'done' = completed

### Refined Logic Consideration

Should "all backlog OR ready-for-dev" → 'backlog'?
Or only "all backlog" → 'backlog'?

Current requirement says:
- "If all stories are 'backlog' → epic is 'backlog'"

This implies ready-for-dev counts as in-progress, which makes sense since story is prepared for development.

### DataService Orchestration (Optional)

Consider creating a DataService that coordinates parsing:

```typescript
// src/services/DataService.ts

export class DataService {
  async loadProjectData(): Promise<ServiceResult<ProjectData>> {
    const epicsResult = await this.epicsParser.parseEpics(epicsPath);
    const storiesResult = await this.storyParser.scanAndParse(storiesPath);
    
    if (!epicsResult.success || !storiesResult.success) {
      // Handle errors
    }
    
    const enrichedEpics = enrichEpicsWithStories(
      epicsResult.data.epics,
      storiesResult.data
    );
    
    return {
      success: true,
      data: {
        epics: enrichedEpics,
        stories: storiesResult.data
      }
    };
  }
}
```

### Project Structure Notes

- Utility function location: `src/utils/statusDerivation.ts`
- Could also be in `src/services/ParserService.ts`
- Test location: `tests/unit/utils/statusDerivation.test.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#FR38] - Epic status derivation requirement
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.6]
- [Source: src/shared/models.ts] - Epic and Story types (Story 4.1)
- [Source: src/services/StoryParser.ts] - Story parsing (Story 4.4)
- [Source: src/services/EpicsParser.ts] - Epic parsing (Story 4.3)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

