# Story 5.1: KanbanProvider Base Implementation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to open a Kanban board as an editor tab**,
So that **I have a dedicated visual space for story management**.

## Acceptance Criteria

1. **Given** the command `bmad.openKanban` exists
   **When** user executes the command (via button or command palette)
   **Then** a WebView panel opens in the editor area (not sidebar) (FR7)
   **And** panel has title "BMAD Kanban"
   **And** panel uses Svelte components

2. **Given** Kanban panel is already open
   **When** user executes `bmad.openKanban` again
   **Then** existing panel is focused (not duplicated)

3. **Given** the WebView panel is created
   **When** VS Code window is reloaded
   **Then** panel state serializes for workspace reload (NFR-R6)

4. **Given** the WebView panel is open
   **When** panel receives PostMessage from extension
   **Then** messages are properly typed and routed

5. **Given** the WebView panel is disposed
   **When** user reopens it
   **Then** previous state is restored from `context.workspaceState`

## Tasks / Subtasks

- [x] Task 1: Create KanbanProvider class (AC: #1, #4)
  - [x] 1.1: Create `src/providers/KanbanProvider.ts` with class implementing panel management
  - [x] 1.2: Add static `viewType` constant set to `'bmad-kanban'`
  - [x] 1.3: Add private `_panel?: vscode.WebviewPanel` for panel reference tracking
  - [x] 1.4: Implement constructor accepting `extensionUri`, `configService`, `errorService`
  - [x] 1.5: Add `_disposables: vscode.Disposable[]` array for cleanup

- [x] Task 2: Implement `createOrShow()` method (AC: #1, #2)
  - [x] 2.1: Check if `_panel` already exists → if so, `reveal()` and return early
  - [x] 2.2: Create new `WebviewPanel` with `createWebviewPanel()` in editor area (`ViewColumn.One`)
  - [x] 2.3: Set panel title to `"BMAD Kanban"`
  - [x] 2.4: Configure `webview.options` with `enableScripts: true` and `localResourceRoots`
  - [x] 2.5: Set `retainContextWhenHidden: true` for state persistence

- [x] Task 3: Generate WebView HTML content (AC: #1)
  - [x] 3.1: Implement `_getHtmlContent(webview: vscode.Webview): string` method
  - [x] 3.2: Build URIs for `dist/webviews/kanban/index.js` and `index.css`
  - [x] 3.3: Generate CSP with `${webview.cspSource}` for script-src and style-src (NFR-S1)
  - [x] 3.4: Return HTML template with VS Code theme variables

- [x] Task 4: Set up PostMessage communication (AC: #4)
  - [x] 4.1: Add `onDidReceiveMessage` handler for WebViewMessage
  - [x] 4.2: Implement typed message switch/case routing
  - [x] 4.3: Handle `'ready'` message to send initial data
  - [x] 4.4: Implement `postMessage(message: ExtensionMessage)` method

- [x] Task 5: Implement state serialization (AC: #3, #5)
  - [x] 5.1: Handle `onDidChangeViewState` for active/inactive tracking
  - [x] 5.2: Store view state in `context.workspaceState` key `'bmad.kanban.state'`
  - [x] 5.3: Restore state from `workspaceState` on panel recreation
  - [x] 5.4: Handle `onDidDispose` to clean up `_panel` reference and disposables

- [x] Task 6: Register command and export (AC: #1, #2)
  - [x] 6.1: Add `bmad.openKanban` command to `package.json` contributes.commands
  - [x] 6.2: Register command handler in `extension.ts` calling `KanbanProvider.createOrShow()`
  - [x] 6.3: Export `KanbanProvider` from `src/providers/index.ts`
  - [x] 6.4: Add keybinding (optional): `Ctrl+Shift+K` / `Cmd+Shift+K`

- [x] Task 7: Testing and verification (AC: all)
  - [x] 7.1: Create `tests/unit/providers/KanbanProvider.test.ts` with unit tests
  - [x] 7.2: Test panel creation and reveal behavior
  - [x] 7.3: Test PostMessage type routing
  - [x] 7.4: Verify panel opens in Extension Development Host
  - [x] 7.5: Verify theme colors apply correctly from VS Code

## Dev Notes

### Architecture Compliance

**Decision: Hybrid Provider + Services Pattern**
- KanbanProvider manages WebView lifecycle
- Data fetching delegated to ParserService (Epic 4)
- Error handling via ErrorService dependency injection
- Follow SidebarProvider as implementation reference

**Decision: Extension Host as Single Source of Truth**
- KanbanProvider fetches data from services, sends to WebView
- WebView receives data via PostMessage, stores in Svelte stores
- User actions in WebView → PostMessage → Provider handles → Service updates

### Code Patterns to Follow

**Named Exports Only:**
```typescript
// ✅ Correct
export class KanbanProvider { }

// ❌ Wrong
export default class KanbanProvider { }
```

**PostMessage Format:**
```typescript
// ✅ Correct - nested payload
{ type: 'dataLoaded', payload: { epics: [], stories: [] } }

// ❌ Wrong - flat structure
{ type: 'dataLoaded', epics: [], stories: [] }
```

**Loading State:**
```typescript
// ✅ Correct - enum
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ❌ Wrong - boolean
let isLoading = true;
```

**ServiceResult Pattern:**
```typescript
// ✅ Correct - return result
return { success: false, error: bmadError };

// ❌ Wrong - throw
throw new Error('Failed');
```

### KanbanProvider Implementation Pattern

Reference implementation structure based on SidebarProvider:

```typescript
import * as vscode from 'vscode';
import type { ExtensionMessage, WebViewMessage } from '../shared/messages';
import type { ConfigService } from '../services/ConfigService';
import type { ErrorService } from '../services/ErrorService';

export class KanbanProvider {
    public static readonly viewType = 'bmad-kanban';
    
    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _configService: ConfigService,
        private readonly _errorService: ErrorService,
        private readonly _context: vscode.ExtensionContext
    ) {}

    public createOrShow(viewColumn?: vscode.ViewColumn): void {
        // Check for existing panel
        if (this._panel) {
            this._panel.reveal(viewColumn);
            return;
        }
        
        // Create new panel in editor area
        this._panel = vscode.window.createWebviewPanel(
            KanbanProvider.viewType,
            'BMAD Kanban',
            viewColumn || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'kanban'),
                    vscode.Uri.joinPath(this._extensionUri, 'media'),
                ],
            }
        );
        
        // Set HTML content
        this._panel.webview.html = this._getHtmlContent(this._panel.webview);
        
        // Handle messages
        this._disposables.push(
            this._panel.webview.onDidReceiveMessage(
                (msg: WebViewMessage) => this._handleMessage(msg)
            )
        );
        
        // Handle dispose
        this._panel.onDidDispose(() => this._dispose());
    }

    private _getHtmlContent(webview: vscode.Webview): string {
        // Build URIs for assets
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'kanban', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'kanban', 'index.css')
        );
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   style-src ${webview.cspSource} 'unsafe-inline'; 
                   script-src ${webview.cspSource};">
    <link rel="stylesheet" href="${styleUri}">
    <title>BMAD Kanban</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private _handleMessage(message: WebViewMessage): void {
        switch (message.type) {
            case 'ready':
                this._onWebViewReady();
                break;
            case 'openFile':
                this._openFile(message.payload.filePath);
                break;
            case 'executeCommand':
                vscode.commands.executeCommand(
                    message.payload.command,
                    ...(message.payload.args ?? [])
                );
                break;
            default:
                this._errorService.warn(`Unknown message type: ${(message as { type: string }).type}`);
        }
    }

    private async _onWebViewReady(): Promise<void> {
        this._errorService.info('Kanban WebView ready');
        // TODO: Epic 4 - Send epics and stories data
    }

    public postMessage(message: ExtensionMessage): void {
        this._panel?.webview.postMessage(message);
    }

    private _dispose(): void {
        this._panel = undefined;
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}
```

### Project Structure After This Story

```
src/providers/
├── index.ts                  # Updated with KanbanProvider export
├── KanbanProvider.ts         # NEW - Kanban WebView panel management
├── KanbanProvider.test.ts    # NEW - Unit tests
├── SidebarProvider.ts        # Existing reference
└── SidebarTreeProvider.ts    # Legacy

webviews/kanban/src/
├── App.svelte                # Already exists from Story 3.1
├── main.ts                   # Already exists
├── components/               # Empty (future stories)
├── stores/                   # Empty (future stories)
└── lib/types.ts              # Already exists
```

### package.json Command Registration

```json
{
  "contributes": {
    "commands": [
      {
        "command": "bmad.openKanban",
        "title": "Open Kanban Board",
        "category": "BMAD"
      }
    ],
    "keybindings": [
      {
        "command": "bmad.openKanban",
        "key": "ctrl+shift+k",
        "mac": "cmd+shift+k"
      }
    ]
  }
}
```

### extension.ts Registration

```typescript
// In activate() function
const kanbanProvider = new KanbanProvider(
    context.extensionUri,
    configService,
    errorService,
    context
);

context.subscriptions.push(
    vscode.commands.registerCommand('bmad.openKanban', () => {
        kanbanProvider.createOrShow();
    })
);
```

### File Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `src/shared/messages.ts` | ✅ Done | ExtensionMessage, WebViewMessage types |
| `src/shared/models.ts` | ✅ Done | Epic, Story interfaces |
| `src/services/ConfigService.ts` | ✅ Done | Project config |
| `src/services/ErrorService.ts` | ✅ Done | Error handling |
| `webviews/kanban/` | ✅ Done | Svelte WebView (Story 3.1) |
| `dist/webviews/kanban/` | ✅ Done | Built assets |

### Performance Requirements

- Panel creation: < 500ms (NFR-P1)
- PostMessage latency: < 50ms (NFR-P6)
- Activation impact: minimal (lazy instantiation)

### Testing Strategy

**Unit Tests (KanbanProvider.test.ts):**
- Mock vscode.window.createWebviewPanel
- Test createOrShow() creates panel first time
- Test createOrShow() reveals existing panel
- Test message handler routing
- Test dispose cleanup

**Manual Verification:**
1. Press F5 to launch Extension Development Host
2. Execute "BMAD: Open Kanban Board" from Command Palette
3. Verify panel opens in editor area with title "BMAD Kanban"
4. Execute command again - verify same panel focuses
5. Check Output panel for "Kanban WebView ready" log

### References

- [SidebarProvider implementation](../src/providers/SidebarProvider.ts#L1-200) - Reference pattern
- [Architecture: Extension Architecture Pattern](planning-artifacts/architecture.md#extension-architecture-pattern)
- [Architecture: Implementation Patterns](planning-artifacts/architecture.md#implementation-patterns--consistency-rules)
- [Story 3.1: WebView Build Pipeline](3-1-webview-build-pipeline-vite-svelte.md) - Build setup
- [Story 3.2: Shared Message Types](3-2-shared-message-types.md) - PostMessage types
- [VS Code WebView Panel API](https://code.visualstudio.com/api/extension-guides/webview#webview-panels)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (GitHub Copilot)

### Debug Log References

- Build successful: `npm run build` completes without errors
- Compile successful: `npm run compile` completes in ~20ms
- Tests passing: 26/26 KanbanProvider tests pass

### Completion Notes List

- **Task 1**: Created KanbanProvider class with static viewType, private panel reference, disposables array, and constructor accepting extensionUri, configService, errorService, and context
- **Task 2**: Implemented createOrShow() with panel reuse (reveal existing), ViewColumn.One placement, "BMAD Kanban" title, enableScripts, localResourceRoots, and retainContextWhenHidden
- **Task 3**: Generated HTML with strict CSP using webview.cspSource, included script/style URIs for dist/webviews/kanban/, added nonce for scripts
- **Task 4**: Set up typed PostMessage handler for ready, openFile, executeCommand messages; implemented postMessage() method for sending ExtensionMessages
- **Task 5**: Implemented state serialization using workspaceState with key 'bmad.kanban.state'; restore state on ready; cleanup on dispose
- **Task 6**: Added bmad.openKanban command to package.json with keybinding Cmd/Ctrl+Shift+K; registered command in extension.ts; exported from providers/index.ts; kept legacy vscode-bmad.openKanban for backward compatibility
- **Task 7**: Created comprehensive test file with 26 passing tests covering all ACs

### File List

**Created:**
- src/providers/KanbanProvider.ts - Main provider implementation
- tests/unit/providers/KanbanProvider.test.ts - Unit tests (26 tests)

**Modified:**
- src/providers/index.ts - Added KanbanProvider export
- src/extension.ts - Registered KanbanProvider and bmad.openKanban command
- package.json - Added bmad.openKanban command and keybinding
- _bmad-output/implementation-artifacts/sprint-status.yaml - Updated story status
