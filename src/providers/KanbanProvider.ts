/**
 * KanbanProvider - WebView Panel for Kanban Board
 * Story 5.1: KanbanProvider Base Implementation
 *
 * Opens Kanban board as an editor tab (not sidebar).
 * Manages WebView lifecycle, PostMessage communication, and state persistence.
 */

import * as vscode from 'vscode';
import type { ExtensionMessage, WebViewMessage } from '../shared/messages';
import type { ConfigService } from '../services/ConfigService';
import type { ErrorService } from '../services/ErrorService';
import type { EpicsParser } from '../services/EpicsParser';
import type { StoryParser } from '../services/StoryParser';
import type { FileWatcherService } from '../services/FileWatcherService';
import type { WorkflowProgressService } from '../services/WorkflowProgressService';
import type { WorkflowProgress } from '../shared/types';

// ============================================================================
// Types
// ============================================================================

/** Kanban view state for persistence */
interface KanbanState {
    activeView: 'epics' | 'stories';
    epicFilter?: string;
    scrollPosition?: number;
}

// ============================================================================
// KanbanProvider
// ============================================================================

/**
 * KanbanProvider manages the Kanban board WebView panel.
 * - Opens as an editor tab (ViewColumn.One)
 * - Single instance (reveal existing panel if already open)
 * - Persists state across VS Code reloads
 *
 * AC #1: Opens WebView panel in editor area with title "BMAD Kanban"
 * AC #2: Reveals existing panel instead of creating duplicate
 * AC #3: Serializes state for workspace reload
 * AC #4: Typed PostMessage communication
 * AC #5: Restores previous state on panel recreation
 */
export class KanbanProvider {
    // Task 1.2: Static viewType constant
    public static readonly viewType = 'bmad-kanban';

    // Task 1.3: Private panel reference
    private _panel?: vscode.WebviewPanel;

    // Task 1.5: Disposables for cleanup
    private _disposables: vscode.Disposable[] = [];

    // State persistence key
    private static readonly STATE_KEY = 'bmad.kanban.state';

    // Task 1.4: Constructor with dependencies
    // Story 5.2: Added EpicsParser and StoryParser for data loading
    // Story 5.7: Added FileWatcherService for auto-refresh
    // Story 5.8: Added WorkflowProgressService for progress bar
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _configService: ConfigService,
        private readonly _errorService: ErrorService,
        private readonly _context: vscode.ExtensionContext,
        private readonly _epicsParser?: EpicsParser,
        private readonly _storyParser?: StoryParser,
        private readonly _fileWatcherService?: FileWatcherService,
        private readonly _workflowProgressService?: WorkflowProgressService
    ) {}

    // ========================================================================
    // Task 2: createOrShow() Method
    // ========================================================================

    /**
     * Create or reveal the Kanban panel
     * AC #1: Creates WebView panel in editor area
     * AC #2: Reveals existing panel if already open
     *
     * @param viewColumn - Optional view column for panel placement
     */
    public createOrShow(viewColumn?: vscode.ViewColumn): void {
        // Task 2.1: Check if panel already exists → reveal and return
        if (this._panel) {
            this._panel.reveal(viewColumn);
            return;
        }

        // Task 2.2: Create new WebviewPanel in editor area (ViewColumn.One)
        this._panel = vscode.window.createWebviewPanel(
            KanbanProvider.viewType,
            'BMAD Kanban', // Task 2.3: Panel title
            viewColumn || vscode.ViewColumn.One,
            {
                // Task 2.4: WebView options
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'kanban'),
                    vscode.Uri.joinPath(this._extensionUri, 'media'),
                ],
                // Task 2.5: Retain context when hidden for state persistence
                retainContextWhenHidden: true,
            }
        );

        // Task 3: Set HTML content
        this._panel.webview.html = this._getHtmlContent(this._panel.webview);

        // Task 4.1: Set up message handler
        this._disposables.push(
            this._panel.webview.onDidReceiveMessage(
                (message: WebViewMessage) => this._handleMessage(message)
            )
        );

        // Task 5.1: Track view state changes
        this._disposables.push(
            this._panel.onDidChangeViewState((e) => {
                if (e.webviewPanel.visible) {
                    this._errorService.info('Kanban panel became visible');
                }
            })
        );

        // Task 5.4: Handle dispose
        this._panel.onDidDispose(() => this._dispose());

        // Story 5.7: Subscribe to FileWatcher for auto-refresh (AC #1, #3)
        if (this._fileWatcherService) {
            const subscription = this._fileWatcherService.subscribe(
                async () => {
                    const startTime = Date.now();
                    await this.refresh();
                    const elapsed = Date.now() - startTime;
                    this._errorService.info(`Kanban refresh completed in ${elapsed}ms`);
                }
            );
            this._disposables.push(subscription);
        }
    }

    // ========================================================================
    // Task 3: Generate WebView HTML Content
    // ========================================================================

    /**
     * Task 3.1: Generate HTML content for WebView
     * Task 3.2: Build URIs for Kanban WebView assets
     * Task 3.3: Content Security Policy with webview.cspSource
     * Task 3.4: HTML template with VS Code theme variables
     */
    private _getHtmlContent(webview: vscode.Webview): string {
        // Task 3.2: Build URIs for assets
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'kanban', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'kanban', 'index.css')
        );

        // Generate nonce for CSP
        const nonce = this._getNonce();

        // Task 3.3, 3.4: HTML template with CSP and theme variables
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
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    /**
     * Generate cryptographic nonce for CSP
     */
    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    // ========================================================================
    // Task 4: PostMessage Communication
    // ========================================================================

    /**
     * Task 4.1, 4.2: Handle messages from WebView with typed routing
     * Story 5.6 Task 5.1: Updated to pass full payload including preview flag
     */
    private _handleMessage(message: WebViewMessage): void {
        switch (message.type) {
            case 'ready':
                // Task 4.3: Handle ready message to send initial data
                this._onWebViewReady();
                break;
            case 'openFile':
                // Story 5.6: Pass preview flag from payload
                this._openFile(message.payload.filePath, message.payload.preview);
                break;
            case 'executeCommand':
                vscode.commands.executeCommand(
                    message.payload.command,
                    ...(message.payload.args ?? [])
                );
                break;
            default:
                // Log unknown message types
                this._errorService.warn(`Unknown message type: ${(message as { type: string }).type}`);
        }
    }

    /**
     * Task 4.3: Handle WebView ready - send initial data
     * Story 5.2: Implemented data loading with EpicsParser and StoryParser
     */
    private async _onWebViewReady(): Promise<void> {
        this._errorService.info('Kanban WebView ready');

        // Restore previous state if available
        const savedState = this._context.workspaceState.get<KanbanState>(KanbanProvider.STATE_KEY);
        if (savedState) {
            this._errorService.info(`Restoring Kanban state: ${savedState.activeView}`);
        }

        // Load and send epics and stories data
        await this._loadAndSendData();
    }

    /**
     * Story 5.2: Load epics and stories data and send to WebView
     */
    private async _loadAndSendData(): Promise<void> {
        // Get config for paths
        const configResult = await this._configService.getConfig();
        if (!configResult.success) {
            this.postMessage({
                type: 'error',
                payload: {
                    code: configResult.error.code,
                    message: configResult.error.message,
                    recoverable: true
                }
            });
            return;
        }

        const config = configResult.data;
        let epics: import('../shared/models').Epic[] = [];
        let stories: import('../shared/models').Story[] = [];

        // Parse epics if parser available
        if (this._epicsParser) {
            const epicsPath = `${config.planningArtifacts}/epics.md`;
            const epicsResult = await this._epicsParser.parseEpics(epicsPath);
            if (epicsResult.success) {
                epics = epicsResult.data.epics;
            } else {
                this._errorService.warn(`Failed to parse epics: ${epicsResult.error.message}`);
            }
        }

        // Parse stories if parser available
        if (this._storyParser) {
            const storiesResult = await this._storyParser.scanAndParse(config.implementationArtifacts);
            if (storiesResult.success) {
                stories = storiesResult.data.stories;
            } else {
                this._errorService.warn(`Failed to parse stories: ${storiesResult.error.message}`);
            }
        }

        // Story 5.8: Calculate workflow progress
        let workflowProgress: WorkflowProgress | undefined;
        if (this._workflowProgressService) {
            const progressResult = await this._workflowProgressService.calculateProgress(config, stories);
            if (progressResult.success) {
                workflowProgress = progressResult.data;
            } else {
                this._errorService.warn(`Failed to calculate progress: ${progressResult.error.message}`);
            }
        }

        // Send data to WebView
        this.postMessage({
            type: 'dataLoaded',
            payload: { epics, stories, workflowProgress }
        });
    }

    /**
     * Story 5.2: Refresh data and send to WebView (for file watcher updates)
     */
    public async refresh(): Promise<void> {
        if (this._panel) {
            await this._loadAndSendData();
        }
    }

    /**
     * Open a file in the editor
     * Story 5.6: Added preview mode for markdown files and error handling (AC #2, #3)
     * @param filePath - Path to the file to open
     * @param preview - If true and file is .md, open in markdown preview mode
     */
    private async _openFile(filePath: string, preview: boolean = false): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            
            // Story 5.6 Task 4.1 & 4.2: Check if file exists first (AC #3)
            try {
                await vscode.workspace.fs.stat(uri);
            } catch {
                // Story 5.6 Task 4.3: Show error notification with actionable guidance
                vscode.window.showErrorMessage(
                    `Story file not found: ${filePath}. File may have been moved or deleted.`
                );
                this._errorService.warn(`Story file not found: ${filePath}`);
                return;
            }
            
            // Story 5.6 Task 3.2 & 3.3: Use markdown preview for .md files when requested (AC #2)
            if (preview && filePath.endsWith('.md')) {
                await vscode.commands.executeCommand('markdown.showPreview', uri);
            } else {
                await vscode.commands.executeCommand('vscode.open', uri);
            }
        } catch (error) {
            this._errorService.error(`Failed to open file: ${filePath}`);
            vscode.window.showErrorMessage(
                `Failed to open story file. Check the Output panel for details.`
            );
        }
    }

    /**
     * Task 4.4: Send typed message to WebView
     */
    public postMessage(message: ExtensionMessage): void {
        this._panel?.webview.postMessage(message);
    }

    // ========================================================================
    // Task 5: State Serialization
    // ========================================================================

    /**
     * Task 5.2: Save current state to workspaceState
     */
    public async saveState(state: KanbanState): Promise<void> {
        await this._context.workspaceState.update(KanbanProvider.STATE_KEY, state);
    }

    /**
     * Task 5.3: Restore state from workspaceState
     */
    public getStoredState(): KanbanState | undefined {
        return this._context.workspaceState.get<KanbanState>(KanbanProvider.STATE_KEY);
    }

    /**
     * Task 5.4: Dispose handler - cleanup panel and disposables
     */
    private _dispose(): void {
        this._panel = undefined;
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }

    /**
     * Check if panel is currently visible
     */
    public get isVisible(): boolean {
        return this._panel?.visible ?? false;
    }

    /**
     * Dispose the provider (called on extension deactivation)
     */
    public dispose(): void {
        this._panel?.dispose();
        this._dispose();
    }
}
