/**
 * Services exports
 * Re-exports all services for convenient importing
 */

export { ErrorService, getErrorService } from './ErrorService';
export { ConfigService, getConfigService } from './ConfigService';
export { ShellService, getShellService, Platform, IShellService } from './ShellService';
export { TerminalService, getTerminalService, TerminalError, ITerminalService } from './TerminalService';
export {
    ParserService,
    getParserService,
    normalizeLineEndings,
    type ParsedFrontmatter,
    type FrontmatterParseOptions,
} from './ParserService';
export {
    EpicsParser,
    getEpicsParser,
    type EpicsMetadata,
    type ParsedEpics,
} from './EpicsParser';
export {
    StoryParser,
    getStoryParser,
    type ParsedStories,
} from './StoryParser';
export {
    FileWatcherService,
    getFileWatcherService,
    type FileChangeType,
    type FileChange,
    type FileChangeEvent,
    type FileChangeCallback,
    type FileWatcherConfig,
} from './FileWatcherService';
export {
    StateService,
    getStateService,
    initializeStateService,
    DEFAULT_STATE,
    type KanbanState,
    type SidebarState,
    type PersistentState,
} from './StateService';
export {
    WorkflowProgressService,
    getWorkflowProgressService,
} from './WorkflowProgressService';
export {
    AgentParserService,
    getAgentParserService,
} from './AgentParserService';
export {
    CopilotService,
    getCopilotService,
} from './CopilotService';
export {
    ModelService,
    getModelService,
} from './ModelService';
