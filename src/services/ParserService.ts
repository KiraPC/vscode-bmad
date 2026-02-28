/**
 * ParserService - YAML Frontmatter Extraction
 * Story 4.2: Parse markdown files with YAML frontmatter
 *
 * Uses gray-matter library for parsing (FR32)
 */

import matter from 'gray-matter';
import { ServiceResult, ErrorCodes, BmadError } from '../shared/types';
import { getErrorService } from './ErrorService';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of parsing frontmatter from a markdown file
 * Task 3.1: ParsedFrontmatter interface
 */
export interface ParsedFrontmatter<T = Record<string, unknown>> {
    /** Parsed frontmatter data, null if not present */
    frontmatter: T | null;
    /** Markdown content after frontmatter */
    content: string;
    /** Whether frontmatter was present */
    hasFrontmatter: boolean;
}

/**
 * Options for frontmatter parsing
 */
export interface FrontmatterParseOptions {
    /** Whether to normalize line endings before parsing (default: true) */
    normalizeLineEndings?: boolean;
}

// ============================================================================
// ParserService Class
// ============================================================================

/**
 * Service for parsing markdown files with YAML frontmatter
 * Task 2.2: Singleton pattern matching ErrorService/ConfigService
 */
export class ParserService {
    private static instance: ParserService | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance of ParserService
     */
    public static getInstance(): ParserService {
        if (!ParserService.instance) {
            ParserService.instance = new ParserService();
        }
        return ParserService.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        ParserService.instance = null;
    }

    /**
     * Parse YAML frontmatter from markdown content
     * Task 3.2-3.4: Use gray-matter to extract frontmatter
     *
     * AC #1: Returns parsed frontmatter object and remaining content body
     * AC #2: Returns null frontmatter and full content for files without frontmatter
     * AC #3: Returns error with details for malformed YAML
     * AC #4: Handles different line endings (CRLF vs LF)
     *
     * @param content - Raw markdown file content
     * @param options - Parsing options
     * @returns ServiceResult with ParsedFrontmatter or error
     */
    public parseFrontmatter<T = Record<string, unknown>>(
        content: string,
        options: FrontmatterParseOptions = {}
    ): ServiceResult<ParsedFrontmatter<T>> {
        const { normalizeLineEndings: shouldNormalize = true } = options;

        try {
            // Task 5.1: Normalize line endings before parsing
            const normalizedContent = shouldNormalize
                ? normalizeLineEndings(content)
                : content;

            // Task 3.2: Use gray-matter to parse
            const result = matter(normalizedContent);

            // Task 3.4: Handle missing frontmatter gracefully
            const hasFrontmatter = Object.keys(result.data).length > 0;

            return {
                success: true,
                data: {
                    frontmatter: hasFrontmatter ? (result.data as T) : null,
                    content: result.content,
                    hasFrontmatter,
                },
            };
        } catch (error) {
            // Task 4.1-4.3: Error handling with ErrorService
            return this.handleParseError<T>(error, content);
        }
    }

    /**
     * Handle parse errors and create appropriate ServiceResult
     * Task 4.1-4.4: Wrap gray-matter in try/catch, create error codes
     */
    private handleParseError<T>(
        error: unknown,
        _content: string
    ): ServiceResult<ParsedFrontmatter<T>> {
        const errorService = getErrorService();
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Log to ErrorService
        errorService.error(`Frontmatter parse error: ${errorMessage}`);

        // Create BmadError with appropriate code
        const bmadError: BmadError = {
            code: ErrorCodes.FRONTMATTER_PARSE_ERROR,
            message: `Failed to parse YAML frontmatter: ${errorMessage}`,
            userMessage: 'Failed to read file metadata. The file may have invalid YAML formatting.',
            recoverable: true,
            shouldNotify: false,
        };

        return {
            success: false,
            error: bmadError,
        };
    }

    /**
     * Parse frontmatter from file content, returning just the data
     * Convenience method that extracts only the frontmatter object
     */
    public extractFrontmatter<T = Record<string, unknown>>(
        content: string,
        options: FrontmatterParseOptions = {}
    ): ServiceResult<T | null> {
        const result = this.parseFrontmatter<T>(content, options);

        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: result.data.frontmatter,
        };
    }

    /**
     * Parse frontmatter from file content, returning just the body
     * Convenience method that extracts only the content after frontmatter
     */
    public extractContent(
        content: string,
        options: FrontmatterParseOptions = {}
    ): ServiceResult<string> {
        const result = this.parseFrontmatter(content, options);

        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: result.data.content,
        };
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize line endings to LF
 * Task 5.2: Handle CRLF vs LF (FR42)
 */
export function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Get ParserService singleton instance
 * Task 6.2: Factory function matching other services
 */
export function getParserService(): ParserService {
    return ParserService.getInstance();
}
