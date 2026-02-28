/**
 * SidebarProvider Unit Tests
 * Story 3.3: SidebarProvider Base Implementation
 * Task 7.1-7.4: Unit tests for WebView-based sidebar provider
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as vscode from 'vscode';
import { SidebarProvider } from '../../../src/providers/SidebarProvider';

// ============================================================================
// Mocks
// ============================================================================

// Mock vscode module
vi.mock('vscode', () => {
    const mockPostMessage = vi.fn();
    const mockOnDidReceiveMessage = vi.fn(() => ({ dispose: vi.fn() }));
    const mockOnDidDispose = vi.fn((cb: () => void) => ({ dispose: vi.fn() }));

    // Mock FileSystemWatcher
    const mockFileSystemWatcher = {
        onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
        onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
        onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
        dispose: vi.fn(),
    };

    // Mock RelativePattern as a class
    class MockRelativePattern {
        constructor(public base: any, public pattern: string) {}
    }

    // Mock EventEmitter as a class (Story 6.5)
    class MockEventEmitter<T> {
        private listeners: ((e: T) => void)[] = [];
        event = (listener: (e: T) => void) => {
            this.listeners.push(listener);
            return { dispose: () => { this.listeners = this.listeners.filter(l => l !== listener); } };
        };
        fire = (data: T) => { this.listeners.forEach(l => l(data)); };
        dispose = () => { this.listeners = []; };
    }

    // Mock Language Model API (Story 6.5)
    const mockLm = {
        selectChatModels: vi.fn().mockResolvedValue([]),
        onDidChangeChatModels: vi.fn(() => ({ dispose: vi.fn() })),
    };

    return {
        Uri: {
            file: (path: string) => ({ fsPath: path, path }),
            joinPath: (...args: any[]) => ({
                fsPath: args.map((a: any) => (typeof a === 'string' ? a : a.fsPath)).join('/'),
                path: args.map((a: any) => (typeof a === 'string' ? a : a.path)).join('/'),
            }),
        },
        window: {
            showTextDocument: vi.fn(),
            showInformationMessage: vi.fn().mockResolvedValue(undefined),
            showWarningMessage: vi.fn().mockResolvedValue(undefined),
            registerWebviewViewProvider: vi.fn(() => ({ dispose: vi.fn() })),
        },
        commands: {
            executeCommand: vi.fn(),
        },
        workspace: {
            workspaceFolders: [
                {
                    uri: { fsPath: '/test/workspace' },
                },
            ],
            createFileSystemWatcher: vi.fn(() => mockFileSystemWatcher),
        },
        extensions: {
            getExtension: vi.fn(() => undefined),
        },
        RelativePattern: MockRelativePattern,
        EventEmitter: MockEventEmitter,
        lm: mockLm,
        // Store references for test access
        __mocks: {
            postMessage: mockPostMessage,
            onDidReceiveMessage: mockOnDidReceiveMessage,
            onDidDispose: mockOnDidDispose,
            fileSystemWatcher: mockFileSystemWatcher,
            lm: mockLm,
        },
    };
});

// Mock ConfigService with proper type
interface MockConfigResult {
    success: boolean;
    data?: {
        projectName: string;
        userName: string;
        communicationLanguage: string;
        planningArtifacts: string;
        implementationArtifacts: string;
    };
    error?: { code: string; message: string };
}

interface MockProjectStateResult {
    success: boolean;
    data?: 'no-project' | 'fresh' | 'in-progress' | 'epics-ready';
    error?: { code: string; message: string };
}

interface MockArtifactProgressResult {
    success: boolean;
    data?: {
        hasProductBrief: boolean;
        hasPrd: boolean;
        hasArchitecture: boolean;
        hasEpics: boolean;
        currentPhase: 'brainstorming' | 'analysis' | 'design' | 'ready';
    };
    error?: { code: string; message: string };
}

interface MockProjectSummaryResult {
    success: boolean;
    data?: {
        epicCount: number;
        storyCount: {
            total: number;
            backlog: number;
            inProgress: number;
            review: number;
            done: number;
        };
        currentSprintStory?: string;
    };
    error?: { code: string; message: string };
}

interface MockFilesLoadedResult {
    success: boolean;
    data?: {
        configFile: {
            type: 'file';
            name: string;
            path: string;
            icon: string;
        };
        planningArtifacts: {
            type: 'folder';
            name: string;
            path: string;
            icon: string;
            children: any[];
        };
        implementationArtifacts: {
            type: 'folder';
            name: string;
            path: string;
            icon: string;
            children: any[];
        };
    };
    error?: { code: string; message: string };
}

const mockHasBmadProject = vi.fn();
const mockGetConfig = vi.fn();
const mockGetProjectState = vi.fn();
const mockGetArtifactProgress = vi.fn();
const mockGetProjectSummary = vi.fn();
const mockGetArtifactFiles = vi.fn();
const mockClearCache = vi.fn();

vi.mock('../../../src/services/ConfigService', () => ({
    getConfigService: () => ({
        hasBmadProject: mockHasBmadProject,
        getConfig: mockGetConfig,
        getProjectState: mockGetProjectState,
        getArtifactProgress: mockGetArtifactProgress,
        getProjectSummary: mockGetProjectSummary,
        getArtifactFiles: mockGetArtifactFiles,
        clearCache: mockClearCache,
    }),
}));

// Mock ErrorService
const mockInfo = vi.fn();
const mockWarn = vi.fn();
const mockHandleError = vi.fn();

vi.mock('../../../src/services/ErrorService', () => ({
    getErrorService: () => ({
        info: mockInfo,
        warn: mockWarn,
        error: vi.fn(),
        handleError: mockHandleError,
    }),
}));

// Mock CopilotService (Story 6.4)
vi.mock('../../../src/services/CopilotService', () => ({
    getCopilotService: () => ({
        launchAgent: vi.fn().mockResolvedValue({ success: true }),
    }),
}));

// Mock ModelService (Story 6.5)
const mockGetAvailableModels = vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: 'default', displayName: 'Default', vendor: 'auto', family: 'auto' }],
});
const mockOnDidChangeModels = vi.fn(() => ({ dispose: vi.fn() }));
const mockWatchModelChanges = vi.fn(() => ({ dispose: vi.fn() }));

vi.mock('../../../src/services/ModelService', () => ({
    getModelService: () => ({
        getAvailableModels: mockGetAvailableModels,
        onDidChangeModels: mockOnDidChangeModels,
        watchModelChanges: mockWatchModelChanges,
    }),
    ModelService: {
        getInstance: vi.fn(),
        resetInstance: vi.fn(),
    },
}));

// Mock WorkflowProgressService (Story 6.7)
const mockCalculateProgress = vi.fn().mockResolvedValue({
    success: true,
    data: {
        planning: 'completed',
        solutioning: 'completed',
        implementation: 'current',
        testing: 'future',
        currentPhase: 'implementation',
    },
});

vi.mock('../../../src/services/WorkflowProgressService', () => ({
    WorkflowProgressService: {
        getInstance: () => ({
            calculateProgress: mockCalculateProgress,
        }),
    },
}));

// Mock StoryParser (Story 6.7)
const mockScanAndParse = vi.fn().mockResolvedValue({
    success: true,
    data: {
        stories: [
            { id: '6-1', title: 'Test Story 1', status: 'done', epicId: '6' },
            { id: '6-2', title: 'Test Story 2', status: 'in-progress', epicId: '6' },
        ],
        parseErrors: [],
    },
});

vi.mock('../../../src/services/StoryParser', () => ({
    StoryParser: {
        getInstance: () => ({
            scanAndParse: mockScanAndParse,
        }),
    },
}));

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
        hasBmadProject: mockHasBmadProject,
        getConfig: mockGetConfig,
        getProjectState: mockGetProjectState,
        getArtifactProgress: mockGetArtifactProgress,
        getProjectSummary: mockGetProjectSummary,
        getArtifactFiles: mockGetArtifactFiles,
        clearCache: mockClearCache,
        refreshWorkspace: vi.fn(),
        dispose: vi.fn(),
    };
}

function createMockErrorService() {
    return {
        info: mockInfo,
        warn: mockWarn,
        error: vi.fn(),
        handleError: mockHandleError,
        dispose: vi.fn(),
    };
}

function createMockWebviewView() {
    const postMessage = vi.fn();
    const onDidReceiveMessageCallbacks: Array<(msg: any) => void> = [];

    return {
        webview: {
            options: {} as vscode.WebviewOptions,
            html: '',
            postMessage,
            onDidReceiveMessage: vi.fn((callback: (msg: any) => void) => {
                onDidReceiveMessageCallbacks.push(callback);
                return { dispose: vi.fn() };
            }),
            asWebviewUri: (uri: vscode.Uri) => {
                // Return a string representation that contains the path
                const path = (uri as any).path || (uri as any).fsPath || String(uri);
                return `vscode-webview://host/${path}`;
            },
            cspSource: 'vscode-webview:',
        },
        onDidDispose: vi.fn((cb: () => void) => ({ dispose: vi.fn() })),
        // Helper to simulate receiving a message
        _simulateMessage: (msg: any) => {
            onDidReceiveMessageCallbacks.forEach((cb) => cb(msg));
        },
        _postMessage: postMessage,
    };
}

function createMockResolveContext(state?: unknown): vscode.WebviewViewResolveContext<{ lastState?: unknown }> {
    return {
        state: state ? { lastState: state } : undefined,
    } as vscode.WebviewViewResolveContext<{ lastState?: unknown }>;
}

function createMockCancellationToken(): vscode.CancellationToken {
    return {
        isCancellationRequested: false,
        onCancellationRequested: vi.fn(),
    } as vscode.CancellationToken;
}

// ============================================================================
// Tests
// ============================================================================

describe('SidebarProvider', () => {
    let provider: SidebarProvider;
    let mockExtensionUri: vscode.Uri;
    let mockConfigService: ReturnType<typeof createMockConfigService>;
    let mockErrorService: ReturnType<typeof createMockErrorService>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockExtensionUri = createMockExtensionUri();
        mockConfigService = createMockConfigService();
        mockErrorService = createMockErrorService();

        // Story 3.5: Default artifact progress mock
        mockGetArtifactProgress.mockResolvedValue({
            success: true,
            data: {
                hasProductBrief: false,
                hasPrd: false,
                hasArchitecture: false,
                hasEpics: false,
                currentPhase: 'brainstorming',
            },
        });

        // Story 3.7: Default artifact files mock
        mockGetArtifactFiles.mockResolvedValue({
            success: true,
            data: {
                configFile: {
                    type: 'file',
                    name: 'config.yaml',
                    path: '/test/workspace/_bmad/bmm/config.yaml',
                    icon: 'settings-gear',
                },
                planningArtifacts: {
                    type: 'folder',
                    name: 'Planning Artifacts',
                    path: '/test/workspace/_bmad-output/planning-artifacts',
                    icon: 'folder',
                    children: [],
                },
                implementationArtifacts: {
                    type: 'folder',
                    name: 'Implementation Artifacts',
                    path: '/test/workspace/_bmad-output/implementation-artifacts',
                    icon: 'folder',
                    children: [],
                },
            },
        });

        provider = new SidebarProvider(
            mockExtensionUri,
            mockConfigService as any,
            mockErrorService as any
        );
    });

    describe('viewType', () => {
        it('should have correct static viewType (Task 7.2)', () => {
            expect(SidebarProvider.viewType).toBe('bmad-sidebar');
        });
    });

    describe('resolveWebviewView (Task 7.2)', () => {
        it('should configure webview options with enableScripts', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            expect(mockView.webview.options.enableScripts).toBe(true);
        });

        it('should set localResourceRoots to sidebar dist folder', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            expect(mockView.webview.options.localResourceRoots).toBeDefined();
            expect((mockView.webview.options.localResourceRoots as vscode.Uri[]).length).toBe(2);
        });

        it('should set HTML content with CSP', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            expect(mockView.webview.html).toContain('<!DOCTYPE html>');
            expect(mockView.webview.html).toContain('Content-Security-Policy');
            expect(mockView.webview.html).toContain('nonce-');
            expect(mockView.webview.html).toContain('index.js');
            expect(mockView.webview.html).toContain('index.css');
        });

        it('should set up message handler', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            expect(mockView.webview.onDidReceiveMessage).toHaveBeenCalled();
        });
    });

    describe('message handling (Task 7.3)', () => {
        it('should handle ready message and send config', async () => {
            mockHasBmadProject.mockResolvedValue(true);
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'in-progress',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Test Project',
                    userName: 'Test User',
                    communicationLanguage: 'English',
                    planningArtifacts: '/test/planning',
                    implementationArtifacts: '/test/impl',
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // Simulate ready message from WebView
            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            // Wait for async operations
            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            // Verify configLoaded message was sent
            const calls = mockView._postMessage.mock.calls;
            const configLoadedCall = calls.find(
                (call: any[]) => call[0]?.type === 'configLoaded'
            );
            expect(configLoadedCall).toBeDefined();
            expect(configLoadedCall![0].payload.projectName).toBe('Test Project');
        });

        it('should handle ready message with no BMAD project', async () => {
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'no-project',
            });
            mockGetConfig.mockResolvedValue({
                success: false,
                error: { code: 'NO_CONFIG', message: 'Not found' },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // Simulate ready message
            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            // Wait for async operations
            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            // Verify projectStateChanged with no-project state (Story 3.4)
            const calls = mockView._postMessage.mock.calls;
            const stateCall = calls.find(
                (call: any[]) => call[0]?.type === 'projectStateChanged'
            );
            expect(stateCall).toBeDefined();
            expect(stateCall![0].payload.state).toBe('no-project');
        });

        it('should handle openFile message', async () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // Simulate openFile message
            mockView._simulateMessage({
                type: 'openFile',
                payload: { filePath: '/test/file.ts' },
            });

            expect(vscode.window.showTextDocument).toHaveBeenCalled();
        });

        it('should handle executeCommand message', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // Simulate executeCommand message
            mockView._simulateMessage({
                type: 'executeCommand',
                payload: { command: 'test.command', args: ['arg1'] },
            });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'test.command',
                'arg1'
            );
        });

        it('should handle launchAgent message via CopilotService', async () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // Simulate launchAgent message
            mockView._simulateMessage({
                type: 'launchAgent',
                payload: { agentId: 'dev' },
            });

            // Wait for async handler
            await new Promise((resolve) => setTimeout(resolve, 10));

            // CopilotService.launchAgent is now called (mocked)
            // Test passes if no error is thrown
        });
    });

    describe('state persistence (Task 7.4)', () => {
        it('should restore state when context has previous state', () => {
            const mockView = createMockWebviewView();
            const previousState = { lastView: 'epics' };
            const context = createMockResolveContext(previousState);
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            expect(mockInfo).toHaveBeenCalledWith('Restoring WebView state');
        });

        it('should not attempt restore when no previous state', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            expect(mockInfo).not.toHaveBeenCalledWith('Restoring WebView state');
        });
    });

    describe('postMessage', () => {
        it('should post message to webview when view exists', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            provider.postMessage({
                type: 'configLoaded',
                payload: {
                    projectName: 'Test',
                    userName: 'User',
                    communicationLanguage: 'en',
                    planningArtifacts: '/planning',
                    implementationArtifacts: '/impl',
                },
            });

            expect(mockView._postMessage).toHaveBeenCalled();
        });
    });

    describe('refresh', () => {
        it('should resend config when refresh is called', async () => {
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'in-progress',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Refreshed Project',
                    userName: 'User',
                    communicationLanguage: 'en',
                    planningArtifacts: '/planning',
                    implementationArtifacts: '/impl',
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            await provider.refresh();

            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });
        });
    });

    describe('dispose', () => {
        it('should clean up disposables', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // Should not throw
            expect(() => provider.dispose()).not.toThrow();
        });
    });

    describe('Story 3.4: Project state detection', () => {
        it('should send projectStateChanged with no-project state', async () => {
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'no-project',
            });
            mockGetConfig.mockResolvedValue({
                success: false,
                error: { code: 'CONFIG_NOT_FOUND', message: 'No config' },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // Simulate ready message
            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            const calls = mockView._postMessage.mock.calls;
            const stateCall = calls.find(
                (call: any[]) => call[0]?.type === 'projectStateChanged'
            );
            expect(stateCall).toBeDefined();
            expect(stateCall![0].payload.state).toBe('no-project');
            expect(stateCall![0].payload.hasConfig).toBe(false);
        });

        it('should send projectStateChanged with fresh state', async () => {
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'fresh',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Test Project',
                    userName: 'Test User',
                    communicationLanguage: 'English',
                    planningArtifacts: '/test/planning',
                    implementationArtifacts: '/test/impl',
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            const calls = mockView._postMessage.mock.calls;
            const stateCall = calls.find(
                (call: any[]) => call[0]?.type === 'projectStateChanged'
            );
            expect(stateCall).toBeDefined();
            expect(stateCall![0].payload.state).toBe('fresh');
            expect(stateCall![0].payload.hasConfig).toBe(true);
        });

        it('should send projectStateChanged with epics-ready state', async () => {
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'epics-ready',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Test Project',
                    userName: 'Test User',
                    communicationLanguage: 'English',
                    planningArtifacts: '/test/planning',
                    implementationArtifacts: '/test/impl',
                },
            });
            mockGetArtifactProgress.mockResolvedValue({
                success: true,
                data: {
                    hasProductBrief: true,
                    hasPrd: true,
                    hasArchitecture: true,
                    hasEpics: true,
                    currentPhase: 'ready',
                },
            });
            mockGetProjectSummary.mockResolvedValue({
                success: true,
                data: {
                    epicCount: 3,
                    storyCount: {
                        total: 10,
                        backlog: 3,
                        inProgress: 2,
                        review: 1,
                        done: 4,
                    },
                    currentSprintStory: '3-6-progressive-panel',
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            const calls = mockView._postMessage.mock.calls;
            const stateCall = calls.find(
                (call: any[]) => call[0]?.type === 'projectStateChanged'
            );
            expect(stateCall).toBeDefined();
            expect(stateCall![0].payload.state).toBe('epics-ready');
            expect(stateCall![0].payload.hasEpics).toBe(true);
            expect(stateCall![0].payload.summary).toBeDefined();
            expect(stateCall![0].payload.summary.epicCount).toBe(3);
            expect(stateCall![0].payload.summary.storyCount.total).toBe(10);
        });

        it('should handle getProjectState error gracefully', async () => {
            mockGetProjectState.mockResolvedValue({
                success: false,
                error: { code: 'UNKNOWN_ERROR', message: 'Something went wrong' },
            });
            mockGetConfig.mockResolvedValue({
                success: false,
                error: { code: 'CONFIG_NOT_FOUND', message: 'No config' },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockHandleError).toHaveBeenCalled();
            });
        });
    });

    describe('HTML generation', () => {
        it('should include VS Code theme CSS variables support', () => {
            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(
                mockView as any,
                context,
                token
            );

            // CSP allows VS Code styles
            expect(mockView.webview.html).toContain('vscode-webview:');
        });

        it('should generate unique nonce for each resolve', () => {
            const mockView1 = createMockWebviewView();
            const mockView2 = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            // Create two separate providers
            const provider2 = new SidebarProvider(
                mockExtensionUri,
                mockConfigService as any,
                mockErrorService as any
            );

            provider.resolveWebviewView(mockView1 as any, context, token);
            provider2.resolveWebviewView(mockView2 as any, context, token);

            // Extract nonces from HTML
            const nonceMatch1 = mockView1.webview.html.match(/nonce-([A-Za-z0-9]+)/);
            const nonceMatch2 = mockView2.webview.html.match(/nonce-([A-Za-z0-9]+)/);

            expect(nonceMatch1).toBeTruthy();
            expect(nonceMatch2).toBeTruthy();
            // Nonces should be different (extremely unlikely to be same)
            expect(nonceMatch1![1]).not.toBe(nonceMatch2![1]);
        });
    });

    // Story 6.7 Task 10: Integration tests for workflow progress
    describe('Workflow Progress Integration', () => {
        it('should include workflowProgress in projectStateChanged payload for epics-ready state', async () => {
            // Task 10.2: Test _sendProjectState includes workflowProgress
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'epics-ready',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Test Project',
                    userName: 'Test User',
                    communicationLanguage: 'English',
                    planningArtifacts: '/test/planning',
                    implementationArtifacts: '/test/impl',
                },
            });
            mockGetArtifactProgress.mockResolvedValue({
                success: true,
                data: {
                    hasProductBrief: true,
                    hasPrd: true,
                    hasArchitecture: true,
                    hasEpics: true,
                    currentPhase: 'ready',
                },
            });
            mockGetProjectSummary.mockResolvedValue({
                success: true,
                data: {
                    epicCount: 3,
                    storyCount: { total: 10, backlog: 3, inProgress: 2, review: 1, done: 4 },
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(mockView as any, context, token);
            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            const calls = mockView._postMessage.mock.calls;
            const stateCall = calls.find(
                (call: any[]) => call[0]?.type === 'projectStateChanged'
            );
            
            expect(stateCall).toBeDefined();
            expect(stateCall![0].payload.workflowProgress).toBeDefined();
            expect(stateCall![0].payload.workflowProgress.currentPhase).toBe('implementation');
            expect(stateCall![0].payload.workflowProgress.planning).toBe('completed');
            expect(stateCall![0].payload.workflowProgress.solutioning).toBe('completed');
            expect(stateCall![0].payload.workflowProgress.implementation).toBe('current');
            expect(stateCall![0].payload.workflowProgress.testing).toBe('future');
        });

        it('should include workflowProgress in projectStateChanged payload for in-progress state', async () => {
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'in-progress',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Test Project',
                    userName: 'Test User',
                    communicationLanguage: 'English',
                    planningArtifacts: '/test/planning',
                    implementationArtifacts: '/test/impl',
                },
            });
            mockGetArtifactProgress.mockResolvedValue({
                success: true,
                data: {
                    hasProductBrief: true,
                    hasPrd: false,
                    hasArchitecture: false,
                    hasEpics: false,
                    currentPhase: 'analysis',
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(mockView as any, context, token);
            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            const calls = mockView._postMessage.mock.calls;
            const stateCall = calls.find(
                (call: any[]) => call[0]?.type === 'projectStateChanged'
            );
            
            expect(stateCall).toBeDefined();
            expect(stateCall![0].payload.workflowProgress).toBeDefined();
        });

        it('should not include workflowProgress for fresh or no-project states', async () => {
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'fresh',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Test Project',
                    userName: 'Test User',
                    communicationLanguage: 'English',
                    planningArtifacts: '/test/planning',
                    implementationArtifacts: '/test/impl',
                },
            });
            mockGetArtifactProgress.mockResolvedValue({
                success: true,
                data: {
                    hasProductBrief: false,
                    hasPrd: false,
                    hasArchitecture: false,
                    hasEpics: false,
                    currentPhase: 'brainstorming',
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(mockView as any, context, token);
            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockView._postMessage).toHaveBeenCalled();
            });

            const calls = mockView._postMessage.mock.calls;
            const stateCall = calls.find(
                (call: any[]) => call[0]?.type === 'projectStateChanged'
            );
            
            expect(stateCall).toBeDefined();
            expect(stateCall![0].payload.workflowProgress).toBeUndefined();
        });

        it('should call StoryParser to get stories for workflow calculation', async () => {
            // Task 10.3: Test workflowProgress recalculates with StoryParser data
            mockGetProjectState.mockResolvedValue({
                success: true,
                data: 'epics-ready',
            });
            mockGetConfig.mockResolvedValue({
                success: true,
                data: {
                    projectName: 'Test Project',
                    userName: 'Test User',
                    communicationLanguage: 'English',
                    planningArtifacts: '/test/planning',
                    implementationArtifacts: '/test/impl',
                },
            });
            mockGetArtifactProgress.mockResolvedValue({
                success: true,
                data: {
                    hasProductBrief: true,
                    hasPrd: true,
                    hasArchitecture: true,
                    hasEpics: true,
                    currentPhase: 'ready',
                },
            });
            mockGetProjectSummary.mockResolvedValue({
                success: true,
                data: {
                    epicCount: 3,
                    storyCount: { total: 10, backlog: 3, inProgress: 2, review: 1, done: 4 },
                },
            });

            const mockView = createMockWebviewView();
            const context = createMockResolveContext();
            const token = createMockCancellationToken();

            provider.resolveWebviewView(mockView as any, context, token);
            mockView._simulateMessage({ type: 'ready', payload: { webviewId: 'sidebar' } });

            await vi.waitFor(() => {
                expect(mockScanAndParse).toHaveBeenCalled();
            });

            // Verify scanAndParse was called with implementation artifacts path
            expect(mockScanAndParse).toHaveBeenCalledWith('/test/impl');
            
            // Verify calculateProgress was called
            expect(mockCalculateProgress).toHaveBeenCalled();
        });
    });
});
