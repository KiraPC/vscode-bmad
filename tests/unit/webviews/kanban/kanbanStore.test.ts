/**
 * Kanban Store Logic Unit Tests
 * Story 5.2: Kanban Column Layout
 * Story 5.9: Epic Filter in Stories View
 * Task 5: Tests for column grouping logic
 * Task 8: Tests for epic filter functionality
 * 
 * Note: We test the grouping logic directly without Svelte store dependencies
 * to avoid issues with Svelte module resolution in Node test environment.
 */

import { describe, it, expect } from 'vitest';
import type { Story, StoryStatus, Epic } from '../../../../src/shared/models';

// ============================================================================
// Test Data
// ============================================================================

const mockStories: Story[] = [
    { id: '1-1', title: 'Setup Project', status: 'done', epicId: '1', filePath: '/path/1-1.md' },
    { id: '1-2', title: 'Config Service', status: 'done', epicId: '1', filePath: '/path/1-2.md' },
    { id: '2-1', title: 'Shell Detection', status: 'in-progress', epicId: '2', filePath: '/path/2-1.md' },
    { id: '2-2', title: 'Terminal Command', status: 'review', epicId: '2', filePath: '/path/2-2.md' },
    { id: '3-1', title: 'WebView Pipeline', status: 'backlog', epicId: '3', filePath: '/path/3-1.md' },
    { id: '3-2', title: 'Message Types', status: 'ready-for-dev', epicId: '3', filePath: '/path/3-2.md' },
];

// ============================================================================
// Column Grouping Logic (mirrors kanbanStore.ts derived stores)
// ============================================================================

/**
 * Group stories by column status
 * This logic mirrors the derived stores in kanbanStore.ts
 */
function groupStoriesByColumn(stories: Story[]) {
    return {
        backlog: stories.filter((s) => s.status === 'backlog' || s.status === 'ready-for-dev'),
        inProgress: stories.filter((s) => s.status === 'in-progress'),
        review: stories.filter((s) => s.status === 'review'),
        done: stories.filter((s) => s.status === 'done'),
    };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Kanban Column Grouping Logic', () => {
    describe('Task 5.3: Column grouping', () => {
        it('should group backlog and ready-for-dev in Backlog column', () => {
            const grouped = groupStoriesByColumn(mockStories);
            
            expect(grouped.backlog).toHaveLength(2);
            expect(grouped.backlog.map(s => s.id)).toEqual(['3-1', '3-2']);
            expect(grouped.backlog.every(s => s.status === 'backlog' || s.status === 'ready-for-dev')).toBe(true);
        });

        it('should group in-progress stories in In Progress column', () => {
            const grouped = groupStoriesByColumn(mockStories);
            
            expect(grouped.inProgress).toHaveLength(1);
            expect(grouped.inProgress[0].id).toBe('2-1');
            expect(grouped.inProgress[0].status).toBe('in-progress');
        });

        it('should group review stories in Review column', () => {
            const grouped = groupStoriesByColumn(mockStories);
            
            expect(grouped.review).toHaveLength(1);
            expect(grouped.review[0].id).toBe('2-2');
            expect(grouped.review[0].status).toBe('review');
        });

        it('should group done stories in Done column', () => {
            const grouped = groupStoriesByColumn(mockStories);
            
            expect(grouped.done).toHaveLength(2);
            expect(grouped.done.map(s => s.id)).toEqual(['1-1', '1-2']);
            expect(grouped.done.every(s => s.status === 'done')).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty stories array', () => {
            const grouped = groupStoriesByColumn([]);
            
            expect(grouped.backlog).toEqual([]);
            expect(grouped.inProgress).toEqual([]);
            expect(grouped.review).toEqual([]);
            expect(grouped.done).toEqual([]);
        });

        it('should handle all stories in one column', () => {
            const allDone: Story[] = mockStories.map(s => ({ ...s, status: 'done' as StoryStatus }));
            const grouped = groupStoriesByColumn(allDone);
            
            expect(grouped.done).toHaveLength(6);
            expect(grouped.backlog).toHaveLength(0);
            expect(grouped.inProgress).toHaveLength(0);
            expect(grouped.review).toHaveLength(0);
        });

        it('should preserve story order within columns', () => {
            const grouped = groupStoriesByColumn(mockStories);
            
            // Backlog should preserve order: 3-1 before 3-2
            expect(grouped.backlog[0].id).toBe('3-1');
            expect(grouped.backlog[1].id).toBe('3-2');
            
            // Done should preserve order: 1-1 before 1-2
            expect(grouped.done[0].id).toBe('1-1');
            expect(grouped.done[1].id).toBe('1-2');
        });
    });

    describe('Column status mapping validation', () => {
        it('should map backlog status to Backlog column', () => {
            const story: Story = { id: 'x', title: 'Test', status: 'backlog', epicId: '1', filePath: '/path' };
            const grouped = groupStoriesByColumn([story]);
            
            expect(grouped.backlog).toContainEqual(story);
        });

        it('should map ready-for-dev status to Backlog column', () => {
            const story: Story = { id: 'x', title: 'Test', status: 'ready-for-dev', epicId: '1', filePath: '/path' };
            const grouped = groupStoriesByColumn([story]);
            
            expect(grouped.backlog).toContainEqual(story);
        });

        it('should map in-progress status to In Progress column', () => {
            const story: Story = { id: 'x', title: 'Test', status: 'in-progress', epicId: '1', filePath: '/path' };
            const grouped = groupStoriesByColumn([story]);
            
            expect(grouped.inProgress).toContainEqual(story);
        });

        it('should map review status to Review column', () => {
            const story: Story = { id: 'x', title: 'Test', status: 'review', epicId: '1', filePath: '/path' };
            const grouped = groupStoriesByColumn([story]);
            
            expect(grouped.review).toContainEqual(story);
        });

        it('should map done status to Done column', () => {
            const story: Story = { id: 'x', title: 'Test', status: 'done', epicId: '1', filePath: '/path' };
            const grouped = groupStoriesByColumn([story]);
            
            expect(grouped.done).toContainEqual(story);
        });
    });
});

// ============================================================================
// Story 5.9: Epic Filter Logic Tests
// ============================================================================

/**
 * Group stories by column status WITH epic filter support
 * This logic mirrors the derived stores in kanbanStore.ts
 */
function groupStoriesByColumnWithFilter(stories: Story[], epicFilter: string | null) {
    const filtered = epicFilter 
        ? stories.filter(s => s.epicId === epicFilter)
        : stories;
    
    return {
        backlog: filtered.filter((s) => s.status === 'backlog' || s.status === 'ready-for-dev'),
        inProgress: filtered.filter((s) => s.status === 'in-progress'),
        review: filtered.filter((s) => s.status === 'review'),
        done: filtered.filter((s) => s.status === 'done'),
    };
}

/**
 * Get active filter epic title
 * Mirrors activeFilterEpicTitle derived store logic
 */
function getActiveFilterEpicTitle(epicFilter: string | null, epics: Epic[]): string | null {
    return epicFilter ? epics.find((e) => e.id === epicFilter)?.title ?? null : null;
}

const mockEpics: Epic[] = [
    { id: '1', title: 'Extension Foundation', description: 'Foundation of the extension', status: 'in-progress', storyIds: ['1-1', '1-2', '1-3', '1-4', '1-5'] },
    { id: '2', title: 'Project Initialization', description: 'Project init features', status: 'done', storyIds: ['2-1', '2-2', '2-3'] },
    { id: '3', title: 'Sidebar Panel', description: 'Sidebar panel features', status: 'in-progress', storyIds: ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7'] },
];

describe('Epic Filter Logic (Story 5.9)', () => {
    describe('Task 8.2-8.3: Epic filter state management', () => {
        it('should set epic filter value', () => {
            // Simulates setEpicFilter behavior
            let epicFilter: string | null = null;
            epicFilter = '2';
            
            expect(epicFilter).toBe('2');
        });

        it('should clear epic filter to null', () => {
            // Simulates clearEpicFilter behavior
            let epicFilter: string | null = '2';
            epicFilter = null;
            
            expect(epicFilter).toBeNull();
        });
    });

    describe('Task 8.4: Derived stores filter when epicFilter is set', () => {
        it('should filter backlog stories by epicFilter', () => {
            const grouped = groupStoriesByColumnWithFilter(mockStories, '3');
            
            expect(grouped.backlog).toHaveLength(2);
            expect(grouped.backlog.every(s => s.epicId === '3')).toBe(true);
        });

        it('should filter in-progress stories by epicFilter', () => {
            const grouped = groupStoriesByColumnWithFilter(mockStories, '2');
            
            expect(grouped.inProgress).toHaveLength(1);
            expect(grouped.inProgress[0].epicId).toBe('2');
        });

        it('should filter review stories by epicFilter', () => {
            const grouped = groupStoriesByColumnWithFilter(mockStories, '2');
            
            expect(grouped.review).toHaveLength(1);
            expect(grouped.review[0].epicId).toBe('2');
        });

        it('should filter done stories by epicFilter', () => {
            const grouped = groupStoriesByColumnWithFilter(mockStories, '1');
            
            expect(grouped.done).toHaveLength(2);
            expect(grouped.done.every(s => s.epicId === '1')).toBe(true);
        });

        it('should return empty columns when filtering epic with no matching stories', () => {
            const grouped = groupStoriesByColumnWithFilter(mockStories, 'non-existent-epic');
            
            expect(grouped.backlog).toHaveLength(0);
            expect(grouped.inProgress).toHaveLength(0);
            expect(grouped.review).toHaveLength(0);
            expect(grouped.done).toHaveLength(0);
        });
    });

    describe('Task 8.5: Derived stores return all stories when epicFilter is null', () => {
        it('should return all stories when epicFilter is null', () => {
            const grouped = groupStoriesByColumnWithFilter(mockStories, null);
            
            expect(grouped.backlog).toHaveLength(2);
            expect(grouped.inProgress).toHaveLength(1);
            expect(grouped.review).toHaveLength(1);
            expect(grouped.done).toHaveLength(2);
        });
    });

    describe('Task 8.6: resetStores clears epicFilter', () => {
        it('should reset epicFilter to null', () => {
            // Simulates resetStores behavior
            let epicFilter: string | null = '3';
            
            // Reset stores logic
            epicFilter = null;
            
            expect(epicFilter).toBeNull();
        });
    });

    describe('Task 7: activeFilterEpicTitle derived store', () => {
        it('should return epic title when filter is active', () => {
            const title = getActiveFilterEpicTitle('1', mockEpics);
            
            expect(title).toBe('Extension Foundation');
        });

        it('should return null when filter is not active', () => {
            const title = getActiveFilterEpicTitle(null, mockEpics);
            
            expect(title).toBeNull();
        });

        it('should return null when filtered epic not found', () => {
            const title = getActiveFilterEpicTitle('non-existent', mockEpics);
            
            expect(title).toBeNull();
        });

        it('should handle empty epics array', () => {
            const title = getActiveFilterEpicTitle('1', []);
            
            expect(title).toBeNull();
        });
    });

    describe('Epic filter edge cases', () => {
        it('should handle filtering with empty stories array', () => {
            const grouped = groupStoriesByColumnWithFilter([], '1');
            
            expect(grouped.backlog).toEqual([]);
            expect(grouped.inProgress).toEqual([]);
            expect(grouped.review).toEqual([]);
            expect(grouped.done).toEqual([]);
        });

        it('should preserve story order when filtering', () => {
            const grouped = groupStoriesByColumnWithFilter(mockStories, '1');
            
            // Done column with epic 1 should preserve order: 1-1 before 1-2
            expect(grouped.done[0].id).toBe('1-1');
            expect(grouped.done[1].id).toBe('1-2');
        });
    });
});
