# Story 1.5: Extension Activation with BMAD Detection

Status: done

## Story

As a **user**,
I want **the extension to automatically detect my BMAD project when I open VS Code**,
So that **I don't need to manually configure anything**.

## Acceptance Criteria

1. **Given** a workspace with `_bmad/bmm/config.yaml` present
   **When** VS Code opens the workspace
   **Then** the extension activates (within <1 second per NFR-P5)
   **And** ConfigService parses the config successfully
   **And** extension logs "BMAD project detected: {projectName}" to output channel

2. **Given** a workspace without BMAD structure
   **When** VS Code opens the workspace
   **Then** extension activates but operates in "fresh/no-project" mode
   **And** no error is shown (graceful handling)

3. **Given** cross-platform file system handling
   **When** extension activates
   **Then** handles case-sensitive (Linux) and case-insensitive (macOS, Windows) file systems (FR41)
   **And** normalizes line endings when parsing YAML (FR42)

4. **Given** activation event configuration
   **When** VS Code starts
   **Then** extension uses `onStartupFinished` activation event for optimal startup performance

## Tasks / Subtasks

- [ ] Task 1: Configure activation event (AC: #4)
  - [ ] 1.1: Update `package.json` activationEvents to use `onStartupFinished`
  - [ ] 1.2: Verify activation doesn't delay VS Code startup

- [ ] Task 2: Implement project detection logic (AC: #1, #2)
  - [ ] 2.1: Create `detectBmadProject()` function in extension.ts
  - [ ] 2.2: Check for `_bmad/bmm/config.yaml` existence
  - [ ] 2.3: Parse config using ConfigService if file exists
  - [ ] 2.4: Log project detection result to OutputChannel
  - [ ] 2.5: Handle fresh project state gracefully

- [ ] Task 3: Create project state management (AC: #1, #2)
  - [ ] 3.1: Create `ProjectState` type ('detected' | 'fresh' | 'error')
  - [ ] 3.2: Store current state in module scope
  - [ ] 3.3: Create `getProjectState()` function for other components

- [ ] Task 4: Handle cross-platform considerations (AC: #3)
  - [ ] 4.1: Ensure config path uses forward slashes (VS Code handles conversion)
  - [ ] 4.2: Handle CRLF/LF line endings in YAML parsing
  - [ ] 4.3: Test on case-sensitive path detection

- [ ] Task 5: Performance verification (AC: #1)
  - [ ] 5.1: Add timing logs to measure activation time
  - [ ] 5.2: Verify activation completes < 1 second (NFR-P5)
  - [ ] 5.3: Profile if needed to optimize

- [ ] Task 6: Integration testing (AC: #1, #2)
  - [ ] 6.1: Create integration test with sample BMAD project
  - [ ] 6.2: Test fresh workspace detection
  - [ ] 6.3: Test project detection with valid config
  - [ ] 6.4: Test malformed config handling

## Dev Notes

### Activation Event Configuration

```json
// package.json (update activationEvents)
{
  "activationEvents": [
    "onStartupFinished"
  ]
}
```

`onStartupFinished` ensures:
- Extension activates after VS Code UI is ready
- Doesn't block VS Code startup
- All workspace APIs are available

### Project State Types

```typescript
// src/shared/models.ts (add to file)
export type ProjectState = 
  | { status: 'detected'; config: ResolvedBmadConfig }
  | { status: 'fresh' }
  | { status: 'error'; error: BmadError };
```

### Updated Extension.ts

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { ErrorService } from './services/ErrorService';
import { ConfigService } from './services/ConfigService';
import { ProjectState, ResolvedBmadConfig } from './shared/models';

let errorService: ErrorService;
let configService: ConfigService;
let projectState: ProjectState = { status: 'fresh' };

export async function activate(context: vscode.ExtensionContext) {
  const startTime = Date.now();
  
  // Initialize core services
  errorService = new ErrorService();
  configService = new ConfigService(errorService);
  
  // Detect BMAD project
  projectState = await detectBmadProject();
  
  // Log result
  if (projectState.status === 'detected') {
    errorService.log(`BMAD project detected: ${projectState.config.projectName}`);
  } else if (projectState.status === 'fresh') {
    errorService.log('No BMAD project detected - operating in fresh project mode');
  } else {
    errorService.log(`BMAD detection error: ${projectState.error.code}`);
  }
  
  // Performance logging (NFR-P5)
  const activationTime = Date.now() - startTime;
  errorService.log(`Extension activated in ${activationTime}ms`);
  
  if (activationTime > 1000) {
    console.warn(`BMAD Extension activation exceeded 1 second: ${activationTime}ms`);
  }

  // Register services for cleanup
  context.subscriptions.push({
    dispose: () => {
      errorService.dispose();
    }
  });
}

async function detectBmadProject(): Promise<ProjectState> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  
  if (!workspaceFolder) {
    return { status: 'fresh' };
  }

  const configResult = await configService.getResolvedConfig();
  
  if (configResult.success) {
    return { status: 'detected', config: configResult.data };
  }
  
  // CONFIG_NOT_FOUND is expected for fresh projects
  if (configResult.error.code === 'CONFIG_NOT_FOUND') {
    return { status: 'fresh' };
  }
  
  // Other errors (parse errors) should be reported
  return { status: 'error', error: configResult.error };
}

export function getProjectState(): ProjectState {
  return projectState;
}

export function getConfigService(): ConfigService {
  return configService;
}

export function getErrorService(): ErrorService {
  return errorService;
}

export function deactivate() {
  // Cleanup handled by context.subscriptions
}
```

### Line Ending Normalization (FR42)

The `yaml` parser automatically handles CRLF/LF differences. If issues arise:

```typescript
// In ConfigService.getConfig()
const text = Buffer.from(content).toString('utf8');
// Normalize line endings before parsing
const normalizedText = text.replace(/\r\n/g, '\n');
const parsed = yaml.parse(normalizedText);
```

### Case-Sensitivity Handling (FR41)

VS Code's `workspace.fs.stat()` handles case-sensitivity based on the underlying file system:
- **Linux**: Case-sensitive - `Config.yaml` ≠ `config.yaml`
- **macOS**: Case-insensitive - `Config.yaml` = `config.yaml`
- **Windows**: Case-insensitive

Our code uses exact path `_bmad/bmm/config.yaml`, relying on VS Code's file system abstraction.

### Performance Budget (NFR-P5)

| Phase | Budget |
|-------|--------|
| Service initialization | < 50ms |
| Config file detection | < 100ms |
| Config parsing | < 200ms |
| **Total** | **< 1000ms** |

### Integration Test Setup

```typescript
// tests/integration/extension.test.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { activate, getProjectState } from '../../src/extension';

describe('Extension Activation', () => {
  const fixturesPath = path.join(__dirname, 'fixtures');

  it('should detect BMAD project with valid config', async () => {
    // Open workspace with fixtures/bmad-project
    const workspaceUri = vscode.Uri.file(path.join(fixturesPath, 'bmad-project'));
    await vscode.commands.executeCommand('vscode.openFolder', workspaceUri);
    
    // Allow activation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state = getProjectState();
    expect(state.status).toBe('detected');
    if (state.status === 'detected') {
      expect(state.config.projectName).toBe('test-project');
    }
  });

  it('should handle fresh workspace gracefully', async () => {
    // Open workspace without BMAD structure
    const workspaceUri = vscode.Uri.file(path.join(fixturesPath, 'empty-project'));
    await vscode.commands.executeCommand('vscode.openFolder', workspaceUri);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state = getProjectState();
    expect(state.status).toBe('fresh');
  });
});
```

### Test Fixtures

Create fixture directories in `tests/integration/fixtures/`:

```
tests/integration/fixtures/
├── bmad-project/
│   └── _bmad/
│       └── bmm/
│           └── config.yaml
└── empty-project/
    └── .gitkeep
```

**fixtures/bmad-project/_bmad/bmm/config.yaml:**
```yaml
project_name: test-project
user_skill_level: intermediate
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
project_knowledge: "{project-root}/docs"
user_name: TestUser
communication_language: English
document_output_language: English
output_folder: "{project-root}/_bmad-output"
```

### Cross-Story Dependencies

- **Depends on:** Story 1.2 (ErrorService), Story 1.3 (ConfigService Basic), Story 1.4 (Template Resolution)
- **Required by:** Epic 2 (Project Init button visibility), Epic 3 (Sidebar state), Epic 4 (File Watching init)

### Project Structure Notes

Files to create/modify:
```
src/
├── extension.ts              ← UPDATE (full activation logic)
├── shared/
│   └── models.ts             ← UPDATE (add ProjectState type)
tests/
└── integration/
    ├── extension.test.ts     ← NEW
    └── fixtures/
        ├── bmad-project/     ← NEW
        │   └── _bmad/bmm/config.yaml
        └── empty-project/    ← NEW
            └── .gitkeep
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Extension-Architecture-Pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management-Strategy]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.5]
- NFR-P5: Extension activation time < 1 second
- FR41: Case-sensitive/insensitive filesystem handling
- FR42: Line ending normalization

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled with created/modified files_
