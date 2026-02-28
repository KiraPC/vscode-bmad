# Story 1.4: ConfigService - Template Variable Resolution

Status: done

## Story

As a **user**,
I want **the extension to resolve `{project-root}` in config paths**,
So that **artifact paths work correctly regardless of my workspace location**.

## Acceptance Criteria

1. **Given** config.yaml contains `planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"`
   **And** workspace root is `/Users/dev/my-project`
   **When** ConfigService resolves the path
   **Then** the result is `/Users/dev/my-project/_bmad-output/planning-artifacts`

2. **Given** a path without `{project-root}` variables
   **When** ConfigService resolves the path
   **Then** it returns the path unchanged

3. **Given** cross-platform path resolution is needed
   **When** ConfigService resolves paths
   **Then** path resolution uses VS Code's `Uri.fsPath` and `path.join()` for cross-platform compatibility (FR40)

## Tasks / Subtasks

- [ ] Task 1: Create path resolver utility (AC: #1, #2, #3)
  - [ ] 1.1: Create `src/utils/path-resolver.ts`
  - [ ] 1.2: Implement `resolveProjectRoot(path: string, workspaceRoot: string): string`
  - [ ] 1.3: Handle `{project-root}` variable replacement
  - [ ] 1.4: Use VS Code Uri API for cross-platform safety
  - [ ] 1.5: Export via `src/utils/index.ts`

- [ ] Task 2: Add resolution method to ConfigService (AC: #1, #2)
  - [ ] 2.1: Add `resolvePath(templatePath: string): string` method to ConfigService
  - [ ] 2.2: Call resolveProjectRoot utility internally
  - [ ] 2.3: Handle edge cases (empty path, undefined)

- [ ] Task 3: Add getResolvedConfig method (AC: #1)
  - [ ] 3.1: Implement `getResolvedConfig(): Promise<ServiceResult<ResolvedBmadConfig>>`
  - [ ] 3.2: Create `ResolvedBmadConfig` type with absolute paths
  - [ ] 3.3: Resolve all path fields before returning

- [ ] Task 4: Write unit tests (AC: #1, #2, #3)
  - [ ] 4.1: Create `src/utils/path-resolver.test.ts`
  - [ ] 4.2: Test {project-root} replacement
  - [ ] 4.3: Test path without variables returns unchanged
  - [ ] 4.4: Test Windows-style paths (backslashes)
  - [ ] 4.5: Test Unix-style paths (forward slashes)
  - [ ] 4.6: Add ConfigService integration tests for resolved paths

## Dev Notes

### Path Resolver Utility

```typescript
// src/utils/path-resolver.ts
import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Resolves {project-root} template variable in paths
 * @param templatePath - Path that may contain {project-root}
 * @param workspaceRoot - Absolute path to workspace root
 * @returns Absolute resolved path
 */
export function resolveProjectRoot(templatePath: string, workspaceRoot: string): string {
  if (!templatePath) {
    return templatePath;
  }
  
  // Replace {project-root} with workspace root
  const resolved = templatePath.replace(/\{project-root\}/g, workspaceRoot);
  
  // Normalize path separators for current OS
  return path.normalize(resolved);
}

/**
 * Gets workspace root path using VS Code API
 * @returns Workspace root path or undefined if no workspace
 */
export function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].uri.fsPath;
}
```

### ResolvedBmadConfig Type

```typescript
// src/shared/models.ts (add to existing file)

// Raw config with template variables
export interface BmadConfig {
  projectName: string;
  userSkillLevel: string;
  planningArtifacts: string;      // May contain {project-root}
  implementationArtifacts: string;
  projectKnowledge: string;
  userName: string;
  communicationLanguage: string;
  documentOutputLanguage: string;
  outputFolder: string;
}

// Resolved config with absolute paths
export interface ResolvedBmadConfig extends Omit<BmadConfig, 
  'planningArtifacts' | 'implementationArtifacts' | 'projectKnowledge' | 'outputFolder'> {
  planningArtifacts: string;       // Absolute path
  implementationArtifacts: string; // Absolute path
  projectKnowledge: string;        // Absolute path
  outputFolder: string;            // Absolute path
  workspaceRoot: string;           // Resolved workspace root
}
```

### ConfigService Updates

```typescript
// src/services/ConfigService.ts (add to existing class)

import { resolveProjectRoot, getWorkspaceRoot } from '../utils/path-resolver';
import { ResolvedBmadConfig } from '../shared/models';

export class ConfigService {
  // ... existing code ...

  /**
   * Get config with all paths resolved to absolute paths
   */
  async getResolvedConfig(): Promise<ServiceResult<ResolvedBmadConfig>> {
    const configResult = await this.getConfig();
    if (!configResult.success) {
      return configResult;
    }

    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      return this.createError(
        'NO_WORKSPACE',
        'No workspace folder open',
        'Please open a folder to use BMAD Extension.'
      );
    }

    const config = configResult.data;
    const resolved: ResolvedBmadConfig = {
      ...config,
      workspaceRoot,
      planningArtifacts: resolveProjectRoot(config.planningArtifacts, workspaceRoot),
      implementationArtifacts: resolveProjectRoot(config.implementationArtifacts, workspaceRoot),
      projectKnowledge: resolveProjectRoot(config.projectKnowledge, workspaceRoot),
      outputFolder: resolveProjectRoot(config.outputFolder, workspaceRoot),
    };

    return { success: true, data: resolved };
  }

  /**
   * Resolve a single path with template variables
   */
  resolvePath(templatePath: string): string {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      return templatePath;
    }
    return resolveProjectRoot(templatePath, workspaceRoot);
  }
}
```

### Cross-Platform Considerations (FR40)

| Platform | Path Separator | Example |
|----------|---------------|---------|
| macOS/Linux | `/` | `/Users/dev/project/_bmad-output` |
| Windows | `\` | `C:\Users\dev\project\_bmad-output` |

The `path.normalize()` function handles this automatically:
- On Windows: `path.normalize('/Users/dev')` → `\Users\dev`
- On macOS/Linux: `path.normalize('C:\\Users\\dev')` → `C:/Users/dev`

VS Code's `Uri.fsPath` returns platform-appropriate separator.

### Testing Strategy

```typescript
// src/utils/path-resolver.test.ts
import { describe, it, expect } from 'vitest';
import { resolveProjectRoot } from './path-resolver';

describe('resolveProjectRoot', () => {
  it('should replace {project-root} with workspace path', () => {
    const result = resolveProjectRoot(
      '{project-root}/_bmad-output/planning-artifacts',
      '/Users/dev/my-project'
    );
    expect(result).toBe('/Users/dev/my-project/_bmad-output/planning-artifacts');
  });

  it('should handle multiple {project-root} occurrences', () => {
    const result = resolveProjectRoot(
      '{project-root}/a/{project-root}/b',
      '/workspace'
    );
    expect(result).toBe('/workspace/a/workspace/b');
  });

  it('should return path unchanged if no template variable', () => {
    const result = resolveProjectRoot('/absolute/path', '/workspace');
    expect(result).toBe('/absolute/path');
  });

  it('should handle empty path', () => {
    const result = resolveProjectRoot('', '/workspace');
    expect(result).toBe('');
  });

  it('should handle Windows-style workspace root', () => {
    const result = resolveProjectRoot(
      '{project-root}/_bmad-output',
      'C:\\Users\\dev\\project'
    );
    // path.normalize will handle separator conversion
    expect(result).toContain('_bmad-output');
  });
});
```

### Cross-Story Dependencies

- **Depends on:** Story 1.3 (ConfigService Basic Parsing)
- **Required by:** Story 1.5 (Extension Activation), Epic 3 (Sidebar), Epic 4 (File Parsing)

### Project Structure Notes

Files to create/modify:
```
src/
├── utils/
│   ├── path-resolver.ts      ← NEW
│   ├── path-resolver.test.ts ← NEW
│   └── index.ts              ← UPDATE
├── shared/
│   └── models.ts             ← UPDATE (add ResolvedBmadConfig)
└── services/
    ├── ConfigService.ts      ← UPDATE (add resolution methods)
    └── ConfigService.test.ts ← UPDATE (add resolution tests)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Platform-Compatibility]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4]
- FR40: Cross-platform path resolution

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled with created/modified files_
