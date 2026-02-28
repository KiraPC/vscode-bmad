# Story 4.4: StoryParser - Scan and Parse Story Files

Status: ready-for-dev

## Story

As a **developer**,
I want **a parser that discovers and parses story files from implementation_artifacts folder**,
So that **I can display stories in the Kanban board**.

## Acceptance Criteria

1. **Given** implementation_artifacts folder exists with story markdown files
   **When** StoryParser.scanAndParse(folderPath) is called
   **Then** it:
   - Scans folder for all `*.md` files (FR34)
   - Parses each file's frontmatter for: status, epic, assignee, title
   - Returns array of Story objects (FR35)

2. **Given** a story file has missing or invalid frontmatter
   **When** StoryParser parses it
   **Then** it uses defaults (status: 'backlog', epicId: extracted from filename) and logs warning (FR39)

3. **Given** story files follow naming convention `{epic}-{story}-{slug}.md`
   **When** StoryParser parses them
   **Then** it extracts epicId and storyId from filename pattern

4. **Given** 100 story files in the folder
   **When** StoryParser scans and parses them
   **Then** total parsing completes in <200ms (NFR-P2)

5. **Given** non-story files exist in the folder (e.g., sprint-status.yaml)
   **When** StoryParser scans the folder
   **Then** it only parses files matching story naming pattern

## Tasks / Subtasks

- [ ] Task 1: Design StoryParser interface (AC: #1, #3)
  - [ ] 1.1: Define return types for scanAndParse
  - [ ] 1.2: Define story filename pattern

- [ ] Task 2: Create StoryParser class (AC: #1)
  - [ ] 2.1: Create `src/services/StoryParser.ts`
  - [ ] 2.2: Import ParserService for frontmatter
  - [ ] 2.3: Implement singleton pattern

- [ ] Task 3: Implement folder scanning (AC: #1, #5)
  - [ ] 3.1: Use VS Code workspace.findFiles or fs.readdir
  - [ ] 3.2: Filter for story file pattern (N-N-*.md)
  - [ ] 3.3: Exclude non-story files (sprint-status.yaml, etc.)

- [ ] Task 4: Implement filename parsing (AC: #3)
  - [ ] 4.1: Create regex for `{epic}-{story}-{slug}.md`
  - [ ] 4.2: Extract epicId and storyNum from pattern
  - [ ] 4.3: Generate story id as "{epicId}-{storyNum}"

- [ ] Task 5: Implement file parsing (AC: #1, #2)
  - [ ] 5.1: Read file content
  - [ ] 5.2: Parse frontmatter using ParserService
  - [ ] 5.3: Extract title from # header if not in frontmatter
  - [ ] 5.4: Map to Story object

- [ ] Task 6: Implement default handling (AC: #2)
  - [ ] 6.1: Default status to 'backlog' if missing
  - [ ] 6.2: Extract epicId from filename if not in frontmatter
  - [ ] 6.3: Log warning for missing/invalid frontmatter

- [ ] Task 7: Register in service exports (AC: #1)
  - [ ] 7.1: Export from `src/services/index.ts`
  - [ ] 7.2: Add getStoryParser() factory function

- [ ] Task 8: Add unit tests (AC: #1-5)
  - [ ] 8.1: Create `tests/unit/services/StoryParser.test.ts`
  - [ ] 8.2: Test folder scanning
  - [ ] 8.3: Test filename pattern extraction
  - [ ] 8.4: Test frontmatter parsing
  - [ ] 8.5: Test default value handling
  - [ ] 8.6: Test non-story file filtering

## Dev Notes

### Story File Naming Convention

Based on existing files in implementation-artifacts:
```
1-1-extension-project-setup.md
1-2-errorservice-implementation.md
3-7-artifact-file-tree.md
```

Pattern: `{epicNum}-{storyNum}-{kebab-slug}.md`

### Filename Regex Pattern

```typescript
// Match story files: "N-N-slug.md"
const storyFilePattern = /^(\d+)-(\d+)-(.+)\.md$/;

// Example: "3-7-artifact-file-tree.md"
// Groups: [1] = "3" (epicNum), [2] = "7" (storyNum), [3] = "artifact-file-tree"
```

### Story File Frontmatter

Current story files use status in first line after frontmatter:
```markdown
# Story 3.7: Artifact File Tree

Status: done
```

Alternative: Could be in YAML frontmatter

### StoryParser Interface

```typescript
// src/services/StoryParser.ts

export interface ParsedStory {
  id: string;           // "3-7"
  epicId: string;       // "3"
  storyNum: string;     // "7"
  title: string;        // "Artifact File Tree"
  status: StoryStatus;  // "done"
  assignee?: string;
  content: string;      // Full file content for preview
  filePath: string;     // Absolute path
}

export class StoryParser {
  private static instance: StoryParser | null = null;

  static getInstance(): StoryParser {
    if (!StoryParser.instance) {
      StoryParser.instance = new StoryParser();
    }
    return StoryParser.instance;
  }

  async scanAndParse(folderPath: string): Promise<ServiceResult<Story[]>> {
    // Implementation
  }

  async parseStoryFile(filePath: string): Promise<ServiceResult<Story>> {
    // Parse individual file
  }
}
```

### Status Extraction Logic

Current story files have status as text line, not frontmatter:
```markdown
Status: ready-for-dev
```

Need to parse this from content:
```typescript
const statusPattern = /^Status:\s*(.+)$/m;
```

### Files to Exclude

- `sprint-status.yaml` - Not a story
- Any file not matching `N-N-*.md` pattern
- Files starting with `bug-` (bug tracking, not stories)

### Performance Optimization

- Use Promise.all for parallel file reads
- Minimize disk I/O by batching operations
- Keep parsed content in memory for Story.content

### Project Structure Notes

- File location: `src/services/StoryParser.ts`
- Depends on: ParserService, ErrorService
- Test location: `tests/unit/services/StoryParser.test.ts`

### References

- [Source: _bmad-output/implementation-artifacts/] - Actual story files to parse
- [Source: _bmad-output/implementation-artifacts/3-7-artifact-file-tree.md] - Example story file
- [Source: _bmad-output/planning-artifacts/architecture.md#Extension Architecture Pattern]
- [Source: src/shared/models.ts] - Story type definition (Story 4.1)
- [Source: src/services/ParserService.ts] - Frontmatter parsing (Story 4.2)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

