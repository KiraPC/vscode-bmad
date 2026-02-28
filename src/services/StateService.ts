/**
 * StateService - Persist Extension State Across Reloads
 * Story 4.7: State Persistence Across Reloads
 *
 * NFR-R6: State persists across VS Code window reloads
 */

import * as vscode from 'vscode';
import { getErrorService } from './ErrorService';

// ============================================================================
// Types
// ============================================================================

/**
 * Kanban board view state
 */
export interface KanbanState {
    /** Current view mode: 'epics' or 'stories' */
    viewMode: 'epics' | 'stories';
    /** Currently selected epic filter (null = all) */
    selectedEpicId: number | null;
    /** Last known scroll position */
    scrollPosition?: number;
}

/**
 * Sidebar view state
 */
export interface SidebarState {
    /** IDs of expanded sections in sidebar */
    expandedSections: string[];
}

/**
 * Complete persistent state structure
 */
export interface PersistentState {
    /** Kanban board state */
    kanban: KanbanState;
    /** Sidebar state */
    sidebar: SidebarState;
    /** Timestamp of last save */
    lastUpdated: number;
}

/**
 * Default state values for fresh installations
 */
export const DEFAULT_STATE: PersistentState = {
    kanban: {
        viewMode: 'stories',
        selectedEpicId: null,
        scrollPosition: 0,
    },
    sidebar: {
        expandedSections: ['artifacts', 'actions'],
    },
    lastUpdated: 0,
};

// ============================================================================
// StateService Class
// ============================================================================

/**
 * Service for persisting extension state across reloads
 *
 * Uses VS Code's workspaceState API for per-workspace persistence.
 * Implements singleton pattern requiring initialization with ExtensionContext.
 */
export class StateService implements vscode.Disposable {
    private static instance: StateService | null = null;
    private context: vscode.ExtensionContext;
    private readonly STATE_KEY = 'bmad.persistentState';

    /**
     * Private constructor - use initialize() to create instance
     */
    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Initialize StateService with ExtensionContext
     * Must be called during extension activation before using getInstance()
     *
     * @param context - VS Code extension context
     * @returns The StateService instance
     */
    public static initialize(context: vscode.ExtensionContext): StateService {
        if (!StateService.instance) {
            StateService.instance = new StateService(context);
        }
        return StateService.instance;
    }

    /**
     * Get the StateService instance
     * @throws Error if not initialized
     */
    public static getInstance(): StateService {
        if (!StateService.instance) {
            throw new Error('StateService not initialized. Call initialize() first with ExtensionContext.');
        }
        return StateService.instance;
    }

    /**
     * Check if StateService has been initialized
     */
    public static isInitialized(): boolean {
        return StateService.instance !== null;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        StateService.instance = null;
    }

    // ========================================================================
    // State Operations
    // ========================================================================

    /**
     * Get the full persistent state
     * Returns default state if stored state is invalid or corrupted (AC #2)
     */
    public async getState(): Promise<PersistentState> {
        try {
            const state = this.context.workspaceState.get<PersistentState>(this.STATE_KEY);

            if (state && this.isValidState(state)) {
                return state;
            }
        } catch (error) {
            const errorService = getErrorService();
            errorService.handleError({
                code: 'STATE_LOAD_ERROR',
                message: `Failed to load state: ${String(error)}`,
                userMessage: 'Failed to load saved state, using defaults',
                recoverable: true,
                shouldNotify: false,
            });
        }

        // Return defaults on any failure (AC #2)
        return { ...DEFAULT_STATE };
    }

    /**
     * Save state with partial update support
     * Merges provided state with existing state
     *
     * @param partialState - Partial state to merge
     */
    public async saveState(partialState: Partial<PersistentState>): Promise<void> {
        try {
            const current = await this.getState();

            // Deep merge for nested objects
            const updated: PersistentState = {
                kanban: {
                    ...current.kanban,
                    ...(partialState.kanban || {}),
                },
                sidebar: {
                    ...current.sidebar,
                    ...(partialState.sidebar || {}),
                },
                lastUpdated: Date.now(),
            };

            await this.context.workspaceState.update(this.STATE_KEY, updated);
        } catch (error) {
            const errorService = getErrorService();
            errorService.handleError({
                code: 'STATE_SAVE_ERROR',
                message: `Failed to save state: ${String(error)}`,
                userMessage: 'Failed to save state',
                recoverable: true,
                shouldNotify: false,
            });
        }
    }

    // ========================================================================
    // Kanban State Shortcuts (AC #3)
    // ========================================================================

    /**
     * Get Kanban state
     */
    public async getKanbanState(): Promise<KanbanState> {
        const state = await this.getState();
        return state.kanban;
    }

    /**
     * Save Kanban state
     */
    public async saveKanbanState(kanbanState: Partial<KanbanState>): Promise<void> {
        const current = await this.getKanbanState();
        await this.saveState({
            kanban: { ...current, ...kanbanState },
        });
    }

    /**
     * Save Kanban view mode
     */
    public async setKanbanViewMode(viewMode: 'epics' | 'stories'): Promise<void> {
        await this.saveKanbanState({ viewMode });
    }

    /**
     * Save selected epic filter
     */
    public async setSelectedEpicId(epicId: number | null): Promise<void> {
        await this.saveKanbanState({ selectedEpicId: epicId });
    }

    /**
     * Save scroll position
     */
    public async setScrollPosition(position: number): Promise<void> {
        await this.saveKanbanState({ scrollPosition: position });
    }

    // ========================================================================
    // Sidebar State Shortcuts (AC #4)
    // ========================================================================

    /**
     * Get Sidebar state
     */
    public async getSidebarState(): Promise<SidebarState> {
        const state = await this.getState();
        return state.sidebar;
    }

    /**
     * Save Sidebar state
     */
    public async saveSidebarState(sidebarState: Partial<SidebarState>): Promise<void> {
        const current = await this.getSidebarState();
        await this.saveState({
            sidebar: { ...current, ...sidebarState },
        });
    }

    /**
     * Toggle a sidebar section expansion
     */
    public async toggleSidebarSection(sectionId: string): Promise<boolean> {
        const current = await this.getSidebarState();
        const isExpanded = current.expandedSections.includes(sectionId);

        const expandedSections = isExpanded
            ? current.expandedSections.filter(id => id !== sectionId)
            : [...current.expandedSections, sectionId];

        await this.saveSidebarState({ expandedSections });
        return !isExpanded;
    }

    /**
     * Set expanded sections
     */
    public async setExpandedSections(sectionIds: string[]): Promise<void> {
        await this.saveSidebarState({ expandedSections: sectionIds });
    }

    // ========================================================================
    // Clear / Reset
    // ========================================================================

    /**
     * Clear all persisted state and reset to defaults
     */
    public async clearState(): Promise<void> {
        try {
            await this.context.workspaceState.update(this.STATE_KEY, undefined);
        } catch (error) {
            const errorService = getErrorService();
            errorService.handleError({
                code: 'STATE_CLEAR_ERROR',
                message: `Failed to clear state: ${String(error)}`,
                userMessage: 'Failed to clear state',
                recoverable: true,
                shouldNotify: false,
            });
        }
    }

    // ========================================================================
    // Validation
    // ========================================================================

    /**
     * Type guard to validate state structure
     * Returns false for invalid/corrupted state
     */
    private isValidState(state: unknown): state is PersistentState {
        if (typeof state !== 'object' || state === null) {
            return false;
        }

        const s = state as Record<string, unknown>;

        // Check kanban property
        if (typeof s.kanban !== 'object' || s.kanban === null) {
            return false;
        }

        const kanban = s.kanban as Record<string, unknown>;
        if (typeof kanban.viewMode !== 'string') {
            return false;
        }
        if (!['epics', 'stories'].includes(kanban.viewMode)) {
            return false;
        }

        // Check sidebar property
        if (typeof s.sidebar !== 'object' || s.sidebar === null) {
            return false;
        }

        const sidebar = s.sidebar as Record<string, unknown>;
        if (!Array.isArray(sidebar.expandedSections)) {
            return false;
        }

        return true;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        // No resources to dispose
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Get the StateService instance
 * @throws Error if not initialized
 */
export function getStateService(): StateService {
    return StateService.getInstance();
}

/**
 * Initialize StateService (called from extension.ts)
 */
export function initializeStateService(context: vscode.ExtensionContext): StateService {
    return StateService.initialize(context);
}
