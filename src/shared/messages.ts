/**
 * Shared Message Types for PostMessage Communication
 * Story 3.2: Typed message interfaces shared between extension and WebView
 * Story 3.5: Extended with ArtifactProgress for in-progress state
 * Story 3.6: Extended with ProjectSummaryPayload for epics-ready state
 *
 * All PostMessage communication uses typed protocol with:
 * - `type` discriminator field for message routing
 * - `payload` object containing message data
 * - Union types for compile-time exhaustiveness checking
 */

import type { ArtifactProgress, ProjectSummaryPayload, FilesLoadedPayload, WorkflowProgress } from './types';
import type { Epic, Story, Agent, AgentCommand, ModelOption } from './models';

// ============================================================================
// Extension → WebView Payloads
// ============================================================================

export interface ConfigPayload {
    projectName: string;
    userName: string;
    communicationLanguage: string;
    planningArtifacts: string;
    implementationArtifacts: string;
}

export interface ProjectStatePayload {
    state: 'no-project' | 'fresh' | 'in-progress' | 'epics-ready';
    hasConfig: boolean;
    hasEpics: boolean;
    hasStories: boolean;
    /** Story 3.5: Detailed artifact progress for in-progress state */
    artifacts?: ArtifactProgress;
    /** Story 3.6: Project summary for epics-ready state */
    summary?: ProjectSummaryPayload;
    /** Story 6.7: Workflow progress for tracker display */
    workflowProgress?: WorkflowProgress;
}

export interface DataLoadedPayload {
    epics: Epic[];
    stories: Story[];
    /** Story 5.8: Workflow progress for progress bar display */
    workflowProgress?: WorkflowProgress;
}

export interface ErrorPayload {
    code: string;
    message: string;
    recoverable: boolean;
}

/**
 * Story 6.3: Payload for agents discovered by AgentParserService
 */
export interface AgentsLoadedPayload {
    agents: Agent[];
}

/**
 * Story 6.3: Payload for commands parsed from selected agent
 */
export interface CommandsLoadedPayload {
    agentId: string;
    commands: AgentCommand[];
}

/**
 * Story 6.5: Payload for available AI models from VS Code API
 */
export interface ModelsLoadedPayload {
    models: ModelOption[];
}

// ============================================================================
// Extension → WebView Message Union
// ============================================================================

export type ExtensionMessage =
    | { type: 'configLoaded'; payload: ConfigPayload }
    | { type: 'projectStateChanged'; payload: ProjectStatePayload }
    | { type: 'dataLoaded'; payload: DataLoadedPayload }
    | { type: 'filesLoaded'; payload: FilesLoadedPayload }
    | { type: 'error'; payload: ErrorPayload }
    | { type: 'agentsLoaded'; payload: AgentsLoadedPayload }
    | { type: 'commandsLoaded'; payload: CommandsLoadedPayload }
    | { type: 'modelsLoaded'; payload: ModelsLoadedPayload };

// ============================================================================
// WebView → Extension Payloads
// ============================================================================

export interface ReadyPayload {
    webviewId: 'sidebar' | 'kanban';
}

export interface OpenFilePayload {
    filePath: string;
    /**
     * Story 5.6: If true and file is markdown, open in preview mode
     * @default false
     */
    preview?: boolean;
}

export interface ExecuteCommandPayload {
    command: string;
    args?: unknown[];
}

export interface LaunchAgentPayload {
    agentId: string;
    command?: string;
    customPrompt?: string;
    model?: string;
}

/**
 * Story 6.3: Request commands for a specific agent
 */
export interface RequestCommandsPayload {
    agentFilePath: string;
}

// ============================================================================
// WebView → Extension Message Union
// ============================================================================

export type WebViewMessage =
    | { type: 'ready'; payload: ReadyPayload }
    | { type: 'openFile'; payload: OpenFilePayload }
    | { type: 'executeCommand'; payload: ExecuteCommandPayload }
    | { type: 'launchAgent'; payload: LaunchAgentPayload }
    | { type: 'requestCommands'; payload: RequestCommandsPayload }
    | { type: 'requestModels'; payload: Record<string, never> };

// ============================================================================
// VS Code API Interface for WebViews
// ============================================================================

export interface VsCodeApi {
    postMessage(message: WebViewMessage): void;
    getState(): unknown;
    setState(state: unknown): void;
}

// Declare global for acquireVsCodeApi
declare global {
    function acquireVsCodeApi(): VsCodeApi;
}

// ============================================================================
// Message Helper Utilities
// ============================================================================

/**
 * Type-safe postMessage wrapper for WebView
 * @param vscode - VS Code API instance from acquireVsCodeApi()
 * @param message - Typed WebViewMessage to send
 */
export function postMessage(vscode: VsCodeApi, message: WebViewMessage): void {
    vscode.postMessage(message);
}

/**
 * Type guard for ExtensionMessage
 * Validates that an unknown message conforms to ExtensionMessage structure
 * @param msg - Unknown message to validate
 * @returns True if message is a valid ExtensionMessage
 */
export function isExtensionMessage(msg: unknown): msg is ExtensionMessage {
    return (
        typeof msg === 'object' &&
        msg !== null &&
        'type' in msg &&
        'payload' in msg &&
        typeof (msg as ExtensionMessage).type === 'string' &&
        typeof (msg as ExtensionMessage).payload === 'object'
    );
}

/**
 * Type guard for WebViewMessage
 * Validates that an unknown message conforms to WebViewMessage structure
 * @param msg - Unknown message to validate
 * @returns True if message is a valid WebViewMessage
 */
export function isWebViewMessage(msg: unknown): msg is WebViewMessage {
    return (
        typeof msg === 'object' &&
        msg !== null &&
        'type' in msg &&
        'payload' in msg &&
        typeof (msg as WebViewMessage).type === 'string' &&
        typeof (msg as WebViewMessage).payload === 'object'
    );
}

// ============================================================================
// Message Type Extractors (for handler pattern)
// ============================================================================

/** Extract the type discriminator from ExtensionMessage */
export type ExtensionMessageType = ExtensionMessage['type'];

/** Extract the type discriminator from WebViewMessage */
export type WebViewMessageType = WebViewMessage['type'];

/** Extract payload type for a specific ExtensionMessage type */
export type ExtensionMessagePayload<T extends ExtensionMessageType> = Extract<
    ExtensionMessage,
    { type: T }
>['payload'];

/** Extract payload type for a specific WebViewMessage type */
export type WebViewMessagePayload<T extends WebViewMessageType> = Extract<
    WebViewMessage,
    { type: T }
>['payload'];
