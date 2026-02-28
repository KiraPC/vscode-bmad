/**
 * SidebarTreeProvider Unit Tests
 * Story 2.3: Project Init Button in Sidebar
 * Task 5.1-5.3: Unit tests for sidebar functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import {
    SidebarTreeProvider,
    SidebarItem,
    InitProjectItem,
    ProjectInfoItem,
} from '../../../src/providers/SidebarTreeProvider';

// Mock vscode module
vi.mock('vscode', () => ({
    TreeItem: class {
        label: string;
        collapsibleState: number;
        command?: any;
        iconPath?: any;
        tooltip?: string;
        contextValue?: string;
        description?: string;
        constructor(label: string, collapsibleState: number) {
            this.label = label;
            this.collapsibleState = collapsibleState;
        }
    },
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2,
    },
    ThemeIcon: class {
        id: string;
        constructor(id: string) {
            this.id = id;
        }
    },
    EventEmitter: class {
        event = vi.fn();
        fire = vi.fn();
        dispose = vi.fn();
    },
    workspace: {
        workspaceFolders: [
            {
                uri: { fsPath: '/test/workspace' },
            },
        ],
        createFileSystemWatcher: vi.fn(() => ({
            onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
            onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
            dispose: vi.fn(),
        })),
    },
    RelativePattern: class {
        constructor(public base: any, public pattern: string) {}
    },
    window: {
        createTreeView: vi.fn(() => ({ dispose: vi.fn() })),
        showInformationMessage: vi.fn(),
    },
    commands: {
        registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    },
}));

// Mock ConfigService
const mockHasBmadProject = vi.fn();
const mockGetConfig = vi.fn();

vi.mock('../../../src/services/ConfigService', () => ({
    getConfigService: () => ({
        hasBmadProject: mockHasBmadProject,
        getConfig: mockGetConfig,
    }),
}));

// Mock TerminalService
const mockExecuteCommand = vi.fn();

vi.mock('../../../src/services/TerminalService', () => ({
    getTerminalService: () => ({
        executeCommand: mockExecuteCommand,
    }),
}));

// Mock ErrorService
vi.mock('../../../src/services/ErrorService', () => ({
    getErrorService: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        handleError: vi.fn(),
    }),
}));

describe('SidebarTreeProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('InitProjectItem', () => {
        it('should have correct label', () => {
            const item = new InitProjectItem();
            expect(item.label).toBe('Start New BMAD Project');
        });

        it('should have rocket icon', () => {
            const item = new InitProjectItem();
            expect(item.iconPath).toBeDefined();
            expect((item.iconPath as any).id).toBe('rocket');
        });

        it('should have command attached', () => {
            const item = new InitProjectItem();
            expect(item.command).toBeDefined();
            expect(item.command?.command).toBe('vscode-bmad.initProject');
        });

        it('should have tooltip', () => {
            const item = new InitProjectItem();
            expect(item.tooltip).toContain('BMAD project');
        });
    });

    describe('ProjectInfoItem', () => {
        it('should display project name', () => {
            const item = new ProjectInfoItem('My Project');
            expect(item.label).toBe('My Project');
        });

        it('should have folder icon', () => {
            const item = new ProjectInfoItem('My Project');
            expect((item.iconPath as any).id).toBe('folder');
        });

        it('should have description', () => {
            const item = new ProjectInfoItem('My Project');
            expect(item.description).toBe('BMAD Project');
        });
    });

    describe('getChildren (Task 5.1, 5.2)', () => {
        it('should return InitProjectItem when no _bmad folder exists (Task 5.1)', async () => {
            mockHasBmadProject.mockResolvedValue(false);

            const provider = new SidebarTreeProvider();
            const children = await provider.getChildren();

            expect(children).toHaveLength(1);
            expect(children[0]).toBeInstanceOf(InitProjectItem);
        });

        it('should return ProjectInfoItem when _bmad folder exists (Task 5.2)', async () => {
            mockHasBmadProject.mockResolvedValue(true);
            mockGetConfig.mockResolvedValue({
                success: true,
                data: { projectName: 'Test Project' },
            });

            const provider = new SidebarTreeProvider();
            const children = await provider.getChildren();

            expect(children).toHaveLength(1);
            expect(children[0]).toBeInstanceOf(ProjectInfoItem);
            expect(children[0].label).toBe('Test Project');
        });

        it('should return empty array for nested items', async () => {
            const provider = new SidebarTreeProvider();
            const parent = new SidebarItem('parent');
            const children = await provider.getChildren(parent);

            expect(children).toHaveLength(0);
        });
    });

    describe('getTreeItem', () => {
        it('should return the same item passed in', () => {
            const provider = new SidebarTreeProvider();
            const item = new InitProjectItem();
            const result = provider.getTreeItem(item);

            expect(result).toBe(item);
        });
    });

    describe('refresh', () => {
        it('should fire onDidChangeTreeData event', () => {
            const provider = new SidebarTreeProvider();
            const fireSpy = vi.spyOn((provider as any)._onDidChangeTreeData, 'fire');

            provider.refresh();

            expect(fireSpy).toHaveBeenCalledWith(undefined);
        });
    });

    describe('dispose', () => {
        it('should dispose all resources', () => {
            const provider = new SidebarTreeProvider();
            expect(() => provider.dispose()).not.toThrow();
        });
    });
});
