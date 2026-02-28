/**
 * EpicsParser - Parse epics.md Structure
 * Story 4.3: Parse epic definitions from epics.md file
 *
 * FR33: Parse epics.md to extract list of epics with title, description, and epic identifier
 */

import * as vscode from 'vscode';
import { ServiceResult, ErrorCodes, BmadError } from '../shared/types';
import { Epic, EpicStatus } from '../shared/models';
import { getErrorService } from './ErrorService';
import { getParserService, normalizeLineEndings } from './ParserService';

// ============================================================================
// Types
// ============================================================================

/**
 * Metadata extracted from epics.md frontmatter
 * Task 1.2: Include frontmatter metadata in parsed result
 */
export interface EpicsMetadata {
    /** Total number of epics */
    totalEpics?: number;
    /** Total number of stories across all epics */
    totalStories?: number;
    /** Document status */
    status?: string;
    /** Completion date if complete */
    completedAt?: string;
    /** FR coverage tracking */
    frCoverage?: string;
    /** Any additional metadata fields */
    [key: string]: unknown;
}

/**
 * Result of parsing epics.md file
 * Task 1.1: Define return types for parseEpics
 */
export interface ParsedEpics {
    /** Frontmatter metadata from file */
    metadata: EpicsMetadata;
    /** Array of parsed epics */
    epics: Epic[];
}

// ============================================================================
// EpicsParser Class
// ============================================================================

/**
 * Service for parsing epics.md files
 * Task 2.2-2.3: Singleton pattern matching other services
 */
export class EpicsParser {
    private static instance: EpicsParser | null = null;

    // Regex pattern to match epic headers: ## Epic N: Title
    // Task 3.1: Use regex to find `## Epic N: Title` patterns
    private readonly epicHeaderPattern = /^## Epic (\d+): (.+)$/gm;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance of EpicsParser
     */
    public static getInstance(): EpicsParser {
        if (!EpicsParser.instance) {
            EpicsParser.instance = new EpicsParser();
        }
        return EpicsParser.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        EpicsParser.instance = null;
    }

    /**
     * Parse epics from an epics.md file
     * Task 4.1-4.4: Read file, parse frontmatter, parse sections, return Epic array
     *
     * AC #1: Returns array of Epic objects with id, title, description, storyIds
     * AC #2: Parses what it can and logs warnings for unparseable sections
     * AC #3: Returns FILE_NOT_FOUND error if file doesn't exist
     * AC #5: Extracts frontmatter metadata separately
     *
     * @param filePath - Absolute path to epics.md file
     * @returns ServiceResult with ParsedEpics or error
     */
    public async parseEpics(filePath: string): Promise<ServiceResult<ParsedEpics>> {
        const errorService = getErrorService();

        try {
            // Task 4.1: Read file content using VS Code API
            const uri = vscode.Uri.file(filePath);
            let content: string;

            try {
                const fileData = await vscode.workspace.fs.readFile(uri);
                content = Buffer.from(fileData).toString('utf-8');
            } catch {
                // Task 5.1: Handle file not found
                const error: BmadError = {
                    code: ErrorCodes.FILE_NOT_FOUND,
                    message: `File not found: ${filePath}`,
                    userMessage: 'The epics file could not be found.',
                    recoverable: true,
                    shouldNotify: false,
                };
                return { success: false, error };
            }

            // Task 4.2: Parse frontmatter using ParserService
            const parserService = getParserService();
            const frontmatterResult = parserService.parseFrontmatter<EpicsMetadata>(content);

            let metadata: EpicsMetadata = {};
            let bodyContent: string;

            if (frontmatterResult.success) {
                metadata = frontmatterResult.data.frontmatter ?? {};
                bodyContent = frontmatterResult.data.content;
            } else {
                // Log warning but continue parsing
                errorService.warn(`Failed to parse frontmatter from ${filePath}`);
                bodyContent = content;
            }

            // Task 4.3: Parse epic sections from content
            const epics = this.parseEpicSections(bodyContent);

            // Task 5.2: Log warnings for any parsing issues (done inside parseEpicSections)

            return {
                success: true,
                data: {
                    metadata,
                    epics,
                },
            };
        } catch (error) {
            // Task 5.3: Handle unexpected errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            errorService.error(`Failed to parse epics: ${errorMessage}`);

            const bmadError: BmadError = {
                code: ErrorCodes.FILE_READ_ERROR,
                message: `Failed to parse epics.md: ${errorMessage}`,
                userMessage: 'Failed to read the epics file.',
                recoverable: true,
                shouldNotify: false,
            };

            return { success: false, error: bmadError };
        }
    }

    /**
     * Parse epic sections from markdown content
     * Task 3.1-3.3: Extract epic number, title, and description
     */
    private parseEpicSections(content: string): Epic[] {
        const errorService = getErrorService();
        const epics: Epic[] = [];

        // Normalize line endings
        const normalizedContent = normalizeLineEndings(content);

        // Find all epic headers with their positions
        const headers: Array<{ match: RegExpExecArray; index: number }> = [];
        let match: RegExpExecArray | null;

        // Reset regex lastIndex
        this.epicHeaderPattern.lastIndex = 0;

        while ((match = this.epicHeaderPattern.exec(normalizedContent)) !== null) {
            headers.push({ match, index: match.index });
        }

        // Process each header
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const epicNumber = header.match[1];
            const epicTitle = header.match[2].trim();

            // Find content between this header and the next (or end of file)
            const startIndex = header.index + header.match[0].length;
            const endIndex = i + 1 < headers.length ? headers[i + 1].index : normalizedContent.length;

            const sectionContent = normalizedContent.slice(startIndex, endIndex).trim();

            // Task 3.3: Extract description (content before first ### or **FRs Covered:** or end)
            const description = this.extractDescription(sectionContent);

            if (!epicNumber || !epicTitle) {
                errorService.warn(`Malformed epic header at index ${header.index}`);
                continue;
            }

            const epic: Epic = {
                id: epicNumber,
                title: epicTitle,
                description,
                status: 'backlog' as EpicStatus, // Default status, will be derived later (FR38)
                storyIds: [], // Initially empty, will be populated by StoryParser
            };

            epics.push(epic);
        }

        return epics;
    }

    /**
     * Extract description from epic section content
     * Stops at first story header (###), **FRs Covered:**, or similar markers
     */
    private extractDescription(content: string): string {
        // Look for **Goal:** pattern which typically contains the main description
        const goalMatch = content.match(/\*\*Goal:\*\*\s*(.+?)(?=\n###|\n\*\*FRs Covered|\n---|\n## |$)/s);

        if (goalMatch) {
            return goalMatch[1].trim();
        }

        // Fallback: take content until first story header or stop marker
        const lines = content.split('\n');
        const descriptionLines: string[] = [];

        for (const line of lines) {
            // Stop at story headers, FRs Covered, or horizontal rules
            if (line.startsWith('### ') ||
                line.startsWith('**FRs Covered') ||
                line.startsWith('---') ||
                line.startsWith('## ')) {
                break;
            }
            descriptionLines.push(line);
        }

        return descriptionLines.join('\n').trim();
    }

    /**
     * Parse epics from content string (for testing without file I/O)
     */
    public parseEpicsFromContent(content: string): ServiceResult<ParsedEpics> {
        const parserService = getParserService();
        const frontmatterResult = parserService.parseFrontmatter<EpicsMetadata>(content);

        let metadata: EpicsMetadata = {};
        let bodyContent: string;

        if (frontmatterResult.success) {
            metadata = frontmatterResult.data.frontmatter ?? {};
            bodyContent = frontmatterResult.data.content;
        } else {
            bodyContent = content;
        }

        const epics = this.parseEpicSections(bodyContent);

        return {
            success: true,
            data: {
                metadata,
                epics,
            },
        };
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Get EpicsParser singleton instance
 * Task 6.2: Factory function matching other services
 */
export function getEpicsParser(): EpicsParser {
    return EpicsParser.getInstance();
}
