/**
 * StoryParser - Scan and Parse Story Files
 * Story 4.4: Parse story files from implementation_artifacts folder
 *
 * FR34: Scan implementation_artifacts folder for story files
 * FR35: Parse story files for metadata
 */

import * as vscode from 'vscode';
import { ServiceResult, ErrorCodes, BmadError } from '../shared/types';
import { Story, StoryStatus, isStoryStatus } from '../shared/models';
import { getErrorService } from './ErrorService';
import { getParserService, normalizeLineEndings } from './ParserService';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of scanning and parsing story files
 */
export interface ParsedStories {
    /** Successfully parsed stories */
    stories: Story[];
    /** Files that failed to parse (logged but not fatal) */
    parseErrors: string[];
}

// ============================================================================
// Constants
// ============================================================================

// Match story files: "N-N-slug.md" (e.g., "3-7-artifact-file-tree.md")
const STORY_FILE_PATTERN = /^(\d+)-(\d+)-(.+)\.md$/;

// Extract title from header: "# Story N.M: Title"
const STORY_HEADER_PATTERN = /^#\s+Story\s+[\d.]+:\s*(.+)$/m;

// Extract status line: "Status: value"
const STATUS_PATTERN = /^Status:\s*(.+)$/m;

// Files to exclude from scanning
const EXCLUDED_FILES = ['sprint-status.yaml', 'bug-'];

// ============================================================================
// StoryParser Class
// ============================================================================

/**
 * Service for scanning and parsing story files
 * Task 2.2-2.3: Singleton pattern matching other services
 */
export class StoryParser {
    private static instance: StoryParser | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance of StoryParser
     */
    public static getInstance(): StoryParser {
        if (!StoryParser.instance) {
            StoryParser.instance = new StoryParser();
        }
        return StoryParser.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        StoryParser.instance = null;
    }

    /**
     * Scan folder and parse all story files
     * Task 3-6: Implement scanning and parsing
     *
     * AC #1: Scans folder for *.md files and parses each
     * AC #2: Uses defaults for missing/invalid frontmatter
     * AC #3: Extracts epicId/storyId from filename
     * AC #5: Only parses story naming pattern files
     *
     * @param folderPath - Absolute path to implementation_artifacts folder
     * @returns ServiceResult with ParsedStories
     */
    public async scanAndParse(folderPath: string): Promise<ServiceResult<ParsedStories>> {
        const errorService = getErrorService();

        try {
            const uri = vscode.Uri.file(folderPath);

            // Task 3.1: Read directory contents
            let entries: [string, vscode.FileType][];
            try {
                entries = await vscode.workspace.fs.readDirectory(uri);
            } catch {
                const error: BmadError = {
                    code: ErrorCodes.FILE_NOT_FOUND,
                    message: `Folder not found: ${folderPath}`,
                    userMessage: 'The implementation artifacts folder could not be found.',
                    recoverable: true,
                    shouldNotify: false,
                };
                return { success: false, error };
            }

            // Task 3.2-3.3: Filter for story files only
            const storyFiles = entries
                .filter(([name, type]) => {
                    if (type !== vscode.FileType.File) {
                        return false;
                    }
                    // Exclude non-story files
                    if (EXCLUDED_FILES.some(excluded => name.startsWith(excluded) || name === excluded)) {
                        return false;
                    }
                    // Must match story pattern
                    return STORY_FILE_PATTERN.test(name);
                })
                .map(([name]) => name);

            // Parse all story files in parallel
            const parsePromises = storyFiles.map(filename =>
                this.parseStoryFile(`${folderPath}/${filename}`)
            );

            const results = await Promise.all(parsePromises);

            const stories: Story[] = [];
            const parseErrors: string[] = [];

            for (const result of results) {
                if (result.success) {
                    stories.push(result.data);
                } else {
                    parseErrors.push(result.error.message);
                    errorService.warn(result.error.message);
                }
            }

            // Sort stories by epicId then storyNum for consistent ordering
            stories.sort((a, b) => {
                const [aEpic, aStory] = a.id.split('-').map(Number);
                const [bEpic, bStory] = b.id.split('-').map(Number);
                if (aEpic !== bEpic) {
                    return aEpic - bEpic;
                }
                return aStory - bStory;
            });

            return {
                success: true,
                data: {
                    stories,
                    parseErrors,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errorService.error(`Failed to scan stories: ${errorMessage}`);

            const bmadError: BmadError = {
                code: ErrorCodes.FILE_READ_ERROR,
                message: `Failed to scan story files: ${errorMessage}`,
                userMessage: 'Failed to read story files.',
                recoverable: true,
                shouldNotify: false,
            };

            return { success: false, error: bmadError };
        }
    }

    /**
     * Parse a single story file
     * Task 4-5: Parse filename and file content
     *
     * @param filePath - Absolute path to story file
     * @returns ServiceResult with Story object
     */
    public async parseStoryFile(filePath: string): Promise<ServiceResult<Story>> {
        const errorService = getErrorService();

        try {
            // Task 4.1-4.3: Extract IDs from filename
            const filename = filePath.split('/').pop() || '';
            const filenameMatch = STORY_FILE_PATTERN.exec(filename);

            if (!filenameMatch) {
                const error: BmadError = {
                    code: ErrorCodes.FILE_READ_ERROR,
                    message: `Invalid story filename: ${filename}`,
                    userMessage: 'Story file does not match expected naming pattern.',
                    recoverable: true,
                    shouldNotify: false,
                };
                return { success: false, error };
            }

            const epicId = filenameMatch[1];
            const storyNum = filenameMatch[2];
            const storyId = `${epicId}-${storyNum}`;

            // Task 5.1: Read file content
            const uri = vscode.Uri.file(filePath);
            let content: string;

            try {
                const fileData = await vscode.workspace.fs.readFile(uri);
                content = Buffer.from(fileData).toString('utf-8');
            } catch {
                const error: BmadError = {
                    code: ErrorCodes.FILE_NOT_FOUND,
                    message: `File not found: ${filePath}`,
                    userMessage: 'Could not read story file.',
                    recoverable: true,
                    shouldNotify: false,
                };
                return { success: false, error };
            }

            // Normalize line endings
            const normalizedContent = normalizeLineEndings(content);

            // Task 5.2: Parse frontmatter (if present) using ParserService
            const parserService = getParserService();
            const frontmatterResult = parserService.parseFrontmatter(normalizedContent);

            // Task 5.3: Extract title from header
            const title = this.extractTitle(normalizedContent, storyId);

            // Task 6.1-6.2: Extract status with defaults
            const status = this.extractStatus(normalizedContent);

            // Extract assignee from frontmatter if available
            let assignee: string | undefined;
            if (frontmatterResult.success && frontmatterResult.data.frontmatter) {
                const fm = frontmatterResult.data.frontmatter as Record<string, unknown>;
                if (typeof fm.assignee === 'string') {
                    assignee = fm.assignee;
                }
            }

            const story: Story = {
                id: storyId,
                title,
                status,
                epicId,
                assignee,
                content: normalizedContent,
                filePath,
            };

            return { success: true, data: story };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errorService.warn(`Failed to parse story file ${filePath}: ${errorMessage}`);

            const bmadError: BmadError = {
                code: ErrorCodes.FILE_READ_ERROR,
                message: `Failed to parse story: ${filePath} - ${errorMessage}`,
                userMessage: 'Failed to parse story file.',
                recoverable: true,
                shouldNotify: false,
            };

            return { success: false, error: bmadError };
        }
    }

    /**
     * Parse story from content string (for testing without file I/O)
     */
    public parseStoryFromContent(
        content: string,
        filename: string,
        filePath: string
    ): ServiceResult<Story> {
        const filenameMatch = STORY_FILE_PATTERN.exec(filename);

        if (!filenameMatch) {
            const error: BmadError = {
                code: ErrorCodes.FILE_READ_ERROR,
                message: `Invalid story filename: ${filename}`,
                userMessage: 'Story file does not match expected naming pattern.',
                recoverable: true,
                shouldNotify: false,
            };
            return { success: false, error };
        }

        const epicId = filenameMatch[1];
        const storyNum = filenameMatch[2];
        const storyId = `${epicId}-${storyNum}`;

        const normalizedContent = normalizeLineEndings(content);
        const title = this.extractTitle(normalizedContent, storyId);
        const status = this.extractStatus(normalizedContent);

        const parserService = getParserService();
        const frontmatterResult = parserService.parseFrontmatter(normalizedContent);

        let assignee: string | undefined;
        if (frontmatterResult.success && frontmatterResult.data.frontmatter) {
            const fm = frontmatterResult.data.frontmatter as Record<string, unknown>;
            if (typeof fm.assignee === 'string') {
                assignee = fm.assignee;
            }
        }

        const story: Story = {
            id: storyId,
            title,
            status,
            epicId,
            assignee,
            content: normalizedContent,
            filePath,
        };

        return { success: true, data: story };
    }

    /**
     * Extract title from story content
     * Looks for "# Story N.M: Title" pattern
     */
    private extractTitle(content: string, fallbackId: string): string {
        const match = STORY_HEADER_PATTERN.exec(content);
        if (match) {
            return match[1].trim();
        }
        // Fallback: use formatted ID as title
        return `Story ${fallbackId.replace('-', '.')}`;
    }

    /**
     * Extract status from story content
     * Task 6.1: Default to 'backlog' if missing
     */
    private extractStatus(content: string): StoryStatus {
        const match = STATUS_PATTERN.exec(content);
        if (match) {
            const rawStatus = match[1].trim().toLowerCase();
            if (isStoryStatus(rawStatus)) {
                return rawStatus;
            }
        }
        // Default status
        return 'backlog';
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Get StoryParser singleton instance
 * Task 7.2: Factory function matching other services
 */
export function getStoryParser(): StoryParser {
    return StoryParser.getInstance();
}
