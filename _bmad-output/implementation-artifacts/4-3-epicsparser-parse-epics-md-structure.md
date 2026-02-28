# Story 4.3: EpicsParser - Parse epics.md Structure

Status: ready-for-dev

## Story

As a **developer**,
I want **a parser that extracts epic definitions from epics.md**,
So that **I can display epics in the Kanban board**.

## Acceptance Criteria

1. **Given** epics.md file exists with epic sections formatted as `## Epic N: Title`
   **When** EpicsParser.parseEpics(filePath) is called
   **Then** it returns array of Epic objects with:
   - id extracted from "Epic N"
   - title extracted from section header
   - description from content below header
   - storyIds initially empty (FR33)

2. **Given** epics.md has malformed structure
   **When** EpicsParser.parseEpics() is called
   **Then** it parses what it can and logs warnings for unparseable sections

3. **Given** epics.md file does not exist
   **When** EpicsParser.parseEpics(filePath) is called
   **Then** it returns ServiceResult error with FILE_NOT_FOUND code

4. **Given** typical epics.md file
   **When** EpicsParser parses it
   **Then** parsing completes in <100ms (NFR-P2)

5. **Given** epics.md has YAML frontmatter
   **When** EpicsParser parses it
   **Then** frontmatter is extracted separately from epic sections
   **And** metadata like totalEpics, totalStories is available

## Tasks / Subtasks

- [ ] Task 1: Design EpicsParser interface (AC: #1, #5)
  - [ ] 1.1: Define return types for parseEpics
  - [ ] 1.2: Include frontmatter metadata in parsed result

- [ ] Task 2: Create EpicsParser class (AC: #1)
  - [ ] 2.1: Create `src/services/EpicsParser.ts`
  - [ ] 2.2: Import ParserService for frontmatter
  - [ ] 2.3: Implement singleton pattern

- [ ] Task 3: Implement epic section detection (AC: #1)
  - [ ] 3.1: Use regex to find `## Epic N: Title` patterns
  - [ ] 3.2: Extract epic number and title from header
  - [ ] 3.3: Extract content between headers as description

- [ ] Task 4: Implement parseEpics method (AC: #1, #5)
  - [ ] 4.1: Read file content using fs API
  - [ ] 4.2: Parse frontmatter if present
  - [ ] 4.3: Parse epic sections from content
  - [ ] 4.4: Return array of Epic objects

- [ ] Task 5: Implement error handling (AC: #2, #3)
  - [ ] 5.1: Handle file not found
  - [ ] 5.2: Handle malformed sections with logging
  - [ ] 5.3: Continue parsing on partial failures

- [ ] Task 6: Register in service exports (AC: #1)
  - [ ] 6.1: Export from `src/services/index.ts`
  - [ ] 6.2: Add getEpicsParser() factory function

- [ ] Task 7: Add unit tests (AC: #1-4)
  - [ ] 7.1: Create `tests/unit/services/EpicsParser.test.ts`
  - [ ] 7.2: Test valid epics.md parsing
  - [ ] 7.3: Test malformed section handling
  - [ ] 7.4: Test file not found error
  - [ ] 7.5: Test frontmatter extraction

## Dev Notes

### Epic Section Pattern in epics.md

Based on actual epics.md structure:
```markdown
---
totalEpics: 6
totalStories: 34
---

## Epic 1: Extension Foundation & Project Detection

**Goal:** When users open VS Code in a folder with `_bmad/`...

### Story 1.1: Extension Project Setup
...
```

### Regex Pattern for Epic Headers

```typescript
// Match "## Epic N: Title" pattern
const epicHeaderPattern = /^## Epic (\d+): (.+)$/gm;

// Or more permissive:
const epicHeaderPattern = /^##\s+Epic\s+(\d+):\s*(.+)$/gmi;
```

### EpicsParser Interface

```typescript
// src/services/EpicsParser.ts

export interface EpicsMetadata {
  totalEpics?: number;
  totalStories?: number;
  status?: string;
  completedAt?: string;
}

export interface ParsedEpics {
  /** Frontmatter metadata */
  metadata: EpicsMetadata;
  /** Array of parsed epics */
  epics: Epic[];
}

export class EpicsParser {
  private static instance: EpicsParser | null = null;
  
  static getInstance(): EpicsParser {
    if (!EpicsParser.instance) {
      EpicsParser.instance = new EpicsParser();
    }
    return EpicsParser.instance;
  }

  async parseEpics(filePath: string): Promise<ServiceResult<ParsedEpics>> {
    // Implementation
  }
}
```

### Description Extraction Logic

The description for each epic is the content between:
- The epic header (## Epic N: Title)
- The next epic header OR end of file

Truncate description at first story header (### Story) or at **FRs Covered:** to keep it concise.

### Performance Consideration

- NFR-P2: <100ms parsing time
- Use synchronous regex operations (fast for typical file sizes)
- Avoid multiple file reads

### Project Structure Notes

- File location: `src/services/EpicsParser.ts`
- Depends on: ParserService (for frontmatter), ErrorService (for error handling)
- Test location: `tests/unit/services/EpicsParser.test.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md] - Actual file structure to parse
- [Source: _bmad-output/planning-artifacts/architecture.md#Extension Architecture Pattern]
- [Source: src/services/ParserService.ts] - Frontmatter parsing dependency (Story 4.2)
- [Source: src/shared/models.ts] - Epic type definition (Story 4.1)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

