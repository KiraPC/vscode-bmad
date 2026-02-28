/**
 * AgentParserService - Agent Discovery and Parsing
 * Story 6.1: Discover and parse BMAD agent files
 *
 * Discovers agent markdown files from _bmad/bmm/agents/ folder,
 * parses frontmatter and XML <agent> tags to extract metadata.
 *
 * FR18: Dynamic agent discovery
 */

import * as vscode from 'vscode';
import { ServiceResult, BmadError, ErrorCodes } from '../shared/types';
import { Agent, AgentCommand, AgentCommandAttributes } from '../shared/models';
import { getParserService } from './ParserService';
import { getErrorService } from './ErrorService';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed XML agent attributes
 */
interface AgentXmlAttributes {
    name?: string;
    title?: string;
    icon?: string;
}

/**
 * Agent frontmatter structure
 */
interface AgentFrontmatter {
    name?: string;
    description?: string;
}

// ============================================================================
// AgentParserService Class
// ============================================================================

/**
 * Service for discovering and parsing BMAD agent files
 * Task 2.2: Singleton pattern matching other services
 */
export class AgentParserService {
    private static instance: AgentParserService | null = null;

    /** XML agent tag regex for attribute extraction */
    private readonly agentTagPattern = /<agent[^>]*>/;

    /** Regex to extract <menu>...</menu> block */
    private readonly menuBlockPattern = /<menu>([\s\S]*?)<\/menu>/;

    /** Regex to match individual <item> elements with attributes and content */
    private readonly itemPattern = /<item\s+([^>]*)>([^<]*)<\/item>/g;

    /** Regex to extract command code from text like "[SP] Sprint Planning..." */
    private readonly commandCodePattern = /^\[([A-Z][A-Z0-9]{1,3})\]/;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance of AgentParserService
     */
    public static getInstance(): AgentParserService {
        if (!AgentParserService.instance) {
            AgentParserService.instance = new AgentParserService();
        }
        return AgentParserService.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        AgentParserService.instance = null;
    }

    /**
     * Discover all agents from the specified agents folder
     * FR18: Dynamic agent discovery
     *
     * AC #1: Returns array of Agent objects with name, displayName, description, filePath, icon
     * AC #2: Recursively discovers all .md files in subfolders
     * AC #3: Completes in <100ms (NFR-P4)
     * AC #4: Returns ServiceResult error if folder doesn't exist
     * AC #5: Skips malformed files with warning logs
     * AC #6: Falls back to XML parsing when no frontmatter
     *
     * @param agentsFolderPath - Absolute path to agents folder (e.g., _bmad/bmm/agents/)
     * @returns ServiceResult with array of Agent objects or error
     */
    public async discoverAgents(agentsFolderPath: string): Promise<ServiceResult<Agent[]>> {
        const errorService = getErrorService();
        const folderUri = vscode.Uri.file(agentsFolderPath);

        // AC #4: Check if folder exists
        try {
            await vscode.workspace.fs.stat(folderUri);
        } catch {
            const error: BmadError = {
                code: ErrorCodes.FILE_NOT_FOUND,
                message: `Agents folder not found: ${agentsFolderPath}`,
                userMessage: 'Could not find agents folder',
                recoverable: true,
                shouldNotify: false,
            };
            errorService.handleError(error);
            return { success: false, error };
        }

        // AC #2: Recursively discover all .md files
        const agentFiles: string[] = [];
        try {
            await this.scanDirectory(folderUri, agentFiles);
        } catch (err) {
            const error: BmadError = {
                code: ErrorCodes.FILE_READ_ERROR,
                message: `Failed to scan agents folder: ${err instanceof Error ? err.message : String(err)}`,
                userMessage: 'Could not scan agents folder',
                recoverable: true,
                shouldNotify: false,
            };
            errorService.handleError(error);
            return { success: false, error };
        }

        // Parse each agent file, collecting successful parses
        const agents: Agent[] = [];
        const parsePromises = agentFiles.map(async (filePath) => {
            const agent = await this.parseAgentFile(filePath);
            if (agent) {
                agents.push(agent);
            }
        });

        await Promise.all(parsePromises);

        // Sort agents by name for consistent ordering
        agents.sort((a, b) => a.name.localeCompare(b.name));

        return { success: true, data: agents };
    }

    /**
     * Recursively scan directory for .md files
     * Task 3.2-3.4: Use VS Code workspace.fs APIs
     */
    private async scanDirectory(dirUri: vscode.Uri, results: string[]): Promise<void> {
        const entries = await vscode.workspace.fs.readDirectory(dirUri);

        for (const [name, type] of entries) {
            const entryUri = vscode.Uri.joinPath(dirUri, name);

            if (type === vscode.FileType.Directory) {
                // AC #2: Recursively scan subfolders
                await this.scanDirectory(entryUri, results);
            } else if (type === vscode.FileType.File && name.endsWith('.md')) {
                // Task 3.4: Filter to only .md files
                results.push(entryUri.fsPath);
            }
        }
    }

    /**
     * Parse single agent file to extract metadata
     * Task 4.1-4.4: Parse frontmatter and XML attributes with fallback logic
     *
     * @param filePath - Absolute path to agent markdown file
     * @returns Agent object or null if parsing fails
     */
    private async parseAgentFile(filePath: string): Promise<Agent | null> {
        const errorService = getErrorService();
        const parserService = getParserService();

        // Read file content
        let content: string;
        try {
            const fileUri = vscode.Uri.file(filePath);
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            content = Buffer.from(fileData).toString('utf8');
        } catch (err) {
            // AC #5: Skip unreadable files with warning
            errorService.warn(
                `Failed to read agent file: ${filePath} - ${err instanceof Error ? err.message : String(err)}`
            );
            return null;
        }

        // Extract id from filename
        const filename = path.basename(filePath, '.md');
        const id = filename;

        // Task 4.1: Parse YAML frontmatter using ParserService
        let frontmatter: AgentFrontmatter | null = null;
        const parseResult = parserService.parseFrontmatter<AgentFrontmatter>(content);
        if (parseResult.success && parseResult.data.hasFrontmatter) {
            frontmatter = parseResult.data.frontmatter;
        }

        // Task 4.3: Extract XML <agent> tag attributes
        const xmlAttributes = this.extractAgentXmlAttributes(content);

        // Task 4.4: Apply fallback logic: frontmatter > XML attributes > filename
        const name = frontmatter?.name || xmlAttributes.name || filename;
        const displayName = frontmatter?.description || xmlAttributes.title || name;
        const description = frontmatter?.description;
        const icon = xmlAttributes.icon;

        // AC #5: Validate we have at least minimal data
        if (!name) {
            errorService.warn(`Agent file has no identifiable name: ${filePath}`);
            return null;
        }

        return {
            id,
            name,
            displayName,
            description,
            filePath,
            icon,
        };
    }

    /**
     * Extract attributes from XML <agent> tag
     * Task 4.3: Parse XML tag for icon, title, name attributes
     *
     * Matches: <agent id="..." name="Bob" title="Scrum Master" icon="🏃">
     */
    private extractAgentXmlAttributes(content: string): AgentXmlAttributes {
        const result: AgentXmlAttributes = {};

        const agentTagMatch = content.match(this.agentTagPattern);
        if (!agentTagMatch) {
            return result;
        }

        const tagContent = agentTagMatch[0];

        // Extract name attribute
        const nameMatch = tagContent.match(/name="([^"]+)"/);
        if (nameMatch) {
            result.name = nameMatch[1];
        }

        // Extract title attribute
        const titleMatch = tagContent.match(/title="([^"]+)"/);
        if (titleMatch) {
            result.title = titleMatch[1];
        }

        // Extract icon attribute
        const iconMatch = tagContent.match(/icon="([^"]+)"/);
        if (iconMatch) {
            result.icon = iconMatch[1];
        }

        return result;
    }

    // ========================================================================
    // Command Parsing Methods (Story 6.2)
    // ========================================================================

    /**
     * Parse commands from agent markdown file menu section
     * FR19: Parse agent commands from markdown
     *
     * AC #1: Extracts array of AgentCommand objects from <menu> section
     * AC #2: Returns empty array when no menu section found
     * AC #3: Logs warning and returns empty array on malformed XML
     * AC #4: Captures optional attributes (workflow, exec, data)
     * AC #5: Returns ServiceResult error when file not found
     *
     * @param agentFilePath - Absolute path to agent markdown file
     * @returns ServiceResult with array of AgentCommand objects
     */
    public async parseCommands(agentFilePath: string): Promise<ServiceResult<AgentCommand[]>> {
        const errorService = getErrorService();
        const fileUri = vscode.Uri.file(agentFilePath);

        // AC #5: Check if file exists
        let content: string;
        try {
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            content = Buffer.from(fileData).toString('utf8');
        } catch {
            const error: BmadError = {
                code: ErrorCodes.FILE_NOT_FOUND,
                message: `Agent file not found: ${agentFilePath}`,
                userMessage: 'Could not find agent file',
                recoverable: true,
                shouldNotify: false,
            };
            errorService.handleError(error);
            return { success: false, error };
        }

        // AC #2: Extract menu section (returns empty array if not found)
        const menuContent = this.extractMenuSection(content);
        if (!menuContent) {
            return { success: true, data: [] };
        }

        // Parse menu items
        const commands: AgentCommand[] = [];
        try {
            // Reset regex lastIndex for fresh matching
            this.itemPattern.lastIndex = 0;

            let match: RegExpExecArray | null;
            while ((match = this.itemPattern.exec(menuContent)) !== null) {
                const attrString = match[1];
                const innerText = match[2].trim();

                const command = this.parseMenuItem(attrString, innerText);
                if (command) {
                    commands.push(command);
                }
            }
        } catch (err) {
            // AC #3: Log warning and return empty on malformed XML
            errorService.warn(
                `Failed to parse menu in agent file: ${agentFilePath} - ${err instanceof Error ? err.message : String(err)}`
            );
            return { success: true, data: [] };
        }

        return { success: true, data: commands };
    }

    /**
     * Extract menu section from agent file content
     * @private
     */
    private extractMenuSection(content: string): string | null {
        const match = content.match(this.menuBlockPattern);
        return match?.[1] ?? null;
    }

    /**
     * Parse individual menu item into AgentCommand
     * Task 3.1-3.5: Extract code, description, fullText, and attributes
     * @private
     */
    private parseMenuItem(attrString: string, innerText: string): AgentCommand | null {
        // Extract command code from text like "[SP] Sprint Planning..."
        const codeMatch = innerText.match(this.commandCodePattern);
        if (!codeMatch) {
            // Skip items without a valid command code
            return null;
        }

        const code = codeMatch[1];

        // Extract description (text after command code)
        const description = innerText.slice(codeMatch[0].length).trim();

        // Extract optional attributes
        const attributes = this.extractCommandAttributes(attrString);

        return {
            code,
            description,
            fullText: innerText,
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        };
    }

    /**
     * Extract command attributes from item tag attributes string
     * Task 3.4: Extract workflow, exec, data attributes
     * @private
     */
    private extractCommandAttributes(attrString: string): AgentCommandAttributes {
        const attributes: AgentCommandAttributes = {};

        // Extract workflow attribute
        const workflowMatch = attrString.match(/workflow="([^"]+)"/);
        if (workflowMatch) {
            attributes.workflow = workflowMatch[1];
        }

        // Extract exec attribute
        const execMatch = attrString.match(/exec="([^"]+)"/);
        if (execMatch) {
            attributes.exec = execMatch[1];
        }

        // Extract data attribute
        const dataMatch = attrString.match(/data="([^"]+)"/);
        if (dataMatch) {
            attributes.data = dataMatch[1];
        }

        return attributes;
    }
}


// ============================================================================
// Factory Function
// ============================================================================

/**
 * Get AgentParserService singleton instance
 * Task 6.2: Factory function export
 */
export function getAgentParserService(): AgentParserService {
    return AgentParserService.getInstance();
}
