/**
 * CopilotService Unit Tests
 * Story 6.4: CopilotService - Chat Integration
 * Task 9: Unit tests for Copilot Chat integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    CopilotService,
    getCopilotService,
} from '../../../src/services/CopilotService';
import { CopilotExtensionIds } from '../../../src/shared/types';

// Track mock function calls
const executedCommands: Array<{ command: string; args?: unknown }> = [];
let mockCopilotChatInstalled = false;
let mockCopilotInstalled = false;
let showWarningMessageSelection: string | undefined = undefined;
let showInfoMessageSelection: string | undefined = undefined;

// Mock ErrorService
const mockErrorService = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    handleError: vi.fn(),
};

vi.mock('../../../src/services/ErrorService', () => ({
    ErrorService: {
        getInstance: vi.fn(() => mockErrorService),
        resetInstance: vi.fn(),
    },
    getErrorService: vi.fn(() => mockErrorService),
}));

// Mock vscode module
vi.mock('vscode', () => ({
    window: {
        createOutputChannel: vi.fn(() => ({
            appendLine: vi.fn(),
            show: vi.fn(),
            dispose: vi.fn(),
        })),
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(async () => showWarningMessageSelection),
        showInformationMessage: vi.fn(async () => showInfoMessageSelection),
    },
    extensions: {
        getExtension: vi.fn((extensionId: string) => {
            if (extensionId === CopilotExtensionIds.COPILOT_CHAT && mockCopilotChatInstalled) {
                return {
                    id: extensionId,
                    extensionPath: '/path/to/extension',
                    isActive: true,
                    packageJSON: { name: 'github.copilot-chat' },
                };
            }
            if (extensionId === CopilotExtensionIds.COPILOT && mockCopilotInstalled) {
                return {
                    id: extensionId,
                    extensionPath: '/path/to/extension',
                    isActive: true,
                    packageJSON: { name: 'github.copilot' },
                };
            }
            return undefined;
        }),
    },
    commands: {
        executeCommand: vi.fn(async (command: string, ...args: unknown[]) => {
            executedCommands.push({ command, args: args.length > 0 ? args : undefined });
            return undefined;
        }),
    },
}));

describe('CopilotService', () => {
    beforeEach(() => {
        // Reset singleton and mocks before each test
        CopilotService.resetInstance();
        vi.clearAllMocks();
        
        // Reset state
        executedCommands.length = 0;
        mockCopilotChatInstalled = false;
        mockCopilotInstalled = false;
        showWarningMessageSelection = undefined;
        showInfoMessageSelection = undefined;
    });

    afterEach(() => {
        CopilotService.resetInstance();
    });

    // ========================================================================
    // Singleton Pattern Tests (Task 2)
    // ========================================================================
    describe('Singleton Pattern', () => {
        it('returns the same instance on multiple calls', () => {
            const instance1 = CopilotService.getInstance();
            const instance2 = CopilotService.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('getCopilotService helper returns singleton', () => {
            const instance1 = getCopilotService();
            const instance2 = getCopilotService();
            expect(instance1).toBe(instance2);
        });

        it('resetInstance clears the singleton', () => {
            const instance1 = CopilotService.getInstance();
            CopilotService.resetInstance();
            const instance2 = CopilotService.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });

    // ========================================================================
    // Availability Detection Tests (AC #2, #3, #6 - Task 3)
    // ========================================================================
    describe('checkAvailability', () => {
        it('returns "full" when Copilot Chat extension is installed (AC #1)', () => {
            mockCopilotChatInstalled = true;
            const service = getCopilotService();
            expect(service.checkAvailability()).toBe('full');
        });

        it('returns "chat-only" when only base Copilot extension is installed (AC #3)', () => {
            mockCopilotChatInstalled = false;
            mockCopilotInstalled = true;
            const service = getCopilotService();
            expect(service.checkAvailability()).toBe('chat-only');
        });

        it('returns "none" when no Copilot extensions are installed (AC #2)', () => {
            mockCopilotChatInstalled = false;
            mockCopilotInstalled = false;
            const service = getCopilotService();
            expect(service.checkAvailability()).toBe('none');
        });

        it('caches availability result (AC #6)', () => {
            mockCopilotChatInstalled = true;
            const service = getCopilotService();
            
            // First call - should check extensions
            expect(service.checkAvailability()).toBe('full');
            
            // Change state but result should be cached
            mockCopilotChatInstalled = false;
            expect(service.checkAvailability()).toBe('full');
        });

        it('clearAvailabilityCache forces fresh check', () => {
            mockCopilotChatInstalled = true;
            const service = getCopilotService();
            
            // First call - caches 'full'
            expect(service.checkAvailability()).toBe('full');
            
            // Change state and clear cache
            mockCopilotChatInstalled = false;
            service.clearAvailabilityCache();
            
            // Should now return 'none'
            expect(service.checkAvailability()).toBe('none');
        });

        it('cache TTL is 5 minutes', () => {
            const service = getCopilotService();
            expect(service.getCacheTtlMs()).toBe(5 * 60 * 1000);
        });
    });

    // ========================================================================
    // Full Copilot Launch Tests (AC #1 - Task 4)
    // ========================================================================
    describe('launchAgent with full Copilot', () => {
        beforeEach(() => {
            mockCopilotChatInstalled = true;
        });

        it('opens chat and sends command format message (AC #1)', async () => {
            const service = getCopilotService();
            const result = await service.launchAgent({
                agentId: 'sm',
                command: 'SP',
            });

            expect(result.success).toBe(true);
            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.newChat',
                args: undefined,
            });
            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm SP' }],
            });
        });

        it('includes custom prompt in message (AC #1)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'analyst',
                command: 'brainstorm',
                customPrompt: 'Help me with task manager features',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@analyst brainstorm Help me with task manager features' }],
            });
        });

        it('works without command (prompt only)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'pm',
                customPrompt: 'Create a PRD',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@pm Create a PRD' }],
            });
        });

        it('works with only agentId (empty message)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'dev',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@dev' }],
            });
        });

        it('logs info message on launch', async () => {
            const service = getCopilotService();
            await service.launchAgent({ agentId: 'sm', command: 'SP' });

            expect(mockErrorService.info).toHaveBeenCalledWith(
                expect.stringContaining('Launching agent')
            );
        });
    });

    // ========================================================================
    // Fallback Path Tests (AC #2, #3 - Task 5)
    // ========================================================================
    describe('launchAgent with chat-only fallback', () => {
        beforeEach(() => {
            mockCopilotChatInstalled = false;
            mockCopilotInstalled = true;
        });

        it('opens basic chat when only base Copilot installed (AC #3)', async () => {
            const service = getCopilotService();
            const result = await service.launchAgent({
                agentId: 'sm',
                command: 'SP',
            });

            expect(result.success).toBe(true);
            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: undefined,
            });
        });

        it('shows info message with install suggestion (AC #3)', async () => {
            const vscode = await import('vscode');
            const service = getCopilotService();
            await service.launchAgent({ agentId: 'sm', command: 'SP' });

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('sm'),
                'Install Copilot Chat'
            );
        });

        it('opens extension marketplace when user clicks Install (AC #4)', async () => {
            showInfoMessageSelection = 'Install Copilot Chat';
            const service = getCopilotService();
            await service.launchAgent({ agentId: 'sm' });

            // Wait for async handlers
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(executedCommands).toContainEqual({
                command: 'workbench.extensions.search',
                args: ['@id:github.copilot-chat'],
            });
        });
    });

    describe('launchAgent with no Copilot installed', () => {
        beforeEach(() => {
            mockCopilotChatInstalled = false;
            mockCopilotInstalled = false;
        });

        it('shows warning notification (AC #2)', async () => {
            const vscode = await import('vscode');
            const service = getCopilotService();
            await service.launchAgent({ agentId: 'sm' });

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('not installed'),
                'Install Copilot',
                'Open Chat Anyway'
            );
        });

        it('opens extension marketplace on Install click (AC #4)', async () => {
            showWarningMessageSelection = 'Install Copilot';
            const service = getCopilotService();
            await service.launchAgent({ agentId: 'sm' });

            expect(executedCommands).toContainEqual({
                command: 'workbench.extensions.search',
                args: ['@id:github.copilot-chat'],
            });
        });

        it('opens basic chat on "Open Chat Anyway" click', async () => {
            showWarningMessageSelection = 'Open Chat Anyway';
            const service = getCopilotService();
            await service.launchAgent({ agentId: 'sm' });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: undefined,
            });
        });

        it('returns success for graceful degradation (AC #2)', async () => {
            const service = getCopilotService();
            const result = await service.launchAgent({ agentId: 'sm' });
            expect(result.success).toBe(true);
        });
    });

    // ========================================================================
    // Prompt Sanitization Tests (AC #5, AC #6 - Task 6)
    // ========================================================================
    describe('Prompt Sanitization', () => {
        beforeEach(() => {
            mockCopilotChatInstalled = true;
        });

        // AC #6: undefined/empty customPrompt handling
        it('omits customPrompt from message when undefined (AC #6)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                command: 'SP',
                customPrompt: undefined,
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm SP' }],
            });
        });

        it('omits customPrompt from message when empty string (AC #6)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                command: 'SP',
                customPrompt: '',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm SP' }],
            });
        });

        it('omits customPrompt from message when whitespace only (AC #6)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                command: 'SP',
                customPrompt: '   ',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm SP' }],
            });
        });

        it('removes leading @ symbols to prevent command injection (AC #5)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                customPrompt: '@evil /inject',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm evil /inject' }],
            });
        });

        it('removes leading / symbols to prevent command injection (AC #5)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                customPrompt: '/dangerous command',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm dangerous command' }],
            });
        });

        it('removes @ and / from multiple lines and strips newlines (AC #5)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                customPrompt: '@first line\n/second line\nnormal line',
            });

            // Newlines are control characters (0x0A) and are stripped
            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm first linesecond linenormal line' }],
            });
        });

        it('removes control characters (AC #5)', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                customPrompt: 'hello\x00world\x1F',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm helloworld' }],
            });
        });

        it('limits prompt length to 2000 characters (AC #5)', async () => {
            const service = getCopilotService();
            const longPrompt = 'a'.repeat(3000);
            await service.launchAgent({
                agentId: 'sm',
                customPrompt: longPrompt,
            });

            const expectedPrompt = 'a'.repeat(2000) + '...';
            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: `@sm ${expectedPrompt}` }],
            });
        });

        it('trims whitespace from prompt', async () => {
            const service = getCopilotService();
            await service.launchAgent({
                agentId: 'sm',
                customPrompt: '  hello world  ',
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: '@sm hello world' }],
            });
        });

        it('preserves normal text unchanged (Task 9.7)', async () => {
            const service = getCopilotService();
            const normalText = 'Please help me debug this TypeScript code';
            await service.launchAgent({
                agentId: 'dev',
                customPrompt: normalText,
            });

            expect(executedCommands).toContainEqual({
                command: 'workbench.action.chat.open',
                args: [{ query: `@dev ${normalText}` }],
            });
        });

        it('max prompt length is 2000', () => {
            const service = getCopilotService();
            expect(service.getMaxPromptLength()).toBe(2000);
        });
    });

    // ========================================================================
    // Error Handling Tests
    // ========================================================================
    describe('Error Handling', () => {
        it('returns failure when executeCommand throws', async () => {
            const vscode = await import('vscode');
            mockCopilotChatInstalled = true;
            
            // Make executeCommand throw
            vi.mocked(vscode.commands.executeCommand).mockRejectedValueOnce(
                new Error('Command failed')
            );

            const service = getCopilotService();
            const result = await service.launchAgent({ agentId: 'sm' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toContain('Failed to launch Copilot Chat');
            }
        });

        it('handles error in chat-only fallback gracefully', async () => {
            const vscode = await import('vscode');
            mockCopilotChatInstalled = false;
            mockCopilotInstalled = true;
            
            vi.mocked(vscode.commands.executeCommand).mockRejectedValueOnce(
                new Error('Command failed')
            );

            const service = getCopilotService();
            const result = await service.launchAgent({ agentId: 'sm' });

            expect(result.success).toBe(false);
            expect(mockErrorService.handleError).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // Integration with other types (Task 1)
    // ========================================================================
    describe('Type Integration', () => {
        it('uses CopilotExtensionIds constants', () => {
            expect(CopilotExtensionIds.COPILOT_CHAT).toBe('github.copilot-chat');
            expect(CopilotExtensionIds.COPILOT).toBe('github.copilot');
        });
    });
});
