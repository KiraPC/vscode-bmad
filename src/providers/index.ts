/**
 * Providers exports
 * Re-exports all providers for convenient importing
 */

// TreeView provider (legacy, kept for reference during transition)
export {
    SidebarTreeProvider,
    SidebarItem,
    InitProjectItem,
    ProjectInfoItem,
    registerSidebarCommands,
    registerSidebarTreeView,
} from './SidebarTreeProvider';

// WebView provider (Story 3.3)
export { SidebarProvider } from './SidebarProvider';

// Kanban WebView provider (Story 5.1)
export { KanbanProvider } from './KanbanProvider';
