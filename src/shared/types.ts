/**
 * Shared types for BMAD Extension
 * Story 1.2: Error types and ServiceResult pattern
 */

// ============================================================================
// Error Types (Story 1.2)
// ============================================================================

export interface BmadError {
    /** Unique error code for programmatic handling */
    code: string;
    /** Technical error message for logging */
    message: string;
    /** User-friendly message for notifications */
    userMessage: string;
    /** Whether the error is recoverable */
    recoverable: boolean;
    /** Optional actions the user can take */
    actions?: ErrorAction[];
    /** Whether to show notification to user */
    shouldNotify?: boolean;
}

export interface ErrorAction {
    title: string;
    command?: string;
    args?: unknown[];
}

// ServiceResult pattern for consistent error handling
export type ServiceResult<T> = 
    | { success: true; data: T }
    | { success: false; error: BmadError };

// ============================================================================
// Config Types (Story 1.3)
// ============================================================================

export interface BmadConfig {
    /** Project name from config */
    projectName: string;
    /** Path to planning artifacts folder */
    planningArtifacts: string;
    /** Path to implementation artifacts folder */
    implementationArtifacts: string;
    /** User name for personalization */
    userName?: string;
    /** Language for agent communication */
    communicationLanguage?: string;
    /** Language for document output */
    documentOutputLanguage?: string;
    /** Raw config object for additional fields */
    raw: Record<string, unknown>;
}

// ============================================================================
// Loading State (from Architecture patterns)
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// Project State (Story 3.4)
// ============================================================================

/**
 * Represents the state of a BMAD project in the workspace
 * - 'no-project': No _bmad/ folder exists
 * - 'fresh': _bmad/ exists but no planning artifacts
 * - 'in-progress': Some planning artifacts exist (prd.md)
 * - 'epics-ready': epics.md exists, ready for implementation
 */
export type ProjectState = 'no-project' | 'fresh' | 'in-progress' | 'epics-ready';

// ============================================================================
// Artifact Progress (Story 3.5)
// ============================================================================

/**
 * Workflow phases for project progress
 */
export type ProjectPhase = 'brainstorming' | 'analysis' | 'design' | 'ready';

/**
 * Artifact detection results for progressive UI (Story 3.5)
 * AC #1, #4: Track which planning artifacts exist and current phase
 */
export interface ArtifactProgress {
    /** Whether product-brief.md exists */
    hasProductBrief: boolean;
    /** Whether prd.md exists */
    hasPrd: boolean;
    /** Whether architecture.md exists */
    hasArchitecture: boolean;
    /** Whether epics.md exists */
    hasEpics: boolean;
    /** Current workflow phase based on artifacts */
    currentPhase: ProjectPhase;
}

// ============================================================================
// Project Summary (Story 3.6)
// ============================================================================

/**
 * Story count breakdown by status
 * Story 3.6 AC #3: Stories by status tracking
 */
export interface StoryCount {
    total: number;
    backlog: number;
    inProgress: number;
    review: number;
    done: number;
}

/**
 * Project summary payload for epics-ready state
 * Story 3.6 AC #3: Summary of project status
 */
export interface ProjectSummaryPayload {
    /** Number of epics in the project */
    epicCount: number;
    /** Story counts by status */
    storyCount: StoryCount;
    /** Currently in-progress story identifier (e.g., "3-6-progressive-panel") */
    currentSprintStory?: string;
}

// ============================================================================
// File Tree Types (Story 3.7)
// ============================================================================

/**
 * Represents a node in the artifact file tree
 * Story 3.7 Task 2: Support files and folders with path, label, icon
 */
export interface FileTreeNode {
    /** Node type - file or folder */
    type: 'file' | 'folder';
    /** Display name for the node */
    name: string;
    /** Absolute path for opening files */
    path: string;
    /** Child nodes for folders */
    children?: FileTreeNode[];
    /** Codicon name for the icon */
    icon?: string;
}

/**
 * Payload for filesLoaded message
 * Story 3.7 AC #1: Contains config file and artifact folders
 */
export interface FilesLoadedPayload {
    /** config.yaml file node */
    configFile: FileTreeNode;
    /** Planning artifacts folder with files */
    planningArtifacts: FileTreeNode;
    /** Implementation artifacts folder with files */
    implementationArtifacts: FileTreeNode;
}

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
    CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
    CONFIG_PARSE_ERROR: 'CONFIG_PARSE_ERROR',
    CONFIG_INVALID: 'CONFIG_INVALID',
    FILE_READ_ERROR: 'FILE_READ_ERROR',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    COMMAND_NOT_ALLOWED: 'COMMAND_NOT_ALLOWED',
    NO_WORKSPACE: 'NO_WORKSPACE',
    TERMINAL_ERROR: 'TERMINAL_ERROR',
    FRONTMATTER_PARSE_ERROR: 'FRONTMATTER_PARSE_ERROR',
    YAML_SYNTAX_ERROR: 'YAML_SYNTAX_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// Workflow Progress Types (Story 5.8)
// ============================================================================

/**
 * BMAD workflow phases for progress tracking
 * Story 5.8 AC #1: Display phases Planning | Solutioning | Implementation | Testing
 */
export type WorkflowPhase = 'planning' | 'solutioning' | 'implementation' | 'testing';

/**
 * Status of each phase in the workflow
 * Story 5.8 AC #1: completed (✓), current (highlighted), future (dimmed)
 */
export type PhaseStatus = 'completed' | 'current' | 'future';

/**
 * Workflow progress state for progress bar display
 * Story 5.8 AC #2: Derive state from artifact files (FR15, FR25)
 */
export interface WorkflowProgress {
    /** Planning phase status - based on brainstorming/product-brief files */
    planning: PhaseStatus;
    /** Solutioning phase status - based on prd.md + architecture.md */
    solutioning: PhaseStatus;
    /** Implementation phase status - based on epics.md + stories */
    implementation: PhaseStatus;
    /** Testing phase status - based on story completion */
    testing: PhaseStatus;
    /** Currently active phase */
    currentPhase: WorkflowPhase;
}

// ============================================================================
// Copilot Service Types (Story 6.4)
// ============================================================================

/**
 * Copilot availability levels
 * Story 6.4 AC #2, #3, #6: Runtime feature detection
 */
export type CopilotAvailability = 'full' | 'chat-only' | 'none';

/**
 * Request payload for launching an agent in Copilot Chat
 * Story 6.4 AC #1, #5: Agent launch with sanitized prompts
 */
export interface AgentLaunchRequest {
    /** Agent identifier (e.g., "sm", "pm", "analyst") */
    agentId: string;
    
    /** Optional command code (e.g., "SP", "CP") */
    command?: string;
    
    /** Optional custom prompt text */
    customPrompt?: string;
    
    /** Optional model selector (for future use) */
    model?: string;
}

/**
 * Copilot extension identifiers
 * Story 6.4 Task 1.4: Extension ID constants
 */
export const CopilotExtensionIds = {
    COPILOT_CHAT: 'github.copilot-chat',
    COPILOT: 'github.copilot',
} as const;
