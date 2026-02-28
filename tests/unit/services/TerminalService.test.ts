/**
 * TerminalService Unit Tests
 * Story 2.2: Terminal Command Execution
 * Task 5.1-5.4: Unit tests for command execution and whitelist
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as vscode from 'vscode';
import { TerminalService, getTerminalService } from '../../../src/services/TerminalService';

// Mock vscode module
vi.mock('vscode', () => ({
    window: {
        createTerminal: vi.fn(),
        terminals: [],
        onDidCloseTerminal: vi.fn(() => ({ dispose: vi.fn() })),
    },
    workspace: {
        workspaceFolders: [
            {
                uri: { fsPath: '/test/workspace' },
            },
        ],
    },
}));

// Mock ShellService
vi.mock('../../../src/services/ShellService', () => ({
    getShellService: () => ({
        getDefaultShell: vi.fn().mockReturnValue('/bin/zsh'),
    }),
}));

// Mock ErrorService
const mockErrorService = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: <T>(data: T) => ({ success: true, data }),
    failure: (error: any) => ({ success: false, error }),
};

vi.mock('../../../src/services/ErrorService', () => ({
    getErrorService: () => mockErrorService,
}));

describe('TerminalService', () => {
    let mockTerminal: {
        show: Mock;
        sendText: Mock;
        dispose: Mock;
    };

    beforeEach(() => {
        // Reset singleton
        TerminalService.resetInstance();

        // Reset mocks
        vi.clearAllMocks();

        // Setup mock terminal
        mockTerminal = {
            show: vi.fn(),
            sendText: vi.fn(),
            dispose: vi.fn(),
        };

        (vscode.window.createTerminal as Mock).mockReturnValue(mockTerminal);
        (vscode.window as any).terminals = [];
    });

    describe('isCommandAllowed (Task 5.2, 5.3)', () => {
        it('should allow npx bmad-method install', () => {
            const service = getTerminalService();
            expect(service.isCommandAllowed('npx bmad-method install')).toBe(true);
        });

        it('should allow npx bmad-method update', () => {
            const service = getTerminalService();
            expect(service.isCommandAllowed('npx bmad-method update')).toBe(true);
        });

        it('should allow npx bmad-method with additional args', () => {
            const service = getTerminalService();
            expect(service.isCommandAllowed('npx bmad-method install --force')).toBe(true);
        });

        it('should block unauthorized commands', () => {
            const service = getTerminalService();
            expect(service.isCommandAllowed('rm -rf /')).toBe(false);
        });

        it('should block commands that look similar but are not allowed', () => {
            const service = getTerminalService();
            expect(service.isCommandAllowed('npx malicious-method install')).toBe(false);
        });

        it('should handle whitespace in commands', () => {
            const service = getTerminalService();
            expect(service.isCommandAllowed('  npx bmad-method install  ')).toBe(true);
        });
    });

    describe('executeCommand (Task 5.4)', () => {
        it('should create terminal with name BMAD', async () => {
            const service = getTerminalService();
            await service.executeCommand('npx bmad-method install');

            expect(vscode.window.createTerminal).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'BMAD',
                })
            );
        });

        it('should show terminal on execution', async () => {
            const service = getTerminalService();
            await service.executeCommand('npx bmad-method install');

            expect(mockTerminal.show).toHaveBeenCalledWith(true);
        });

        it('should send command to terminal', async () => {
            const service = getTerminalService();
            await service.executeCommand('npx bmad-method install');

            expect(mockTerminal.sendText).toHaveBeenCalledWith('npx bmad-method install');
        });

        it('should return success for allowed commands', async () => {
            const service = getTerminalService();
            const result = await service.executeCommand('npx bmad-method install');

            expect(result.success).toBe(true);
        });

        it('should return error for blocked commands', async () => {
            const service = getTerminalService();
            const result = await service.executeCommand('rm -rf /');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('COMMAND_NOT_ALLOWED');
            }
        });

        it('should reuse existing terminal', async () => {
            // First call creates terminal
            const service = getTerminalService();
            await service.executeCommand('npx bmad-method install');

            // Add terminal to list of active terminals
            (vscode.window as any).terminals = [mockTerminal];

            // Second call should reuse
            await service.executeCommand('npx bmad-method update');

            // createTerminal should only be called once
            expect(vscode.window.createTerminal).toHaveBeenCalledTimes(1);
        });

        it('should log execution attempts', async () => {
            const service = getTerminalService();
            await service.executeCommand('npx bmad-method install');

            expect(mockErrorService.info).toHaveBeenCalledWith(
                expect.stringContaining('Terminal execution requested')
            );
        });

        it('should log blocked command attempts', async () => {
            const service = getTerminalService();
            await service.executeCommand('rm -rf /');

            expect(mockErrorService.warn).toHaveBeenCalledWith(
                expect.stringContaining('Blocked unauthorized command')
            );
        });
    });

    describe('no workspace scenario', () => {
        it('should return error when no workspace is open', async () => {
            // Temporarily remove workspaceFolders
            const original = vscode.workspace.workspaceFolders;
            (vscode.workspace as any).workspaceFolders = undefined;

            const service = getTerminalService();
            const result = await service.executeCommand('npx bmad-method install');

            expect(result.success).toBe(false);

            // Restore
            (vscode.workspace as any).workspaceFolders = original;
        });
    });

    describe('singleton pattern', () => {
        it('should return same instance', () => {
            const service1 = getTerminalService();
            const service2 = getTerminalService();
            expect(service1).toBe(service2);
        });
    });
});
