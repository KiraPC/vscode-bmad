/**
 * Status Derivation Utilities
 * Story 4.6: Derived Epic Status
 *
 * FR38: Derive epic status by aggregating child story statuses
 */

import type { Story, Epic, EpicStatus } from '../shared/models';

// ============================================================================
// Status Derivation
// ============================================================================

/**
 * Derive epic status from child story statuses
 *
 * Logic (FR38):
 * - If no stories → 'backlog'
 * - If all stories are 'backlog' → 'backlog'
 * - If all stories are 'done' → 'done'
 * - Otherwise → 'in-progress'
 *
 * Note: 'ready-for-dev', 'in-progress', 'review' are all considered
 * "work has started" so they result in epic being 'in-progress'.
 *
 * @param stories - Array of stories belonging to an epic
 * @returns The derived epic status
 */
export function deriveEpicStatus(stories: Story[]): EpicStatus {
    // Handle empty stories array
    if (stories.length === 0) {
        return 'backlog';
    }

    // Check if all stories are backlog
    const allBacklog = stories.every(s => s.status === 'backlog');
    if (allBacklog) {
        return 'backlog';
    }

    // Check if all stories are done
    const allDone = stories.every(s => s.status === 'done');
    if (allDone) {
        return 'done';
    }

    // Otherwise, epic is in-progress
    return 'in-progress';
}

// ============================================================================
// Epic Enrichment
// ============================================================================

/**
 * Get stories belonging to a specific epic
 *
 * @param epicId - The epic ID to filter by
 * @param stories - All stories
 * @returns Stories belonging to the specified epic
 */
export function getStoriesForEpic(epicId: string, stories: Story[]): Story[] {
    return stories.filter(story => story.epicId === epicId);
}

/**
 * Enrich a single epic with its child stories and derived status
 *
 * @param epic - The epic to enrich
 * @param allStories - All stories to find children from
 * @returns Enriched epic with storyIds and derived status
 */
export function enrichEpic(epic: Epic, allStories: Story[]): Epic {
    const epicStories = getStoriesForEpic(epic.id, allStories);
    const derivedStatus = deriveEpicStatus(epicStories);

    return {
        ...epic,
        storyIds: epicStories.map(s => s.id),
        status: derivedStatus,
    };
}

/**
 * Enrich all epics with their child stories and derived status
 *
 * This function matches stories to epics by epicId and calculates
 * the derived status for each epic based on its child stories.
 *
 * @param epics - Array of epics to enrich
 * @param stories - Array of all stories
 * @returns Array of enriched epics with storyIds and derived status
 */
export function enrichEpicsWithStories(epics: Epic[], stories: Story[]): Epic[] {
    return epics.map(epic => enrichEpic(epic, stories));
}

// ============================================================================
// Summary Statistics
// ============================================================================

/**
 * Summary of story counts by status for an epic
 */
export interface EpicStorySummary {
    /** Total number of stories */
    total: number;
    /** Number of stories in backlog */
    backlog: number;
    /** Number of stories ready for development */
    readyForDev: number;
    /** Number of stories in progress */
    inProgress: number;
    /** Number of stories in review */
    review: number;
    /** Number of completed stories */
    done: number;
}

/**
 * Get summary counts of stories by status for an epic
 *
 * @param stories - Stories belonging to an epic
 * @returns Summary object with counts by status
 */
export function getEpicStorySummary(stories: Story[]): EpicStorySummary {
    return {
        total: stories.length,
        backlog: stories.filter(s => s.status === 'backlog').length,
        readyForDev: stories.filter(s => s.status === 'ready-for-dev').length,
        inProgress: stories.filter(s => s.status === 'in-progress').length,
        review: stories.filter(s => s.status === 'review').length,
        done: stories.filter(s => s.status === 'done').length,
    };
}

/**
 * Calculate progress percentage for an epic
 *
 * @param stories - Stories belonging to an epic
 * @returns Progress percentage (0-100)
 */
export function calculateEpicProgress(stories: Story[]): number {
    if (stories.length === 0) {
        return 0;
    }

    const doneCount = stories.filter(s => s.status === 'done').length;
    return Math.round((doneCount / stories.length) * 100);
}
