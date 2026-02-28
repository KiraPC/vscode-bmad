/**
 * Message Types Unit Tests
 * Story 3.2: Shared Message Types
 * Task 6: Unit tests for type safety
 */

import { describe, it, expect } from 'vitest';
import type {
    ExtensionMessage,
    WebViewMessage,
    ConfigPayload,
    ProjectStatePayload,
    ErrorPayload,
    DataLoadedPayload,
    ReadyPayload,
    OpenFilePayload,
    ExecuteCommandPayload,
    LaunchAgentPayload,
    ExtensionMessageType,
    WebViewMessageType,
    ExtensionMessagePayload,
    WebViewMessagePayload,
} from '../../../src/shared/messages';
import {
    isExtensionMessage,
    isWebViewMessage,
    postMessage,
    type VsCodeApi,
} from '../../../src/shared/messages';

describe('messages', () => {
    // Helper to create messages with unknown type at compile time
    function createExtensionMessage(msg: ExtensionMessage): ExtensionMessage {
        return msg;
    }
    function createWebViewMessage(msg: WebViewMessage): WebViewMessage {
        return msg;
    }

    describe('ExtensionMessage', () => {
        describe('type narrowing with switch statement', () => {
            it('should narrow configLoaded message type', () => {
                const message = createExtensionMessage({
                    type: 'configLoaded',
                    payload: {
                        projectName: 'test-project',
                        userName: 'TestUser',
                        communicationLanguage: 'en',
                        planningArtifacts: '/path/planning',
                        implementationArtifacts: '/path/impl',
                    },
                });

                let result: string | undefined;
                switch (message.type) {
                    case 'configLoaded':
                        // TypeScript knows payload is ConfigPayload here
                        result = message.payload.projectName;
                        break;
                    case 'projectStateChanged':
                    case 'dataLoaded':
                    case 'filesLoaded':
                    case 'error':
                        break;
                    default:
                        // Exhaustive check - TypeScript error if case missed
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('test-project');
            });

            it('should narrow projectStateChanged message type', () => {
                const message = createExtensionMessage({
                    type: 'projectStateChanged',
                    payload: {
                        state: 'fresh',
                        hasConfig: false,
                        hasEpics: false,
                        hasStories: false,
                    },
                });

                let result: ProjectStatePayload['state'] | undefined;
                switch (message.type) {
                    case 'configLoaded':
                        break;
                    case 'projectStateChanged':
                        // TypeScript knows payload is ProjectStatePayload here
                        result = message.payload.state;
                        break;
                    case 'dataLoaded':
                    case 'filesLoaded':
                    case 'error':
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('fresh');
            });

            it('should narrow dataLoaded message type', () => {
                const message = createExtensionMessage({
                    type: 'dataLoaded',
                    payload: {
                        epics: [{ id: '1', title: 'Epic 1', description: '', status: 'backlog', storyIds: [] }],
                        stories: [{ id: 's1', title: 'Story 1', status: 'backlog', epicId: '1', filePath: '/path' }],
                    },
                });

                let result: number | undefined;
                switch (message.type) {
                    case 'configLoaded':
                    case 'projectStateChanged':
                        break;
                    case 'dataLoaded':
                        // TypeScript knows payload is DataLoadedPayload here
                        result = message.payload.epics.length;
                        break;
                    case 'filesLoaded':
                    case 'error':
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe(1);
            });

            it('should narrow error message type', () => {
                const message = createExtensionMessage({
                    type: 'error',
                    payload: {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config file not found',
                        recoverable: true,
                    },
                });

                let result: string | undefined;
                switch (message.type) {
                    case 'configLoaded':
                    case 'projectStateChanged':
                    case 'dataLoaded':
                    case 'filesLoaded':
                        break;
                    case 'error':
                        // TypeScript knows payload is ErrorPayload here
                        result = message.payload.code;
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('CONFIG_NOT_FOUND');
            });

            it('should narrow filesLoaded message type (Story 3.7)', () => {
                const message = createExtensionMessage({
                    type: 'filesLoaded',
                    payload: {
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
                            children: [
                                {
                                    type: 'file',
                                    name: 'prd.md',
                                    path: '/test/workspace/_bmad-output/planning-artifacts/prd.md',
                                    icon: 'markdown',
                                },
                            ],
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

                let result: string | undefined;
                switch (message.type) {
                    case 'configLoaded':
                    case 'projectStateChanged':
                    case 'dataLoaded':
                        break;
                    case 'filesLoaded':
                        // TypeScript knows payload is FilesLoadedPayload here
                        result = message.payload.configFile.name;
                        break;
                    case 'error':
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('config.yaml');
            });
        });

        it('should require payload wrapper', () => {
            const message: ExtensionMessage = {
                type: 'error',
                payload: {
                    code: 'TEST_ERROR',
                    message: 'Test message',
                    recoverable: false,
                },
            };
            expect(message.payload.code).toBe('TEST_ERROR');
        });
    });

    describe('WebViewMessage', () => {
        describe('type narrowing with switch statement', () => {
            it('should narrow ready message type', () => {
                const message = createWebViewMessage({
                    type: 'ready',
                    payload: { webviewId: 'sidebar' },
                });

                let result: ReadyPayload['webviewId'] | undefined;
                switch (message.type) {
                    case 'ready':
                        // TypeScript knows payload is ReadyPayload here
                        result = message.payload.webviewId;
                        break;
                    case 'openFile':
                    case 'executeCommand':
                    case 'launchAgent':
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('sidebar');
            });

            it('should narrow openFile message type', () => {
                const message = createWebViewMessage({
                    type: 'openFile',
                    payload: { filePath: '/path/to/file.ts' },
                });

                let result: string | undefined;
                switch (message.type) {
                    case 'ready':
                        break;
                    case 'openFile':
                        // TypeScript knows payload is OpenFilePayload here
                        result = message.payload.filePath;
                        break;
                    case 'executeCommand':
                    case 'launchAgent':
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('/path/to/file.ts');
            });

            it('should narrow executeCommand message type', () => {
                const message = createWebViewMessage({
                    type: 'executeCommand',
                    payload: { command: 'bmad.init', args: ['arg1', 42] },
                });

                let result: string | undefined;
                switch (message.type) {
                    case 'ready':
                    case 'openFile':
                        break;
                    case 'executeCommand':
                        // TypeScript knows payload is ExecuteCommandPayload here
                        result = message.payload.command;
                        break;
                    case 'launchAgent':
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('bmad.init');
            });

            it('should narrow launchAgent message type', () => {
                const message = createWebViewMessage({
                    type: 'launchAgent',
                    payload: {
                        agentId: 'pm',
                        command: 'DS',
                        customPrompt: 'story 1.1',
                    },
                });

                let result: string | undefined;
                switch (message.type) {
                    case 'ready':
                    case 'openFile':
                    case 'executeCommand':
                        break;
                    case 'launchAgent':
                        // TypeScript knows payload is LaunchAgentPayload here
                        result = message.payload.agentId;
                        break;
                    default:
                        const _exhaustive: never = message;
                        void _exhaustive;
                }

                expect(result).toBe('pm');
            });
        });

        it('should require payload wrapper', () => {
            const message: WebViewMessage = {
                type: 'ready',
                payload: { webviewId: 'kanban' },
            };
            expect(message.payload.webviewId).toBe('kanban');
        });

        it('should allow optional args in executeCommand', () => {
            const messageWithArgs: WebViewMessage = {
                type: 'executeCommand',
                payload: { command: 'test.cmd', args: [1, 2, 3] },
            };
            const messageWithoutArgs: WebViewMessage = {
                type: 'executeCommand',
                payload: { command: 'test.cmd' },
            };

            expect(messageWithArgs.payload).toHaveProperty('args');
            expect(messageWithoutArgs.payload).not.toHaveProperty('args');
        });

        it('should allow optional fields in launchAgent', () => {
            const minimalMessage: WebViewMessage = {
                type: 'launchAgent',
                payload: { agentId: 'dev' },
            };
            const fullMessage: WebViewMessage = {
                type: 'launchAgent',
                payload: {
                    agentId: 'dev',
                    command: 'DS',
                    customPrompt: 'story 3.2',
                    model: 'claude-opus-4-20250514',
                },
            };

            expect(minimalMessage.payload.command).toBeUndefined();
            expect(fullMessage.payload.command).toBe('DS');
        });
    });

    describe('isExtensionMessage', () => {
        it('should return true for valid ExtensionMessage', () => {
            const message = {
                type: 'configLoaded',
                payload: {
                    projectName: 'test',
                    userName: 'user',
                    communicationLanguage: 'en',
                    planningArtifacts: '/path',
                    implementationArtifacts: '/path',
                },
            };
            expect(isExtensionMessage(message)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isExtensionMessage(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isExtensionMessage(undefined)).toBe(false);
        });

        it('should return false for non-object', () => {
            expect(isExtensionMessage('string')).toBe(false);
            expect(isExtensionMessage(123)).toBe(false);
        });

        it('should return false for object without type', () => {
            expect(isExtensionMessage({ payload: {} })).toBe(false);
        });

        it('should return false for object without payload', () => {
            expect(isExtensionMessage({ type: 'configLoaded' })).toBe(false);
        });

        it('should return false for object with non-string type', () => {
            expect(isExtensionMessage({ type: 123, payload: {} })).toBe(false);
        });

        it('should return false for object with non-object payload', () => {
            expect(isExtensionMessage({ type: 'error', payload: 'string' })).toBe(false);
        });
    });

    describe('isWebViewMessage', () => {
        it('should return true for valid WebViewMessage', () => {
            const message = {
                type: 'ready',
                payload: { webviewId: 'sidebar' },
            };
            expect(isWebViewMessage(message)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isWebViewMessage(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isWebViewMessage(undefined)).toBe(false);
        });

        it('should return false for object without type', () => {
            expect(isWebViewMessage({ payload: {} })).toBe(false);
        });

        it('should return false for object without payload', () => {
            expect(isWebViewMessage({ type: 'ready' })).toBe(false);
        });
    });

    describe('postMessage', () => {
        it('should call vscode.postMessage with the message', () => {
            const mockPostMessage = vi.fn();
            const mockVsCode: VsCodeApi = {
                postMessage: mockPostMessage,
                getState: vi.fn(),
                setState: vi.fn(),
            };

            const message: WebViewMessage = {
                type: 'ready',
                payload: { webviewId: 'sidebar' },
            };

            postMessage(mockVsCode, message);

            expect(mockPostMessage).toHaveBeenCalledOnce();
            expect(mockPostMessage).toHaveBeenCalledWith(message);
        });

        it('should be type-safe for different message types', () => {
            const mockPostMessage = vi.fn();
            const mockVsCode: VsCodeApi = {
                postMessage: mockPostMessage,
                getState: vi.fn(),
                setState: vi.fn(),
            };

            // All these should compile without error
            postMessage(mockVsCode, { type: 'ready', payload: { webviewId: 'sidebar' } });
            postMessage(mockVsCode, { type: 'openFile', payload: { filePath: '/path/file.ts' } });
            postMessage(mockVsCode, { type: 'executeCommand', payload: { command: 'cmd' } });
            postMessage(mockVsCode, { type: 'launchAgent', payload: { agentId: 'pm' } });

            expect(mockPostMessage).toHaveBeenCalledTimes(4);
        });
    });

    describe('Type extractors', () => {
        it('should correctly extract ExtensionMessageType', () => {
            const types: ExtensionMessageType[] = ['configLoaded', 'projectStateChanged', 'dataLoaded', 'error'];
            expect(types).toHaveLength(4);
        });

        it('should correctly extract WebViewMessageType', () => {
            const types: WebViewMessageType[] = ['ready', 'openFile', 'executeCommand', 'launchAgent'];
            expect(types).toHaveLength(4);
        });

        it('should correctly extract payload types', () => {
            // These are compile-time checks - if they compile, the types work
            const configPayload: ExtensionMessagePayload<'configLoaded'> = {
                projectName: 'test',
                userName: 'user',
                communicationLanguage: 'en',
                planningArtifacts: '/path',
                implementationArtifacts: '/path',
            };
            const readyPayload: WebViewMessagePayload<'ready'> = {
                webviewId: 'sidebar',
            };

            expect(configPayload.projectName).toBe('test');
            expect(readyPayload.webviewId).toBe('sidebar');
        });
    });

    describe('Payload types', () => {
        describe('ConfigPayload', () => {
            it('should have all required fields', () => {
                const payload: ConfigPayload = {
                    projectName: 'my-project',
                    userName: 'Developer',
                    communicationLanguage: 'en',
                    planningArtifacts: '/planning',
                    implementationArtifacts: '/impl',
                };
                expect(payload.projectName).toBe('my-project');
                expect(payload.userName).toBe('Developer');
                expect(payload.communicationLanguage).toBe('en');
            });
        });

        describe('ProjectStatePayload', () => {
            it('should allow valid state values', () => {
                const fresh: ProjectStatePayload = { state: 'fresh', hasConfig: false, hasEpics: false, hasStories: false };
                const inProgress: ProjectStatePayload = { state: 'in-progress', hasConfig: true, hasEpics: false, hasStories: false };
                const epicsReady: ProjectStatePayload = { state: 'epics-ready', hasConfig: true, hasEpics: true, hasStories: true };

                expect(fresh.state).toBe('fresh');
                expect(inProgress.state).toBe('in-progress');
                expect(epicsReady.state).toBe('epics-ready');
            });
        });

        describe('ErrorPayload', () => {
            it('should have code, message, and recoverable', () => {
                const payload: ErrorPayload = {
                    code: 'CONFIG_NOT_FOUND',
                    message: 'Configuration file not found',
                    recoverable: true,
                };
                expect(payload.code).toBe('CONFIG_NOT_FOUND');
                expect(payload.recoverable).toBe(true);
            });
        });

        describe('DataLoadedPayload', () => {
            it('should accept arrays of epics and stories', () => {
                const payload: DataLoadedPayload = {
                    epics: [
                        { id: '1', title: 'Epic 1', description: '', status: 'backlog', storyIds: [] },
                        { id: '2', title: 'Epic 2', description: '', status: 'backlog', storyIds: [] },
                    ],
                    stories: [
                        { id: 's1', title: 'Story 1', status: 'backlog', epicId: '1', filePath: '/path' },
                    ],
                };
                expect(payload.epics).toHaveLength(2);
                expect(payload.stories).toHaveLength(1);
            });
        });

        describe('ReadyPayload', () => {
            it('should require valid webviewId', () => {
                const sidebar: ReadyPayload = { webviewId: 'sidebar' };
                const kanban: ReadyPayload = { webviewId: 'kanban' };
                expect(sidebar.webviewId).toBe('sidebar');
                expect(kanban.webviewId).toBe('kanban');
            });
        });

        describe('OpenFilePayload', () => {
            it('should have filePath', () => {
                const payload: OpenFilePayload = { filePath: '/path/to/file.ts' };
                expect(payload.filePath).toBe('/path/to/file.ts');
            });

            it('should support optional preview flag (Story 5.6)', () => {
                const withPreview: OpenFilePayload = { filePath: '/path/to/story.md', preview: true };
                const withoutPreview: OpenFilePayload = { filePath: '/path/to/file.ts' };
                const previewFalse: OpenFilePayload = { filePath: '/path/to/doc.md', preview: false };

                expect(withPreview.preview).toBe(true);
                expect(withoutPreview.preview).toBeUndefined();
                expect(previewFalse.preview).toBe(false);
            });
        });

        describe('ExecuteCommandPayload', () => {
            it('should have required command and optional args', () => {
                const withoutArgs: ExecuteCommandPayload = { command: 'bmad.init' };
                const withArgs: ExecuteCommandPayload = { command: 'bmad.open', args: ['/path'] };

                expect(withoutArgs.command).toBe('bmad.init');
                expect(withoutArgs.args).toBeUndefined();
                expect(withArgs.args).toEqual(['/path']);
            });
        });

        describe('LaunchAgentPayload', () => {
            it('should have required agentId and optional fields', () => {
                const minimal: LaunchAgentPayload = { agentId: 'pm' };
                const full: LaunchAgentPayload = {
                    agentId: 'dev',
                    command: 'DS',
                    customPrompt: 'story 3.2',
                    model: 'claude-opus-4-20250514',
                };

                expect(minimal.agentId).toBe('pm');
                expect(minimal.command).toBeUndefined();
                expect(full.model).toBe('claude-opus-4-20250514');
            });
        });
    });
});

// Import vi at the end for function mocking
import { vi } from 'vitest';
