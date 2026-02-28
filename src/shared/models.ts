/**
 * Shared Data Models for Epic, Story, and Status Types
 * Story 4.1: TypeScript interfaces for data structures
 *
 * These types are shared between extension and WebView code.
 * All types use named exports (no default exports).
 */

// ============================================================================
// Status Types (Task 1)
// ============================================================================

/**
 * Status values for stories - aligned with sprint-status.yaml format
 * Task 1.1: Story status type union
 */
export type StoryStatus = 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';

/**
 * Status values for epics - aligned with sprint-status.yaml format
 * Task 1.2: Epic status type union
 */
export type EpicStatus = 'backlog' | 'in-progress' | 'done';

// ============================================================================
// Story Interface (Task 2)
// ============================================================================

/**
 * Represents a user story from implementation-artifacts
 * FR35: Parse story files for metadata
 *
 * Task 2.1-2.3: Story interface with required and optional fields
 */
export interface Story {
    /** Story identifier (e.g., "4-1") */
    id: string;

    /** Story title from story file header */
    title: string;

    /** Current status */
    status: StoryStatus;

    /** Parent epic identifier (e.g., "4") */
    epicId: string;

    /** Assignee name (optional) */
    assignee?: string;

    /** Story file content (optional, for preview) */
    content?: string;

    /** Absolute file path to the story file */
    filePath: string;
}

// ============================================================================
// Epic Interface (Task 3)
// ============================================================================

/**
 * Represents an epic from epics.md
 * FR33: Parse epics.md for epic list
 *
 * Task 3.1-3.3: Epic interface with required fields
 */
export interface Epic {
    /** Epic identifier (e.g., "1", "2") */
    id: string;

    /** Epic title from epics.md */
    title: string;

    /** Epic description/goal */
    description: string;

    /** Derived status based on child stories - FR38 */
    status: EpicStatus;

    /** IDs of stories belonging to this epic */
    storyIds: string[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid StoryStatus
 */
export function isStoryStatus(value: unknown): value is StoryStatus {
    return (
        typeof value === 'string' &&
        ['backlog', 'ready-for-dev', 'in-progress', 'review', 'done'].includes(value)
    );
}

/**
 * Type guard to check if a value is a valid EpicStatus
 */
export function isEpicStatus(value: unknown): value is EpicStatus {
    return (
        typeof value === 'string' &&
        ['backlog', 'in-progress', 'done'].includes(value)
    );
}

// ============================================================================
// Agent Interface (Story 6.1)
// ============================================================================

/**
 * Represents a BMAD agent from _bmad/bmm/agents/
 * FR18: Dynamic agent discovery
 *
 * Story 6.1: AgentParserService - Discover Agents
 */
export interface Agent {
    /** Unique identifier (filename without .md extension) */
    id: string;

    /** Agent name from frontmatter or filename */
    name: string;

    /** Display name for UI (from frontmatter description or XML title) */
    displayName: string;

    /** Optional description text */
    description?: string;

    /** Absolute file path to agent markdown file */
    filePath: string;

    /** Optional emoji icon from XML <agent> tag */
    icon?: string;
}

/**
 * Type guard to check if a value is a valid Agent
 */
export function isAgent(value: unknown): value is Agent {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.displayName === 'string' &&
        typeof obj.filePath === 'string' &&
        (obj.description === undefined || typeof obj.description === 'string') &&
        (obj.icon === undefined || typeof obj.icon === 'string')
    );
}

// ============================================================================
// Agent Command Interfaces (Story 6.2)
// ============================================================================

/**
 * Optional attributes for agent menu commands
 * FR19: Parse agent commands from markdown
 *
 * Story 6.2: AgentParserService - Parse Commands
 */
export interface AgentCommandAttributes {
    /** Workflow YAML path for workflow-based commands */
    workflow?: string;

    /** Exec markdown path for direct execution commands */
    exec?: string;

    /** Data file path (CSV, JSON, YAML) for data-driven commands */
    data?: string;
}

/**
 * Represents a single command from an agent's menu
 * FR19: Parse agent commands from markdown
 *
 * Story 6.2: AgentParserService - Parse Commands
 */
export interface AgentCommand {
    /** Short command code (e.g., "SP", "CP", "MH") */
    code: string;

    /** Command description (text after command code) */
    description: string;

    /** Full menu item text including [CODE] prefix */
    fullText: string;

    /** Optional command attributes (workflow, exec, data) */
    attributes?: AgentCommandAttributes;
}

/**
 * Type guard to check if a value is a valid AgentCommandAttributes
 */
export function isAgentCommandAttributes(value: unknown): value is AgentCommandAttributes {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value as Record<string, unknown>;
    return (
        (obj.workflow === undefined || typeof obj.workflow === 'string') &&
        (obj.exec === undefined || typeof obj.exec === 'string') &&
        (obj.data === undefined || typeof obj.data === 'string')
    );
}

/**
 * Type guard to check if a value is a valid AgentCommand
 */
export function isAgentCommand(value: unknown): value is AgentCommand {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.code === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.fullText === 'string' &&
        (obj.attributes === undefined || isAgentCommandAttributes(obj.attributes))
    );
}

// ============================================================================
// Model Interface (Story 6.5)
// ============================================================================

/**
 * AI Model option for Model Selector dropdown
 * Story 6.5: Model Selector Integration
 * FR20: Available models from VS Code Language Model API
 */
export interface ModelOption {
    /** Unique model identifier from VS Code API */
    id: string;

    /** Human-readable display name (e.g., "copilot: GPT-4") */
    displayName: string;

    /** Model vendor (e.g., "copilot", "anthropic") */
    vendor: string;

    /** Model family (e.g., "gpt4", "claude-3") */
    family: string;
}

/**
 * Type guard to check if a value is a valid ModelOption
 */
export function isModelOption(value: unknown): value is ModelOption {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.id === 'string' &&
        typeof obj.displayName === 'string' &&
        typeof obj.vendor === 'string' &&
        typeof obj.family === 'string'
    );
}
