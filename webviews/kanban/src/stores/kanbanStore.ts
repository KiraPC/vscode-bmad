/**
 * Kanban Store - Reactive state management for Kanban WebView
 * Story 5.2: Kanban Column Layout
 *
 * Manages:
 * - Stories and Epics data received from extension
 * - Derived stores for stories grouped by column status
 * - Loading state for initial render
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { Story, Epic, StoryStatus } from '@shared/models';
import type { ExtensionMessage, DataLoadedPayload } from '@shared/messages';
import type { WorkflowProgress } from '@shared/types';

// ============================================================================
// Task 1.1: Core writable stores
// ============================================================================

/** All stories loaded from extension */
export const stories = writable<Story[]>([]);

/** All epics loaded from extension */
export const epics = writable<Epic[]>([]);

// ============================================================================
// Task 1.4: Loading state store
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Loading state for initial data fetch */
export const loadingState = writable<LoadingState>('idle');

/** Error message if loading fails */
export const errorMessage = writable<string | null>(null);

// ============================================================================
// Story 5.8 Task 6: Workflow progress store
// ============================================================================

/** Workflow progress for progress bar display */
export const workflowProgress = writable<WorkflowProgress | null>(null);

// ============================================================================
// Task 5.5.4: Epic filter for Stories view
// ============================================================================

/** Currently active epic filter (null = no filter) */
export const epicFilter = writable<string | null>(null);

/** Set epic filter - used when clicking epic card */
export function setEpicFilter(epicId: string | null): void {
    epicFilter.set(epicId);
}

/** Clear epic filter */
export function clearEpicFilter(): void {
    epicFilter.set(null);
}

// ============================================================================
// Story 5.9 Task 7: Derived epic title for filter badge display
// ============================================================================

/** Active filter epic title for display in filter badge */
export const activeFilterEpicTitle: Readable<string | null> = derived(
    [epicFilter, epics],
    ([$epicFilter, $epics]) => 
        $epicFilter ? $epics.find((e) => e.id === $epicFilter)?.title ?? null : null
);

// ============================================================================
// Task 1.3: Derived stores for column grouping (with epic filter support)
// ============================================================================

/**
 * Column status mapping:
 * - Backlog: 'backlog', 'ready-for-dev'
 * - In Progress: 'in-progress'
 * - Review: 'review'
 * - Done: 'done'
 */

/** Stories in Backlog column (backlog + ready-for-dev), respects epicFilter */
export const backlogStories: Readable<Story[]> = derived(
    [stories, epicFilter],
    ([$stories, $epicFilter]) =>
        $stories.filter((s) =>
            (s.status === 'backlog' || s.status === 'ready-for-dev') &&
            ($epicFilter === null || s.epicId === $epicFilter)
        )
);

/** Stories in In Progress column, respects epicFilter */
export const inProgressStories: Readable<Story[]> = derived(
    [stories, epicFilter],
    ([$stories, $epicFilter]) =>
        $stories.filter((s) =>
            s.status === 'in-progress' &&
            ($epicFilter === null || s.epicId === $epicFilter)
        )
);

/** Stories in Review column, respects epicFilter */
export const reviewStories: Readable<Story[]> = derived(
    [stories, epicFilter],
    ([$stories, $epicFilter]) =>
        $stories.filter((s) =>
            s.status === 'review' &&
            ($epicFilter === null || s.epicId === $epicFilter)
        )
);

/** Stories in Done column, respects epicFilter */
export const doneStories: Readable<Story[]> = derived(
    [stories, epicFilter],
    ([$stories, $epicFilter]) =>
        $stories.filter((s) =>
            s.status === 'done' &&
            ($epicFilter === null || s.epicId === $epicFilter)
        )
);

// ============================================================================
// Task 1.2: Message handler to update stores
// ============================================================================

/**
 * Handle messages from extension and update stores
 * Called from App.svelte message listener
 */
export function handleExtensionMessage(message: ExtensionMessage): void {
    switch (message.type) {
        case 'dataLoaded':
            handleDataLoaded(message.payload);
            break;
        case 'error':
            loadingState.set('error');
            errorMessage.set(message.payload.message);
            break;
        case 'projectStateChanged':
            // Handle project state changes if needed
            break;
        case 'configLoaded':
        case 'filesLoaded':
            // Other message types - no action needed for kanban store
            break;
    }
}

/**
 * Process dataLoaded message and populate stores
 * Story 5.8 Task 6.2: Extract and set workflow progress from dataLoaded
 */
function handleDataLoaded(payload: DataLoadedPayload): void {
    stories.set(payload.stories);
    epics.set(payload.epics);
    // Story 5.8: Update workflow progress
    workflowProgress.set(payload.workflowProgress ?? null);
    loadingState.set('success');
    errorMessage.set(null);
}

/**
 * Set loading state to 'loading' - call when requesting data
 */
export function startLoading(): void {
    loadingState.set('loading');
}

// ============================================================================
// Task 5.4.2: Active view state for dual-view navigation
// ============================================================================

export type ViewType = 'stories' | 'epics';

/** Currently active view tab */
export const activeView = writable<ViewType>('stories');

/** Switch active view */
export function setActiveView(view: ViewType): void {
    activeView.set(view);
}

/**
 * Reset all stores to initial state
 */
export function resetStores(): void {
    stories.set([]);
    epics.set([]);
    loadingState.set('idle');
    errorMessage.set(null);
    activeView.set('stories');
    epicFilter.set(null);
    workflowProgress.set(null);
}
