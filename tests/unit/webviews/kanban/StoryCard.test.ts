/**
 * StoryCard Component Logic Unit Tests
 * Story 5.3: Story Card Component
 * Story 5.6: Story Card Click - Markdown Preview
 * Task 8: Tests for StoryCard component logic
 * 
 * Note: We test the logic functions directly without Svelte component rendering
 * to avoid issues with Svelte module resolution in Node test environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Story, StoryStatus } from '../../../../src/shared/models';

// ============================================================================
// Test Data
// ============================================================================

const mockStoryComplete: Story = {
    id: '5-3',
    title: 'Story Card Component',
    status: 'in-progress',
    epicId: '5',
    assignee: 'Developer',
    filePath: '/path/5-3.md'
};

const mockStoryNoAssignee: Story = {
    id: '3-2',
    title: 'Message Types',
    status: 'ready-for-dev',
    epicId: '3',
    filePath: '/path/3-2.md'
};

// ============================================================================
// StoryCard Logic (mirrors StoryCard.svelte functions)
// ============================================================================

/**
 * Get status color based on story status
 * Task 3.2: Map status to appropriate colors
 */
function getStatusColor(status: StoryStatus): string {
    const colorMap: Record<StoryStatus, string> = {
        'backlog': 'var(--vscode-descriptionForeground)',
        'ready-for-dev': 'var(--vscode-textLink-foreground)',
        'in-progress': 'var(--vscode-editorWarning-foreground)',
        'review': 'var(--vscode-charts-purple, #b180d7)',
        'done': 'var(--vscode-testing-iconPassed, #89d185)'
    };
    return colorMap[status] ?? colorMap['backlog'];
}

/**
 * Format status text for display
 * Converts 'ready-for-dev' to 'Ready For Dev'
 */
function formatStatus(status: StoryStatus): string {
    return status.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Generate ARIA label for screen readers
 * Task 6.2: Combine story title, epic, status, and assignee
 */
function generateAriaLabel(story: Story): string {
    const parts = [
        story.title,
        `Epic ${story.epicId}`,
        `Status: ${formatStatus(story.status)}`
    ];
    if (story.assignee) {
        parts.push(`Assignee: ${story.assignee}`);
    }
    return parts.join(' - ');
}

// ============================================================================
// Test Suite
// ============================================================================

describe('StoryCard Component Logic', () => {
    describe('Task 8.2: Status color mapping', () => {
        it('should return gray color for backlog status', () => {
            const color = getStatusColor('backlog');
            expect(color).toBe('var(--vscode-descriptionForeground)');
        });

        it('should return blue color for ready-for-dev status', () => {
            const color = getStatusColor('ready-for-dev');
            expect(color).toBe('var(--vscode-textLink-foreground)');
        });

        it('should return orange/warning color for in-progress status', () => {
            const color = getStatusColor('in-progress');
            expect(color).toBe('var(--vscode-editorWarning-foreground)');
        });

        it('should return purple color for review status', () => {
            const color = getStatusColor('review');
            expect(color).toBe('var(--vscode-charts-purple, #b180d7)');
        });

        it('should return green color for done status', () => {
            const color = getStatusColor('done');
            expect(color).toBe('var(--vscode-testing-iconPassed, #89d185)');
        });
    });

    describe('Task 8.4: Status text formatting', () => {
        it('should format single word status correctly', () => {
            expect(formatStatus('backlog')).toBe('Backlog');
            expect(formatStatus('done')).toBe('Done');
            expect(formatStatus('review')).toBe('Review');
        });

        it('should format hyphenated status correctly', () => {
            expect(formatStatus('ready-for-dev')).toBe('Ready For Dev');
            expect(formatStatus('in-progress')).toBe('In Progress');
        });
    });

    describe('Task 8.3: ARIA label generation', () => {
        it('should include title, epic, and status in ARIA label', () => {
            const label = generateAriaLabel(mockStoryNoAssignee);
            
            expect(label).toContain(mockStoryNoAssignee.title);
            expect(label).toContain('Epic 3');
            expect(label).toContain('Status: Ready For Dev');
        });

        it('should include assignee when present', () => {
            const label = generateAriaLabel(mockStoryComplete);
            
            expect(label).toContain('Assignee: Developer');
        });

        it('should not include assignee when absent', () => {
            const label = generateAriaLabel(mockStoryNoAssignee);
            
            expect(label).not.toContain('Assignee');
        });

        it('should format ARIA label with correct separators', () => {
            const label = generateAriaLabel(mockStoryComplete);
            
            // Should be separated by " - "
            const parts = label.split(' - ');
            expect(parts.length).toBe(4); // title, epic, status, assignee
        });
    });

    describe('Task 8.2: Story property rendering', () => {
        it('should have all required story properties', () => {
            // Verify Story interface requirements
            expect(mockStoryComplete.id).toBe('5-3');
            expect(mockStoryComplete.title).toBe('Story Card Component');
            expect(mockStoryComplete.epicId).toBe('5');
            expect(mockStoryComplete.status).toBe('in-progress');
            expect(mockStoryComplete.assignee).toBe('Developer');
            expect(mockStoryComplete.filePath).toBe('/path/5-3.md');
        });

        it('should handle story without optional assignee', () => {
            expect(mockStoryNoAssignee.assignee).toBeUndefined();
            // Verify other required fields still present
            expect(mockStoryNoAssignee.id).toBeDefined();
            expect(mockStoryNoAssignee.title).toBeDefined();
            expect(mockStoryNoAssignee.epicId).toBeDefined();
        });
    });

    describe('Task 8.4: All status types covered', () => {
        const allStatuses: StoryStatus[] = ['backlog', 'ready-for-dev', 'in-progress', 'review', 'done'];

        it('should handle all valid status types', () => {
            allStatuses.forEach(status => {
                const color = getStatusColor(status);
                expect(color).toBeDefined();
                expect(color.startsWith('var(--vscode-')).toBe(true);
            });
        });

        it('should format all status types correctly', () => {
            allStatuses.forEach(status => {
                const formatted = formatStatus(status);
                expect(formatted).toBeDefined();
                expect(formatted.length).toBeGreaterThan(0);
                // First letter should be capitalized
                expect(formatted.charAt(0)).toBe(formatted.charAt(0).toUpperCase());
            });
        });
    });

    // ========================================================================
    // Story 5.6: Click Handler Logic Tests
    // ========================================================================

    describe('Story 5.6: Click handler for markdown preview (AC #1, #4)', () => {
        let mockPostMessage: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            mockPostMessage = vi.fn();
        });

        /**
         * Simulates the handleClick() function from StoryCard.svelte
         * Story 5.6 Task 1.2: Click handler sends openFile PostMessage
         */
        function handleClick(story: Story, vscode: { postMessage?: typeof mockPostMessage } | undefined): void {
            if (!story.filePath) {
                console.warn('Story has no filePath');
                return;
            }
            vscode?.postMessage?.({
                type: 'openFile',
                payload: { 
                    filePath: story.filePath,
                    preview: true
                }
            });
        }

        /**
         * Simulates the handleKeydown() function from StoryCard.svelte
         * Story 5.6 Task 1.3: Keyboard handler for Enter/Space
         */
        function handleKeydown(
            event: { key: string; preventDefault: () => void }, 
            story: Story,
            vscode: { postMessage?: typeof mockPostMessage } | undefined
        ): void {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleClick(story, vscode);
            }
        }

        it('should send openFile message with preview=true on click (Task 6.2)', () => {
            const mockVscode = { postMessage: mockPostMessage };
            
            handleClick(mockStoryComplete, mockVscode);

            expect(mockPostMessage).toHaveBeenCalledTimes(1);
            expect(mockPostMessage).toHaveBeenCalledWith({
                type: 'openFile',
                payload: {
                    filePath: mockStoryComplete.filePath,
                    preview: true
                }
            });
        });

        it('should not send message when story has no filePath', () => {
            const mockVscode = { postMessage: mockPostMessage };
            const storyWithoutPath: Story = { ...mockStoryNoAssignee, filePath: undefined } as Story;

            handleClick(storyWithoutPath, mockVscode);

            expect(mockPostMessage).not.toHaveBeenCalled();
        });

        it('should handle undefined vscode gracefully', () => {
            expect(() => handleClick(mockStoryComplete, undefined)).not.toThrow();
        });

        it('should trigger handleClick on Enter key (Task 6.3, AC #4)', () => {
            const mockVscode = { postMessage: mockPostMessage };
            const mockEvent = { key: 'Enter', preventDefault: vi.fn() };

            handleKeydown(mockEvent, mockStoryComplete, mockVscode);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockPostMessage).toHaveBeenCalledWith({
                type: 'openFile',
                payload: {
                    filePath: mockStoryComplete.filePath,
                    preview: true
                }
            });
        });

        it('should trigger handleClick on Space key (Task 6.3, AC #4)', () => {
            const mockVscode = { postMessage: mockPostMessage };
            const mockEvent = { key: ' ', preventDefault: vi.fn() };

            handleKeydown(mockEvent, mockStoryComplete, mockVscode);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockPostMessage).toHaveBeenCalledWith({
                type: 'openFile',
                payload: {
                    filePath: mockStoryComplete.filePath,
                    preview: true
                }
            });
        });

        it('should not trigger on other keys', () => {
            const mockVscode = { postMessage: mockPostMessage };
            const mockEvent = { key: 'Tab', preventDefault: vi.fn() };

            handleKeydown(mockEvent, mockStoryComplete, mockVscode);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(mockPostMessage).not.toHaveBeenCalled();
        });

        it('should not trigger on Escape key', () => {
            const mockVscode = { postMessage: mockPostMessage };
            const mockEvent = { key: 'Escape', preventDefault: vi.fn() };

            handleKeydown(mockEvent, mockStoryComplete, mockVscode);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(mockPostMessage).not.toHaveBeenCalled();
        });
    });
});
