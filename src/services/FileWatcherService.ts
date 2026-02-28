/**
 * FileWatcherService - Watch for File Changes
 * Story 4.5: Monitor BMAD project files for changes
 *
 * FR36: Watch for file changes in config.yaml, epics.md, and implementation-artifacts
 * FR37: Debounce file change events (200ms delay)
 */

import * as vscode from 'vscode';
import { getErrorService } from './ErrorService';

// ============================================================================
// Types
// ============================================================================

/**
 * Type of file change
 */
export type FileChangeType = 'created' | 'changed' | 'deleted';

/**
 * Individual file change information
 * Task 5.1: Define FileChangeEvent interface
 */
export interface FileChange {
    /** Absolute file path */
    path: string;
    /** Type of change */
    type: FileChangeType;
}

/**
 * Consolidated file change event
 * Task 1.2: Define file change event payload
 */
export interface FileChangeEvent {
    /** Files that were changed */
    files: FileChange[];
    /** Timestamp of the consolidated event */
    timestamp: number;
}

/**
 * Callback type for file change notifications
 * Task 1.1: Define callback types
 */
export type FileChangeCallback = (event: FileChangeEvent) => void;

/**
 * Configuration for FileWatcherService
 */
export interface FileWatcherConfig {
    /** Path to config.yaml */
    configPath: string;
    /** Path to epics.md */
    epicsPath: string;
    /** Path to implementation artifacts folder */
    implementationArtifactsPath: string;
    /** Path to planning artifacts folder */
    planningArtifactsPath: string;
}

// ============================================================================
// FileWatcherService Class
// ============================================================================

/**
 * Service for watching BMAD project files
 * Task 2.1-2.3: Singleton pattern with ConfigService dependency
 *
 * AC #1: Creates watchers for config.yaml, epics.md, implementation_artifacts
 * AC #2: Debounces events and emits consolidated changes
 * AC #4: Recovers from errors with retry logic
 * AC #5: Consolidates multiple rapid changes
 */
export class FileWatcherService implements vscode.Disposable {
    private static instance: FileWatcherService | null = null;

    // Task 3.1: VS Code file system watchers
    private watchers: vscode.FileSystemWatcher[] = [];

    // Task 7.1: Subscriber management
    private subscribers: FileChangeCallback[] = [];

    // Task 4.2-4.4: Debounce state
    private pendingChanges: Map<string, FileChangeType> = new Map();
    private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    private readonly DEBOUNCE_MS = 200; // NFR-P7

    // Task 6.2: Retry state
    private retryCount = 0;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 1000;

    private initialized = false;
    private disposables: vscode.Disposable[] = [];

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance of FileWatcherService
     */
    public static getInstance(): FileWatcherService {
        if (!FileWatcherService.instance) {
            FileWatcherService.instance = new FileWatcherService();
        }
        return FileWatcherService.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        if (FileWatcherService.instance) {
            FileWatcherService.instance.dispose();
        }
        FileWatcherService.instance = null;
    }

    /**
     * Initialize watchers based on config paths
     * Task 3.2-3.4: Create watchers for project files
     *
     * @param config - Paths to watch
     */
    public async initialize(config: FileWatcherConfig): Promise<void> {
        if (this.initialized) {
            // Already initialized, dispose old watchers first
            this.disposeWatchers();
        }

        const errorService = getErrorService();

        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                errorService.warn('No workspace folder found for file watching');
                return;
            }

            const workspaceFolder = workspaceFolders[0];

            // Task 3.2: Watch config.yaml
            this.createWatcher(
                new vscode.RelativePattern(workspaceFolder, '_bmad/**/config.yaml')
            );

            // Task 3.3: Watch epics.md
            this.createWatcher(
                new vscode.RelativePattern(workspaceFolder, '**/planning-artifacts/epics.md')
            );

            // Alternative pattern for planning artifacts
            this.createWatcher(
                new vscode.RelativePattern(workspaceFolder, '**/planning-artifacts/*.md')
            );

            // Task 3.4: Watch implementation_artifacts/**/*.md
            this.createWatcher(
                new vscode.RelativePattern(workspaceFolder, '**/implementation-artifacts/**/*.md')
            );

            // Also watch implementation-artifacts yaml files (sprint-status.yaml)
            this.createWatcher(
                new vscode.RelativePattern(workspaceFolder, '**/implementation-artifacts/**/*.yaml')
            );

            this.initialized = true;
            this.retryCount = 0;

            errorService.info('FileWatcherService initialized successfully');
        } catch (error) {
            // Task 6.1-6.3: Error recovery with retry
            await this.handleInitError(error, config);
        }
    }

    /**
     * Create a file system watcher with event handlers
     * Task 3.1: Use vscode.workspace.createFileSystemWatcher
     */
    private createWatcher(pattern: vscode.RelativePattern): void {
        const watcher = vscode.workspace.createFileSystemWatcher(
            pattern,
            false, // ignoreCreateEvents
            false, // ignoreChangeEvents
            false  // ignoreDeleteEvents
        );

        // Register event handlers
        this.disposables.push(
            watcher.onDidCreate(uri => this.handleChange(uri, 'created'))
        );
        this.disposables.push(
            watcher.onDidChange(uri => this.handleChange(uri, 'changed'))
        );
        this.disposables.push(
            watcher.onDidDelete(uri => this.handleChange(uri, 'deleted'))
        );

        this.watchers.push(watcher);
        this.disposables.push(watcher);
    }

    /**
     * Handle a file change event
     * Task 4.1-4.3: Debounce and collect changes
     */
    private handleChange(uri: vscode.Uri, type: FileChangeType): void {
        // Task 5.3: Deduplicate - latest change type wins
        this.pendingChanges.set(uri.fsPath, type);

        // Task 4.1: Clear existing timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Task 4.4: Set new debounce timeout
        this.debounceTimeout = setTimeout(() => {
            this.flushChanges();
        }, this.DEBOUNCE_MS);
    }

    /**
     * Flush pending changes to subscribers
     * Task 5.2: Consolidate and notify
     */
    private flushChanges(): void {
        if (this.pendingChanges.size === 0) {
            return;
        }

        // Convert pending changes to array
        const files: FileChange[] = Array.from(this.pendingChanges.entries())
            .map(([path, type]) => ({ path, type }));

        // Clear pending changes
        this.pendingChanges.clear();
        this.debounceTimeout = null;

        // Create consolidated event
        const event: FileChangeEvent = {
            files,
            timestamp: Date.now(),
        };

        // Notify all subscribers
        for (const callback of this.subscribers) {
            try {
                callback(event);
            } catch (error) {
                const errorService = getErrorService();
                errorService.error(`File change callback error: ${error}`);
            }
        }
    }

    /**
     * Subscribe to file change events
     * Task 7.1-7.2: Register callback and return disposable
     *
     * @param callback - Function to call when files change
     * @returns Disposable to unsubscribe
     */
    public subscribe(callback: FileChangeCallback): vscode.Disposable {
        this.subscribers.push(callback);

        return {
            dispose: () => {
                const index = this.subscribers.indexOf(callback);
                if (index !== -1) {
                    this.subscribers.splice(index, 1);
                }
            },
        };
    }

    /**
     * Handle initialization error with retry
     * Task 6.1-6.3: Error recovery
     */
    private async handleInitError(
        error: unknown,
        config: FileWatcherConfig
    ): Promise<void> {
        const errorService = getErrorService();
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.retryCount++;

        if (this.retryCount <= this.MAX_RETRIES) {
            errorService.warn(
                `FileWatcherService init failed (attempt ${this.retryCount}/${this.MAX_RETRIES}): ${errorMessage}`
            );

            // Exponential backoff
            const delay = this.RETRY_DELAY_MS * Math.pow(2, this.retryCount - 1);

            await new Promise(resolve => setTimeout(resolve, delay));

            // Retry initialization
            await this.initialize(config);
        } else {
            errorService.error(
                `FileWatcherService failed after ${this.MAX_RETRIES} retries: ${errorMessage}`
            );
        }
    }

    /**
     * Check if service is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get number of active watchers
     */
    public getWatcherCount(): number {
        return this.watchers.length;
    }

    /**
     * Get number of subscribers
     */
    public getSubscriberCount(): number {
        return this.subscribers.length;
    }

    /**
     * Dispose only watchers (for re-initialization)
     */
    private disposeWatchers(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        this.watchers = [];
        this.initialized = false;
    }

    /**
     * Dispose all resources
     * Task 7.3: Cleanup on extension deactivation
     */
    public dispose(): void {
        // Clear pending debounce
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }

        // Clear pending changes
        this.pendingChanges.clear();

        // Clear subscribers
        this.subscribers = [];

        // Dispose all watchers
        this.disposeWatchers();
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Get FileWatcherService singleton instance
 * Task 8.2: Factory function matching other services
 */
export function getFileWatcherService(): FileWatcherService {
    return FileWatcherService.getInstance();
}
