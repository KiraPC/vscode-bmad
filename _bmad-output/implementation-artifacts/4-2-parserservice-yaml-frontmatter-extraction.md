# Story 4.2: ParserService - YAML Frontmatter Extraction

Status: ready-for-dev

## Story

As a **developer**,
I want **a parser that extracts YAML frontmatter from markdown files**,
So that **I can read metadata from epics.md and story files**.

## Acceptance Criteria

1. **Given** a markdown file with YAML frontmatter (delimited by `---`)
   **When** ParserService.parseFrontmatter(content) is called
   **Then** it returns parsed frontmatter object and remaining content body

2. **Given** a markdown file without frontmatter
   **When** ParserService.parseFrontmatter(content) is called
   **Then** it returns null frontmatter and full content (graceful handling)

3. **Given** a markdown file with malformed YAML frontmatter
   **When** ParserService.parseFrontmatter(content) is called
   **Then** it returns error with details and logs to ErrorService (FR39)

4. **Given** files with different line endings (CRLF vs LF)
   **When** ParserService parses them
   **Then** line ending normalization is handled correctly (FR42)

5. **Given** ParserService is used
   **When** checking dependencies
   **Then** `gray-matter` library is used for parsing (FR32)

## Tasks / Subtasks

- [ ] Task 1: Install gray-matter if not present (AC: #5)
  - [ ] 1.1: Verify gray-matter in package.json dependencies
  - [ ] 1.2: Add @types/gray-matter if needed

- [ ] Task 2: Create ParserService class (AC: #1, #2)
  - [ ] 2.1: Create `src/services/ParserService.ts`
  - [ ] 2.2: Implement singleton pattern matching ErrorService/ConfigService
  - [ ] 2.3: Import gray-matter library

- [ ] Task 3: Implement parseFrontmatter method (AC: #1, #2, #4)
  - [ ] 3.1: Define ParsedFrontmatter interface
  - [ ] 3.2: Use gray-matter to extract frontmatter
  - [ ] 3.3: Return { frontmatter, content } structure
  - [ ] 3.4: Handle missing frontmatter gracefully

- [ ] Task 4: Implement error handling (AC: #3)
  - [ ] 4.1: Wrap gray-matter in try/catch
  - [ ] 4.2: Create specific error codes for parse failures
  - [ ] 4.3: Log to ErrorService with line details if available
  - [ ] 4.4: Return ServiceResult pattern

- [ ] Task 5: Handle line ending normalization (AC: #4)
  - [ ] 5.1: Normalize CRLF to LF before parsing
  - [ ] 5.2: Add normalizeLineEndings utility function

- [ ] Task 6: Register in service exports (AC: #1)
  - [ ] 6.1: Export from `src/services/index.ts`
  - [ ] 6.2: Add getParserService() factory function

- [ ] Task 7: Add unit tests (AC: #1-5)
  - [ ] 7.1: Create `tests/unit/services/ParserService.test.ts`
  - [ ] 7.2: Test valid frontmatter extraction
  - [ ] 7.3: Test missing frontmatter handling
  - [ ] 7.4: Test malformed YAML error handling
  - [ ] 7.5: Test CRLF normalization

## Dev Notes

### Architecture Patterns

- **Singleton Pattern**: Match ConfigService and ErrorService patterns
- **ServiceResult**: Return `ServiceResult<ParsedFrontmatter>` for error handling
- **Error Codes**: Add new codes to ErrorCodes in types.ts

### gray-matter Usage

```typescript
import matter from 'gray-matter';

const result = matter(content);
// result.data - parsed frontmatter as object
// result.content - remaining markdown content
// result.isEmpty - true if no frontmatter present
```

### Interface Design

```typescript
// src/services/ParserService.ts

export interface ParsedFrontmatter<T = Record<string, unknown>> {
  /** Parsed frontmatter data, null if not present */
  frontmatter: T | null;
  /** Markdown content after frontmatter */
  content: string;
  /** Whether frontmatter was present */
  hasFrontmatter: boolean;
}

export interface FrontmatterParseOptions {
  /** Whether to normalize line endings before parsing */
  normalizeLineEndings?: boolean;
}
```

### Error Codes to Add

```typescript
// Add to ErrorCodes in types.ts
FRONTMATTER_PARSE_ERROR: 'FRONTMATTER_PARSE_ERROR',
YAML_SYNTAX_ERROR: 'YAML_SYNTAX_ERROR',
```

### Line Ending Normalization

```typescript
function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
```

### Performance Note

- NFR-P2: File parsing operations should complete in <200ms
- gray-matter is lightweight and synchronous - performance should not be an issue

### Project Structure Notes

- File location: `src/services/ParserService.ts`
- Test location: `tests/unit/services/ParserService.test.ts`
- Follows existing pattern from ErrorService.ts and ConfigService.ts

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] - gray-matter dependency
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling & Logging] - ErrorService pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- [Source: src/services/ErrorService.ts] - Singleton pattern reference
- [Source: src/shared/types.ts#ErrorCodes] - Error code constants

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

