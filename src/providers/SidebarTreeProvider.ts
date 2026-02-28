/**
 * SidebarTreeProvider - TreeView-based sidebar for BMAD
 * Story 2.3: Project Init Button in Sidebar
 */

import * as vscode from 'vscode';
import { getConfigService } from '../services/ConfigService';
import { getTerminalService } from '../services/TerminalService';
import { getErrorService } from '../services/ErrorService';

// ============================================================================
// TreeItem Classes
// ============================================================================

/**
 * Base class for sidebar items
 */
export class SidebarItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState);
    }
}

/**
 * "Start New BMAD Project" button for fresh projects
 * Task 1.3, 1.4: TreeItem with rocket icon
 */
export class InitProjectItem extends SidebarItem {
    constructor() {
        super('Start New BMAD Project', vscode.TreeItemCollapsibleState.None);
        this.command = {
            command: 'vscode-bmad.initProject',
            title: 'Start New BMAD Project',
        };
        this.iconPath = new vscode.ThemeIcon('rocket');
        this.tooltip = 'Initialize a new BMAD project in the current workspace';
        this.contextValue = 'initProject';
    }
}

/**
 * Project info item showing current project name
 */
export class ProjectInfoItem extends SidebarItem {
    constructor(projectName: string) {
        super(projectName, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('folder');
        this.tooltip = `BMAD Project: ${projectName}`;
        this.contextValue = 'projectInfo';
        this.description = 'BMAD Project';
    }
}

// ============================================================================
// SidebarTreeProvider
// ============================================================================

export class SidebarTreeProvider implements vscode.TreeDataProvider<SidebarItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SidebarItem | undefined | null>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private fileWatcher: vscode.FileSystemWatcher | null = null;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.setupFileWatcher();
    }

    /**
     * Task 4.1-4.4: Watch for _bmad/ folder creation and trigger refresh
     */
    private setupFileWatcher(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        // Watch for _bmad folder creation
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, '_bmad/**')
        );

        // Refresh on folder creation (Task 4.2)
        this.fileWatcher.onDidCreate(() => {
            this.refresh();
            // Task 4.3: Reload config when _bmad is created
            const configService = getConfigService();
            configService.getConfig(true);
        });

        this.fileWatcher.onDidDelete(() => {
            this.refresh();
        });

        this.disposables.push(this.fileWatcher);
    }

    /**
     * Refresh the tree view
     */
    public refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    /**
     * Get tree item for display
     */
    public getTreeItem(element: SidebarItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children for tree view
     * AC #1: Shows init button for fresh projects
     * AC #3: Shows project info for existing projects
     */
    public async getChildren(element?: SidebarItem): Promise<SidebarItem[]> {
        if (element) {
            // No nested children for now
            return [];
        }

        // Root level - determine project state
        const configService = getConfigService();
        const isBmadProject = await configService.hasBmadProject();

        if (!isBmadProject) {
            // Fresh project - show init button (AC #1)
            return [new InitProjectItem()];
        }

        // Existing BMAD project - show project info
        const configResult = await configService.getConfig();
        if (configResult.success) {
            return [new ProjectInfoItem(configResult.data.projectName)];
        }

        // Config error - still show refresh option
        return [new ProjectInfoItem('BMAD Project (config error)')];
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this._onDidChangeTreeData.dispose();
        this.disposables.forEach(d => d.dispose());
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }
}

// ============================================================================
// Command Registration
// ============================================================================

/**
 * Register sidebar-related commands
 * Task 3.1-3.4: Command registration and execution
 */
export function registerSidebarCommands(
    context: vscode.ExtensionContext,
    sidebarProvider: SidebarTreeProvider
): void {
    const errorService = getErrorService();

    // Register init project command (AC #2)
    const initProjectCommand = vscode.commands.registerCommand(
        'vscode-bmad.initProject',
        async () => {
            errorService.info('Init project command triggered');

            // Show info message on execution start (Task 3.4)
            vscode.window.showInformationMessage('Initializing BMAD project...');

            // Execute the install command (AC #2)
            // Use --directory . to specify current workspace, avoiding interactive prompt
            const terminalService = getTerminalService();
            const result = await terminalService.executeCommand('npx bmad-method install --directory .');

            if (!result.success) {
                errorService.handleError(result.error);
            }
        }
    );

    context.subscriptions.push(initProjectCommand);

    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand(
        'vscode-bmad.refreshSidebar',
        () => {
            sidebarProvider.refresh();
        }
    );

    context.subscriptions.push(refreshCommand);
}

/**
 * Register the sidebar tree view
 */
export function registerSidebarTreeView(
    context: vscode.ExtensionContext
): SidebarTreeProvider {
    const sidebarProvider = new SidebarTreeProvider();

    // Register the tree view (Task 1.2)
    const treeView = vscode.window.createTreeView('bmad-sidebar', {
        treeDataProvider: sidebarProvider,
        showCollapseAll: false,
    });

    context.subscriptions.push(treeView);
    context.subscriptions.push(sidebarProvider);

    // Register commands
    registerSidebarCommands(context, sidebarProvider);

    return sidebarProvider;
}
