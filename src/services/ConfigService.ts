/**
 * ConfigService - Parse and manage BMAD config.yaml
 * Story 1.3: ConfigService - Basic YAML Parsing
 * Story 1.4: ConfigService - Template Variable Resolution
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { BmadConfig, ServiceResult, ErrorCodes, ProjectState, ArtifactProgress, ProjectPhase, ProjectSummaryPayload, StoryCount, FileTreeNode, FilesLoadedPayload } from '../shared/types';
import { getErrorService } from './ErrorService';

export class ConfigService {
    private static instance: ConfigService | null = null;
    private config: BmadConfig | null = null;
    private workspaceRoot: string | null = null;

    private constructor() {
        this.workspaceRoot = this.getWorkspaceRoot();
    }

    /**
     * Get singleton instance of ConfigService
     */
    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Get the workspace root path
     */
    private getWorkspaceRoot(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Get the config.yaml path
     */
    public getConfigPath(): string | null {
        if (!this.workspaceRoot) {
            return null;
        }
        return path.join(this.workspaceRoot, '_bmad', 'bmm', 'config.yaml');
    }

    /**
     * Check if BMAD project exists in workspace
     */
    public async hasBmadProject(): Promise<boolean> {
        const configPath = this.getConfigPath();
        if (!configPath) {
            return false;
        }

        try {
            await fs.promises.access(configPath, fs.constants.R_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the current project state
     * Story 3.4: Project state detection for progressive UI
     * 
     * Detection logic:
     * - 'no-project': No _bmad/ folder exists
     * - 'fresh': _bmad/ exists but no planning artifacts
     * - 'in-progress': Some planning artifacts exist (prd.md or architecture.md)
     * - 'epics-ready': epics.md exists, ready for implementation
     */
    public async getProjectState(): Promise<ServiceResult<ProjectState>> {
        const errorService = getErrorService();

        // Check workspace exists
        if (!this.workspaceRoot) {
            return errorService.success('no-project');
        }

        // Check _bmad/ folder exists
        const bmadPath = path.join(this.workspaceRoot, '_bmad');
        try {
            await fs.promises.access(bmadPath, fs.constants.R_OK);
        } catch {
            // _bmad/ folder doesn't exist
            return errorService.success('no-project');
        }

        // Get config to find planning artifacts path
        const configResult = await this.getConfig();
        if (!configResult.success) {
            // Config exists check failed, but _bmad/ exists - treat as fresh
            return errorService.success('fresh');
        }

        const planningPath = configResult.data.planningArtifacts;

        // Check for epics.md (epics-ready state)
        try {
            const epicsPath = path.join(planningPath, 'epics.md');
            await fs.promises.access(epicsPath, fs.constants.R_OK);
            return errorService.success('epics-ready');
        } catch {
            // No epics.md - continue checking
        }

        // Check for prd.md or architecture.md (in-progress state)
        try {
            const prdPath = path.join(planningPath, 'prd.md');
            await fs.promises.access(prdPath, fs.constants.R_OK);
            return errorService.success('in-progress');
        } catch {
            // No prd.md - try architecture.md
        }

        try {
            const archPath = path.join(planningPath, 'architecture.md');
            await fs.promises.access(archPath, fs.constants.R_OK);
            return errorService.success('in-progress');
        } catch {
            // No planning artifacts - fresh state
        }

        return errorService.success('fresh');
    }

    /**
     * Get detailed artifact progress for in-progress UI
     * Story 3.5: Artifact detection for progressive panel
     * AC #1: Detect which planning artifacts exist
     * AC #4: Determine current workflow phase
     */
    public async getArtifactProgress(): Promise<ServiceResult<ArtifactProgress>> {
        const errorService = getErrorService();

        // Get config to find planning artifacts path
        const configResult = await this.getConfig();
        if (!configResult.success) {
            return { success: false, error: configResult.error };
        }

        const planningPath = configResult.data.planningArtifacts;

        // Detect artifact existence using glob-like patterns
        const artifacts = {
            hasProductBrief: await this.checkArtifactExists(planningPath, 'product-brief'),
            hasPrd: await this.checkArtifactExists(planningPath, 'prd'),
            hasArchitecture: await this.checkArtifactExists(planningPath, 'architecture'),
            hasEpics: await this.checkArtifactExists(planningPath, 'epics'),
        };

        // Determine current phase based on artifacts (AC #4)
        const currentPhase = this.determinePhase(artifacts);

        return errorService.success({
            ...artifacts,
            currentPhase,
        });
    }

    /**
     * Check if an artifact file exists (supports partial name matching)
     * Task 1.2-1.4: Check for product-brief, prd, architecture presence
     */
    private async checkArtifactExists(basePath: string, artifactPattern: string): Promise<boolean> {
        try {
            const files = await fs.promises.readdir(basePath);
            // Match files containing the pattern (case-insensitive)
            const regex = new RegExp(artifactPattern, 'i');
            return files.some(file => regex.test(file) && file.endsWith('.md'));
        } catch {
            return false;
        }
    }

    /**
     * Determine current workflow phase based on artifacts
     * Task 1.5: Return detailed state with artifact flags
     */
    private determinePhase(artifacts: Omit<ArtifactProgress, 'currentPhase'>): ProjectPhase {
        if (artifacts.hasEpics) {
            return 'ready';
        }
        if (artifacts.hasArchitecture) {
            return 'design';
        }
        if (artifacts.hasPrd) {
            return 'analysis';
        }
        return 'brainstorming';
    }

    /**
     * Get project summary for epics-ready state
     * Story 3.6 AC #3: Parse sprint-status.yaml for epic/story counts
     */
    public async getProjectSummary(): Promise<ServiceResult<ProjectSummaryPayload>> {
        const errorService = getErrorService();

        const configResult = await this.getConfig();
        if (!configResult.success) {
            return { success: false, error: configResult.error };
        }

        const sprintStatusPath = path.join(
            configResult.data.implementationArtifacts,
            'sprint-status.yaml'
        );

        try {
            const content = await fs.promises.readFile(sprintStatusPath, 'utf-8');
            const normalizedContent = this.normalizeLineEndings(content);
            const parsed = yaml.parse(normalizedContent) as Record<string, unknown>;

            const status = (parsed.development_status ?? {}) as Record<string, string>;
            const storyCount: StoryCount = {
                total: 0,
                backlog: 0,
                inProgress: 0,
                review: 0,
                done: 0,
            };

            let epicCount = 0;
            let currentStory: string | undefined;

            for (const [key, value] of Object.entries(status)) {
                // Epic keys start with "epic-" (e.g., "epic-1", "epic-2")
                if (key.startsWith('epic-') && !key.includes('retrospective')) {
                    // Only count if status is not backlog (epic has been started)
                    if (value !== 'backlog') {
                        epicCount++;
                    } else {
                        // Still count if in backlog, as it exists
                        epicCount++;
                    }
                } else if (key.match(/^\d+-\d+/)) {
                    // Story key pattern: "1-2-story-title" (epic#-story#-title)
                    storyCount.total++;

                    switch (value) {
                        case 'backlog':
                            storyCount.backlog++;
                            break;
                        case 'ready-for-dev':
                            storyCount.inProgress++;
                            break;
                        case 'in-progress':
                            storyCount.inProgress++;
                            if (!currentStory) {
                                currentStory = key;
                            }
                            break;
                        case 'review':
                            storyCount.review++;
                            break;
                        case 'done':
                            storyCount.done++;
                            break;
                        default:
                            // Unknown status, count as backlog
                            storyCount.backlog++;
                    }
                }
            }

            return errorService.success({
                epicCount,
                storyCount,
                currentSprintStory: currentStory,
            });
        } catch {
            // No sprint-status.yaml yet - return zeros
            return errorService.success({
                epicCount: 0,
                storyCount: { total: 0, backlog: 0, inProgress: 0, review: 0, done: 0 },
            });
        }
    }

    /**
     * Get artifact files for file tree display
     * Story 3.7 AC #1: Scan config, planning, and implementation folders
     */
    public async getArtifactFiles(): Promise<ServiceResult<FilesLoadedPayload>> {
        const errorService = getErrorService();

        if (!this.workspaceRoot) {
            return errorService.failure({
                code: ErrorCodes.NO_WORKSPACE,
                message: 'No workspace folder open',
                userMessage: 'Please open a folder to view artifact files.',
                recoverable: true,
            });
        }

        const configResult = await this.getConfig();
        if (!configResult.success) {
            return { success: false, error: configResult.error };
        }

        const configPath = this.getConfigPath();
        const planningPath = configResult.data.planningArtifacts;
        const implPath = configResult.data.implementationArtifacts;

        return errorService.success({
            configFile: {
                type: 'file',
                name: 'config.yaml',
                path: configPath!,
                icon: 'settings-gear',
            },
            planningArtifacts: await this.scanFolder(planningPath, 'Planning Artifacts'),
            implementationArtifacts: await this.scanFolder(implPath, 'Implementation Artifacts'),
        });
    }

    /**
     * Scan a folder recursively for file tree
     * Story 3.7 Task 1.2-1.4: Scan planning and implementation folders
     */
    private async scanFolder(folderPath: string, label: string): Promise<FileTreeNode> {
        const children: FileTreeNode[] = [];

        try {
            const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });

            // Sort entries: folders first, then files, both alphabetically
            const sortedEntries = entries.sort((a, b) => {
                if (a.isDirectory() && !b.isDirectory()) return -1;
                if (!a.isDirectory() && b.isDirectory()) return 1;
                return a.name.localeCompare(b.name);
            });

            for (const entry of sortedEntries) {
                const entryPath = path.join(folderPath, entry.name);

                if (entry.isDirectory()) {
                    children.push(await this.scanFolder(entryPath, entry.name));
                } else {
                    children.push({
                        type: 'file',
                        name: entry.name,
                        path: entryPath,
                        icon: this.getFileIcon(entry.name),
                    });
                }
            }
        } catch {
            // Folder doesn't exist yet - return empty folder node
        }

        return {
            type: 'folder',
            name: label,
            path: folderPath,
            icon: 'folder',
            children,
        };
    }

    /**
     * Get codicon name for file type
     * Story 3.7 AC #4: Use VS Code codicons for file type consistency
     */
    private getFileIcon(filename: string): string {
        const lower = filename.toLowerCase();
        if (lower.endsWith('.md')) return 'markdown';
        if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'settings-gear';
        if (lower.endsWith('.json')) return 'json';
        if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'symbol-field';
        if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'symbol-field';
        if (lower.endsWith('.svelte')) return 'symbol-class';
        return 'file';
    }

    /**
     * Load and parse config.yaml
     * Story 1.3: Basic YAML Parsing
     */
    public async getConfig(forceReload = false): Promise<ServiceResult<BmadConfig>> {
        const errorService = getErrorService();

        // Return cached config if available
        if (this.config && !forceReload) {
            return errorService.success(this.config);
        }

        const configPath = this.getConfigPath();
        if (!configPath) {
            return errorService.failure({
                code: ErrorCodes.CONFIG_NOT_FOUND,
                message: 'No workspace folder open',
                userMessage: 'Please open a folder in VS Code to use BMAD Extension.',
                recoverable: true,
                shouldNotify: false,
            });
        }

        // Check if config file exists
        try {
            await fs.promises.access(configPath, fs.constants.R_OK);
        } catch {
            return errorService.failure({
                code: ErrorCodes.CONFIG_NOT_FOUND,
                message: `Config file not found: ${configPath}`,
                userMessage: 'BMAD project not detected. Would you like to initialize one?',
                recoverable: true,
                actions: [
                    { title: 'Initialize BMAD Project', command: 'bmad.initProject' }
                ],
            });
        }

        // Read and parse config file
        try {
            const content = await fs.promises.readFile(configPath, 'utf-8');
            // Normalize line endings (FR42)
            const normalizedContent = this.normalizeLineEndings(content);
            const parsed = this.parseYaml(normalizedContent, configPath);
            
            if (!parsed.success) {
                return parsed;
            }

            // Transform raw YAML to BmadConfig
            const config = this.transformConfig(parsed.data);
            this.config = config;
            
            errorService.info(`BMAD project detected: ${config.projectName}`);
            return errorService.success(config);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return errorService.failure({
                code: ErrorCodes.FILE_READ_ERROR,
                message: `Failed to read config: ${message}`,
                userMessage: 'Failed to read BMAD configuration file.',
                recoverable: true,
            });
        }
    }

    /**
     * Parse YAML content with error handling
     */
    private parseYaml(content: string, filePath: string): ServiceResult<Record<string, unknown>> {
        const errorService = getErrorService();
        
        try {
            const parsed = yaml.parse(content);
            if (!parsed || typeof parsed !== 'object') {
                return errorService.failure({
                    code: ErrorCodes.CONFIG_INVALID,
                    message: 'Config file is empty or not an object',
                    userMessage: 'BMAD config.yaml is empty or invalid.',
                    recoverable: true,
                });
            }
            return errorService.success(parsed as Record<string, unknown>);
        } catch (err) {
            // YAML parse error with line info
            if (err instanceof yaml.YAMLParseError) {
                const line = err.linePos?.[0]?.line ?? 'unknown';
                return errorService.failure({
                    code: ErrorCodes.CONFIG_PARSE_ERROR,
                    message: `YAML parse error at line ${line}: ${err.message}`,
                    userMessage: `BMAD config.yaml has a syntax error at line ${line}. Please fix and reload.`,
                    recoverable: true,
                    actions: [
                        { title: 'Open config.yaml', command: 'vscode.open', args: [vscode.Uri.file(filePath)] }
                    ],
                });
            }
            
            const message = err instanceof Error ? err.message : String(err);
            return errorService.failure({
                code: ErrorCodes.CONFIG_PARSE_ERROR,
                message: `Failed to parse YAML: ${message}`,
                userMessage: 'Failed to parse BMAD config.yaml. Check for syntax errors.',
                recoverable: true,
            });
        }
    }

    /**
     * Transform raw YAML to BmadConfig
     */
    private transformConfig(raw: Record<string, unknown>): BmadConfig {
        const projectName = this.getString(raw, 'project_name') ?? 
                           this.getString(raw, 'projectName') ?? 
                           'Unnamed Project';
        
        const planningArtifacts = this.resolvePath(
            this.getString(raw, 'planning_artifacts') ?? 
            this.getString(raw, 'planningArtifacts') ?? 
            '{project-root}/_bmad-output/planning-artifacts'
        );
        
        const implementationArtifacts = this.resolvePath(
            this.getString(raw, 'implementation_artifacts') ?? 
            this.getString(raw, 'implementationArtifacts') ?? 
            '{project-root}/_bmad-output/implementation-artifacts'
        );

        return {
            projectName,
            planningArtifacts,
            implementationArtifacts,
            userName: this.getString(raw, 'user_name') ?? this.getString(raw, 'userName'),
            communicationLanguage: this.getString(raw, 'communication_language') ?? 
                                   this.getString(raw, 'communicationLanguage'),
            documentOutputLanguage: this.getString(raw, 'document_output_language') ?? 
                                    this.getString(raw, 'documentOutputLanguage'),
            raw,
        };
    }

    /**
     * Resolve template variables in paths
     * Story 1.4: Template Variable Resolution
     */
    public resolvePath(pathTemplate: string): string {
        if (!pathTemplate) {
            return pathTemplate;
        }

        let resolved = pathTemplate;

        // Replace {project-root} with workspace root (FR4)
        if (this.workspaceRoot) {
            resolved = resolved.replace(/\{project-root\}/gi, this.workspaceRoot);
        }

        // Normalize path separators for cross-platform (FR40)
        resolved = this.normalizePath(resolved);

        return resolved;
    }

    /**
     * Normalize path for cross-platform compatibility (FR40)
     */
    private normalizePath(filePath: string): string {
        // Use path.normalize for consistent separators
        return path.normalize(filePath);
    }

    /**
     * Normalize line endings (FR42)
     */
    private normalizeLineEndings(content: string): string {
        // Convert CRLF to LF, then normalize any remaining CR
        return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    /**
     * Safely get a string value from raw config
     */
    private getString(obj: Record<string, unknown>, key: string): string | undefined {
        const value = obj[key];
        return typeof value === 'string' ? value : undefined;
    }

    /**
     * Clear cached config (useful for reloading)
     */
    public clearCache(): void {
        this.config = null;
    }

    /**
     * Refresh workspace root (for workspace changes)
     */
    public refreshWorkspace(): void {
        this.workspaceRoot = this.getWorkspaceRoot();
        this.clearCache();
    }

    /**
     * Get current workspace root
     */
    public getWorkspaceRootPath(): string | null {
        return this.workspaceRoot;
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.config = null;
        ConfigService.instance = null;
    }
}

// Export singleton accessor
export const getConfigService = (): ConfigService => ConfigService.getInstance();
