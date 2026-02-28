/**
 * Models Unit Tests
 * Story 4.1: Shared Data Models
 * Task 7: Unit tests for type guards and exports
 */

import { describe, it, expect } from 'vitest';
import {
    isStoryStatus,
    isEpicStatus,
    type StoryStatus,
    type EpicStatus,
    type Story,
    type Epic,
} from '../../../src/shared/models';

describe('models', () => {
    describe('StoryStatus', () => {
        describe('isStoryStatus type guard', () => {
            it('should return true for valid story statuses', () => {
                const validStatuses: StoryStatus[] = [
                    'backlog',
                    'ready-for-dev',
                    'in-progress',
                    'review',
                    'done',
                ];

                for (const status of validStatuses) {
                    expect(isStoryStatus(status)).toBe(true);
                }
            });

            it('should return false for invalid story statuses', () => {
                expect(isStoryStatus('invalid')).toBe(false);
                expect(isStoryStatus('completed')).toBe(false);
                expect(isStoryStatus('pending')).toBe(false);
                expect(isStoryStatus('')).toBe(false);
            });

            it('should return false for non-string values', () => {
                expect(isStoryStatus(null)).toBe(false);
                expect(isStoryStatus(undefined)).toBe(false);
                expect(isStoryStatus(123)).toBe(false);
                expect(isStoryStatus({})).toBe(false);
                expect(isStoryStatus([])).toBe(false);
                expect(isStoryStatus(true)).toBe(false);
            });
        });

        describe('StoryStatus type', () => {
            it('should allow valid status assignment', () => {
                const status1: StoryStatus = 'backlog';
                const status2: StoryStatus = 'ready-for-dev';
                const status3: StoryStatus = 'in-progress';
                const status4: StoryStatus = 'review';
                const status5: StoryStatus = 'done';

                expect(status1).toBe('backlog');
                expect(status2).toBe('ready-for-dev');
                expect(status3).toBe('in-progress');
                expect(status4).toBe('review');
                expect(status5).toBe('done');
            });
        });
    });

    describe('EpicStatus', () => {
        describe('isEpicStatus type guard', () => {
            it('should return true for valid epic statuses', () => {
                const validStatuses: EpicStatus[] = [
                    'backlog',
                    'in-progress',
                    'done',
                ];

                for (const status of validStatuses) {
                    expect(isEpicStatus(status)).toBe(true);
                }
            });

            it('should return false for invalid epic statuses', () => {
                expect(isEpicStatus('invalid')).toBe(false);
                expect(isEpicStatus('ready-for-dev')).toBe(false);
                expect(isEpicStatus('review')).toBe(false);
                expect(isEpicStatus('')).toBe(false);
            });

            it('should return false for non-string values', () => {
                expect(isEpicStatus(null)).toBe(false);
                expect(isEpicStatus(undefined)).toBe(false);
                expect(isEpicStatus(123)).toBe(false);
                expect(isEpicStatus({})).toBe(false);
                expect(isEpicStatus([])).toBe(false);
                expect(isEpicStatus(true)).toBe(false);
            });
        });

        describe('EpicStatus type', () => {
            it('should allow valid status assignment', () => {
                const status1: EpicStatus = 'backlog';
                const status2: EpicStatus = 'in-progress';
                const status3: EpicStatus = 'done';

                expect(status1).toBe('backlog');
                expect(status2).toBe('in-progress');
                expect(status3).toBe('done');
            });
        });
    });

    describe('Story interface', () => {
        it('should allow creating a story with required fields', () => {
            const story: Story = {
                id: '4-1',
                title: 'Shared Data Models',
                status: 'in-progress',
                epicId: '4',
                filePath: '/path/to/story.md',
            };

            expect(story.id).toBe('4-1');
            expect(story.title).toBe('Shared Data Models');
            expect(story.status).toBe('in-progress');
            expect(story.epicId).toBe('4');
            expect(story.filePath).toBe('/path/to/story.md');
        });

        it('should allow creating a story with optional fields', () => {
            const story: Story = {
                id: '4-1',
                title: 'Shared Data Models',
                status: 'in-progress',
                epicId: '4',
                filePath: '/path/to/story.md',
                assignee: 'Dev',
                content: '## Story Content',
            };

            expect(story.assignee).toBe('Dev');
            expect(story.content).toBe('## Story Content');
        });

        it('should work with all story statuses', () => {
            const statuses: StoryStatus[] = [
                'backlog',
                'ready-for-dev',
                'in-progress',
                'review',
                'done',
            ];

            for (const status of statuses) {
                const story: Story = {
                    id: '1-1',
                    title: 'Test',
                    status,
                    epicId: '1',
                    filePath: '/test.md',
                };
                expect(story.status).toBe(status);
            }
        });
    });

    describe('Epic interface', () => {
        it('should allow creating an epic with required fields', () => {
            const epic: Epic = {
                id: '4',
                title: 'File Parsing & State Management',
                description: 'Parse project files and manage state',
                status: 'in-progress',
                storyIds: ['4-1', '4-2', '4-3'],
            };

            expect(epic.id).toBe('4');
            expect(epic.title).toBe('File Parsing & State Management');
            expect(epic.description).toBe('Parse project files and manage state');
            expect(epic.status).toBe('in-progress');
            expect(epic.storyIds).toEqual(['4-1', '4-2', '4-3']);
        });

        it('should work with all epic statuses', () => {
            const statuses: EpicStatus[] = ['backlog', 'in-progress', 'done'];

            for (const status of statuses) {
                const epic: Epic = {
                    id: '1',
                    title: 'Test Epic',
                    description: 'Test',
                    status,
                    storyIds: [],
                };
                expect(epic.status).toBe(status);
            }
        });

        it('should allow empty storyIds array', () => {
            const epic: Epic = {
                id: '1',
                title: 'New Epic',
                description: 'Description',
                status: 'backlog',
                storyIds: [],
            };

            expect(epic.storyIds).toEqual([]);
        });
    });

    describe('exports', () => {
        it('should export all required types and functions', () => {
            // Type guards are functions
            expect(typeof isStoryStatus).toBe('function');
            expect(typeof isEpicStatus).toBe('function');
        });
    });
});
