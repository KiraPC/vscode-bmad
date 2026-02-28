/**
 * ErrorService - Centralized error handling
 * Story 1.2: ErrorService Implementation
 */

import * as vscode from 'vscode';
import { BmadError, ServiceResult, ErrorCodes } from '../shared/types';

export class ErrorService {
    private static instance: ErrorService | null = null;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('BMAD Extension');
    }

    /**
     * Get singleton instance of ErrorService
     */
    public static getInstance(): ErrorService {
        if (!ErrorService.instance) {
            ErrorService.instance = new ErrorService();
        }
        return ErrorService.instance;
    }

    /**
     * Handle an error - log it and optionally notify user
     */
    public handleError(error: BmadError): void {
        // Always log to output channel
        this.log(`[${error.code}] ${error.message}`);

        // Show notification if requested
        if (error.shouldNotify !== false) {
            this.showNotification(error);
        }
    }

    /**
     * Log a message to the output channel
     */
    public log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Log an info message
     */
    public info(message: string): void {
        this.log(`[INFO] ${message}`);
    }

    /**
     * Log a warning message
     */
    public warn(message: string): void {
        this.log(`[WARN] ${message}`);
    }

    /**
     * Log an error message
     */
    public error(message: string): void {
        this.log(`[ERROR] ${message}`);
    }

    /**
     * Show the output channel to user
     */
    public show(): void {
        this.outputChannel.show();
    }

    /**
     * Create a BmadError from a standard Error
     */
    public createError(
        code: string,
        message: string,
        userMessage: string,
        options: Partial<BmadError> = {}
    ): BmadError {
        return {
            code,
            message,
            userMessage,
            recoverable: options.recoverable ?? true,
            actions: options.actions,
            shouldNotify: options.shouldNotify ?? true,
        };
    }

    /**
     * Create a failure ServiceResult
     */
    public failure<T>(error: BmadError): ServiceResult<T> {
        return { success: false, error };
    }

    /**
     * Create a success ServiceResult
     */
    public success<T>(data: T): ServiceResult<T> {
        return { success: true, data };
    }

    /**
     * Wrap an async operation with error handling
     */
    public async wrapAsync<T>(
        operation: () => Promise<T>,
        errorCode: string,
        userMessage: string
    ): Promise<ServiceResult<T>> {
        try {
            const data = await operation();
            return this.success(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const error = this.createError(errorCode, message, userMessage);
            this.handleError(error);
            return this.failure(error);
        }
    }

    /**
     * Show notification to user based on error type
     */
    private showNotification(error: BmadError): void {
        const actions = error.actions?.map(a => a.title) ?? [];
        
        if (error.recoverable) {
            vscode.window.showWarningMessage(error.userMessage, ...actions)
                .then(selected => this.handleActionSelection(error, selected));
        } else {
            vscode.window.showErrorMessage(error.userMessage, ...actions)
                .then(selected => this.handleActionSelection(error, selected));
        }
    }

    /**
     * Handle user selection of error action
     */
    private handleActionSelection(error: BmadError, selected: string | undefined): void {
        if (!selected || !error.actions) {
            return;
        }

        const action = error.actions.find(a => a.title === selected);
        if (action?.command) {
            vscode.commands.executeCommand(action.command, ...(action.args ?? []));
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.outputChannel.dispose();
        ErrorService.instance = null;
    }
}

// Export singleton accessor
export const getErrorService = (): ErrorService => ErrorService.getInstance();
