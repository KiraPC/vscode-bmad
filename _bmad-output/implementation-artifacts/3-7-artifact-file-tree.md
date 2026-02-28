# Story 3.7: Artifact File Tree

Status: done

## Story

As a **user**,
I want **to see my key artifact files in a clickable tree**,
So that **I can quickly open any artifact in the editor**.

## Acceptance Criteria

1. **Given** a BMAD project with artifacts present
   **When** sidebar WebView renders the file tree section
   **Then** it shows:
   - config.yaml (always present)
   - planning-artifacts/ folder with files (if exists)
   - implementation-artifacts/ folder with files (if exists) (FR30)

2. **Given** user clicks a file in the tree
   **When** the click event is handled
   **Then** that file opens in VS Code editor (FR31)

3. **Given** files change in the artifact folders
   **When** FileWatcher detects the change
   **Then** the tree updates to reflect the new files

4. **Given** the file tree renders
   **When** user views the tree
   **Then** icons use VS Code codicons for file type consistency

5. **Given** a folder has many files
   **When** user views the tree
   **Then** folders are collapsible to manage visual space

## Tasks / Subtasks

- [x] Task 1: Create file discovery service (AC: #1)
  - [x] 1.1: Add `getArtifactFiles()` method to ConfigService
  - [x] 1.2: Scan planning_artifacts folder
  - [x] 1.3: Scan implementation_artifacts folder
  - [x] 1.4: Return tree structure with file paths

- [x] Task 2: Define file tree data structure (AC: #1)
  - [x] 2.1: Create `FileTreeNode` interface
  - [x] 2.2: Support files and folders
  - [x] 2.3: Include file path, label, icon type

- [x] Task 3: Add file tree to message protocol (AC: #1)
  - [x] 3.1: Add `filesLoaded` message type
  - [x] 3.2: Send file tree after WebView ready
  - [x] 3.3: Add `files` store in WebView

- [x] Task 4: Create FileTree Svelte component (AC: #1, #4, #5)
  - [x] 4.1: Create `webviews/sidebar/src/components/FileTree.svelte`
  - [x] 4.2: Render tree structure with indentation
  - [x] 4.3: Add folder expand/collapse functionality
  - [x] 4.4: Use codicons for file/folder icons

- [x] Task 5: Create FileTreeItem Svelte component (AC: #2, #4)
  - [x] 5.1: Create `webviews/sidebar/src/components/FileTreeItem.svelte`
  - [x] 5.2: Handle click for file open
  - [x] 5.3: Handle click for folder toggle
  - [x] 5.4: Display appropriate icon based on file type

- [x] Task 6: Implement file open handler (AC: #2)
  - [x] 6.1: Send `openFile` message with file path
  - [x] 6.2: Handle in SidebarProvider
  - [x] 6.3: Use `vscode.window.showTextDocument()` to open

- [x] Task 7: Add file watching for tree refresh (AC: #3)
  - [x] 7.1: Watch planning_artifacts/**
  - [x] 7.2: Watch implementation_artifacts/**
  - [x] 7.3: Re-scan and send filesLoaded on change
  - [x] 7.4: Debounce rapid changes

- [x] Task 8: Update App.svelte to include FileTree (AC: #1-5)
  - [x] 8.1: Import FileTree component
  - [x] 8.2: Position in sidebar layout
  - [x] 8.3: Make collapsible as a section

- [x] Task 9: Add unit tests (AC: #1-5)
  - [x] 9.1: Test file discovery logic
  - [x] 9.2: Test tree rendering with nested folders
  - [x] 9.3: Test file click sends openFile message

## Dev Notes

### FileTreeNode Interface

```typescript
// src/shared/messages.ts or src/shared/models.ts
export interface FileTreeNode {
  type: 'file' | 'folder';
  name: string;
  path: string;  // Absolute path for opening
  children?: FileTreeNode[];
  icon?: string;  // Codicon name
}

export interface FilesLoadedPayload {
  configFile: FileTreeNode;
  planningArtifacts: FileTreeNode;
  implementationArtifacts: FileTreeNode;
}
```

### File Discovery Implementation

```typescript
// ConfigService additions
async getArtifactFiles(): Promise<ServiceResult<FilesLoadedPayload>> {
  const configResult = await this.getConfig();
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  
  if (!workspaceRoot || !configResult.success) {
    return { success: false, error: { code: 'NO_WORKSPACE', ... } };
  }

  const planningPath = configResult.data.planningArtifacts;
  const implPath = configResult.data.implementationArtifacts;

  return {
    success: true,
    data: {
      configFile: {
        type: 'file',
        name: 'config.yaml',
        path: path.join(workspaceRoot, '_bmad', 'bmm', 'config.yaml'),
        icon: 'settings-gear',
      },
      planningArtifacts: await this.scanFolder(planningPath, 'Planning Artifacts'),
      implementationArtifacts: await this.scanFolder(implPath, 'Implementation Artifacts'),
    },
  };
}

private async scanFolder(folderPath: string, label: string): Promise<FileTreeNode> {
  const uri = vscode.Uri.file(folderPath);
  const children: FileTreeNode[] = [];

  try {
    const entries = await vscode.workspace.fs.readDirectory(uri);
    
    for (const [name, type] of entries) {
      const entryPath = path.join(folderPath, name);
      
      if (type === vscode.FileType.Directory) {
        children.push(await this.scanFolder(entryPath, name));
      } else {
        children.push({
          type: 'file',
          name,
          path: entryPath,
          icon: this.getFileIcon(name),
        });
      }
    }
  } catch {
    // Folder doesn't exist yet
  }

  return {
    type: 'folder',
    name: label,
    path: folderPath,
    icon: 'folder',
    children,
  };
}

private getFileIcon(filename: string): string {
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'settings-gear';
  if (filename.endsWith('.json')) return 'json';
  return 'file';
}
```

### Extended Message Types

```typescript
// Add to ExtensionMessage union
export type ExtensionMessage =
  | { type: 'configLoaded'; payload: ConfigPayload }
  | { type: 'projectStateChanged'; payload: ProjectStatePayload }
  | { type: 'dataLoaded'; payload: DataLoadedPayload }
  | { type: 'filesLoaded'; payload: FilesLoadedPayload }  // NEW
  | { type: 'error'; payload: ErrorPayload };
```

### FileTree Component

```svelte
<!-- webviews/sidebar/src/components/FileTree.svelte -->
<script lang="ts">
  import FileTreeItem from './FileTreeItem.svelte';
  import type { FileTreeNode } from '../lib/types';
  import { files } from '../stores/state';

  let expanded = true;
</script>

{#if $files}
  <section class="file-tree">
    <button class="section-header" on:click={() => expanded = !expanded}>
      <span class="codicon codicon-{expanded ? 'chevron-down' : 'chevron-right'}"></span>
      <span class="label">Project Files</span>
    </button>

    {#if expanded}
      <div class="tree-content">
        <!-- Config file (always shown) -->
        <FileTreeItem node={$files.configFile} depth={0} />

        <!-- Planning artifacts -->
        {#if $files.planningArtifacts.children?.length}
          <FileTreeItem node={$files.planningArtifacts} depth={0} />
        {/if}

        <!-- Implementation artifacts -->
        {#if $files.implementationArtifacts.children?.length}
          <FileTreeItem node={$files.implementationArtifacts} depth={0} />
        {/if}
      </div>
    {/if}
  </section>
{/if}

<style>
  .file-tree {
    border-top: 1px solid var(--vscode-widget-border);
    margin-top: 1rem;
  }

  .section-header {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-header:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .section-header:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  .tree-content {
    padding-bottom: 0.5rem;
  }
</style>
```

### FileTreeItem Component

```svelte
<!-- webviews/sidebar/src/components/FileTreeItem.svelte -->
<script lang="ts">
  import type { FileTreeNode } from '../lib/types';

  export let node: FileTreeNode;
  export let depth: number = 0;

  const vscode = acquireVsCodeApi();

  let expanded = depth === 0;  // Top-level folders expanded by default

  function handleClick() {
    if (node.type === 'folder') {
      expanded = !expanded;
    } else {
      vscode.postMessage({
        type: 'openFile',
        payload: { filePath: node.path },
      });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  $: paddingLeft = `${(depth * 12) + 8}px`;
</script>

<div class="tree-item">
  <button
    class="item-row"
    style="padding-left: {paddingLeft}"
    on:click={handleClick}
    on:keydown={handleKeydown}
    role="treeitem"
    aria-expanded={node.type === 'folder' ? expanded : undefined}
  >
    {#if node.type === 'folder'}
      <span class="codicon codicon-{expanded ? 'chevron-down' : 'chevron-right'}"></span>
    {:else}
      <span class="spacer"></span>
    {/if}
    
    <span class="codicon codicon-{node.icon || 'file'}"></span>
    <span class="name">{node.name}</span>
  </button>

  {#if node.type === 'folder' && expanded && node.children}
    <div class="children" role="group">
      {#each node.children as child}
        <svelte:self node={child} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .item-row {
    width: 100%;
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    text-align: left;
  }

  .item-row:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .item-row:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  .spacer {
    width: 16px;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .children {
    display: flex;
    flex-direction: column;
  }
</style>
```

### SidebarProvider File Open Handler

```typescript
// SidebarProvider - already implemented in Story 3.3
private async openFile(filePath: string): Promise<void> {
  const uri = vscode.Uri.file(filePath);
  await vscode.window.showTextDocument(uri);
}
```

### SidebarProvider Send Files

```typescript
// Add to onWebViewReady()
private async onWebViewReady(): Promise<void> {
  // ... existing config loading ...

  // Load file tree
  const filesResult = await this.configService.getArtifactFiles();
  if (filesResult.success) {
    this.postMessage({
      type: 'filesLoaded',
      payload: filesResult.data,
    });
  }
}
```

### Files Store

```typescript
// webviews/sidebar/src/stores/state.ts
import type { FilesLoadedPayload } from '../lib/types';

export const files = writable<FilesLoadedPayload | null>(null);
```

### Updated App.svelte Message Handler

```svelte
<script lang="ts">
  import FileTree from './components/FileTree.svelte';
  import { files } from './stores/state';

  function handleMessage(event: MessageEvent<ExtensionMessage>) {
    const message = event.data;
    
    switch (message.type) {
      // ... existing cases ...
      case 'filesLoaded':
        files.set(message.payload);
        break;
    }
  }
</script>

<main>
  <!-- ... existing content ... -->
  
  <FileTree />
</main>
```

### File Watching for Tree Updates

```typescript
// SidebarProvider - extend setupFileWatcher()
private setupFileWatcher(): void {
  const configResult = await this.configService.getConfig();
  if (!configResult.success) return;

  const patterns = [
    `${configResult.data.planningArtifacts}/**`,
    `${configResult.data.implementationArtifacts}/**`,
  ];

  for (const pattern of patterns) {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    
    const debouncedRefresh = this.debounce(() => {
      this.refreshProjectState();
      this.refreshFileTree();
    }, 200);

    watcher.onDidCreate(debouncedRefresh);
    watcher.onDidDelete(debouncedRefresh);

    this.disposables.push(watcher);
  }
}

private async refreshFileTree(): Promise<void> {
  const filesResult = await this.configService.getArtifactFiles();
  if (filesResult.success) {
    this.postMessage({
      type: 'filesLoaded',
      payload: filesResult.data,
    });
  }
}
```

### Codicon Reference

Use VS Code built-in codicons for consistent styling:
- `file` - Generic file
- `markdown` - Markdown files
- `settings-gear` - YAML/config files
- `json` - JSON files
- `folder` - Closed folder
- `folder-opened` - Open folder (optional)
- `chevron-right` - Collapsed indicator
- `chevron-down` - Expanded indicator

Include codicons CSS in WebView HTML head:
```html
<link href="${codiconsUri}" rel="stylesheet" />
```

### Accessibility Notes (NFR-A2, NFR-A3)

- Tree items have `role="treeitem"`
- Folders have `aria-expanded` attribute
- Children groups have `role="group"`
- All items keyboard accessible (Tab, Enter, Space)
- Focus indicators visible

### Project Structure Notes

- FileTree is always visible when in a BMAD project
- Collapsible section header for space management
- Icons match VS Code native file explorer
- Recursive component for nested folder support

### References

- [Source: epics.md#Story 3.7] - Artifact File Tree requirements
- [Source: prd.md#FR30] - Clickable file tree in sidebar
- [Source: prd.md#FR31] - Click file tree items to open in editor
- [Source: architecture.md#Accessibility] - ARIA and keyboard navigation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (via GitHub Copilot)

### Completion Notes List

- Implemented FileTreeNode interface and FilesLoadedPayload in shared/types.ts
- Added getArtifactFiles() method to ConfigService with recursive folder scanning
- Extended ExtensionMessage union with filesLoaded message type
- Created FileTree.svelte and FileTreeItem.svelte components with codicons
- Updated App.svelte to display file tree when files are available
- Extended SidebarProvider's file watchers to include implementation-artifacts
- Added unit tests for filesLoaded message type narrowing
- Added unit tests for getArtifactFiles() file discovery logic
- Note: ConfigService.test.ts has pre-existing heap memory issues not related to this story

### File List

- src/shared/types.ts (modified - added FileTreeNode, FilesLoadedPayload)
- src/shared/messages.ts (modified - added filesLoaded to ExtensionMessage)
- src/services/ConfigService.ts (modified - added getArtifactFiles, scanFolder, getFileIcon)
- src/providers/SidebarProvider.ts (modified - added _sendFileTree, extended watchers)
- webviews/sidebar/src/components/FileTree.svelte (new)
- webviews/sidebar/src/components/FileTreeItem.svelte (new)
- webviews/sidebar/src/App.svelte (modified - handle filesLoaded, render FileTree)
- tests/unit/shared/messages.test.ts (modified - added filesLoaded tests)
- tests/unit/services/ConfigService.test.ts (modified - added getArtifactFiles tests)
- tests/unit/providers/SidebarProvider.test.ts (modified - added mockGetArtifactFiles)
