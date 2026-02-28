# Story 3.3: SidebarProvider Base Implementation

Status: complete

## Story

As a **user**,
I want **to see a sidebar panel when I open a BMAD project**,
So that **I have a central place for BMAD actions**.

## Acceptance Criteria

1. **Given** the extension is activated and WebView build pipeline exists
   **When** SidebarProvider is registered
   **Then** a sidebar view appears in VS Code's activity bar with BMAD icon

2. **Given** user clicks on the BMAD sidebar icon
   **When** the sidebar opens
   **Then** a WebView loads with basic Svelte component
   **And** PostMessage communication works between extension and WebView
   **And** the WebView uses VS Code's theme colors (NFR-A1)

3. **Given** the WebView is loaded
   **When** the extension sends messages
   **Then** the Svelte component receives and processes them

4. **Given** the WebView is loaded
   **When** user interacts with UI elements
   **Then** messages are sent to the extension via PostMessage

5. **Given** the WebView is disposed and reopened
   **When** user opens the sidebar again
   **Then** the WebView state is restored (NFR-R6)

## Tasks / Subtasks

- [x] Task 1: Create SidebarProvider class (AC: #1)
  - [x] 1.1: Create `src/providers/SidebarProvider.ts`
  - [x] 1.2: Implement `vscode.WebviewViewProvider` interface
  - [x] 1.3: Implement `resolveWebviewView()` method
  - [x] 1.4: Configure WebView options (retainContextWhenHidden, enableScripts)

- [x] Task 2: Register WebView view contribution (AC: #1)
  - [x] 2.1: Add `viewsContainers` to package.json with activity bar icon
  - [x] 2.2: Add `views` with WebView type for sidebar
  - [x] 2.3: Register provider in `extension.ts` activation
  - [x] 2.4: Add BMAD icon to `media/` folder

- [x] Task 3: Implement HTML generation with CSP (AC: #2)
  - [x] 3.1: Create `getHtmlContent()` method
  - [x] 3.2: Generate strict Content Security Policy (NFR-S1)
  - [x] 3.3: Insert correct script and style URIs with nonce
  - [x] 3.4: Load bundled Svelte output from `dist/webviews/sidebar/`

- [x] Task 4: Implement PostMessage communication (AC: #3, #4)
  - [x] 4.1: Set up `onDidReceiveMessage` handler with typed messages
  - [x] 4.2: Create `postMessage()` method for sending to WebView
  - [x] 4.3: Handle `ready` message from WebView initialization
  - [x] 4.4: Send `configLoaded` message when config available

- [x] Task 5: Add state persistence (AC: #5)
  - [x] 5.1: Implement `getState()` / `setState()` for WebView state
  - [x] 5.2: Store last known project state
  - [x] 5.3: Restore state on WebView recreation

- [x] Task 6: Update Svelte sidebar to use PostMessage (AC: #2, #3, #4)
  - [x] 6.1: Update `App.svelte` to initialize VS Code API
  - [x] 6.2: Send `ready` message on component mount
  - [x] 6.3: Add message listener for extension messages
  - [x] 6.4: Display received config data

- [x] Task 7: Add unit tests (AC: #1-5)
  - [x] 7.1: Create `src/providers/SidebarProvider.test.ts`
  - [x] 7.2: Test provider registration
  - [x] 7.3: Test message handling with mocked WebView
  - [x] 7.4: Test state persistence

## Dev Notes

### SidebarProvider Implementation

```typescript
// src/providers/SidebarProvider.ts
import * as vscode from 'vscode';
import type { ExtensionMessage, WebViewMessage } from '../shared/messages';
import type { ConfigService } from '../services/ConfigService';
import type { ErrorService } from '../services/ErrorService';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'bmad-sidebar';
  
  private _view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly configService: ConfigService,
    private readonly errorService: ErrorService
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webviews', 'sidebar'),
        vscode.Uri.joinPath(this.extensionUri, 'media'),
      ],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // Handle messages from WebView
    webviewView.webview.onDidReceiveMessage(
      (message: WebViewMessage) => this.handleMessage(message)
    );

    // Restore state if available
    if (context.state) {
      this.restoreState(context.state);
    }
  }

  private handleMessage(message: WebViewMessage): void {
    switch (message.type) {
      case 'ready':
        this.onWebViewReady();
        break;
      case 'openFile':
        this.openFile(message.payload.filePath);
        break;
      case 'executeCommand':
        vscode.commands.executeCommand(
          message.payload.command,
          ...(message.payload.args ?? [])
        );
        break;
      case 'launchAgent':
        // Will be implemented in Epic 6
        break;
      default:
        const _exhaustive: never = message;
        this.errorService.logWarning(`Unknown message: ${(message as any).type}`);
    }
  }

  private async onWebViewReady(): Promise<void> {
    const configResult = await this.configService.getConfig();
    if (configResult.success) {
      this.postMessage({
        type: 'configLoaded',
        payload: {
          projectName: configResult.data.projectName,
          userName: configResult.data.userName,
          communicationLanguage: configResult.data.communicationLanguage,
          planningArtifacts: configResult.data.planningArtifacts,
          implementationArtifacts: configResult.data.implementationArtifacts,
        },
      });
    }
  }

  private postMessage(message: ExtensionMessage): void {
    this._view?.webview.postMessage(message);
  }

  private async openFile(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
  }

  private restoreState(state: unknown): void {
    // Restore previous WebView state
  }

  // ... getHtmlContent implementation below
}
```

### HTML Content Generation with CSP

```typescript
private getHtmlContent(webview: vscode.Webview): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this.extensionUri, 'dist', 'webviews', 'sidebar', 'index.js')
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this.extensionUri, 'dist', 'webviews', 'sidebar', 'index.css')
  );

  // Generate nonce for CSP
  const nonce = this.getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src 'nonce-${nonce}';
    font-src ${webview.cspSource};
  ">
  <link href="${styleUri}" rel="stylesheet">
  <title>BMAD Sidebar</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

private getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

### Package.json Configuration

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "bmad-container",
          "title": "BMAD Method",
          "icon": "media/bmad-icon.svg"
        }
      ]
    },
    "views": {
      "bmad-container": [
        {
          "type": "webview",
          "id": "bmad-sidebar",
          "name": "BMAD"
        }
      ]
    }
  }
}
```

### Extension Registration

```typescript
// extension.ts (add to activate function)
const sidebarProvider = new SidebarProvider(
  context.extensionUri,
  configService,
  errorService
);

context.subscriptions.push(
  vscode.window.registerWebviewViewProvider(
    SidebarProvider.viewType,
    sidebarProvider
  )
);
```

### Updated Svelte App Component

```svelte
<!-- webviews/sidebar/src/App.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExtensionMessage, ConfigPayload } from './lib/types';

  const vscode = acquireVsCodeApi();
  
  let config: ConfigPayload | null = null;
  let loading = true;

  onMount(() => {
    // Listen for messages from extension
    window.addEventListener('message', handleMessage);
    
    // Notify extension that WebView is ready
    vscode.postMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });

  function handleMessage(event: MessageEvent<ExtensionMessage>) {
    const message = event.data;
    
    switch (message.type) {
      case 'configLoaded':
        config = message.payload;
        loading = false;
        break;
      case 'projectStateChanged':
        // Handle state updates
        break;
      case 'error':
        console.error('Extension error:', message.payload);
        break;
    }
  }
</script>

<main>
  {#if loading}
    <p class="loading">Loading...</p>
  {:else if config}
    <h1>👋 {config.userName}</h1>
    <p class="project-name">{config.projectName}</p>
  {:else}
    <p>No project detected</p>
  {/if}
</main>

<style>
  main {
    padding: 1rem;
    color: var(--vscode-foreground);
  }
  
  h1 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
  
  .project-name {
    color: var(--vscode-descriptionForeground);
    font-size: 0.9rem;
  }
  
  .loading {
    color: var(--vscode-descriptionForeground);
  }
</style>
```

### Icon Requirements

Create `media/bmad-icon.svg` - a simple icon for the activity bar. VS Code requires SVG format with single color that adapts to theme.

```svg
<!-- media/bmad-icon.svg -->
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
</svg>
```

### Relationship with Existing SidebarTreeProvider

Story 2-3 created `SidebarTreeProvider` using TreeView. This story creates a **WebView-based** `SidebarProvider` as the primary sidebar for richer UI capabilities (Svelte components, reactive state).

Options for migration:
1. **Replace**: Remove TreeView, use only WebView sidebar
2. **Coexist**: Keep TreeView for simple actions, WebView for complex UI
3. **Hybrid**: TreeView becomes a sub-view within the WebView container

**Recommended**: Option 1 - Replace with WebView for unified experience. The "Start New BMAD Project" button will be rendered as a Svelte component instead.

### Project Structure Notes

- Provider handles WebView lifecycle and message routing
- Svelte component handles UI rendering and user interactions
- Shared types ensure type-safe communication
- CSP is critical for security (NFR-S1)

### References

- [Source: architecture.md#Extension Architecture Pattern] - Provider + Services pattern
- [Source: architecture.md#State Management Strategy] - Extension Host as source of truth
- [Source: architecture.md#Security] - CSP requirements (NFR-S1)
- [Source: architecture.md#Accessibility] - High contrast support (NFR-A1)
- [Source: architecture.md#Package.json Contributes] - View registration

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

1. Created `SidebarProvider.ts` implementing `WebviewViewProvider` interface with full PostMessage communication
2. Updated `package.json` to register WebView-type sidebar with custom BMAD icon at `media/bmad-icon.svg`
3. Changed view container ID from `bmad-explorer` to `bmad-container` for clarity
4. Registered provider in `extension.ts` with `retainContextWhenHidden: true` option (NFR-R6)
5. Implemented strict CSP with nonce-based script loading (NFR-S1)
6. Updated `App.svelte` with Svelte 5 `$state` runes for reactive state management
7. Added comprehensive message handling for: ready, configLoaded, projectStateChanged, openFile, executeCommand, launchAgent
8. TreeView-based `SidebarTreeProvider` kept for reference but replaced by WebView provider
9. Created 17 unit tests covering: viewType, resolveWebviewView, message handling, state persistence, HTML generation, nonce uniqueness

### File List

- `src/providers/SidebarProvider.ts` - NEW: WebView-based sidebar provider
- `src/providers/index.ts` - MODIFIED: Added SidebarProvider export
- `src/extension.ts` - MODIFIED: Register WebView provider instead of TreeView
- `package.json` - MODIFIED: WebView type view, new icon path, updated container
- `media/bmad-icon.svg` - NEW: BMAD activity bar icon
- `webviews/sidebar/src/App.svelte` - MODIFIED: Full PostMessage communication
- `tests/unit/providers/SidebarProvider.test.ts` - NEW: 17 unit tests
