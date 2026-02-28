/**
 * StoryParser Unit Tests
 * Story 4.4: StoryParser - Scan and Parse Story Files
 * Task 8: Unit tests for parsing functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    StoryParser,
    getStoryParser,
} from '../../../src/services/StoryParser';
import { ParserService } from '../../../src/services/ParserService';

// Mock vscode module
vi.mock('vscode', () => ({
    window: {
        createOutputChannel: vi.fn(() => ({
            appendLine: vi.fn(),
            show: vi.fn(),
            dispose: vi.fn(),
        })),
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showInformationMessage: vi.fn(),
    },
    Uri: {
        file: vi.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
    },
    workspace: {
        fs: {
            readFile: vi.fn(),
            readDirectory: vi.fn(),
        },
    },
    FileType: {
        File: 1,
        Directory: 2,
    },
}));

describe('StoryParser', () => {
    beforeEach(() => {
        StoryParser.resetInstance();
        ParserService.resetInstance();
    });

    describe('singleton pattern', () => {
        it('should return same instance on multiple calls', () => {
            const instance1 = StoryParser.getInstance();
            const instance2 = StoryParser.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should return same instance via factory function', () => {
            const instance1 = getStoryParser();
            const instance2 = getStoryParser();

            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = StoryParser.getInstance();
            StoryParser.resetInstance();
            const instance2 = StoryParser.getInstance();

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('parseStoryFromContent', () => {
        describe('valid story parsing (AC #1)', () => {
            it('should parse story with title and status', () => {
                const content = `# Story 1.2: ErrorService Implementation

Status: done

## Story

As a **developer**...`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '1-2-errorservice-implementation.md',
                    '/path/to/1-2-errorservice-implementation.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.id).toBe('1-2');
                    expect(result.data.title).toBe('ErrorService Implementation');
                    expect(result.data.status).toBe('done');
                    expect(result.data.epicId).toBe('1');
                    expect(result.data.filePath).toBe('/path/to/1-2-errorservice-implementation.md');
                }
            });

            it('should parse story with ready-for-dev status', () => {
                const content = `# Story 4.1: Shared Data Models

Status: ready-for-dev

## Story`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '4-1-shared-data-models.md',
                    '/path/4-1-shared-data-models.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe('ready-for-dev');
                }
            });

            it('should parse story with in-progress status', () => {
                const content = `# Story 3.5: Progressive Panel

Status: in-progress`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '3-5-progressive-panel.md',
                    '/path/to/file.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe('in-progress');
                }
            });

            it('should parse story with review status', () => {
                const content = `# Story 3.1: Webview Build

Status: review`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '3-1-webview-build.md',
                    '/path/to/file.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe('review');
                }
            });
        });

        describe('filename parsing (AC #3)', () => {
            it('should extract epicId and storyNum from filename', () => {
                const content = `# Story 3.7: Artifact File Tree\n\nStatus: done`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '3-7-artifact-file-tree.md',
                    '/path/3-7-artifact-file-tree.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.id).toBe('3-7');
                    expect(result.data.epicId).toBe('3');
                }
            });

            it('should handle double-digit epic and story numbers', () => {
                const content = `# Story 12.34: Large Project Story\n\nStatus: backlog`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '12-34-large-project-story.md',
                    '/path/12-34-large-project-story.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.id).toBe('12-34');
                    expect(result.data.epicId).toBe('12');
                }
            });

            it('should reject invalid filename pattern', () => {
                const content = `# Some Document`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    'sprint-status.yaml',
                    '/path/sprint-status.yaml'
                );

                expect(result.success).toBe(false);
            });

            it('should reject filename without proper story pattern', () => {
                const content = `# Bug Report`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    'bug-config-issue.md',
                    '/path/bug-config-issue.md'
                );

                expect(result.success).toBe(false);
            });
        });

        describe('default handling (AC #2)', () => {
            it('should default status to backlog when missing', () => {
                const content = `# Story 1.1: No Status

## Story

No status line here.`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '1-1-no-status.md',
                    '/path/1-1-no-status.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe('backlog');
                }
            });

            it('should default status to backlog for invalid status value', () => {
                const content = `# Story 1.1: Invalid Status

Status: invalid-status`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '1-1-invalid-status.md',
                    '/path/1-1-invalid-status.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe('backlog');
                }
            });

            it('should use formatted ID as title when header missing', () => {
                const content = `Status: done

Just content without proper header.`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '2-3-no-header.md',
                    '/path/2-3-no-header.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.title).toBe('Story 2.3');
                }
            });
        });

        describe('content preservation', () => {
            it('should preserve full content in story object', () => {
                const content = `# Story 1.1: Full Content

Status: done

## Story

All the content here.

## Tasks

- [ ] Task 1`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '1-1-full-content.md',
                    '/path/1-1-full-content.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.content).toContain('# Story 1.1');
                    expect(result.data.content).toContain('## Tasks');
                }
            });

            it('should normalize CRLF line endings', () => {
                const content = '# Story 1.1: CRLF Test\r\n\r\nStatus: done\r\n\r\nContent here.';

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '1-1-crlf-test.md',
                    '/path/1-1-crlf-test.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.content).not.toContain('\r\n');
                }
            });
        });

        describe('assignee extraction', () => {
            it('should extract assignee from frontmatter', () => {
                const content = `---
assignee: Alice
---

# Story 1.1: Assigned Story

Status: in-progress`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '1-1-assigned-story.md',
                    '/path/1-1-assigned-story.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.assignee).toBe('Alice');
                }
            });

            it('should have undefined assignee when not in frontmatter', () => {
                const content = `# Story 1.1: Unassigned

Status: backlog`;

                const parser = getStoryParser();
                const result = parser.parseStoryFromContent(
                    content,
                    '1-1-unassigned.md',
                    '/path/1-1-unassigned.md'
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.assignee).toBeUndefined();
                }
            });
        });
    });

    describe('scanAndParse', () => {
        it('should return FILE_NOT_FOUND for missing folder', async () => {
            const vscode = await import('vscode');
            vi.mocked(vscode.workspace.fs.readDirectory).mockRejectedValue(
                new Error('Folder not found')
            );

            const parser = getStoryParser();
            const result = await parser.scanAndParse('/nonexistent/folder');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('FILE_NOT_FOUND');
            }
        });

        it('should filter out non-story files (AC #5)', async () => {
            const vscode = await import('vscode');

            // Mock directory listing
            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValue([
                ['1-1-story.md', 1], // File type
                ['sprint-status.yaml', 1],
                ['bug-issue.md', 1],
                ['readme.md', 1],
                ['2-1-another-story.md', 1],
                ['subfolder', 2], // Directory type
            ]);

            // Mock file reads
            vi.mocked(vscode.workspace.fs.readFile).mockImplementation(async (uri) => {
                const path = (uri as { fsPath: string }).fsPath || '';
                if (path.includes('1-1-story')) {
                    return Buffer.from('# Story 1.1: First\n\nStatus: done');
                }
                if (path.includes('2-1-another')) {
                    return Buffer.from('# Story 2.1: Second\n\nStatus: backlog');
                }
                throw new Error('File not found');
            });

            const parser = getStoryParser();
            const result = await parser.scanAndParse('/test/folder');

            expect(result.success).toBe(true);
            if (result.success) {
                // Should only have parsed the two story files
                expect(result.data.stories).toHaveLength(2);
                expect(result.data.stories[0].id).toBe('1-1');
                expect(result.data.stories[1].id).toBe('2-1');
            }
        });

        it('should sort stories by epicId and storyNum', async () => {
            const vscode = await import('vscode');

            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValue([
                ['3-2-story-c.md', 1],
                ['1-1-story-a.md', 1],
                ['2-1-story-b.md', 1],
                ['1-3-story-d.md', 1],
            ]);

            vi.mocked(vscode.workspace.fs.readFile).mockImplementation(async (uri) => {
                const path = (uri as { fsPath: string }).fsPath || '';
                if (path.includes('3-2')) return Buffer.from('# Story 3.2: C\n\nStatus: done');
                if (path.includes('1-1')) return Buffer.from('# Story 1.1: A\n\nStatus: done');
                if (path.includes('2-1')) return Buffer.from('# Story 2.1: B\n\nStatus: done');
                if (path.includes('1-3')) return Buffer.from('# Story 1.3: D\n\nStatus: done');
                throw new Error('File not found');
            });

            const parser = getStoryParser();
            const result = await parser.scanAndParse('/test/folder');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.stories.map(s => s.id)).toEqual(['1-1', '1-3', '2-1', '3-2']);
            }
        });

        it('should track parse errors without failing', async () => {
            const vscode = await import('vscode');

            vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValue([
                ['1-1-good.md', 1],
                ['2-1-bad.md', 1],
            ]);

            vi.mocked(vscode.workspace.fs.readFile).mockImplementation(async (uri) => {
                const path = (uri as { fsPath: string }).fsPath || '';
                if (path.includes('1-1-good')) {
                    return Buffer.from('# Story 1.1: Good\n\nStatus: done');
                }
                throw new Error('Read error');
            });

            const parser = getStoryParser();
            const result = await parser.scanAndParse('/test/folder');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.stories).toHaveLength(1);
                expect(result.data.parseErrors).toHaveLength(1);
            }
        });
    });
});
