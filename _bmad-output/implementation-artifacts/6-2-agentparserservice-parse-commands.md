# Story 6.2: AgentParserService - Parse Commands

Status: review

## Story

As a **developer**,
I want **to parse agent commands from agent markdown files**,
So that **users can see available commands in a dropdown**.

## Acceptance Criteria

1. **Given** an agent markdown file with `<menu>` section containing `<item>` elements
   **When** AgentParserService.parseCommands(agentFilePath) is called
   **Then** it extracts array of AgentCommand objects with:
   - code (e.g., "SP", "MH", "CP")
   - description (e.g., "Sprint Planning: Generate or update...")
   - fullText (complete menu item text)
   - attributes (optional: workflow, exec, data paths)
   (FR19)

2. **Given** agent file has no `<menu>` section
   **When** parseCommands is called
   **Then** it returns empty array (graceful handling, no error)

3. **Given** agent file has malformed XML or unparseable menu
   **When** parseCommands is called
   **Then** it logs warning via ErrorService and returns empty array

4. **Given** menu item has additional attributes (workflow, exec, data)
   **When** parseCommands parses that item
   **Then** attributes are captured in the AgentCommand object

5. **Given** agent file path does not exist
   **When** parseCommands is called
   **Then** it returns ServiceResult error with code 'FILE_NOT_FOUND'

## Tasks / Subtasks

- [x] Task 1: Define AgentCommand interface (AC: #1, #4)
  - [x] 1.1: Add `AgentCommand` interface to `src/shared/models.ts`
  - [x] 1.2: Include code, description, fullText, attributes fields
  - [x] 1.3: Define `AgentCommandAttributes` interface for optional workflow/exec/data
  - [x] 1.4: Add type guard `isAgentCommand()` function

- [x] Task 2: Implement parseCommands method (AC: #1)
  - [x] 2.1: Add `parseCommands(agentFilePath: string)` method to AgentParserService
  - [x] 2.2: Read agent file content via VS Code fs API
  - [x] 2.3: Extract `<menu>...</menu>` section using regex
  - [x] 2.4: Parse each `<item>` element within menu

- [x] Task 3: Implement menu item parsing (AC: #1, #4)
  - [x] 3.1: Extract `cmd` attribute from `<item>` tag
  - [x] 3.2: Extract command code from item text (e.g., "[SP]" → "SP")
  - [x] 3.3: Extract description from item text (after command code)
  - [x] 3.4: Extract optional attributes: workflow, exec, data
  - [x] 3.5: Build AgentCommand object with all fields

- [x] Task 4: Implement error handling (AC: #2, #3, #5)
  - [x] 4.1: Return empty array when no menu section found
  - [x] 4.2: Log warning and return empty on malformed XML
  - [x] 4.3: Return ServiceResult error when file not found
  - [x] 4.4: Use ErrorService for logging warnings

- [x] Task 5: Add unit tests (AC: #1-5)
  - [x] 5.1: Create `tests/unit/services/AgentParserService.parseCommands.test.ts`
  - [x] 5.2: Test valid menu parsing with multiple commands
  - [x] 5.3: Test extraction of command code, description, fullText
  - [x] 5.4: Test attribute extraction (workflow, exec, data)
  - [x] 5.5: Test no menu section returns empty array
  - [x] 5.6: Test malformed XML returns empty array with warning
  - [x] 5.7: Test file not found error
  - [x] 5.8: Create test fixtures with sample agent menu content

## Dev Notes

### Menu XML Structure (from actual agent files)

Agent markdown files contain an XML `<menu>` section with `<item>` elements:

```xml
<menu>
  <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
  <item cmd="SP or fuzzy match on sprint-planning" workflow="{project-root}/_bmad/bmm/workflows/...">[SP] Sprint Planning: Description</item>
  <item cmd="CP or fuzzy match on create-prd" exec="{project-root}/_bmad/bmm/workflows/...">[CP] Create PRD: Expert led facilitation...</item>
  <item cmd="ER or fuzzy match on epic-retrospective" workflow="..." data="{project-root}/_bmad/_config/agent-manifest.csv">[ER] Epic Retrospective: Party Mode review...</item>
</menu>
```

### Parsing Strategy

1. **Find menu section**: Use regex `/<menu>[\s\S]*?<\/menu>/` to extract menu block
2. **Extract items**: Use regex `/<item\s+([^>]*)>([^<]*)<\/item>/g` to get each item
3. **Parse item attributes**: Extract `cmd`, `workflow`, `exec`, `data` from tag attributes
4. **Parse item text**: Extract command code `[XX]` and description from element content

### AgentCommand Interface

```typescript
// src/shared/models.ts

/**
 * Optional attributes for agent menu commands
 * FR19: Parse agent commands from markdown
 */
export interface AgentCommandAttributes {
  /** Workflow YAML path for workflow-based commands */
  workflow?: string;
  
  /** Exec markdown path for direct execution commands */
  exec?: string;
  
  /** Data file path (CSV, JSON, YAML) for data-driven commands */
  data?: string;
}

/**
 * Represents a single command from an agent's menu
 * FR19: Parse agent commands from markdown
 */
export interface AgentCommand {
  /** Short command code (e.g., "SP", "CP", "MH") */
  code: string;
  
  /** Command description (text after command code) */
  description: string;
  
  /** Full menu item text including [CODE] prefix */
  fullText: string;
  
  /** Optional command attributes (workflow, exec, data) */
  attributes?: AgentCommandAttributes;
}
```

### Regex Patterns

```typescript
// Extract <menu>...</menu> block
private readonly menuBlockPattern = /<menu>([\s\S]*?)<\/menu>/;

// Match individual <item> elements with attributes and content
// Captures: 1=attributes string, 2=inner text
private readonly itemPattern = /<item\s+([^>]*)>([^<]*)<\/item>/g;

// Extract specific attribute from attributes string
private extractAttribute(attrString: string, name: string): string | undefined {
  const match = attrString.match(new RegExp(`${name}="([^"]+)"`));
  return match?.[1];
}

// Extract command code from text like "[SP] Sprint Planning..."
private extractCommandCode(text: string): string | null {
  const match = text.match(/^\[([A-Z]{2})\]/);
  return match?.[1] ?? null;
}
```

### AgentParserService Method Signature

```typescript
// Add to AgentParserService class (from Story 6.1)

/**
 * Parse commands from agent markdown file menu section
 * FR19: Parse agent commands from markdown
 * 
 * @param agentFilePath - Absolute path to agent markdown file
 * @returns ServiceResult with array of AgentCommand objects
 */
public async parseCommands(agentFilePath: string): Promise<ServiceResult<AgentCommand[]>> {
  // Implementation
}

/**
 * Extract menu section from agent file content
 * @private
 */
private extractMenuSection(content: string): string | null {
  const match = content.match(this.menuBlockPattern);
  return match?.[1] ?? null;
}

/**
 * Parse individual menu item into AgentCommand
 * @private
 */
private parseMenuItem(attrString: string, innerText: string): AgentCommand | null {
  // Implementation
}
```

### Sample Agent Files for Reference

**SM Agent** (`_bmad/bmm/agents/sm.md`):
- Commands: MH, CH, SP, CS, ER, CC, PM, DA
- Uses workflow attributes

**PM Agent** (`_bmad/bmm/agents/pm.md`):
- Commands: MH, CH, CP, VP, EP, CE, IR, CC, PM, DA  
- Uses exec attributes

### Integration with Story 6.1

This story extends AgentParserService created in Story 6.1:
- Uses same singleton pattern
- Uses same ErrorService for logging
- Adds parseCommands() method to existing class
- Uses same ServiceResult<T> return pattern

### Test Fixtures

Create test fixtures in `tests/fixtures/agents/`:

```markdown
<!-- tests/fixtures/agents/valid-with-menu.md -->
---
name: "test-agent"
description: "Test Agent"
---

<agent id="test" name="Test" title="Test Agent" icon="🧪">
  <menu>
    <item cmd="T1 or fuzzy match on test-one" workflow="/path/to/workflow.yaml">[T1] Test One: First test command</item>
    <item cmd="T2 or fuzzy match on test-two" exec="/path/to/exec.md">[T2] Test Two: Second test command</item>
    <item cmd="T3 or fuzzy match on test-three" data="/path/to/data.csv">[T3] Test Three: Third test command</item>
    <item cmd="T4 or fuzzy match on test-four">[T4] Test Four: No attributes</item>
  </menu>
</agent>
```

```markdown
<!-- tests/fixtures/agents/no-menu.md -->
---
name: "no-menu-agent"
description: "Agent without menu"
---

<agent id="no-menu" name="NoMenu" title="No Menu Agent" icon="❌">
  <persona>Just a persona, no menu</persona>
</agent>
```

### Project Structure Notes

- **File location:** `src/services/AgentParserService.ts` (extend existing from 6.1)
- **Types location:** `src/shared/models.ts` (add AgentCommand, AgentCommandAttributes)
- **Test location:** `tests/unit/services/AgentParserService.parseCommands.test.ts`
- **Test fixtures:** `tests/fixtures/agents/` (add menu test files)

### Error Codes to Use

- `FILE_NOT_FOUND` - Agent file doesn't exist
- `FILE_READ_ERROR` - Cannot read agent file content

### Performance Requirements

- NFR-P4: Agent Launcher dropdown population completes in <100ms
- parseCommands should be fast since it parses a single file's content

### Dependencies

- **Story 6.1:** AgentParserService base class must exist first
- **ParserService:** May use for frontmatter extraction if needed
- **ErrorService:** For warning/error logging
- **VS Code fs API:** For reading file content

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] - Story requirements
- [Source: _bmad-output/planning-artifacts/architecture.md] - Service patterns, ServiceResult
- [Source: src/services/ParserService.ts] - Reference for parsing patterns and error handling
- [Source: src/shared/types.ts] - ServiceResult, BmadError types
- [Source: src/shared/models.ts] - Existing model patterns
- [Source: _bmad/bmm/agents/sm.md] - Sample agent file with menu structure
- [Source: _bmad/bmm/agents/pm.md] - Sample agent file with menu structure
- [Source: _bmad-output/implementation-artifacts/6-1-agentparserservice-discover-agents.md] - Prereq story with AgentParserService base

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Fixed command code regex from `/^\[([A-Z]{2,4})\]/` to `/^\[([A-Z][A-Z0-9]{1,3})\]/` to allow alphanumeric codes like "T1", "SP", etc.

### Completion Notes List

- Added `AgentCommand` and `AgentCommandAttributes` interfaces to `src/shared/models.ts`
- Added `isAgentCommand()` and `isAgentCommandAttributes()` type guards
- Implemented `parseCommands()` method in AgentParserService with:
  - Menu section extraction via regex
  - Item parsing with code, description, fullText extraction
  - Attribute extraction (workflow, exec, data)
  - Error handling for missing files and malformed content
- Added 18 new unit tests covering all acceptance criteria
- Created 3 test fixtures: valid-with-menu.md, no-menu.md, malformed-menu.md
- All 492 tests pass (42 in AgentParserService.test.ts)

### File List

- src/shared/models.ts (modified - added AgentCommand, AgentCommandAttributes interfaces and type guards)
- src/services/AgentParserService.ts (modified - added parseCommands method and helper methods)
- tests/unit/services/AgentParserService.test.ts (modified - added 18 parseCommands tests and type guard tests)
- tests/fixtures/agents/valid-with-menu.md (new - test fixture with complete menu)
- tests/fixtures/agents/no-menu.md (new - test fixture without menu)
- tests/fixtures/agents/malformed-menu.md (new - test fixture with malformed menu)

