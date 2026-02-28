/**
 * SidebarProvider - WebView-based sidebar for BMAD
 * Story 3.3: SidebarProvider Base Implementation
 *
 * Implements WebviewViewProvider for rich Svelte-based UI.
 * Replaces TreeView-based SidebarTreeProvider for unified experience.
 */

import * as vscode from 'vscode';
import type { ExtensionMessage, WebViewMessage } from '../shared/messages';
import type { ConfigService } from '../services/ConfigService';
import type { ErrorService } from '../services/ErrorService';
import { getCopilotService } from '../services/CopilotService';
import { getModelService } from '../services/ModelService';
import { getAgentParserService } from '../services/AgentParserService';
import { WorkflowProgressService } from '../services/WorkflowProgressService';
import { StoryParser } from '../services/StoryParser';
import type { WorkflowProgress } from '../shared/types';
import type { Story } from '../shared/models';

// ============================================================================
// SidebarProvider
// ============================================================================

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'bmad-sidebar';

    private _view?: vscode.WebviewView;
    private _disposables: vscode.Disposable[] = [];
    private _fileWatchers: vscode.FileSystemWatcher[] = [];
    private _refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    private static readonly REFRESH_DEBOUNCE_MS = 500;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _configService: ConfigService,
        private readonly _errorService: ErrorService
    ) {
        this._setupFileWatchers();
    }

    /**
     * Resolve the WebView view when it becomes visible
     * AC #1: WebView loads with basic Svelte component
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<{ lastState?: unknown }>,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        // Task 1.4: Configure WebView options
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'sidebar'),
                vscode.Uri.joinPath(this._extensionUri, 'media'),
            ],
        };

        // Task 3.1: Generate HTML content with CSP
        webviewView.webview.html = this._getHtmlContent(webviewView.webview);

        // Task 4.1: Set up message handler
        this._disposables.push(
            webviewView.webview.onDidReceiveMessage(
                (message: WebViewMessage) => this._handleMessage(message)
            )
        );

        // Task 5.3: Restore state on WebView recreation
        if (context.state?.lastState) {
            this._restoreState(context.state.lastState);
        }

        // Cleanup on dispose
        webviewView.onDidDispose(() => {
            this._disposables.forEach(d => d.dispose());
            this._disposables = [];
        });
    }

    /**
     * Task 4.1: Handle messages from WebView with typed routing
     */
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
            case 'launchAgent':
                this._launchAgent(
                    message.payload.agentId, 
                    message.payload.command ?? '',
                    message.payload.customPrompt,
                    message.payload.model
                );
                break;
            case 'requestCommands':
                // Story 6.3: Parse commands from agent file and send back
                this._sendCommands(message.payload.agentFilePath);
                break;
            case 'requestModels':
                // Task 9: Handle model refresh request from WebView
                this._sendModels();
                break;
            default:
                // Exhaustive check - TypeScript will error if a case is missing
                const _exhaustive: never = message;
                this._errorService.warn(`Unknown message type: ${(message as { type: string }).type}`);
        }
    }

    /**
     * Task 4.3: Handle WebView ready message
     * Sends config data when WebView is initialized
     * Story 3.4: Also sends project state for progressive UI
     * Story 3.7: Also sends file tree for artifact display
     */
    private async _onWebViewReady(): Promise<void> {
        this._errorService.info('WebView ready, sending config...');
        
        // Always send project state first
        await this._sendProjectState();
        
        // Then try to send config if available
        const configResult = await this._configService.getConfig();
        if (configResult.success) {
            this.postMessage({
                type: 'configLoaded',
                payload: {
                    projectName: configResult.data.projectName,
                    userName: configResult.data.userName ?? 'User',
                    communicationLanguage: configResult.data.communicationLanguage ?? 'English',
                    planningArtifacts: configResult.data.planningArtifacts,
                    implementationArtifacts: configResult.data.implementationArtifacts,
                },
            });

            // Story 3.7 AC #1: Send file tree after config loaded
            await this._sendFileTree();
            
            // Story 6.3: Send available agents for Agent Launcher
            await this._sendAgents();
            
            // Story 6.5 Task 9: Send available models for Agent Launcher
            await this._sendModels();
            
            // Task 9.3, 9.4: Subscribe to model changes
            this._setupModelWatcher();
        }
        // If no config, the projectStateChanged message already handles UI state
    }

    /**
     * Determine and send current project state
     * Story 3.4: Uses ConfigService.getProjectState() for accurate detection
     * Story 3.5: Includes artifact progress for in-progress state
     * Story 3.6: Includes project summary for epics-ready state
     * Story 6.7: Includes workflow progress for tracker display
     */
    private async _sendProjectState(): Promise<void> {
        const stateResult = await this._configService.getProjectState();
        
        if (!stateResult.success) {
            this._errorService.handleError(stateResult.error);
            return;
        }

        const state = stateResult.data;
        const hasConfig = state !== 'no-project';
        const hasEpics = state === 'epics-ready';
        const hasStories = false; // TODO: Detect stories in Epic 4

        // Story 3.5 AC #1, #4: Get artifact progress for in-progress state
        let artifacts = undefined;
        if (state === 'in-progress' || state === 'epics-ready' || state === 'fresh') {
            const artifactsResult = await this._configService.getArtifactProgress();
            if (artifactsResult.success) {
                artifacts = artifactsResult.data;
            }
        }

        // Story 3.6 AC #3: Get project summary for epics-ready state
        let summary = undefined;
        if (state === 'epics-ready') {
            const summaryResult = await this._configService.getProjectSummary();
            if (summaryResult.success) {
                summary = summaryResult.data;
            }
        }

        // Story 6.7 AC #2, #3, #4, #5: Calculate workflow progress
        let workflowProgress: WorkflowProgress | undefined = undefined;
        if (state === 'in-progress' || state === 'epics-ready') {
            const configResult = await this._configService.getConfig();
            if (configResult.success) {
                // Task 8.2, 8.3: Get stories using StoryParser for accurate phase detection
                let stories: Story[] = [];
                const storyParser = StoryParser.getInstance();
                const storiesResult = await storyParser.scanAndParse(configResult.data.implementationArtifacts);
                if (storiesResult.success) {
                    stories = storiesResult.data.stories;
                }
                // Task 8.4: Handle parsing errors gracefully (empty array fallback)
                
                const progressResult = await WorkflowProgressService.getInstance()
                    .calculateProgress(configResult.data, stories);
                if (progressResult.success) {
                    workflowProgress = progressResult.data;
                }
            }
        }

        this.postMessage({
            type: 'projectStateChanged',
            payload: {
                state,
                hasConfig,
                hasEpics,
                hasStories,
                artifacts,
                summary,
                workflowProgress,
            },
        });
    }

    /**
     * Task 4.2: Post message to WebView
     */
    public postMessage(message: ExtensionMessage): void {
        this._view?.webview.postMessage(message);
    }

    /**
     * Open a file in the editor
     */
    private async _openFile(filePath: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.window.showTextDocument(uri);
        } catch (error) {
            this._errorService.handleError({
                code: 'FILE_OPEN_ERROR',
                message: `Failed to open file: ${filePath}`,
                userMessage: `Unable to open file: ${filePath}`,
                recoverable: true,
            });
        }
    }

    /**
     * Launch an agent workflow using CopilotService
     * Story 3.4: Handle brainstorm/idea/docs buttons
     * Story 6.4: Use CopilotService for chat integration
     * Story 6.5: Pass model selection to CopilotService
     */
    private async _launchAgent(agentId: string, command: string, customPrompt?: string, model?: string): Promise<void> {
        const copilotService = getCopilotService();
        const result = await copilotService.launchAgent({
            agentId,
            command,
            customPrompt,
            model,
        });
        
        if (!result.success) {
            this._errorService.handleError(result.error);
        }
    }

    /**
     * Task 5.1, 5.2: Store state for WebView persistence
     */
    public getState(): unknown {
        return this._view?.webview.postMessage({ type: 'getState' });
    }

    /**
     * Task 5.3: Restore previously saved state
     */
    private _restoreState(state: unknown): void {
        this._errorService.info('Restoring WebView state');
        // State restoration is handled by sending current config on ready
        // Additional state restoration logic can be added here
    }

    /**
     * Refresh the WebView with updated data
     */
    public async refresh(): Promise<void> {
        if (this._view) {
            await this._onWebViewReady();
        }
    }

    /**
     * Story 3.7 AC #1: Send file tree to WebView
     */
    private async _sendFileTree(): Promise<void> {
        const filesResult = await this._configService.getArtifactFiles();
        if (filesResult.success) {
            this.postMessage({
                type: 'filesLoaded',
                payload: filesResult.data,
            });
        }
    }

    /**
     * Story 6.5 Task 9.2: Send available models to WebView
     * AC #1: Populate model dropdown with API models
     */
    private async _sendModels(): Promise<void> {
        const modelService = getModelService();
        const result = await modelService.getAvailableModels();
        if (result.success && result.data) {
            this.postMessage({
                type: 'modelsLoaded',
                payload: { models: result.data },
            });
        }
    }

    /**
     * Story 6.3: Send available agents to WebView
     * AC #1: Populate agent dropdown with discovered agents
     */
    private async _sendAgents(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }
        
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const agentsFolderPath = `${workspaceRoot}/_bmad/bmm/agents`;
        
        const agentParserService = getAgentParserService();
        const result = await agentParserService.discoverAgents(agentsFolderPath);
        
        if (result.success && result.data) {
            this.postMessage({
                type: 'agentsLoaded',
                payload: { agents: result.data },
            });
        }
    }

    /**
     * Story 6.3: Send agent commands to WebView
     * AC #2: Parse and send commands when agent is selected
     */
    private async _sendCommands(agentFilePath: string): Promise<void> {
        const agentParserService = getAgentParserService();
        const result = await agentParserService.parseCommands(agentFilePath);
        
        if (result.success && result.data) {
            // Extract agent ID from file path (filename without extension)
            const agentId = agentFilePath.split('/').pop()?.replace('.md', '') ?? '';
            
            this.postMessage({
                type: 'commandsLoaded',
                payload: { agentId, commands: result.data },
            });
        }
    }

    /**
     * Story 6.5 Task 9.3, 9.4, 9.5: Set up model change watcher
     * AC #3: Update dropdown when models change at runtime
     */
    private _setupModelWatcher(): void {
        const modelService = getModelService();
        
        // Task 9.3: Subscribe to model change events
        const modelChangeDisposable = modelService.onDidChangeModels((models) => {
            // Task 9.4: Send updated models to WebView
            this.postMessage({
                type: 'modelsLoaded',
                payload: { models },
            });
        });
        
        // Task 9.5: Add to disposables for cleanup
        this._disposables.push(modelChangeDisposable);
        
        // Start watching for model changes
        const watcherDisposable = modelService.watchModelChanges();
        this._disposables.push(watcherDisposable);
    }

    /**
     * Task 6.1, 6.2: Set up file watchers for project state changes
     * Story 3.4 AC #5: Re-send projectStateChanged when changes detected
     * Story 3.7 AC #3: Watch both planning and implementation artifact folders
     */
    private _setupFileWatchers(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        // Watch for _bmad/ folder creation/deletion
        const bmadWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceRoot, '_bmad/**')
        );

        // Watch for planning artifacts
        const planningWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceRoot, '_bmad-output/planning-artifacts/**')
        );

        // Story 3.7 AC #3: Watch for implementation artifacts
        const implementationWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceRoot, '_bmad-output/implementation-artifacts/**')
        );

        // Set up handlers with debouncing
        const debouncedRefresh = () => this._debouncedStateRefresh();

        bmadWatcher.onDidCreate(debouncedRefresh);
        bmadWatcher.onDidDelete(debouncedRefresh);
        bmadWatcher.onDidChange(debouncedRefresh);

        planningWatcher.onDidCreate(debouncedRefresh);
        planningWatcher.onDidDelete(debouncedRefresh);

        implementationWatcher.onDidCreate(debouncedRefresh);
        implementationWatcher.onDidDelete(debouncedRefresh);

        this._fileWatchers.push(bmadWatcher, planningWatcher, implementationWatcher);
        this._disposables.push(bmadWatcher, planningWatcher, implementationWatcher);
    }

    /**
     * Task 6.4: Debounced state refresh to prevent rapid updates
     * Story 3.7 AC #3: Also refreshes file tree on changes
     */
    private _debouncedStateRefresh(): void {
        if (this._refreshDebounceTimer) {
            clearTimeout(this._refreshDebounceTimer);
        }

        this._refreshDebounceTimer = setTimeout(() => {
            this._refreshDebounceTimer = null;
            this._configService.clearCache();
            this._sendProjectState();
            this._sendFileTree();
        }, SidebarProvider.REFRESH_DEBOUNCE_MS);
    }

    /**
     * Task 3.1, 3.2, 3.3, 3.4: Generate HTML content with strict CSP
     * NFR-S1: Content Security Policy for WebView security
     */
    private _getHtmlContent(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'sidebar', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webviews', 'sidebar', 'index.css')
        );

        // Generate nonce for CSP
        const nonce = this._getNonce();

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
        img-src ${webview.cspSource} https:;
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

    /**
     * Dispose resources
     */
    public dispose(): void {
        if (this._refreshDebounceTimer) {
            clearTimeout(this._refreshDebounceTimer);
        }
        this._fileWatchers.forEach(w => w.dispose());
        this._fileWatchers = [];
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}
