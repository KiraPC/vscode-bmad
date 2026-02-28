/**
 * Status Derivation Unit Tests
 * Story 4.6: Derived Epic Status
 * Task 6: Unit tests for status derivation
 */

import { describe, it, expect } from 'vitest';
import type { Story, Epic } from '../../../src/shared/models';
import {
    deriveEpicStatus,
    getStoriesForEpic,
    enrichEpic,
    enrichEpicsWithStories,
    getEpicStorySummary,
    calculateEpicProgress,
} from '../../../src/utils/statusDerivation';

// ============================================================================
// Test Fixtures
// ============================================================================

function createStory(overrides: Partial<Story> = {}): Story {
    return {
        id: 'test-story',
        epicId: '1',
        title: 'Test Story',
        status: 'backlog',
        filePath: '/path/to/story.md',
        ...overrides,
    };
}

function createEpic(overrides: Partial<Epic> = {}): Epic {
    return {
        id: '1',
        title: 'Test Epic',
        description: 'Test epic description',
        storyIds: [],
        status: 'backlog',
        ...overrides,
    };
}

// ============================================================================
// deriveEpicStatus Tests
// ============================================================================

describe('deriveEpicStatus', () => {
    describe('AC #1: status derivation rules', () => {
        it('should return backlog when all stories are backlog', () => {
            const stories: Story[] = [
                createStory({ id: '1-1', status: 'backlog' }),
                createStory({ id: '1-2', status: 'backlog' }),
                createStory({ id: '1-3', status: 'backlog' }),
            ];

            expect(deriveEpicStatus(stories)).toBe('backlog');
        });

        it('should return done when all stories are done', () => {
            const stories: Story[] = [
                createStory({ id: '1-1', status: 'done' }),
                createStory({ id: '1-2', status: 'done' }),
                createStory({ id: '1-3', status: 'done' }),
            ];

            expect(deriveEpicStatus(stories)).toBe('done');
        });

        it('should return in-progress when stories have mixed statuses', () => {
            const stories: Story[] = [
                createStory({ id: '1-1', status: 'done' }),
                createStory({ id: '1-2', status: 'in-progress' }),
                createStory({ id: '1-3', status: 'backlog' }),
            ];

            expect(deriveEpicStatus(stories)).toBe('in-progress');
        });

        it('should return in-progress when some are backlog and some are done', () => {
            const stories: Story[] = [
                createStory({ id: '1-1', status: 'done' }),
                createStory({ id: '1-2', status: 'backlog' }),
            ];

            expect(deriveEpicStatus(stories)).toBe('in-progress');
        });

        it('should return in-progress when any story is in-progress', () => {
            const stories: Story[] = [
                createStory({ id: '1-1', status: 'backlog' }),
                createStory({ id: '1-2', status: 'in-progress' }),
            ];

            expect(deriveEpicStatus(stories)).toBe('in-progress');
        });

        it('should return in-progress when any story is ready-for-dev', () => {
            const stories: Story[] = [
                createStory({ id: '1-1', status: 'backlog' }),
                createStory({ id: '1-2', status: 'ready-for-dev' }),
            ];

            expect(deriveEpicStatus(stories)).toBe('in-progress');
        });

        it('should return in-progress when any story is in review', () => {
            const stories: Story[] = [
                createStory({ id: '1-1', status: 'backlog' }),
                createStory({ id: '1-2', status: 'review' }),
            ];

            expect(deriveEpicStatus(stories)).toBe('in-progress');
        });
    });

    describe('AC #2: empty stories handling', () => {
        it('should return backlog when no stories exist', () => {
            expect(deriveEpicStatus([])).toBe('backlog');
        });
    });

    describe('single story scenarios', () => {
        it('should handle single backlog story', () => {
            const stories: Story[] = [createStory({ status: 'backlog' })];
            expect(deriveEpicStatus(stories)).toBe('backlog');
        });

        it('should handle single done story', () => {
            const stories: Story[] = [createStory({ status: 'done' })];
            expect(deriveEpicStatus(stories)).toBe('done');
        });

        it('should handle single in-progress story', () => {
            const stories: Story[] = [createStory({ status: 'in-progress' })];
            expect(deriveEpicStatus(stories)).toBe('in-progress');
        });
    });
});

// ============================================================================
// getStoriesForEpic Tests
// ============================================================================

describe('getStoriesForEpic', () => {
    it('should return stories matching epicId', () => {
        const stories: Story[] = [
            createStory({ id: '1-1', epicId: '1' }),
            createStory({ id: '1-2', epicId: '1' }),
            createStory({ id: '2-1', epicId: '2' }),
        ];

        const result = getStoriesForEpic('1', stories);

        expect(result).toHaveLength(2);
        expect(result.map(s => s.id)).toEqual(['1-1', '1-2']);
    });

    it('should return empty array when no stories match', () => {
        const stories: Story[] = [
            createStory({ id: '1-1', epicId: '1' }),
        ];

        const result = getStoriesForEpic('99', stories);

        expect(result).toHaveLength(0);
    });

    it('should return empty array for empty stories array', () => {
        const result = getStoriesForEpic('1', []);

        expect(result).toHaveLength(0);
    });
});

// ============================================================================
// enrichEpic Tests
// ============================================================================

describe('enrichEpic', () => {
    it('should populate storyIds from matching stories', () => {
        const epic: Epic = createEpic({ id: '1' });
        const stories: Story[] = [
            createStory({ id: '1-1', epicId: '1' }),
            createStory({ id: '1-2', epicId: '1' }),
            createStory({ id: '2-1', epicId: '2' }),
        ];

        const enriched = enrichEpic(epic, stories);

        expect(enriched.storyIds).toEqual(['1-1', '1-2']);
    });

    it('should set derived status', () => {
        const epic: Epic = createEpic({ id: '1', status: 'backlog' });
        const stories: Story[] = [
            createStory({ id: '1-1', epicId: '1', status: 'done' }),
            createStory({ id: '1-2', epicId: '1', status: 'in-progress' }),
        ];

        const enriched = enrichEpic(epic, stories);

        expect(enriched.status).toBe('in-progress');
    });

    it('should preserve other epic properties', () => {
        const epic: Epic = createEpic({
            id: '1',
            title: 'My Epic',
            description: 'Epic description',
        });
        const stories: Story[] = [];

        const enriched = enrichEpic(epic, stories);

        expect(enriched.id).toBe('1');
        expect(enriched.title).toBe('My Epic');
        expect(enriched.description).toBe('Epic description');
    });

    it('should handle epic with no matching stories', () => {
        const epic: Epic = createEpic({ id: '1' });
        const stories: Story[] = [
            createStory({ id: '2-1', epicId: '2' }),
        ];

        const enriched = enrichEpic(epic, stories);

        expect(enriched.storyIds).toEqual([]);
        expect(enriched.status).toBe('backlog');
    });
});

// ============================================================================
// enrichEpicsWithStories Tests
// ============================================================================

describe('enrichEpicsWithStories', () => {
    it('should enrich all epics with stories and status (AC #4)', () => {
        const epics: Epic[] = [
            createEpic({ id: '1', title: 'Epic 1' }),
            createEpic({ id: '2', title: 'Epic 2' }),
        ];
        const stories: Story[] = [
            createStory({ id: '1-1', epicId: '1', status: 'done' }),
            createStory({ id: '1-2', epicId: '1', status: 'done' }),
            createStory({ id: '2-1', epicId: '2', status: 'in-progress' }),
        ];

        const enriched = enrichEpicsWithStories(epics, stories);

        expect(enriched).toHaveLength(2);

        // Epic 1 - all done
        expect(enriched[0].storyIds).toEqual(['1-1', '1-2']);
        expect(enriched[0].status).toBe('done');

        // Epic 2 - in progress
        expect(enriched[1].storyIds).toEqual(['2-1']);
        expect(enriched[1].status).toBe('in-progress');
    });

    it('should handle empty epics array', () => {
        const stories: Story[] = [createStory()];

        const enriched = enrichEpicsWithStories([], stories);

        expect(enriched).toHaveLength(0);
    });

    it('should handle empty stories array', () => {
        const epics: Epic[] = [createEpic({ id: '1' })];

        const enriched = enrichEpicsWithStories(epics, []);

        expect(enriched).toHaveLength(1);
        expect(enriched[0].storyIds).toEqual([]);
        expect(enriched[0].status).toBe('backlog');
    });
});

// ============================================================================
// getEpicStorySummary Tests
// ============================================================================

describe('getEpicStorySummary', () => {
    it('should count stories by status', () => {
        const stories: Story[] = [
            createStory({ id: '1', status: 'backlog' }),
            createStory({ id: '2', status: 'ready-for-dev' }),
            createStory({ id: '3', status: 'in-progress' }),
            createStory({ id: '4', status: 'review' }),
            createStory({ id: '5', status: 'done' }),
            createStory({ id: '6', status: 'done' }),
        ];

        const summary = getEpicStorySummary(stories);

        expect(summary.total).toBe(6);
        expect(summary.backlog).toBe(1);
        expect(summary.readyForDev).toBe(1);
        expect(summary.inProgress).toBe(1);
        expect(summary.review).toBe(1);
        expect(summary.done).toBe(2);
    });

    it('should return zeros for empty stories', () => {
        const summary = getEpicStorySummary([]);

        expect(summary.total).toBe(0);
        expect(summary.backlog).toBe(0);
        expect(summary.readyForDev).toBe(0);
        expect(summary.inProgress).toBe(0);
        expect(summary.review).toBe(0);
        expect(summary.done).toBe(0);
    });
});

// ============================================================================
// calculateEpicProgress Tests
// ============================================================================

describe('calculateEpicProgress', () => {
    it('should return 0 for empty stories', () => {
        expect(calculateEpicProgress([])).toBe(0);
    });

    it('should return 100 for all done stories', () => {
        const stories: Story[] = [
            createStory({ status: 'done' }),
            createStory({ status: 'done' }),
        ];

        expect(calculateEpicProgress(stories)).toBe(100);
    });

    it('should return 0 for no done stories', () => {
        const stories: Story[] = [
            createStory({ status: 'backlog' }),
            createStory({ status: 'in-progress' }),
        ];

        expect(calculateEpicProgress(stories)).toBe(0);
    });

    it('should calculate percentage correctly', () => {
        const stories: Story[] = [
            createStory({ status: 'done' }),
            createStory({ status: 'done' }),
            createStory({ status: 'in-progress' }),
            createStory({ status: 'backlog' }),
        ];

        // 2 of 4 = 50%
        expect(calculateEpicProgress(stories)).toBe(50);
    });

    it('should round percentage', () => {
        const stories: Story[] = [
            createStory({ status: 'done' }),
            createStory({ status: 'backlog' }),
            createStory({ status: 'backlog' }),
        ];

        // 1 of 3 = 33.33% → 33%
        expect(calculateEpicProgress(stories)).toBe(33);
    });
});
