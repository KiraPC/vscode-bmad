# Story 1.3: ConfigService - Basic YAML Parsing

Status: done

## Story

As a **user**,
I want **the extension to read my `_bmad/bmm/config.yaml` file**,
So that **it knows my project name, artifact paths, and preferences**.

## Acceptance Criteria

1. **Given** a workspace with `_bmad/bmm/config.yaml` present
   **When** ConfigService.getConfig() is called
   **Then** it returns a `BmadConfig` object containing:
   - `projectName` (from `project_name`)
   - `planningArtifacts` path (from `planning_artifacts`)
   - `implementationArtifacts` path (from `implementation_artifacts`)
   - `userName`, `communicationLanguage`, `documentOutputLanguage`

2. **Given** a workspace without `_bmad/bmm/config.yaml`
   **When** ConfigService.getConfig() is called
   **Then** it returns `{ success: false, error: { code: 'CONFIG_NOT_FOUND', ... } }`

3. **Given** a workspace with malformed YAML in config.yaml
   **When** ConfigService.getConfig() is called
   **Then** it returns error with specific line number and YAML syntax issue (FR6)

## Tasks / Subtasks

- [ ] Task 1: Install YAML parsing dependency (AC: #1, #3)
  - [ ] 1.1: Run `npm install yaml` for YAML parsing
  - [ ] 1.2: Verify yaml package is added to package.json dependencies

- [ ] Task 2: Create BmadConfig type definition (AC: #1)
  - [ ] 2.1: Create `src/shared/models.ts` file
  - [ ] 2.2: Define `BmadConfig` interface with all config fields
  - [ ] 2.3: Export via `src/shared/index.ts`

- [ ] Task 3: Implement ConfigService class (AC: #1, #2, #3)
  - [ ] 3.1: Create `src/services/ConfigService.ts`
  - [ ] 3.2: Inject ErrorService dependency via constructor
  - [ ] 3.3: Implement `getConfigPath()` method to locate config.yaml
  - [ ] 3.4: Implement `getConfig(): Promise<ServiceResult<BmadConfig>>` method
  - [ ] 3.5: Parse YAML using `yaml` library
  - [ ] 3.6: Map YAML keys to BmadConfig properties (snake_case → camelCase)
  - [ ] 3.7: Handle file not found error (AC: #2)
  - [ ] 3.8: Handle YAML parse errors with line number reporting (AC: #3)
  - [ ] 3.9: Export ConfigService via `src/services/index.ts`

- [ ] Task 4: Write unit tests (AC: #1, #2, #3)
  - [ ] 4.1: Create `src/services/ConfigService.test.ts`
  - [ ] 4.2: Test successful parsing with valid config.yaml
  - [ ] 4.3: Test CONFIG_NOT_FOUND error when file missing
  - [ ] 4.4: Test CONFIG_PARSE_ERROR with malformed YAML

## Dev Notes

### BmadConfig Interface Definition

```typescript
// src/shared/models.ts
export interface BmadConfig {
  projectName: string;
  userSkillLevel: string;
  planningArtifacts: string;      // Raw path with {project-root}
  implementationArtifacts: string; // Raw path with {project-root}
  projectKnowledge: string;
  userName: string;
  communicationLanguage: string;
  documentOutputLanguage: string;
  outputFolder: string;
}
```

### Config YAML Structure (Expected Input)

```yaml
# _bmad/bmm/config.yaml
project_name: vscode-bmad
user_skill_level: intermediate
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
project_knowledge: "{project-root}/docs"
user_name: Pasquale
communication_language: Italiano
document_output_language: English
output_folder: "{project-root}/_bmad-output"
```

### ConfigService Implementation

```typescript
// src/services/ConfigService.ts
import * as vscode from 'vscode';
import * as yaml from 'yaml';
import { BmadConfig } from '../shared/models';
import { ServiceResult, ErrorCodes, BmadError } from '../shared/errors';
import { ErrorService } from './ErrorService';

export class ConfigService {
  private static readonly CONFIG_PATH = '_bmad/bmm/config.yaml';
  
  constructor(private errorService: ErrorService) {}

  async getConfig(): Promise<ServiceResult<BmadConfig>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return this.createError('CONFIG_NOT_FOUND', 'No workspace folder open');
    }

    const configUri = vscode.Uri.joinPath(workspaceFolder.uri, ConfigService.CONFIG_PATH);
    
    try {
      // Check if file exists
      await vscode.workspace.fs.stat(configUri);
    } catch {
      return this.createError(
        'CONFIG_NOT_FOUND',
        `Config file not found at ${ConfigService.CONFIG_PATH}`,
        'BMAD config.yaml not found. Run "Start New BMAD Project" to initialize.'
      );
    }

    try {
      const content = await vscode.workspace.fs.readFile(configUri);
      const text = Buffer.from(content).toString('utf8');
      const parsed = yaml.parse(text);
      
      const config: BmadConfig = {
        projectName: parsed.project_name ?? '',
        userSkillLevel: parsed.user_skill_level ?? 'intermediate',
        planningArtifacts: parsed.planning_artifacts ?? '',
        implementationArtifacts: parsed.implementation_artifacts ?? '',
        projectKnowledge: parsed.project_knowledge ?? '',
        userName: parsed.user_name ?? '',
        communicationLanguage: parsed.communication_language ?? 'English',
        documentOutputLanguage: parsed.document_output_language ?? 'English',
        outputFolder: parsed.output_folder ?? '',
      };

      return { success: true, data: config };
    } catch (error) {
      const yamlError = error as yaml.YAMLParseError;
      const lineInfo = yamlError.linePos ? ` at line ${yamlError.linePos[0].line}` : '';
      
      return this.createError(
        'CONFIG_PARSE_ERROR',
        `YAML parse error${lineInfo}: ${yamlError.message}`,
        `Invalid YAML in config.yaml${lineInfo}. Please check syntax.`,
        true
      );
    }
  }

  private createError(
    code: string, 
    message: string, 
    userMessage?: string,
    shouldNotify = false
  ): { success: false; error: BmadError } {
    const error: BmadError = {
      code,
      message,
      userMessage: userMessage ?? message,
      recoverable: true,
      shouldNotify,
    };
    this.errorService.handleError(error);
    return { success: false, error };
  }
}
```

### YAML Library Usage Notes

The `yaml` package provides detailed error information:

```typescript
import * as yaml from 'yaml';

try {
  const doc = yaml.parse(content);
} catch (error) {
  const e = error as yaml.YAMLParseError;
  console.log(e.message);   // Error message
  console.log(e.linePos);   // [{ line, col }, { line, col }] for start/end
}
```

### Error Messages (FR6)

Per FR6, error messages must have actionable guidance:

| Error Code | User Message |
|------------|--------------|
| CONFIG_NOT_FOUND | "BMAD config.yaml not found. Run 'Start New BMAD Project' to initialize." |
| CONFIG_PARSE_ERROR | "Invalid YAML in config.yaml at line X. Please check syntax." |

### Cross-Story Dependencies

- **Depends on:** Story 1.1 (Project Setup), Story 1.2 (ErrorService)
- **Required by:** Story 1.4 (Template Variable Resolution), Story 1.5 (Extension Activation)

### Testing Strategy

```typescript
// src/services/ConfigService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from './ConfigService';

// Mock vscode.workspace
vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    fs: {
      stat: vi.fn(),
      readFile: vi.fn(),
    },
  },
  Uri: {
    joinPath: vi.fn((base, path) => ({ fsPath: `${base.fsPath}/${path}` })),
  },
}));

describe('ConfigService', () => {
  it('should parse valid config.yaml', async () => {
    // Setup mock to return valid YAML content
    // Assert BmadConfig is returned with correct values
  });

  it('should return CONFIG_NOT_FOUND when file missing', async () => {
    // Setup mock to throw ENOENT
    // Assert error result with correct code
  });

  it('should return CONFIG_PARSE_ERROR with line number for malformed YAML', async () => {
    // Setup mock to return invalid YAML
    // Assert error includes line number
  });
});
```

### Project Structure Notes

Files to create/modify:
```
src/
├── shared/
│   ├── models.ts      ← NEW
│   ├── errors.ts      ← (from 1.2)
│   └── index.ts       ← UPDATE (add BmadConfig export)
├── services/
│   ├── ConfigService.ts      ← NEW
│   ├── ConfigService.test.ts ← NEW
│   └── index.ts              ← UPDATE (add ConfigService export)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Service-Result-Pattern]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]
- [Source: _bmad/bmm/config.yaml] (example of actual config structure)

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled with created/modified files_
