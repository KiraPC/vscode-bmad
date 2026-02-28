/**
 * TerminalService - Execute commands in VS Code terminal
 * Story 2.2: Terminal Command Execution
 */

import * as vscode from 'vscode';
import { ServiceResult, ErrorCodes } from '../shared/types';
import { getErrorService } from './ErrorService';
import { getShellService } from './ShellService';

// ============================================================================
// Types (Story 2.2)
// ============================================================================

export type TerminalError =
    | { code: 'COMMAND_NOT_ALLOWED'; command: string }
    | { code: 'NO_WORKSPACE'; message: string }
    | { code: 'TERMINAL_ERROR'; message: string };

export interface ITerminalService {
    executeCommand(command: string): Promise<ServiceResult<void>>;
    isCommandAllowed(command: string): boolean;
}

// ============================================================================
// Command Whitelist (NFR-S2)
// ============================================================================

const ALLOWED_COMMANDS = [
    'npx bmad-method install',
    'npx bmad-method update',
    'npx bmad-method',
] as const;

// ============================================================================
// TerminalService Implementation
// ============================================================================

export class TerminalService implements ITerminalService {
    private static instance: TerminalService | null = null;
    private bmadTerminal: vscode.Terminal | null = null;

    private constructor() {}

    /**
     * Get singleton instance of TerminalService
     */
    public static getInstance(): TerminalService {
        if (!TerminalService.instance) {
            TerminalService.instance = new TerminalService();
        }
        return TerminalService.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        TerminalService.instance = null;
    }

    /**
     * Check if a command is allowed to execute
     * AC #2, #3: Whitelist validation
     */
    public isCommandAllowed(command: string): boolean {
        const normalizedCommand = command.trim();
        return ALLOWED_COMMANDS.some(allowed =>
            normalizedCommand === allowed || normalizedCommand.startsWith(allowed + ' ')
        );
    }

    /**
     * Execute a command in the BMAD terminal
     * AC #1: Creates terminal named "BMAD", executes command, shows terminal
     * AC #2: Only executes whitelisted commands
     * AC #3: Blocks non-whitelisted commands
     */
    public async executeCommand(command: string): Promise<ServiceResult<void>> {
        const errorService = getErrorService();
        const normalizedCommand = command.trim();

        // Log execution attempt
        errorService.info(`Terminal execution requested: ${normalizedCommand}`);

        // AC #3: Validate command against whitelist
        if (!this.isCommandAllowed(normalizedCommand)) {
            errorService.warn(`Blocked unauthorized command: ${normalizedCommand}`);
            return errorService.failure({
                code: 'COMMAND_NOT_ALLOWED',
                message: `Command not in whitelist: ${normalizedCommand}`,
                userMessage: 'This command is not allowed for security reasons.',
                recoverable: true,
                shouldNotify: true,
            });
        }

        // Check for workspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return errorService.failure({
                code: ErrorCodes.CONFIG_NOT_FOUND,
                message: 'No workspace folder open',
                userMessage: 'Please open a folder to run BMAD commands.',
                recoverable: true,
                shouldNotify: true,
            });
        }

        try {
            // Create or reuse terminal
            const terminal = this.getOrCreateTerminal(workspaceFolder.uri.fsPath);

            // Show terminal (AC #1: terminal becomes visible)
            terminal.show(true); // true = preserve focus

            // Execute command (AC #1: command is executed)
            terminal.sendText(normalizedCommand);

            errorService.info(`Command executed in BMAD terminal: ${normalizedCommand}`);
            return errorService.success(undefined);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            errorService.error(`Terminal execution failed: ${message}`);
            return errorService.failure({
                code: 'TERMINAL_ERROR',
                message: `Terminal execution failed: ${message}`,
                userMessage: 'Failed to execute command in terminal.',
                recoverable: true,
                shouldNotify: true,
            });
        }
    }

    /**
     * Get existing BMAD terminal or create a new one
     * Task 3.1-3.5: Terminal creation with proper shell
     */
    private getOrCreateTerminal(cwd: string): vscode.Terminal {
        // Check if existing terminal is still valid
        if (this.bmadTerminal) {
            // Terminal may have been closed by user
            const terminals = vscode.window.terminals;
            if (terminals.includes(this.bmadTerminal)) {
                return this.bmadTerminal;
            }
            this.bmadTerminal = null;
        }

        // Get shell from ShellService (Task 3.3)
        const shellService = getShellService();
        const shellPath = shellService.getDefaultShell();

        // Create new terminal (Task 3.1, 3.2)
        this.bmadTerminal = vscode.window.createTerminal({
            name: 'BMAD',
            shellPath: shellPath,
            cwd: cwd,
        });

        // Listen for terminal close
        const disposable = vscode.window.onDidCloseTerminal(terminal => {
            if (terminal === this.bmadTerminal) {
                this.bmadTerminal = null;
                disposable.dispose();
            }
        });

        return this.bmadTerminal;
    }

    /**
     * Dispose of terminal resources
     */
    public dispose(): void {
        if (this.bmadTerminal) {
            this.bmadTerminal.dispose();
            this.bmadTerminal = null;
        }
    }
}

/**
 * Get singleton instance of TerminalService
 */
export function getTerminalService(): TerminalService {
    return TerminalService.getInstance();
}
