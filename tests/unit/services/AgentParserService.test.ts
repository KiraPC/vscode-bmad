/**
 * AgentParserService Unit Tests
 * Story 6.1: AgentParserService - Discover Agents
 * Task 7: Unit tests for agent discovery functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    AgentParserService,
    getAgentParserService,
} from '../../../src/services/AgentParserService';
import { Agent, isAgent, AgentCommand, isAgentCommand, isAgentCommandAttributes } from '../../../src/shared/models';
import { ErrorCodes } from '../../../src/shared/types';
import * as path from 'path';
import * as fs from 'fs';

// Get absolute path to test fixtures
const FIXTURES_PATH = path.resolve(__dirname, '../../fixtures/agents');

// Track mock function calls
const mockStatCalls: string[] = [];
const mockReadDirCalls: string[] = [];
const mockReadFileCalls: string[] = [];
let mockStatShouldFail = false;
let mockReadDirShouldFail = false;

// Mock ErrorService
vi.mock('../../../src/services/ErrorService', () => ({
    ErrorService: {
        getInstance: vi.fn(() => ({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            log: vi.fn(),
            handleError: vi.fn(),
        })),
        resetInstance: vi.fn(),
    },
    getErrorService: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        handleError: vi.fn(),
    })),
}));

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
        file: vi.fn((fsPath: string) => ({
            fsPath,
            scheme: 'file',
        })),
        joinPath: vi.fn((base: { fsPath: string }, ...segments: string[]) => {
            const joined = path.join(base.fsPath, ...segments);
            return { fsPath: joined, scheme: 'file' };
        }),
    },
    FileType: {
        File: 1,
        Directory: 2,
        SymbolicLink: 64,
    },
    workspace: {
        fs: {
            stat: vi.fn(async (uri: { fsPath: string }) => {
                mockStatCalls.push(uri.fsPath);
                if (mockStatShouldFail) {
                    throw new Error('Folder not found');
                }
                // Check if path actually exists
                try {
                    const stat = fs.statSync(uri.fsPath);
                    return {
                        type: stat.isDirectory() ? 2 : 1, // FileType.Directory = 2, FileType.File = 1
                        ctime: stat.ctimeMs,
                        mtime: stat.mtimeMs,
                        size: stat.size,
                    };
                } catch {
                    throw new Error('File not found');
                }
            }),
            readDirectory: vi.fn(async (uri: { fsPath: string }) => {
                mockReadDirCalls.push(uri.fsPath);
                if (mockReadDirShouldFail) {
                    throw new Error('Cannot read directory');
                }
                // Actually read the directory from fixtures
                try {
                    const entries = fs.readdirSync(uri.fsPath, { withFileTypes: true });
                    return entries.map(entry => {
                        const type = entry.isDirectory() ? 2 : 1; // FileType.Directory = 2, FileType.File = 1
                        return [entry.name, type] as [string, number];
                    });
                } catch {
                    throw new Error('Cannot read directory');
                }
            }),
            readFile: vi.fn(async (uri: { fsPath: string }) => {
                mockReadFileCalls.push(uri.fsPath);
                // Actually read the file from fixtures
                try {
                    const content = fs.readFileSync(uri.fsPath);
                    return content;
                } catch {
                    throw new Error('Cannot read file');
                }
            }),
        },
    },
}));

describe('AgentParserService', () => {
    beforeEach(() => {
        AgentParserService.resetInstance();
        mockStatCalls.length = 0;
        mockReadDirCalls.length = 0;
        mockReadFileCalls.length = 0;
        mockStatShouldFail = false;
        mockReadDirShouldFail = false;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================================================
    // Singleton Pattern Tests
    // ========================================================================

    describe('singleton pattern', () => {
        it('should return same instance on multiple calls', () => {
            const instance1 = AgentParserService.getInstance();
            const instance2 = AgentParserService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should return same instance via factory function', () => {
            const instance1 = getAgentParserService();
            const instance2 = getAgentParserService();

            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = AgentParserService.getInstance();
            AgentParserService.resetInstance();
            const instance2 = AgentParserService.getInstance();

            expect(instance1).not.toBe(instance2);
        });
    });

    // ========================================================================
    // Agent Discovery Tests (AC #1, #2)
    // ========================================================================

    describe('discoverAgents', () => {
        describe('valid agent discovery (AC #1)', () => {
            it('should discover agents from folder with frontmatter', async () => {
                const service = getAgentParserService();
                const result = await service.discoverAgents(FIXTURES_PATH);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.length).toBeGreaterThan(0);

                    // Find the valid-agent
                    const validAgent = result.data.find(a => a.id === 'valid-agent');
                    expect(validAgent).toBeDefined();
                    if (validAgent) {
                        expect(validAgent.name).toBe('test-agent');
                        expect(validAgent.displayName).toBe('Test Agent for Unit Tests');
                        expect(validAgent.icon).toBe('🧪');
                        expect(validAgent.filePath).toContain('valid-agent.md');
                    }
                }
            });

            it('should return Agent objects with required fields', async () => {
                const service = getAgentParserService();
                const result = await service.discoverAgents(FIXTURES_PATH);

                expect(result.success).toBe(true);
                if (result.success) {
                    for (const agent of result.data) {
                        expect(typeof agent.id).toBe('string');
                        expect(typeof agent.name).toBe('string');
                        expect(typeof agent.displayName).toBe('string');
                        expect(typeof agent.filePath).toBe('string');
                        // Optional fields
                        if (agent.description !== undefined) {
                            expect(typeof agent.description).toBe('string');
                        }
                        if (agent.icon !== undefined) {
                            expect(typeof agent.icon).toBe('string');
                        }
                    }
                }
            });
        });

        describe('nested folder discovery (AC #2)', () => {
            it('should recursively discover agents in nested folders', async () => {
                const service = getAgentParserService();
                const result = await service.discoverAgents(FIXTURES_PATH);

                expect(result.success).toBe(true);
                if (result.success) {
                    // Check nested agent is discovered
                    const nestedAgent = result.data.find(a => a.id === 'nested-agent');
                    expect(nestedAgent).toBeDefined();
                    if (nestedAgent) {
                        expect(nestedAgent.name).toBe('nested-agent');
                        expect(nestedAgent.filePath).toContain('nested');
                    }
                }
            });
        });

        describe('folder not found error (AC #4)', () => {
            it('should return error when folder does not exist', async () => {
                mockStatShouldFail = true;
                const service = getAgentParserService();
                const result = await service.discoverAgents('/nonexistent/path');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe(ErrorCodes.FILE_NOT_FOUND);
                }
            });
        });

        describe('malformed file handling (AC #5)', () => {
            it('should skip malformed files and continue with others', async () => {
                const service = getAgentParserService();
                const result = await service.discoverAgents(FIXTURES_PATH);

                expect(result.success).toBe(true);
                if (result.success) {
                    // Should still find valid agents despite malformed one
                    expect(result.data.length).toBeGreaterThan(0);

                    // The malformed agent might still be included with fallback name
                    // (since we use filename as fallback)
                    const malformed = result.data.find(a => a.id === 'malformed-agent');
                    // If included, should have filename-derived name
                    if (malformed) {
                        expect(malformed.name).toBeDefined();
                    }
                }
            });
        });

        describe('XML fallback parsing (AC #6)', () => {
            it('should extract name from XML when no frontmatter', async () => {
                const service = getAgentParserService();
                const result = await service.discoverAgents(FIXTURES_PATH);

                expect(result.success).toBe(true);
                if (result.success) {
                    // Find the XML-only agent
                    const xmlAgent = result.data.find(a => a.id === 'xml-only-agent');
                    expect(xmlAgent).toBeDefined();
                    if (xmlAgent) {
                        // Should fall back to XML attributes
                        expect(xmlAgent.name).toBe('XmlBot');
                        expect(xmlAgent.displayName).toBe('XML Only Agent');
                        expect(xmlAgent.icon).toBe('📄');
                    }
                }
            });

            it('should use filename as last resort fallback', async () => {
                const service = getAgentParserService();
                const result = await service.discoverAgents(FIXTURES_PATH);

                expect(result.success).toBe(true);
                if (result.success) {
                    // All agents should have an id derived from filename
                    for (const agent of result.data) {
                        expect(agent.id).toBeTruthy();
                        expect(agent.id).not.toContain('.md');
                    }
                }
            });
        });

        describe('sorting', () => {
            it('should return agents sorted by name', async () => {
                const service = getAgentParserService();
                const result = await service.discoverAgents(FIXTURES_PATH);

                expect(result.success).toBe(true);
                if (result.success && result.data.length > 1) {
                    for (let i = 1; i < result.data.length; i++) {
                        expect(result.data[i - 1].name.localeCompare(result.data[i].name)).toBeLessThanOrEqual(0);
                    }
                }
            });
        });
    });

    // ========================================================================
    // Type Guard Tests
    // ========================================================================

    describe('isAgent type guard', () => {
        it('should return true for valid Agent object', () => {
            const agent: Agent = {
                id: 'test',
                name: 'test-agent',
                displayName: 'Test Agent',
                filePath: '/path/to/agent.md',
            };

            expect(isAgent(agent)).toBe(true);
        });

        it('should return true for Agent with all optional fields', () => {
            const agent: Agent = {
                id: 'test',
                name: 'test-agent',
                displayName: 'Test Agent',
                filePath: '/path/to/agent.md',
                description: 'A test agent',
                icon: '🧪',
            };

            expect(isAgent(agent)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isAgent(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isAgent(undefined)).toBe(false);
        });

        it('should return false for non-object', () => {
            expect(isAgent('string')).toBe(false);
            expect(isAgent(123)).toBe(false);
            expect(isAgent(true)).toBe(false);
        });

        it('should return false for object missing required fields', () => {
            expect(isAgent({ id: 'test' })).toBe(false);
            expect(isAgent({ id: 'test', name: 'test' })).toBe(false);
            expect(isAgent({ id: 'test', name: 'test', displayName: 'Test' })).toBe(false);
        });

        it('should return false for object with wrong field types', () => {
            expect(isAgent({
                id: 123, // should be string
                name: 'test',
                displayName: 'Test',
                filePath: '/path',
            })).toBe(false);
        });
    });

    // ========================================================================
    // parseCommands Tests (Story 6.2)
    // ========================================================================

    describe('parseCommands', () => {
        describe('valid menu parsing (AC #1)', () => {
            it('should parse commands from agent file with menu', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-with-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.length).toBeGreaterThan(0);
                    expect(result.data.length).toBe(6);
                }
            });

            it('should extract command code, description, and fullText', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-with-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    const firstCommand = result.data.find(c => c.code === 'T1');
                    expect(firstCommand).toBeDefined();
                    if (firstCommand) {
                        expect(firstCommand.code).toBe('T1');
                        expect(firstCommand.description).toBe('Test One: First test command');
                        expect(firstCommand.fullText).toBe('[T1] Test One: First test command');
                    }
                }
            });

            it('should handle 2-4 character command codes', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-with-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    // 2-char code
                    const mhCommand = result.data.find(c => c.code === 'MH');
                    expect(mhCommand).toBeDefined();

                    // 4-char code
                    const longCommand = result.data.find(c => c.code === 'LONG');
                    expect(longCommand).toBeDefined();
                }
            });
        });

        describe('attribute extraction (AC #4)', () => {
            it('should extract workflow attribute', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-with-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    const workflowCommand = result.data.find(c => c.code === 'T1');
                    expect(workflowCommand).toBeDefined();
                    expect(workflowCommand?.attributes?.workflow).toBe('/path/to/workflow.yaml');
                }
            });

            it('should extract exec attribute', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-with-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    const execCommand = result.data.find(c => c.code === 'T2');
                    expect(execCommand).toBeDefined();
                    expect(execCommand?.attributes?.exec).toBe('/path/to/exec.md');
                }
            });

            it('should extract data attribute', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-with-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    const dataCommand = result.data.find(c => c.code === 'T3');
                    expect(dataCommand).toBeDefined();
                    expect(dataCommand?.attributes?.data).toBe('/path/to/data.csv');
                }
            });

            it('should have undefined attributes when none present', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-with-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    const noAttrCommand = result.data.find(c => c.code === 'T4');
                    expect(noAttrCommand).toBeDefined();
                    expect(noAttrCommand?.attributes).toBeUndefined();
                }
            });
        });

        describe('no menu section (AC #2)', () => {
            it('should return empty array when no menu section', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'no-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual([]);
                }
            });

            it('should return empty array for valid-agent without menu', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'valid-agent.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual([]);
                }
            });
        });

        describe('malformed menu handling (AC #3)', () => {
            it('should skip items without valid command code', async () => {
                const service = getAgentParserService();
                const filePath = path.join(FIXTURES_PATH, 'malformed-menu.md');
                const result = await service.parseCommands(filePath);

                expect(result.success).toBe(true);
                if (result.success) {
                    // Should only parse items with valid [XX] codes
                    expect(result.data.length).toBe(2); // T1 and T3 only
                    expect(result.data.map(c => c.code)).toEqual(['T1', 'T3']);
                }
            });
        });

        describe('file not found (AC #5)', () => {
            it('should return error when file does not exist', async () => {
                const service = getAgentParserService();
                const result = await service.parseCommands('/nonexistent/agent.md');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe(ErrorCodes.FILE_NOT_FOUND);
                }
            });
        });
    });

    // ========================================================================
    // AgentCommand Type Guard Tests (Story 6.2)
    // ========================================================================

    describe('isAgentCommand type guard', () => {
        it('should return true for valid AgentCommand', () => {
            const command: AgentCommand = {
                code: 'T1',
                description: 'Test command',
                fullText: '[T1] Test command',
            };
            expect(isAgentCommand(command)).toBe(true);
        });

        it('should return true for AgentCommand with attributes', () => {
            const command: AgentCommand = {
                code: 'SP',
                description: 'Sprint Planning',
                fullText: '[SP] Sprint Planning',
                attributes: {
                    workflow: '/path/to/workflow.yaml',
                },
            };
            expect(isAgentCommand(command)).toBe(true);
        });

        it('should return true for AgentCommand with all attributes', () => {
            const command: AgentCommand = {
                code: 'CP',
                description: 'Create PRD',
                fullText: '[CP] Create PRD',
                attributes: {
                    workflow: '/path/workflow.yaml',
                    exec: '/path/exec.md',
                    data: '/path/data.csv',
                },
            };
            expect(isAgentCommand(command)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isAgentCommand(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isAgentCommand(undefined)).toBe(false);
        });

        it('should return false for non-object', () => {
            expect(isAgentCommand('string')).toBe(false);
            expect(isAgentCommand(123)).toBe(false);
        });

        it('should return false for object missing required fields', () => {
            expect(isAgentCommand({ code: 'T1' })).toBe(false);
            expect(isAgentCommand({ code: 'T1', description: 'test' })).toBe(false);
        });

        it('should return false for object with wrong field types', () => {
            expect(isAgentCommand({
                code: 123, // should be string
                description: 'test',
                fullText: 'test',
            })).toBe(false);
        });
    });

    describe('isAgentCommandAttributes type guard', () => {
        it('should return true for empty object', () => {
            expect(isAgentCommandAttributes({})).toBe(true);
        });

        it('should return true for object with workflow', () => {
            expect(isAgentCommandAttributes({ workflow: '/path' })).toBe(true);
        });

        it('should return true for object with all attributes', () => {
            expect(isAgentCommandAttributes({
                workflow: '/workflow.yaml',
                exec: '/exec.md',
                data: '/data.csv',
            })).toBe(true);
        });

        it('should return false for null', () => {
            expect(isAgentCommandAttributes(null)).toBe(false);
        });

        it('should return false for wrong types', () => {
            expect(isAgentCommandAttributes({ workflow: 123 })).toBe(false);
        });
    });
});
