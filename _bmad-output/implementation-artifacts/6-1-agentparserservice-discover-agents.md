# Story 6.1: AgentParserService - Discover Agents

Status: review

## Story

As a **developer**,
I want **a service that discovers available agents from the file system**,
So that **the Agent Launcher can show a dropdown of agents**.

## Acceptance Criteria

1. **Given** `_bmad/bmm/agents/` folder exists with agent markdown files
   **When** AgentParserService.discoverAgents() is called
   **Then** it returns array of Agent objects with:
   - name (from frontmatter or filename)
   - displayName (from frontmatter or title attribute in XML)
   - description (from frontmatter)
   - filePath (absolute path to agent file)
   - icon (from XML `<agent>` tag if present)
   (FR18)

2. **Given** agents folder contains nested subfolders (e.g., `agents/tech-writer/tech-writer.md`)
   **When** AgentParserService.discoverAgents() is called
   **Then** it recursively discovers all `.md` files in subfolders

3. **Given** discovery completes
   **When** measuring performance
   **Then** completes in <100ms (NFR-P4)

4. **Given** `_bmad/bmm/agents/` folder does not exist
   **When** AgentParserService.discoverAgents() is called
   **Then** it returns ServiceResult error with appropriate code

5. **Given** agent file has malformed frontmatter or content
   **When** AgentParserService.discoverAgents() is called
   **Then** it skips that file, logs warning, and continues with other files

6. **Given** agent file has no frontmatter but has valid XML structure
   **When** AgentParserService parses the file
   **Then** it extracts name from `<agent>` tag attributes as fallback

## Tasks / Subtasks

- [x] Task 1: Define Agent interface and types (AC: #1)
  - [x] 1.1: Create `Agent` interface in `src/shared/models.ts`
  - [x] 1.2: Include id, name, displayName, description, filePath, icon fields
  - [x] 1.3: Add type guard `isAgent()` function

- [x] Task 2: Create AgentParserService class (AC: #1)
  - [x] 2.1: Create `src/services/AgentParserService.ts`
  - [x] 2.2: Implement singleton pattern matching other services
  - [x] 2.3: Import dependences (ParserService for frontmatter, ErrorService)

- [x] Task 3: Implement agent discovery method (AC: #1, #2)
  - [x] 3.1: Implement `discoverAgents()` method signature
  - [x] 3.2: Use VS Code `workspace.fs.readDirectory()` for folder scanning
  - [x] 3.3: Recursively scan nested folders for `.md` files
  - [x] 3.4: Filter to only `.md` files

- [x] Task 4: Implement agent file parsing (AC: #1, #6)
  - [x] 4.1: Parse YAML frontmatter using ParserService
  - [x] 4.2: Extract name, description from frontmatter
  - [x] 4.3: Parse XML `<agent>` tag for icon, title, name attributes
  - [x] 4.4: Use fallback logic: frontmatter > XML attributes > filename

- [x] Task 5: Implement error handling (AC: #4, #5)
  - [x] 5.1: Handle folder not found with ServiceResult error
  - [x] 5.2: Skip malformed files with warning logs
  - [x] 5.3: Continue parsing remaining files on individual failures

- [x] Task 6: Register in service exports (AC: #1)
  - [x] 6.1: Export from `src/services/index.ts`
  - [x] 6.2: Add `getAgentParserService()` factory function

- [x] Task 7: Add unit tests (AC: #1-6)
  - [x] 7.1: Create `tests/unit/services/AgentParserService.test.ts`
  - [x] 7.2: Test valid agent discovery with sample fixtures
  - [x] 7.3: Test nested folder discovery
  - [x] 7.4: Test folder not found error
  - [x] 7.5: Test malformed file handling
  - [x] 7.6: Test fallback parsing (XML when no frontmatter)
  - [x] 7.7: Create test fixtures in `tests/fixtures/agents/`

## Dev Notes

### Agent File Structure

Agent markdown files have this structure:
```markdown
---
name: "sm"
description: "Scrum Master"
---

... markdown content ...

```xml
<agent id="sm.agent.yaml" name="Bob" title="Scrum Master" icon="🏃">
...
</agent>
```

### Parsing Priority

1. **Frontmatter** (primary): `name`, `description` from YAML
2. **XML attributes** (fallback): `title`, `icon`, `name` from `<agent>` tag
3. **Filename** (last resort): derive name from filename (e.g., `pm.md` → "pm")

### Agent Interface

```typescript
// src/shared/models.ts

/**
 * Represents a BMAD agent from _bmad/bmm/agents/
 * FR18: Dynamic agent discovery
 */
export interface Agent {
  /** Unique identifier (filename without .md extension) */
  id: string;
  
  /** Agent name from frontmatter or filename */
  name: string;
  
  /** Display name for UI (from frontmatter description or XML title) */
  displayName: string;
  
  /** Optional description text */
  description?: string;
  
  /** Absolute file path to agent markdown file */
  filePath: string;
  
  /** Optional emoji icon from XML <agent> tag */
  icon?: string;
}
```

### Folder Structure Examples

```
_bmad/bmm/agents/
├── analyst.md
├── architect.md
├── dev.md
├── pm.md
├── qa.md
├── quick-flow-solo-dev.md
├── sm.md
├── tech-writer/           # Nested folder
│   └── tech-writer.md
└── ux-designer.md
```

### AgentParserService Implementation Pattern

```typescript
// src/services/AgentParserService.ts

import * as vscode from 'vscode';
import { ServiceResult, BmadError, ErrorCodes } from '../shared/types';
import { Agent } from '../shared/models';
import { getParserService } from './ParserService';
import { getErrorService } from './ErrorService';

export class AgentParserService {
  private static instance: AgentParserService | null = null;

  // XML agent tag regex
  private readonly agentTagPattern = /<agent[^>]+>/;
  
  private constructor() {}

  public static getInstance(): AgentParserService {
    if (!AgentParserService.instance) {
      AgentParserService.instance = new AgentParserService();
    }
    return AgentParserService.instance;
  }

  public static resetInstance(): void {
    AgentParserService.instance = null;
  }

  /**
   * Discover all agents from _bmad/bmm/agents/ folder
   * FR18: Dynamic agent discovery
   */
  public async discoverAgents(agentsFolderPath: string): Promise<ServiceResult<Agent[]>> {
    // Implementation
  }

  /**
   * Parse single agent file
   */
  private async parseAgentFile(filePath: string): Promise<Agent | null> {
    // Implementation
  }

  /**
   * Extract attributes from XML <agent> tag
   */
  private extractAgentXmlAttributes(content: string): { 
    name?: string; 
    title?: string; 
    icon?: string; 
  } {
    // Implementation
  }
}

export function getAgentParserService(): AgentParserService {
  return AgentParserService.getInstance();
}
```

### XML Attribute Extraction

Use regex to extract attributes from `<agent>` tag:
```typescript
// Match: <agent id="..." name="Bob" title="Scrum Master" icon="🏃">
const agentTagMatch = content.match(/<agent[^>]*>/);
if (agentTagMatch) {
  const tagContent = agentTagMatch[0];
  const nameMatch = tagContent.match(/name="([^"]+)"/);
  const titleMatch = tagContent.match(/title="([^"]+)"/);
  const iconMatch = tagContent.match(/icon="([^"]+)"/);
}
```

### Performance Requirements

- NFR-P4: Agent Launcher dropdown population completes in <100ms
- Use async/parallel file reading where possible
- Avoid blocking operations

### Error Codes to Use

- `FILE_NOT_FOUND` - agents folder doesn't exist
- `FILE_READ_ERROR` - cannot read agent file

### Project Structure Notes

- **File location:** `src/services/AgentParserService.ts`
- **Depends on:** ParserService (frontmatter), ErrorService (logging)
- **Test location:** `tests/unit/services/AgentParserService.test.ts`
- **Test fixtures:** `tests/fixtures/agents/` with sample agent files

### Test Fixtures to Create

```
tests/fixtures/agents/
├── valid-agent.md           # Full frontmatter + XML
├── xml-only-agent.md        # No frontmatter, valid XML
├── malformed-agent.md       # Invalid content
└── nested/
    └── nested-agent.md      # Test recursive discovery
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6] - Story requirements
- [Source: _bmad-output/planning-artifacts/architecture.md] - Service patterns
- [Source: src/services/EpicsParser.ts] - Reference for parsing patterns
- [Source: src/services/ParserService.ts] - Frontmatter extraction
- [Source: _bmad/bmm/agents/sm.md] - Sample agent file structure
- [Source: _bmad/bmm/agents/pm.md] - Sample agent file structure
- [Source: _bmad/bmm/agents/dev.md] - Sample agent file structure

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

None - implementation completed without issues.

### Completion Notes List

- Implemented Agent interface in models.ts with type guard isAgent()
- Created AgentParserService with singleton pattern matching existing services
- Used VS Code workspace.fs APIs for cross-platform file operations
- Fallback parsing: frontmatter → XML attributes → filename
- Agents sorted alphabetically by name for consistent ordering
- 18 unit tests covering all acceptance criteria
- Test fixtures created for valid, XML-only, malformed, and nested agents

### File List

- src/shared/models.ts (modified - added Agent interface and isAgent type guard)
- src/services/AgentParserService.ts (created - service implementation)
- src/services/index.ts (modified - added exports)
- tests/unit/services/AgentParserService.test.ts (created - 18 tests)
- tests/fixtures/agents/valid-agent.md (created - test fixture)
- tests/fixtures/agents/xml-only-agent.md (created - test fixture)
- tests/fixtures/agents/malformed-agent.md (created - test fixture)
- tests/fixtures/agents/nested/nested-agent.md (created - test fixture)

