/**
 * EpicsParser Unit Tests
 * Story 4.3: EpicsParser - Parse epics.md Structure
 * Task 7: Unit tests for parsing functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    EpicsParser,
    getEpicsParser,
    type ParsedEpics,
} from '../../../src/services/EpicsParser';
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
        },
    },
}));

describe('EpicsParser', () => {
    beforeEach(() => {
        EpicsParser.resetInstance();
        ParserService.resetInstance();
    });

    describe('singleton pattern', () => {
        it('should return same instance on multiple calls', () => {
            const instance1 = EpicsParser.getInstance();
            const instance2 = EpicsParser.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should return same instance via factory function', () => {
            const instance1 = getEpicsParser();
            const instance2 = getEpicsParser();

            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = EpicsParser.getInstance();
            EpicsParser.resetInstance();
            const instance2 = EpicsParser.getInstance();

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('parseEpicsFromContent', () => {
        describe('valid epics.md parsing (AC #1)', () => {
            it('should parse single epic with title and description', () => {
                const content = `## Epic 1: Foundation Setup

**Goal:** Set up the basic extension project structure.

### Story 1.1: Project Setup
Story content...`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics).toHaveLength(1);
                    expect(result.data.epics[0].id).toBe('1');
                    expect(result.data.epics[0].title).toBe('Foundation Setup');
                    expect(result.data.epics[0].description).toContain('Set up the basic extension');
                    expect(result.data.epics[0].storyIds).toEqual([]);
                    expect(result.data.epics[0].status).toBe('backlog');
                }
            });

            it('should parse multiple epics', () => {
                const content = `## Epic 1: First Epic

**Goal:** First goal description.

## Epic 2: Second Epic

**Goal:** Second goal description.

## Epic 3: Third Epic

**Goal:** Third goal description.`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics).toHaveLength(3);
                    expect(result.data.epics[0].id).toBe('1');
                    expect(result.data.epics[0].title).toBe('First Epic');
                    expect(result.data.epics[1].id).toBe('2');
                    expect(result.data.epics[1].title).toBe('Second Epic');
                    expect(result.data.epics[2].id).toBe('3');
                    expect(result.data.epics[2].title).toBe('Third Epic');
                }
            });

            it('should extract description from Goal section', () => {
                const content = `## Epic 1: Test Epic

**Goal:** When users open VS Code in a folder with \`_bmad/\`, the extension should activate.

### Story 1.1: First Story`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics[0].description).toContain('When users open VS Code');
                    expect(result.data.epics[0].description).not.toContain('### Story');
                }
            });

            it('should handle epic with no Goal section', () => {
                const content = `## Epic 1: Simple Epic

This is just regular content without a Goal marker.

### Story 1.1: First Story`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics).toHaveLength(1);
                    expect(result.data.epics[0].description).toContain('regular content');
                }
            });

            it('should stop description at FRs Covered marker', () => {
                const content = `## Epic 1: Test Epic

**Goal:** Main goal here.

**FRs Covered:** FR1, FR2, FR3`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics[0].description).toContain('Main goal here');
                    expect(result.data.epics[0].description).not.toContain('FRs Covered');
                }
            });
        });

        describe('frontmatter extraction (AC #5)', () => {
            it('should extract frontmatter metadata', () => {
                const content = `---
totalEpics: 6
totalStories: 34
status: complete
completedAt: '2026-02-12'
---

## Epic 1: Foundation

**Goal:** Setup the foundation.`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.metadata.totalEpics).toBe(6);
                    expect(result.data.metadata.totalStories).toBe(34);
                    expect(result.data.metadata.status).toBe('complete');
                    expect(result.data.metadata.completedAt).toBe('2026-02-12');
                    expect(result.data.epics).toHaveLength(1);
                }
            });

            it('should handle missing frontmatter', () => {
                const content = `## Epic 1: No Frontmatter

**Goal:** This file has no frontmatter.`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.metadata).toEqual({});
                    expect(result.data.epics).toHaveLength(1);
                }
            });
        });

        describe('malformed content handling (AC #2)', () => {
            it('should handle content with no epics', () => {
                const content = `# Just a document

Without any epics defined.`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics).toHaveLength(0);
                }
            });

            it('should handle empty content', () => {
                const content = '';

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics).toHaveLength(0);
                }
            });

            it('should skip invalid epic headers', () => {
                const content = `## Not an Epic Header

Some content.

## Epic 1: Valid Epic

**Goal:** This one is valid.

## Another Invalid Header`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    // Should only find the valid epic
                    expect(result.data.epics).toHaveLength(1);
                    expect(result.data.epics[0].id).toBe('1');
                }
            });

            it('should handle epic with minimal content', () => {
                const content = `## Epic 42: Minimal Epic`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics).toHaveLength(1);
                    expect(result.data.epics[0].id).toBe('42');
                    expect(result.data.epics[0].title).toBe('Minimal Epic');
                    expect(result.data.epics[0].description).toBe('');
                }
            });
        });

        describe('line ending handling', () => {
            it('should handle CRLF line endings', () => {
                const content = '---\r\ntotalEpics: 2\r\n---\r\n\r\n## Epic 1: First\r\n\r\n**Goal:** Goal one.\r\n\r\n## Epic 2: Second\r\n\r\n**Goal:** Goal two.';

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epics).toHaveLength(2);
                    expect(result.data.metadata.totalEpics).toBe(2);
                }
            });
        });

        describe('real-world content parsing', () => {
            it('should parse content matching actual epics.md structure', () => {
                const content = `---
totalEpics: 6
totalStories: 34
status: 'complete'
completedAt: '2026-02-12'
frCoverage: '44/44'
---

# vscode-bmad - Epic Breakdown

## Overview

This document provides the complete epic breakdown.

## Epic 1: Extension Foundation & Project Detection

**Goal:** When users open VS Code in a folder with \`_bmad/\`, the extension automatically recognizes the BMAD project and activates.

### Story 1.1: Extension Project Setup

As a **developer**...

---

### Story 1.2: ErrorService Implementation

As a **developer**...

## Epic 2: Project Initialization

**Goal:** Users can initialize a new BMAD project with a single click.

### Story 2.1: Shell Detection Service
`;

                const parser = getEpicsParser();
                const result = parser.parseEpicsFromContent(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.metadata.totalEpics).toBe(6);
                    expect(result.data.metadata.totalStories).toBe(34);
                    expect(result.data.metadata.frCoverage).toBe('44/44');

                    expect(result.data.epics).toHaveLength(2);

                    expect(result.data.epics[0].id).toBe('1');
                    expect(result.data.epics[0].title).toBe('Extension Foundation & Project Detection');
                    expect(result.data.epics[0].description).toContain('When users open VS Code');

                    expect(result.data.epics[1].id).toBe('2');
                    expect(result.data.epics[1].title).toBe('Project Initialization');
                    expect(result.data.epics[1].description).toContain('Users can initialize');
                }
            });
        });
    });

    describe('parseEpics (file-based)', () => {
        it('should return FILE_NOT_FOUND error for missing file', async () => {
            const vscode = await import('vscode');
            vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(
                new Error('File not found')
            );

            const parser = getEpicsParser();
            const result = await parser.parseEpics('/nonexistent/epics.md');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('FILE_NOT_FOUND');
            }
        });

        it('should parse file content successfully', async () => {
            const vscode = await import('vscode');
            const content = `---
totalEpics: 1
---

## Epic 1: Test Epic

**Goal:** Test goal.`;

            vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
                Buffer.from(content)
            );

            const parser = getEpicsParser();
            const result = await parser.parseEpics('/test/epics.md');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.epics).toHaveLength(1);
                expect(result.data.metadata.totalEpics).toBe(1);
            }
        });
    });
});
