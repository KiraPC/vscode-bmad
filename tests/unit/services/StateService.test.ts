/**
 * StateService Unit Tests
 * Story 4.7: State Persistence Across Reloads
 * Task 9: Unit tests for state persistence
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ExtensionContext, Memento } from 'vscode';
import {
    StateService,
    getStateService,
    initializeStateService,
    DEFAULT_STATE,
    type PersistentState,
    type KanbanState,
} from '../../../src/services/StateService';

// Mock ErrorService
vi.mock('../../../src/services/ErrorService', () => ({
    ErrorService: {
        getInstance: vi.fn(() => ({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            log: vi.fn(),
            handleError: vi.fn(),
        })),
        resetInstance: vi.fn(),
    },
    getErrorService: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        handleError: vi.fn(),
    })),
}));

// Mock vscode (minimal)
vi.mock('vscode', () => ({}));

/**
 * Create a mock Memento (workspaceState/globalState)
 */
function createMockMemento(): Memento {
    const storage = new Map<string, unknown>();

    return {
        keys: () => Array.from(storage.keys()),
        get: vi.fn(<T>(key: string, defaultValue?: T): T | undefined => {
            if (storage.has(key)) {
                return storage.get(key) as T;
            }
            return defaultValue;
        }),
        update: vi.fn(async (key: string, value: unknown): Promise<void> => {
            if (value === undefined) {
                storage.delete(key);
            } else {
                storage.set(key, value);
            }
        }),
    };
}

/**
 * Create a mock globalState with setKeysForSync
 */
function createMockGlobalState(): Memento & { setKeysForSync(keys: readonly string[]): void } {
    const memento = createMockMemento();
    return {
        ...memento,
        setKeysForSync: vi.fn(),
    };
}

/**
 * Create a mock ExtensionContext
 */
function createMockContext(): ExtensionContext {
    return {
        workspaceState: createMockMemento(),
        globalState: createMockGlobalState(),
        subscriptions: [],
        extensionPath: '/mock/extension',
        extensionUri: { fsPath: '/mock/extension' } as unknown as ExtensionContext['extensionUri'],
        storagePath: '/mock/storage',
        storageUri: { fsPath: '/mock/storage' } as unknown as ExtensionContext['storageUri'],
        globalStoragePath: '/mock/global-storage',
        globalStorageUri: { fsPath: '/mock/global-storage' } as unknown as ExtensionContext['globalStorageUri'],
        logPath: '/mock/log',
        logUri: { fsPath: '/mock/log' } as unknown as ExtensionContext['logUri'],
        extensionMode: 1, // Development
        asAbsolutePath: vi.fn((p: string) => `/mock/extension/${p}`),
        environmentVariableCollection: {} as unknown as ExtensionContext['environmentVariableCollection'],
        secrets: {} as unknown as ExtensionContext['secrets'],
        extension: {} as unknown as ExtensionContext['extension'],
        languageModelAccessInformation: {} as unknown as ExtensionContext['languageModelAccessInformation'],
    };
}

describe('StateService', () => {
    let mockContext: ExtensionContext;

    beforeEach(() => {
        StateService.resetInstance();
        mockContext = createMockContext();
    });

    afterEach(() => {
        StateService.resetInstance();
    });

    // ========================================================================
    // Singleton Pattern Tests
    // ========================================================================

    describe('singleton pattern', () => {
        it('should initialize with context', () => {
            const service = initializeStateService(mockContext);

            expect(service).toBeDefined();
            expect(StateService.isInitialized()).toBe(true);
        });

        it('should return same instance on multiple initialize calls', () => {
            const instance1 = initializeStateService(mockContext);
            const instance2 = initializeStateService(mockContext);

            expect(instance1).toBe(instance2);
        });

        it('should return same instance via factory function', () => {
            initializeStateService(mockContext);
            const instance1 = getStateService();
            const instance2 = getStateService();

            expect(instance1).toBe(instance2);
        });

        it('should throw if getInstance called before initialize', () => {
            expect(() => StateService.getInstance()).toThrow('StateService not initialized');
        });

        it('should create new instance after reset', () => {
            const instance1 = initializeStateService(mockContext);
            StateService.resetInstance();
            const instance2 = initializeStateService(mockContext);

            expect(instance1).not.toBe(instance2);
        });

        it('should report not initialized after reset', () => {
            initializeStateService(mockContext);
            expect(StateService.isInitialized()).toBe(true);

            StateService.resetInstance();
            expect(StateService.isInitialized()).toBe(false);
        });
    });

    // ========================================================================
    // State Load Tests (AC #1)
    // ========================================================================

    describe('getState (AC #1)', () => {
        it('should return default state when no state stored', async () => {
            const service = initializeStateService(mockContext);

            const state = await service.getState();

            expect(state).toEqual(DEFAULT_STATE);
        });

        it('should return stored state when valid', async () => {
            const storedState: PersistentState = {
                kanban: {
                    viewMode: 'epics',
                    selectedEpicId: 3,
                    scrollPosition: 150,
                },
                sidebar: {
                    expandedSections: ['section1', 'section2'],
                },
                lastUpdated: 12345,
            };

            await mockContext.workspaceState.update('bmad.persistentState', storedState);
            const service = initializeStateService(mockContext);

            const state = await service.getState();

            expect(state.kanban.viewMode).toBe('epics');
            expect(state.kanban.selectedEpicId).toBe(3);
            expect(state.sidebar.expandedSections).toEqual(['section1', 'section2']);
        });
    });

    // ========================================================================
    // State Save Tests (AC #1)
    // ========================================================================

    describe('saveState (AC #1)', () => {
        it('should save state to workspaceState', async () => {
            const service = initializeStateService(mockContext);

            await service.saveState({
                kanban: {
                    viewMode: 'epics',
                    selectedEpicId: 5,
                },
            });

            expect(mockContext.workspaceState.update).toHaveBeenCalled();
        });

        it('should merge partial state with existing', async () => {
            const service = initializeStateService(mockContext);

            // Save initial state
            await service.saveState({
                kanban: { viewMode: 'epics', selectedEpicId: null },
            });

            // Update only selectedEpicId
            await service.saveState({
                kanban: { viewMode: 'stories', selectedEpicId: 3 },
            });

            const state = await service.getState();

            expect(state.kanban.viewMode).toBe('stories');
            expect(state.kanban.selectedEpicId).toBe(3);
        });

        it('should update lastUpdated timestamp', async () => {
            const service = initializeStateService(mockContext);
            const before = Date.now();

            await service.saveState({
                kanban: { viewMode: 'epics', selectedEpicId: null },
            });

            const state = await service.getState();
            const after = Date.now();

            expect(state.lastUpdated).toBeGreaterThanOrEqual(before);
            expect(state.lastUpdated).toBeLessThanOrEqual(after);
        });
    });

    // ========================================================================
    // Fallback Tests (AC #2)
    // ========================================================================

    describe('graceful fallback (AC #2)', () => {
        it('should return default state for invalid state structure', async () => {
            // Store invalid state
            await mockContext.workspaceState.update('bmad.persistentState', {
                invalid: 'structure',
            });

            const service = initializeStateService(mockContext);
            const state = await service.getState();

            expect(state).toEqual(DEFAULT_STATE);
        });

        it('should return default state for null kanban', async () => {
            await mockContext.workspaceState.update('bmad.persistentState', {
                kanban: null,
                sidebar: { expandedSections: [] },
            });

            const service = initializeStateService(mockContext);
            const state = await service.getState();

            expect(state).toEqual(DEFAULT_STATE);
        });

        it('should return default state for invalid viewMode', async () => {
            await mockContext.workspaceState.update('bmad.persistentState', {
                kanban: { viewMode: 'invalid', selectedEpicId: null },
                sidebar: { expandedSections: [] },
            });

            const service = initializeStateService(mockContext);
            const state = await service.getState();

            expect(state).toEqual(DEFAULT_STATE);
        });

        it('should return default state for missing expandedSections array', async () => {
            await mockContext.workspaceState.update('bmad.persistentState', {
                kanban: { viewMode: 'stories', selectedEpicId: null },
                sidebar: { expandedSections: 'not-an-array' },
            });

            const service = initializeStateService(mockContext);
            const state = await service.getState();

            expect(state).toEqual(DEFAULT_STATE);
        });
    });

    // ========================================================================
    // Kanban State Shortcuts Tests (AC #3)
    // ========================================================================

    describe('Kanban state shortcuts (AC #3)', () => {
        it('should get kanban state', async () => {
            const storedState: PersistentState = {
                kanban: { viewMode: 'epics', selectedEpicId: 2, scrollPosition: 100 },
                sidebar: { expandedSections: [] },
                lastUpdated: 0,
            };
            await mockContext.workspaceState.update('bmad.persistentState', storedState);

            const service = initializeStateService(mockContext);
            const kanban = await service.getKanbanState();

            expect(kanban.viewMode).toBe('epics');
            expect(kanban.selectedEpicId).toBe(2);
            expect(kanban.scrollPosition).toBe(100);
        });

        it('should save kanban view mode', async () => {
            const service = initializeStateService(mockContext);

            await service.setKanbanViewMode('epics');

            const kanban = await service.getKanbanState();
            expect(kanban.viewMode).toBe('epics');
        });

        it('should save selected epic id', async () => {
            const service = initializeStateService(mockContext);

            await service.setSelectedEpicId(7);

            const kanban = await service.getKanbanState();
            expect(kanban.selectedEpicId).toBe(7);
        });

        it('should save scroll position', async () => {
            const service = initializeStateService(mockContext);

            await service.setScrollPosition(500);

            const kanban = await service.getKanbanState();
            expect(kanban.scrollPosition).toBe(500);
        });
    });

    // ========================================================================
    // Sidebar State Shortcuts Tests (AC #4)
    // ========================================================================

    describe('Sidebar state shortcuts (AC #4)', () => {
        it('should get sidebar state', async () => {
            const storedState: PersistentState = {
                kanban: { viewMode: 'stories', selectedEpicId: null },
                sidebar: { expandedSections: ['section1', 'section2'] },
                lastUpdated: 0,
            };
            await mockContext.workspaceState.update('bmad.persistentState', storedState);

            const service = initializeStateService(mockContext);
            const sidebar = await service.getSidebarState();

            expect(sidebar.expandedSections).toEqual(['section1', 'section2']);
        });

        it('should set expanded sections', async () => {
            const service = initializeStateService(mockContext);

            await service.setExpandedSections(['a', 'b', 'c']);

            const sidebar = await service.getSidebarState();
            expect(sidebar.expandedSections).toEqual(['a', 'b', 'c']);
        });

        it('should toggle section expansion - expand', async () => {
            const service = initializeStateService(mockContext);
            await service.setExpandedSections(['existing']);

            const isNowExpanded = await service.toggleSidebarSection('new-section');

            expect(isNowExpanded).toBe(true);
            const sidebar = await service.getSidebarState();
            expect(sidebar.expandedSections).toContain('new-section');
            expect(sidebar.expandedSections).toContain('existing');
        });

        it('should toggle section expansion - collapse', async () => {
            const service = initializeStateService(mockContext);
            await service.setExpandedSections(['section1', 'section2']);

            const isNowExpanded = await service.toggleSidebarSection('section1');

            expect(isNowExpanded).toBe(false);
            const sidebar = await service.getSidebarState();
            expect(sidebar.expandedSections).not.toContain('section1');
            expect(sidebar.expandedSections).toContain('section2');
        });
    });

    // ========================================================================
    // Clear State Tests
    // ========================================================================

    describe('clearState', () => {
        it('should clear stored state', async () => {
            const service = initializeStateService(mockContext);

            // Set some state
            await service.saveState({
                kanban: { viewMode: 'epics', selectedEpicId: 5 },
            });

            // Clear it
            await service.clearState();

            // Should return defaults now
            const state = await service.getState();
            expect(state).toEqual(DEFAULT_STATE);
        });
    });
});
