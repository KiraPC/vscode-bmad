import * as vscode from 'vscode';
import { getErrorService, getConfigService, getTerminalService, getEpicsParser, getStoryParser, getFileWatcherService, getWorkflowProgressService } from './services';
import { SidebarProvider, KanbanProvider } from './providers';

/**
 * Called when the extension is activated.
 * Story 1.5: Extension Activation with BMAD Detection
 * Story 2.3: Project Init Button in Sidebar
 * Story 3.3: SidebarProvider Base Implementation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const errorService = getErrorService();
    const configService = getConfigService();
    const terminalService = getTerminalService();
    const epicsParser = getEpicsParser();
    const storyParser = getStoryParser();
    const fileWatcherService = getFileWatcherService();
    const workflowProgressService = getWorkflowProgressService();

    errorService.info('BMAD Extension activating...');

    // Register hello world command for testing
    const helloWorldCommand = vscode.commands.registerCommand('bmad.helloWorld', () => {
        vscode.window.showInformationMessage('Hello from BMAD Extension!');
    });
    context.subscriptions.push(helloWorldCommand);

    // Register init project command (Story 2.3)
    const initProjectCommand = vscode.commands.registerCommand(
        'vscode-bmad.initProject',
        async () => {
            errorService.info('Init project command triggered');
            vscode.window.showInformationMessage('Initializing BMAD project...');

            const result = await terminalService.executeCommand('npx bmad-method install --directory .');
            if (!result.success) {
                errorService.handleError(result.error);
            }
        }
    );
    context.subscriptions.push(initProjectCommand);

    // Register Kanban provider (Story 5.1, Story 5.2, Story 5.7, Story 5.8)
    const kanbanProvider = new KanbanProvider(
        context.extensionUri,
        configService,
        errorService,
        context,
        epicsParser,
        storyParser,
        fileWatcherService,
        workflowProgressService
    );

    // Register bmad.openKanban command (AC #1, #2)
    const openKanbanCommand = vscode.commands.registerCommand('bmad.openKanban', () => {
        kanbanProvider.createOrShow();
    });
    context.subscriptions.push(openKanbanCommand);

    // Keep legacy command for backward compatibility
    const openKanbanLegacyCommand = vscode.commands.registerCommand('vscode-bmad.openKanban', () => {
        kanbanProvider.createOrShow();
    });
    context.subscriptions.push(openKanbanLegacyCommand);

    // Register WebView-based sidebar provider (Story 3.3)
    const sidebarProvider = new SidebarProvider(
        context.extensionUri,
        configService,
        errorService
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarProvider.viewType,
            sidebarProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // Register refresh sidebar command
    const refreshSidebarCommand = vscode.commands.registerCommand(
        'vscode-bmad.refreshSidebar',
        () => {
            sidebarProvider.refresh();
        }
    );
    context.subscriptions.push(refreshSidebarCommand);

    // Detect BMAD project (FR2)
    const hasBmadProject = await configService.hasBmadProject();
    
    if (hasBmadProject) {
        // Load config (FR3)
        const configResult = await configService.getConfig();
        
        if (configResult.success) {
            const config = configResult.data;
            errorService.info(`BMAD project detected: ${config.projectName}`);
            vscode.window.setStatusBarMessage(`BMAD: ${config.projectName}`, 5000);

            // Story 5.7: Initialize FileWatcherService for Kanban auto-refresh
            try {
                await fileWatcherService.initialize({
                    configPath: `${config.planningArtifacts}/../_bmad/bmm/config.yaml`,
                    epicsPath: `${config.planningArtifacts}/epics.md`,
                    implementationArtifactsPath: config.implementationArtifacts,
                    planningArtifactsPath: config.planningArtifacts
                });
                errorService.info('FileWatcherService initialized');
                context.subscriptions.push(fileWatcherService);
            } catch (error) {
                // Task 1.4: Handle initialization failure gracefully
                errorService.warn(`FileWatcher init failed: ${error}`);
            }
        } else {
            // FR6: Error messages for malformed config
            errorService.handleError(configResult.error);
        }
    } else {
        // Fresh project mode - no BMAD structure detected
        errorService.info('No BMAD project detected - operating in fresh project mode');
    }

    // Listen for workspace folder changes (NFR-I4)
    const workspaceFoldersChanged = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
        errorService.info('Workspace folders changed, refreshing configuration...');
        configService.refreshWorkspace();
        sidebarProvider.refresh();
        
        const hasProject = await configService.hasBmadProject();
        if (hasProject) {
            const result = await configService.getConfig(true);
            if (result.success) {
                errorService.info(`BMAD project redetected: ${result.data.projectName}`);
            }
        }
    });
    context.subscriptions.push(workspaceFoldersChanged);

    // Cleanup on deactivation
    context.subscriptions.push({
        dispose: () => {
            kanbanProvider.dispose();
            terminalService.dispose();
            configService.dispose();
            errorService.dispose();
        }
    });

    errorService.info('BMAD Extension activated successfully');
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
    const errorService = getErrorService();
    errorService.info('BMAD Extension deactivating...');
}

