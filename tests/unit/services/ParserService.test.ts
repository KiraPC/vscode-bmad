/**
 * ParserService Unit Tests
 * Story 4.2: ParserService - YAML Frontmatter Extraction
 * Task 7: Unit tests for parsing functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ParserService,
    getParserService,
    normalizeLineEndings,
    type ParsedFrontmatter,
} from '../../../src/services/ParserService';
import { ErrorCodes } from '../../../src/shared/types';

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
}));

describe('ParserService', () => {
    beforeEach(() => {
        ParserService.resetInstance();
    });

    describe('singleton pattern', () => {
        it('should return same instance on multiple calls', () => {
            const instance1 = ParserService.getInstance();
            const instance2 = ParserService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should return same instance via factory function', () => {
            const instance1 = getParserService();
            const instance2 = getParserService();

            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = ParserService.getInstance();
            ParserService.resetInstance();
            const instance2 = ParserService.getInstance();

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('parseFrontmatter', () => {
        describe('valid frontmatter (AC #1)', () => {
            it('should parse simple YAML frontmatter', () => {
                const content = `---
title: Test Document
author: Test Author
---

# Content here`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasFrontmatter).toBe(true);
                    expect(result.data.frontmatter).toEqual({
                        title: 'Test Document',
                        author: 'Test Author',
                    });
                    expect(result.data.content.trim()).toBe('# Content here');
                }
            });

            it('should parse frontmatter with nested objects', () => {
                const content = `---
metadata:
  version: 1.0
  tags:
    - test
    - demo
---

Body content`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.frontmatter).toEqual({
                        metadata: {
                            version: 1.0,
                            tags: ['test', 'demo'],
                        },
                    });
                }
            });

            it('should parse frontmatter with various data types', () => {
                const content = `---
string: hello
number: 42
float: 3.14
boolean: true
nullValue: null
array:
  - one
  - two
---

Content`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.frontmatter).toEqual({
                        string: 'hello',
                        number: 42,
                        float: 3.14,
                        boolean: true,
                        nullValue: null,
                        array: ['one', 'two'],
                    });
                }
            });

            it('should type frontmatter with generic parameter', () => {
                interface MyFrontmatter {
                    title: string;
                    count: number;
                }

                const content = `---
title: Typed Document
count: 5
---

Content`;

                const parser = getParserService();
                const result = parser.parseFrontmatter<MyFrontmatter>(content);

                expect(result.success).toBe(true);
                if (result.success && result.data.frontmatter) {
                    // TypeScript knows the type
                    expect(result.data.frontmatter.title).toBe('Typed Document');
                    expect(result.data.frontmatter.count).toBe(5);
                }
            });
        });

        describe('missing frontmatter (AC #2)', () => {
            it('should handle file without frontmatter', () => {
                const content = `# Just a Heading

Regular markdown content without frontmatter.`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasFrontmatter).toBe(false);
                    expect(result.data.frontmatter).toBeNull();
                    expect(result.data.content).toBe(content);
                }
            });

            it('should handle empty file', () => {
                const content = '';

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasFrontmatter).toBe(false);
                    expect(result.data.frontmatter).toBeNull();
                }
            });

            it('should handle file with only dashes (not frontmatter)', () => {
                const content = `Some content
---
More content
---
Even more`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    // gray-matter may interpret this differently, but result should be valid
                    expect(result.data.content).toBeDefined();
                }
            });

            it('should handle empty frontmatter delimiters', () => {
                const content = `---
---

Content after empty frontmatter`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasFrontmatter).toBe(false);
                    expect(result.data.frontmatter).toBeNull();
                }
            });
        });

        describe('malformed YAML (AC #3)', () => {
            it('should return error for invalid YAML syntax', () => {
                const content = `---
invalid: yaml: syntax: here
  - broken indentation
 bad
---

Content`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe(ErrorCodes.FRONTMATTER_PARSE_ERROR);
                    expect(result.error.recoverable).toBe(true);
                }
            });

            it('should handle missing closing delimiter gracefully', () => {
                const content = `---
title: Test
--

Content`;

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                // gray-matter treats `--` as incomplete delimiter, causing parse error
                // Either way, we should get a valid result (success or controlled error)
                expect(typeof result.success).toBe('boolean');
            });
        });

        describe('line ending normalization (AC #4)', () => {
            it('should normalize CRLF to LF by default', () => {
                const content = '---\r\ntitle: Test\r\n---\r\n\r\nContent';

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasFrontmatter).toBe(true);
                    expect(result.data.frontmatter).toEqual({ title: 'Test' });
                    // Content should have LF line endings
                    expect(result.data.content).not.toContain('\r\n');
                }
            });

            it('should normalize standalone CR to LF', () => {
                const content = '---\rtitle: Test\r---\r\rContent';

                const parser = getParserService();
                const result = parser.parseFrontmatter(content);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasFrontmatter).toBe(true);
                }
            });

            it('should skip normalization when option is false', () => {
                const content = '---\r\ntitle: Test\r\n---\r\n\r\nContent';

                const parser = getParserService();
                const result = parser.parseFrontmatter(content, {
                    normalizeLineEndings: false,
                });

                expect(result.success).toBe(true);
                // gray-matter handles various line endings, so this should still work
            });
        });
    });

    describe('extractFrontmatter', () => {
        it('should return only frontmatter data', () => {
            const content = `---
title: Extract Test
---

Body`;

            const parser = getParserService();
            const result = parser.extractFrontmatter(content);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ title: 'Extract Test' });
            }
        });

        it('should return null for missing frontmatter', () => {
            const content = 'Just content without frontmatter';

            const parser = getParserService();
            const result = parser.extractFrontmatter(content);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeNull();
            }
        });
    });

    describe('extractContent', () => {
        it('should return only content body', () => {
            const content = `---
title: Content Test
---

The body content here.`;

            const parser = getParserService();
            const result = parser.extractContent(content);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.trim()).toBe('The body content here.');
            }
        });

        it('should return full content for files without frontmatter', () => {
            const content = 'Full content without frontmatter';

            const parser = getParserService();
            const result = parser.extractContent(content);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(content);
            }
        });
    });

    describe('normalizeLineEndings utility', () => {
        it('should convert CRLF to LF', () => {
            const input = 'line1\r\nline2\r\nline3';
            const expected = 'line1\nline2\nline3';

            expect(normalizeLineEndings(input)).toBe(expected);
        });

        it('should convert standalone CR to LF', () => {
            const input = 'line1\rline2\rline3';
            const expected = 'line1\nline2\nline3';

            expect(normalizeLineEndings(input)).toBe(expected);
        });

        it('should handle mixed line endings', () => {
            const input = 'line1\r\nline2\rline3\nline4';
            const expected = 'line1\nline2\nline3\nline4';

            expect(normalizeLineEndings(input)).toBe(expected);
        });

        it('should leave LF unchanged', () => {
            const input = 'line1\nline2\nline3';

            expect(normalizeLineEndings(input)).toBe(input);
        });

        it('should handle empty string', () => {
            expect(normalizeLineEndings('')).toBe('');
        });

        it('should handle string with no line endings', () => {
            const input = 'single line content';

            expect(normalizeLineEndings(input)).toBe(input);
        });
    });
});
