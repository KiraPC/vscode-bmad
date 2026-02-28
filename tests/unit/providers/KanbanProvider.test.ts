/**
 * KanbanProvider Unit Tests
 * Story 5.1: KanbanProvider Base Implementation
 * Task 7.1-7.4: Unit tests for Kanban WebView panel
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import * as vscode from 'vscode';
import { KanbanProvider } from '../../../src/providers/KanbanProvider';

// ============================================================================
// Mocks
// ============================================================================

// Mock panel instance
const mockPanel = {
    webview: {
        html: '',
        options: {},
        postMessage: vi.fn(),
        onDidReceiveMessage: vi.fn(() => ({ dispose: vi.fn() })),
        asWebviewUri: vi.fn((uri: any) => ({ toString: () => `vscode-resource:${uri.path}` })),
        cspSource: 'https://webview.vscode-cdn.net',
    },
    reveal: vi.fn(),
    onDidDispose: vi.fn((cb: () => void) => {
        // Store callback for later invocation
        (mockPanel as any)._disposeCallback = cb;
        return { dispose: vi.fn() };
    }),
    onDidChangeViewState: vi.fn(() => ({ dispose: vi.fn() })),
    visible: true,
    dispose: vi.fn(),
};

// Story 5.6: Mock fs.stat for file existence checks
let mockFsStatResult: 'exists' | 'not-exists' = 'exists';

// Mock vscode module
vi.mock('vscode', () => {
    return {
        Uri: {
            file: (path: string) => ({ fsPath: path, path }),
            joinPath: (...args: any[]) => ({
                fsPath: args.map((a: any) => (typeof a === 'string' ? a : a.fsPath)).join('/'),
                path: args.map((a: any) => (typeof a === 'string' ? a : a.path)).join('/'),
            }),
        },
        window: {
            createWebviewPanel: vi.fn(() => mockPanel),
            showTextDocument: vi.fn(),
            showErrorMessage: vi.fn(),
        },
        commands: {
            executeCommand: vi.fn(),
        },
        ViewColumn: {
            One: 1,
            Two: 2,
        },
        workspace: {
            workspaceFolders: [
                {
                    uri: { fsPath: '/test/workspace' },
                },
            ],
            fs: {
                stat: vi.fn().mockImplementation(() => {
                    if (mockFsStatResult === 'not-exists') {
                        return Promise.reject(new Error('File not found'));
                    }
                    return Promise.resolve({ type: 1 });
                }),
            },
        },
    };
});

// ============================================================================
// Test Helpers
// ============================================================================

function createMockExtensionUri(): vscode.Uri {
    return {
        fsPath: '/test/extension',
        path: '/test/extension',
    } as vscode.Uri;
}

function createMockConfigService() {
    return {
        hasBmadProject: vi.fn().mockResolvedValue(true),
        getConfig: vi.fn().mockResolvedValue({
            success: true,
            data: {
                projectName: 'test-project',
                userName: 'TestUser',
                communicationLanguage: 'English',
                planningArtifacts: '/test/planning',
                implementationArtifacts: '/test/implementation',
            },
        }),
        getProjectState: vi.fn().mockResolvedValue({
            success: true,
            data: 'epics-ready',
        }),
        dispose: vi.fn(),
    };
}

function createMockErrorService() {
    return {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        handleError: vi.fn(),
    };
}

function createMockExtensionContext(): vscode.ExtensionContext {
    const workspaceState = new Map<string, any>();
    return {
        extensionUri: createMockExtensionUri(),
        workspaceState: {
            get: vi.fn((key: string) => workspaceState.get(key)),
            update: vi.fn((key: string, value: any) => {
                workspaceState.set(key, value);
                return Promise.resolve();
            }),
        },
        subscriptions: [],
    } as unknown as vscode.ExtensionContext;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('KanbanProvider', () => {
    let provider: KanbanProvider;
    let mockConfigService: ReturnType<typeof createMockConfigService>;
    let mockErrorService: ReturnType<typeof createMockErrorService>;
    let mockContext: vscode.ExtensionContext;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        mockPanel.webview.html = '';
        (mockPanel as any)._disposeCallback = undefined;
        // Story 5.6: Reset file stat mock to success
        mockFsStatResult = 'exists';

        // Create fresh mock services
        mockConfigService = createMockConfigService();
        mockErrorService = createMockErrorService();
        mockContext = createMockExtensionContext();

        // Create provider instance
        provider = new KanbanProvider(
            createMockExtensionUri(),
            mockConfigService as any,
            mockErrorService as any,
            mockContext
        );
    });

    afterEach(() => {
        provider.dispose();
    });

    // ========================================================================
    // Task 1: KanbanProvider Class Structure
    // ========================================================================

    describe('Class Structure', () => {
        it('should have static viewType constant', () => {
            // Task 1.2: Static viewType constant
            expect(KanbanProvider.viewType).toBe('bmad-kanban');
        });

        it('should accept required dependencies in constructor', () => {
            // Task 1.4: Constructor with dependencies
            expect(provider).toBeInstanceOf(KanbanProvider);
        });

        it('should initially have no visible panel', () => {
            // Task 1.3: Private panel reference initially undefined
            expect(provider.isVisible).toBe(false);
        });
    });

    // ========================================================================
    // Task 2: createOrShow() Method
    // ========================================================================

    describe('createOrShow()', () => {
        it('should create a new WebView panel on first call (AC #1)', () => {
            // Task 2.2: Create new WebviewPanel
            provider.createOrShow();

            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'bmad-kanban',
                'BMAD Kanban', // Task 2.3: Panel title
                vscode.ViewColumn.One, // Task 2.2: Editor area
                expect.objectContaining({
                    enableScripts: true,
                    retainContextWhenHidden: true, // Task 2.5
                })
            );
        });

        it('should reveal existing panel instead of creating new one (AC #2)', () => {
            // Task 2.1: Check for existing panel
            provider.createOrShow();
            provider.createOrShow();

            // Should only create once
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
            // Should reveal on second call
            expect(mockPanel.reveal).toHaveBeenCalledTimes(1);
        });

        it('should open panel in specified ViewColumn', () => {
            provider.createOrShow(vscode.ViewColumn.Two);

            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                vscode.ViewColumn.Two,
                expect.any(Object)
            );
        });

        it('should set up message handler', () => {
            // Task 4.1: Message handler setup
            provider.createOrShow();

            expect(mockPanel.webview.onDidReceiveMessage).toHaveBeenCalledTimes(1);
        });

        it('should set up dispose handler', () => {
            // Task 5.4: Dispose handler setup
            provider.createOrShow();

            expect(mockPanel.onDidDispose).toHaveBeenCalledTimes(1);
        });
    });

    // ========================================================================
    // Task 3: WebView HTML Content
    // ========================================================================

    describe('HTML Content Generation', () => {
        it('should generate HTML with CSP (NFR-S1)', () => {
            // Task 3.3: CSP with webview.cspSource
            provider.createOrShow();

            const html = mockPanel.webview.html;
            expect(html).toContain('Content-Security-Policy');
            expect(html).toContain(mockPanel.webview.cspSource);
        });

        it('should generate HTML with correct title', () => {
            provider.createOrShow();

            const html = mockPanel.webview.html;
            expect(html).toContain('<title>BMAD Kanban</title>');
        });

        it('should include script and style URIs', () => {
            // Task 3.2: Build URIs for assets
            provider.createOrShow();

            const html = mockPanel.webview.html;
            expect(html).toContain('index.js');
            expect(html).toContain('index.css');
        });

        it('should have app mount point', () => {
            provider.createOrShow();

            const html = mockPanel.webview.html;
            expect(html).toContain('<div id="app"></div>');
        });

        it('should include VS Code theme support', () => {
            // Task 3.4: HTML template with VS Code theme variables
            provider.createOrShow();

            const html = mockPanel.webview.html;
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<html lang="en">');
        });
    });

    // ========================================================================
    // Task 4: PostMessage Communication
    // ========================================================================

    describe('PostMessage Communication', () => {
        it('should handle ready message (Task 4.3)', () => {
            provider.createOrShow();

            // Get the message handler
            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            // Simulate ready message
            messageHandler({ type: 'ready', payload: { webviewId: 'kanban' } });

            // Should log ready message
            expect(mockErrorService.info).toHaveBeenCalledWith('Kanban WebView ready');
        });

        it('should handle openFile message', async () => {
            provider.createOrShow();

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            // Story 5.6: _openFile is now async, so we need to await the handler
            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/file.md' },
            });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'vscode.open',
                expect.objectContaining({ fsPath: '/test/file.md' })
            );
        });

        it('should handle executeCommand message', () => {
            provider.createOrShow();

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            messageHandler({
                type: 'executeCommand',
                payload: { command: 'workbench.action.files.newUntitledFile', args: [] },
            });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'workbench.action.files.newUntitledFile'
            );
        });

        it('should log warning for unknown message type', () => {
            provider.createOrShow();

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            messageHandler({ type: 'unknownType', payload: {} });

            expect(mockErrorService.warn).toHaveBeenCalled();
        });

        it('should send messages to webview (Task 4.4)', () => {
            provider.createOrShow();

            provider.postMessage({
                type: 'dataLoaded',
                payload: { epics: [], stories: [] },
            });

            expect(mockPanel.webview.postMessage).toHaveBeenCalledWith({
                type: 'dataLoaded',
                payload: { epics: [], stories: [] },
            });
        });

        it('should not fail when posting message without panel', () => {
            // No createOrShow called
            expect(() => {
                provider.postMessage({
                    type: 'dataLoaded',
                    payload: { epics: [], stories: [] },
                });
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Task 5: State Serialization
    // ========================================================================

    describe('State Serialization', () => {
        it('should save state to workspaceState (Task 5.2)', async () => {
            const state = { activeView: 'stories' as const, epicFilter: 'epic-1' };

            await provider.saveState(state);

            expect(mockContext.workspaceState.update).toHaveBeenCalledWith(
                'bmad.kanban.state',
                state
            );
        });

        it('should retrieve stored state (Task 5.3)', async () => {
            const state = { activeView: 'epics' as const };
            await provider.saveState(state);

            const retrieved = provider.getStoredState();

            expect(mockContext.workspaceState.get).toHaveBeenCalledWith('bmad.kanban.state');
        });

        it('should return undefined when no state stored', () => {
            const retrieved = provider.getStoredState();

            expect(retrieved).toBeUndefined();
        });

        it('should clean up on dispose (Task 5.4)', () => {
            provider.createOrShow();

            // Trigger dispose callback
            const disposeCallback = (mockPanel as any)._disposeCallback;
            if (disposeCallback) {
                disposeCallback();
            }

            // Panel reference should be cleared
            expect(provider.isVisible).toBe(false);
        });
    });

    // ========================================================================
    // Integration Tests
    // ========================================================================

    describe('Integration', () => {
        it('should handle full panel lifecycle', () => {
            // Create panel
            provider.createOrShow();
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);

            // Reveal existing
            provider.createOrShow();
            expect(mockPanel.reveal).toHaveBeenCalledTimes(1);

            // Dispose
            provider.dispose();
            expect(mockPanel.dispose).toHaveBeenCalled();
        });

        it('should create new panel after dispose', () => {
            provider.createOrShow();
            
            // Simulate panel disposal
            const disposeCallback = (mockPanel as any)._disposeCallback;
            if (disposeCallback) {
                disposeCallback();
            }

            // Clear the mock before second call
            (vscode.window.createWebviewPanel as Mock).mockClear();

            // Should create new panel
            provider.createOrShow();
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
        });

        it('should handle view state changes', () => {
            provider.createOrShow();

            // Get the view state change handler
            const viewStateHandler = (mockPanel.onDidChangeViewState as Mock).mock.calls[0][0];

            // Simulate view becoming visible
            viewStateHandler({ webviewPanel: { visible: true } });

            expect(mockErrorService.info).toHaveBeenCalledWith('Kanban panel became visible');
        });
    });

    // ========================================================================
    // Story 5.6: Story Card Click - Markdown Preview
    // ========================================================================

    describe('Story 5.6: Markdown Preview and Error Handling', () => {
        it('should open markdown file in preview mode when preview=true (AC #2)', async () => {
            provider.createOrShow();

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            // Simulate openFile message with preview flag
            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/story.md', preview: true },
            });

            // Should use markdown.showPreview command
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'markdown.showPreview',
                expect.objectContaining({ fsPath: '/test/story.md' })
            );
        });

        it('should open non-markdown file normally even with preview=true', async () => {
            provider.createOrShow();

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/file.ts', preview: true },
            });

            // Should use vscode.open for non-markdown files
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'vscode.open',
                expect.objectContaining({ fsPath: '/test/file.ts' })
            );
        });

        it('should open file normally when preview=false (default behavior)', async () => {
            provider.createOrShow();

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/file.md', preview: false },
            });

            // Should use vscode.open when preview is false
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'vscode.open',
                expect.objectContaining({ fsPath: '/test/file.md' })
            );
        });

        it('should open file normally when preview is undefined (backward compatibility)', async () => {
            provider.createOrShow();

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/file.md' },
            });

            // Should use vscode.open when preview is undefined
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'vscode.open',
                expect.objectContaining({ fsPath: '/test/file.md' })
            );
        });

        it('should show error notification when file does not exist (AC #3)', async () => {
            provider.createOrShow();
            mockFsStatResult = 'not-exists';

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/missing.md', preview: true },
            });

            // Should show error message
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Story file not found')
            );
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('File may have been moved or deleted')
            );
        });

        it('should log warning when file does not exist', async () => {
            provider.createOrShow();
            mockFsStatResult = 'not-exists';

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/missing.md', preview: true },
            });

            expect(mockErrorService.warn).toHaveBeenCalledWith(
                expect.stringContaining('Story file not found')
            );
        });

        it('should not execute open command when file does not exist', async () => {
            provider.createOrShow();
            mockFsStatResult = 'not-exists';

            const messageHandler = (mockPanel.webview.onDidReceiveMessage as Mock).mock.calls[0][0];

            await messageHandler({
                type: 'openFile',
                payload: { filePath: '/test/missing.md', preview: true },
            });

            // Should not call any open commands
            expect(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
                'markdown.showPreview',
                expect.any(Object)
            );
            expect(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
                'vscode.open',
                expect.any(Object)
            );
        });
    });

    // ========================================================================
    // Story 5.7: Kanban Auto-Refresh
    // ========================================================================

    describe('Auto-Refresh with FileWatcher (Story 5.7)', () => {
        let mockFileWatcherService: {
            subscribe: Mock;
            isInitialized: Mock;
        };

        beforeEach(() => {
            mockFileWatcherService = {
                subscribe: vi.fn().mockReturnValue({ dispose: vi.fn() }),
                isInitialized: vi.fn().mockReturnValue(true),
            };
        });

        it('should subscribe to FileWatcher when panel opens (AC #1)', () => {
            // Task 6.2: Test subscription is created when panel opens
            provider = new KanbanProvider(
                createMockExtensionUri(),
                mockConfigService as any,
                mockErrorService as any,
                mockContext,
                undefined,
                undefined,
                mockFileWatcherService as any
            );

            provider.createOrShow();

            expect(mockFileWatcherService.subscribe).toHaveBeenCalledOnce();
            expect(mockFileWatcherService.subscribe).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should call refresh() when FileWatcher emits change (AC #1)', async () => {
            // Task 6.3: Test refresh() is called when FileWatcher emits change
            let capturedCallback: (() => Promise<void>) | null = null;
            mockFileWatcherService.subscribe.mockImplementation((cb) => {
                capturedCallback = cb;
                return { dispose: vi.fn() };
            });

            provider = new KanbanProvider(
                createMockExtensionUri(),
                mockConfigService as any,
                mockErrorService as any,
                mockContext,
                undefined,
                undefined,
                mockFileWatcherService as any
            );

            provider.createOrShow();

            // Simulate file change event
            expect(capturedCallback).not.toBeNull();
            await capturedCallback!();

            // Verify that data was requested (refresh sends data to webview)
            expect(mockConfigService.getConfig).toHaveBeenCalled();
        });

        it('should log performance timing on refresh (AC #1 - <300ms)', async () => {
            // Task 5.1: Test performance logging
            let capturedCallback: (() => Promise<void>) | null = null;
            mockFileWatcherService.subscribe.mockImplementation((cb) => {
                capturedCallback = cb;
                return { dispose: vi.fn() };
            });

            provider = new KanbanProvider(
                createMockExtensionUri(),
                mockConfigService as any,
                mockErrorService as any,
                mockContext,
                undefined,
                undefined,
                mockFileWatcherService as any
            );

            provider.createOrShow();

            // Simulate file change event
            await capturedCallback!();

            // Verify timing was logged
            expect(mockErrorService.info).toHaveBeenCalledWith(
                expect.stringMatching(/Kanban refresh completed in \d+ms/)
            );
        });

        it('should dispose subscription when panel closes (AC #3)', () => {
            // Task 6.4: Test subscription is disposed when panel closes
            const mockDispose = vi.fn();
            mockFileWatcherService.subscribe.mockReturnValue({ dispose: mockDispose });

            provider = new KanbanProvider(
                createMockExtensionUri(),
                mockConfigService as any,
                mockErrorService as any,
                mockContext,
                undefined,
                undefined,
                mockFileWatcherService as any
            );

            provider.createOrShow();

            // Simulate panel dispose
            const disposeCallback = (mockPanel as any)._disposeCallback;
            if (disposeCallback) {
                disposeCallback();
            }

            expect(mockDispose).toHaveBeenCalledOnce();
        });

        it('should not subscribe if FileWatcherService not provided', () => {
            // Test graceful handling when FileWatcherService is not passed
            provider = new KanbanProvider(
                createMockExtensionUri(),
                mockConfigService as any,
                mockErrorService as any,
                mockContext,
                undefined,
                undefined,
                undefined  // No FileWatcherService
            );

            provider.createOrShow();

            // Should not throw, just work without auto-refresh
            expect(mockFileWatcherService.subscribe).not.toHaveBeenCalled();
        });
    });
});
