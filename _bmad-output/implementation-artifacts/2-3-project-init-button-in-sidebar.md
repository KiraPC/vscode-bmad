# Story 2.3: Project Init Button in Sidebar

Status: done

## Story

As a **BMAD newcomer**,
I want **a "Start New BMAD Project" button in the sidebar**,
So that **I can initialize my project with one click**.

## Acceptance Criteria

1. **Given** a workspace without `_bmad/` folder (fresh project state)
   **When** user views the sidebar panel
   **Then** a prominent button "Start New BMAD Project" is visible

2. **Given** user clicks the "Start New BMAD Project" button
   **When** the click event is handled
   **Then** TerminalService executes `npx bmad-method install` (FR1)
   **And** user sees terminal output in real-time (FR5)

3. **Given** the command completes successfully
   **When** `_bmad/` folder is created
   **Then** the sidebar automatically refreshes to show the new project state
   **And** ConfigService is called to load the new config

## Tasks / Subtasks

- [x] Task 1: Create TreeView-based sidebar (AC: #1)
  - [x] 1.1: Create `src/providers/SidebarTreeProvider.ts` implementing TreeDataProvider
  - [x] 1.2: Register view in package.json contributes.views
  - [x] 1.3: Create TreeItem for "Start New BMAD Project" button
  - [x] 1.4: Style with appropriate codicon (e.g., `$(rocket)`)

- [x] Task 2: Implement fresh project detection (AC: #1)
  - [x] 2.1: Add `isBmadProject()` method to ConfigService
  - [x] 2.2: Check for `_bmad/` folder existence
  - [x] 2.3: Show init button only when NOT a BMAD project

- [x] Task 3: Implement button click handler (AC: #2)
  - [x] 3.1: Register command `vscode-bmad.initProject`
  - [x] 3.2: Connect TreeItem to command
  - [x] 3.3: Call TerminalService.executeCommand('npx bmad-method install')
  - [x] 3.4: Show info message on execution start

- [x] Task 4: Implement auto-refresh on folder creation (AC: #3)
  - [x] 4.1: Use FileSystemWatcher to watch for `_bmad/` folder creation
  - [x] 4.2: Trigger sidebar refresh when folder appears
  - [x] 4.3: Call ConfigService.loadConfig() to detect new project
  - [x] 4.4: Update sidebar to show project state

- [x] Task 5: Add integration tests
  - [x] 5.1: Test button appears when no `_bmad/` folder
  - [x] 5.2: Test button hidden when `_bmad/` folder exists
  - [x] 5.3: Test command execution triggers terminal

## Dev Notes

### TreeView Registration (package.json)

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "bmad-explorer",
          "title": "BMAD",
          "icon": "$(beaker)"
        }
      ]
    },
    "views": {
      "bmad-explorer": [
        {
          "id": "bmad-sidebar",
          "name": "BMAD Project"
        }
      ]
    },
    "commands": [
      {
        "command": "vscode-bmad.initProject",
        "title": "Start New BMAD Project",
        "icon": "$(rocket)"
      }
    ]
  }
}
```

### TreeDataProvider Implementation

```typescript
import * as vscode from 'vscode';

export class SidebarTreeProvider implements vscode.TreeDataProvider<SidebarItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SidebarItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private configService: ConfigService,
    private terminalService: TerminalService
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SidebarItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SidebarItem): Promise<SidebarItem[]> {
    if (!element) {
      // Root level
      const isBmad = await this.configService.isBmadProject();
      if (!isBmad) {
        return [new InitProjectItem()];
      }
      // Return other items for existing projects
      return [];
    }
    return [];
  }
}

class InitProjectItem extends vscode.TreeItem {
  constructor() {
    super('Start New BMAD Project', vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: 'vscode-bmad.initProject',
      title: 'Start New BMAD Project'
    };
    this.iconPath = new vscode.ThemeIcon('rocket');
    this.tooltip = 'Initialize a new BMAD project with npx bmad-method install';
  }
}
```

### Folder Watch for Auto-Refresh

```typescript
const watcher = vscode.workspace.createFileSystemWatcher(
  new vscode.RelativePattern(workspaceFolder, '_bmad/**')
);

watcher.onDidCreate(() => {
  sidebarProvider.refresh();
  configService.loadConfig();
});
```

## Requirements Traceability

| Requirement | Coverage |
|-------------|----------|
| FR1 | One-click BMAD project initialization |
| FR5 | Users see project init progress in terminal |
| FR26 | Sidebar panel displays project state |
| FR27 | Fresh project shows initial action buttons |

## Dependencies

- TerminalService (from story 2-2) for command execution
- ConfigService (from story 1-3, 1-4) for project detection
- ErrorService (from story 1-2) for error handling

## Notes

This story provides a simplified TreeView-based sidebar. The full WebView-based sidebar with Svelte will be implemented in Epic 3 (Story 3.3). This TreeView approach allows Epic 2 to be completed independently while still providing core functionality.

## Dev Agent Record

### Implementation Summary
- Created SidebarTreeProvider implementing TreeDataProvider
- InitProjectItem with rocket icon, command link to vscode-bmad.initProject
- ProjectInfoItem displays project name when _bmad/ exists
- FileSystemWatcher for _bmad/** triggers refresh on folder creation
- Commands registered: vscode-bmad.initProject, vscode-bmad.refreshSidebar
- Package.json updated with viewsContainers, views, and commands
- Extension.ts updated to register sidebar on activation
- 13 unit tests covering TreeItems and getChildren logic

### File List
- src/providers/SidebarTreeProvider.ts (created)
- tests/unit/providers/SidebarTreeProvider.test.ts (created)
- src/providers/index.ts (modified - added exports)
- src/extension.ts (modified - register sidebar)
- package.json (modified - added views, viewsContainers, commands)
- vitest.config.ts (created)

### Test Results
All 43 tests pass (vitest):
- ShellService: 14 tests
- TerminalService: 16 tests  
- SidebarTreeProvider: 13 tests
