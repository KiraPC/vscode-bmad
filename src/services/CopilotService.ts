/**
 * CopilotService - GitHub Copilot Chat Integration
 * Story 6.4: Chat integration with graceful fallback
 * 
 * FR22: Launch agents in Copilot Chat
 * FR23: Graceful fallback when Copilot unavailable
 * NFR-I2: Graceful degradation if Copilot not installed
 */

import * as vscode from 'vscode';
import { 
    ServiceResult, 
    BmadError, 
    ErrorCodes, 
    CopilotAvailability, 
    AgentLaunchRequest,
    CopilotExtensionIds 
} from '../shared/types';
import { getErrorService } from './ErrorService';

/**
 * CopilotService - Singleton service for Copilot Chat integration
 * Story 6.4: Implements agent launching with graceful degradation
 */
export class CopilotService {
    private static instance: CopilotService | null = null;
    
    /** Cache availability check result with timestamp */
    private _availabilityCache: { value: CopilotAvailability; timestamp: number } | null = null;
    
    /** Cache TTL: 5 minutes (AC #6) */
    private readonly CACHE_TTL_MS = 5 * 60 * 1000;
    
    /** Maximum prompt length to prevent token overflow (AC #5) */
    private readonly MAX_PROMPT_LENGTH = 2000;

    private constructor() {}

    /**
     * Get singleton instance of CopilotService
     */
    public static getInstance(): CopilotService {
        if (!CopilotService.instance) {
            CopilotService.instance = new CopilotService();
        }
        return CopilotService.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        CopilotService.instance = null;
    }

    /**
     * Check Copilot Chat availability
     * Story 6.4 AC #2, #3, #6: Runtime feature detection with caching
     */
    public checkAvailability(): CopilotAvailability {
        // Check cache first (AC #6)
        if (this._availabilityCache && 
            Date.now() - this._availabilityCache.timestamp < this.CACHE_TTL_MS) {
            return this._availabilityCache.value;
        }
        
        // Check for Copilot Chat extension (AC #1: full functionality)
        const chatExtension = vscode.extensions.getExtension(CopilotExtensionIds.COPILOT_CHAT);
        if (chatExtension) {
            this._availabilityCache = { value: 'full', timestamp: Date.now() };
            return 'full';
        }
        
        // Check for base Copilot extension (AC #3: limited functionality)
        const baseExtension = vscode.extensions.getExtension(CopilotExtensionIds.COPILOT);
        if (baseExtension) {
            this._availabilityCache = { value: 'chat-only', timestamp: Date.now() };
            return 'chat-only';
        }
        
        // No Copilot found (AC #2)
        this._availabilityCache = { value: 'none', timestamp: Date.now() };
        return 'none';
    }

    /**
     * Clear availability cache (for testing or when extension state changes)
     */
    public clearAvailabilityCache(): void {
        this._availabilityCache = null;
    }

    /**
     * Launch an agent in Copilot Chat
     * Story 6.4 AC #1, #2, #3: Launch with appropriate fallback
     * @param request - Agent launch request with agentId, command, and optional prompt
     * @returns ServiceResult indicating success or failure
     */
    public async launchAgent(request: AgentLaunchRequest): Promise<ServiceResult<void>> {
        const errorService = getErrorService();
        const availability = this.checkAvailability();

        errorService.info(`CopilotService: Launching agent '${request.agentId}' with availability '${availability}'`);

        switch (availability) {
            case 'full':
                return this.launchWithFullCopilot(request);
            case 'chat-only':
                return this.launchWithChatFallback(request);
            case 'none':
                return this.handleNoCopilot();
        }
    }

    /**
     * Launch agent with full Copilot Chat functionality
     * Story 6.4 AC #1: Open chat with @agent and command, auto-send
     */
    private async launchWithFullCopilot(request: AgentLaunchRequest): Promise<ServiceResult<void>> {
        const errorService = getErrorService();
        
        try {
            // Construct message with @agent prefix: @{agentId} {command} {prompt}
            const message = this.constructChatMessage(request);
            
            // Open new chat first to ensure fresh context
            await vscode.commands.executeCommand('workbench.action.chat.newChat');
            
            // Open chat with query - this auto-sends the message
            await vscode.commands.executeCommand('workbench.action.chat.open', { 
                query: message
            });
            
            errorService.info(`CopilotService: Launched chat with message: ${message}`);
            
            return { success: true, data: undefined };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const error: BmadError = {
                code: ErrorCodes.UNKNOWN_ERROR,
                message: `Failed to launch Copilot Chat: ${message}`,
                userMessage: 'Failed to open Copilot Chat. Please try again.',
                recoverable: true,
                shouldNotify: true,
            };
            errorService.handleError(error);
            return { success: false, error };
        }
    }

    /**
     * Launch with basic chat fallback (Copilot base extension only)
     * Story 6.4 AC #3: Open chat with info message
     */
    private async launchWithChatFallback(request: AgentLaunchRequest): Promise<ServiceResult<void>> {
        const errorService = getErrorService();
        
        try {
            // Construct message without @-mention (older versions may not support it)
            const message = this.constructFallbackMessage(request);
            
            // Open chat with basic command
            await vscode.commands.executeCommand('workbench.action.chat.open');
            
            // Show info message with instructions
            vscode.window.showInformationMessage(
                `Launch agent '${request.agentId}'${request.command ? ` with /${request.command}` : ''}. ` +
                'Copilot Chat extension recommended for full functionality.',
                'Install Copilot Chat'
            ).then(selection => {
                if (selection === 'Install Copilot Chat') {
                    this.openCopilotExtensionPage();
                }
            });
            
            errorService.info(`CopilotService: Fallback launch for agent '${request.agentId}' (chat-only mode)`);
            
            return { success: true, data: undefined };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const error: BmadError = {
                code: ErrorCodes.UNKNOWN_ERROR,
                message: `Failed to launch chat fallback: ${message}`,
                userMessage: 'Failed to open VS Code Chat. Please try again.',
                recoverable: true,
                shouldNotify: true,
            };
            errorService.handleError(error);
            return { success: false, error };
        }
    }

    /**
     * Handle case when Copilot is not installed
     * Story 6.4 AC #2, #4: Show notification with Install action
     */
    private async handleNoCopilot(): Promise<ServiceResult<void>> {
        const errorService = getErrorService();
        
        errorService.info('CopilotService: Copilot not installed, showing install prompt');
        
        // Show notification with Install action (AC #4)
        const selection = await vscode.window.showWarningMessage(
            'GitHub Copilot is not installed. Install it to use BMAD agents in chat.',
            'Install Copilot',
            'Open Chat Anyway'
        );
        
        if (selection === 'Install Copilot') {
            await this.openCopilotExtensionPage();
        } else if (selection === 'Open Chat Anyway') {
            // Open basic VS Code chat as last resort
            await vscode.commands.executeCommand('workbench.action.chat.open');
        }
        
        // Return success since we handled the situation gracefully
        return { success: true, data: undefined };
    }

    /**
     * Open Copilot Chat extension page in marketplace
     * Story 6.4 AC #4: NFR-I2 graceful degradation
     */
    private async openCopilotExtensionPage(): Promise<void> {
        await vscode.commands.executeCommand(
            'workbench.extensions.search',
            '@id:github.copilot-chat'
        );
    }

    /**
     * Construct chat message for full Copilot Chat
     * Story 6.4 AC #1: Format as @{agentId} {command} {prompt}
     * Story 6.6 AC #6: Empty/whitespace-only prompts are omitted
     */
    private constructChatMessage(request: AgentLaunchRequest): string {
        const parts: string[] = [];
        
        // Add @-mention for agent selection
        parts.push(`@${request.agentId}`);
        
        // Add command if provided
        if (request.command) {
            parts.push(request.command);
        }
        
        // Add sanitized prompt if provided and non-empty after sanitization
        if (request.customPrompt) {
            const sanitized = this.sanitizePrompt(request.customPrompt);
            if (sanitized) {
                parts.push(sanitized);
            }
        }
        
        return parts.join(' ');
    }

    /**
     * Construct fallback message with @-mention
     * Story 6.6 AC #6: Empty/whitespace-only prompts are omitted
     */
    private constructFallbackMessage(request: AgentLaunchRequest): string {
        const parts: string[] = [];
        
        // Add @-mention for agent
        parts.push(`@${request.agentId}`);
        
        // Add command if provided
        if (request.command) {
            parts.push(request.command);
        }
        
        // Add prompt if provided and non-empty after sanitization
        if (request.customPrompt) {
            const sanitized = this.sanitizePrompt(request.customPrompt);
            if (sanitized) {
                parts.push(sanitized);
            }
        }
        
        return parts.join(' ');
    }

    /**
     * Sanitize user-provided prompt to prevent command injection
     * Story 6.4 AC #5: NFR-S3 input sanitization for security
     */
    private sanitizePrompt(prompt: string): string {
        // Remove or escape command prefixes that could inject commands
        let sanitized = prompt
            // Remove leading @ or / at line starts to prevent command injection
            .replace(/^[@/]/gm, '')
            // Remove control characters
            .replace(/[\x00-\x1F\x7F]/g, '')
            .trim();
        
        // Limit length to prevent token overflow
        if (sanitized.length > this.MAX_PROMPT_LENGTH) {
            sanitized = sanitized.substring(0, this.MAX_PROMPT_LENGTH) + '...';
        }
        
        return sanitized;
    }

    /**
     * Get cache TTL in milliseconds (for testing)
     */
    public getCacheTtlMs(): number {
        return this.CACHE_TTL_MS;
    }

    /**
     * Get max prompt length (for testing)
     */
    public getMaxPromptLength(): number {
        return this.MAX_PROMPT_LENGTH;
    }
}

/**
 * Get singleton instance of CopilotService
 * Story 6.4: Convenience function for service access
 */
export function getCopilotService(): CopilotService {
    return CopilotService.getInstance();
}
