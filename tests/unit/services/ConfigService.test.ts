/**
 * ConfigService Unit Tests
 * Story 1.3: ConfigService - Basic YAML Parsing
 * Story 1.4: ConfigService - Template Variable Resolution
 * Story 3.4: ConfigService - getProjectState() detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

// ============================================================================
// Mocks
// ============================================================================

// Mock vscode module
vi.mock('vscode', () => ({
    workspace: {
        workspaceFolders: [
            {
                uri: { fsPath: '/test/workspace' },
            },
        ],
    },
}));

// Mock fs module
vi.mock('fs', () => ({
    promises: {
        access: vi.fn(),
        readFile: vi.fn(),
        readdir: vi.fn(),
    },
    constants: {
        R_OK: 4,
    },
}));

// Mock ErrorService
vi.mock('../../../src/services/ErrorService', () => ({
    getErrorService: () => ({
        success: <T>(data: T) => ({ success: true, data }),
        failure: (error: any) => ({ success: false, error }),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));

// ============================================================================
// Import after mocks
// ============================================================================

import { ConfigService, getConfigService } from '../../../src/services/ConfigService';

// ============================================================================
// Tests
// ============================================================================

describe('ConfigService', () => {
    let mockFsAccess: ReturnType<typeof vi.fn>;
    let mockFsReadFile: ReturnType<typeof vi.fn>;
    let mockFsReaddir: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Reset all mocks INCLUDING implementations (fixes OOM issue)
        vi.resetAllMocks();
        // Reset singleton
        (ConfigService as any).instance = null;

        mockFsAccess = fs.promises.access as ReturnType<typeof vi.fn>;
        mockFsReadFile = fs.promises.readFile as ReturnType<typeof vi.fn>;
        mockFsReaddir = fs.promises.readdir as ReturnType<typeof vi.fn>;
    });

    describe('getProjectState (Story 3.4)', () => {
        describe('Task 1.1-1.4: State detection logic', () => {
            it('should return no-project when _bmad/ folder does not exist', async () => {
                // _bmad folder doesn't exist
                mockFsAccess.mockRejectedValue(new Error('ENOENT'));

                const service = getConfigService();
                const result = await service.getProjectState();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe('no-project');
                }
            });

            it('should return fresh when _bmad/ exists but no config', async () => {
                // _bmad exists
                mockFsAccess.mockImplementation(async (path: string) => {
                    if (path.includes('_bmad') && !path.includes('config.yaml')) {
                        return undefined; // exists
                    }
                    throw new Error('ENOENT');
                });

                const service = getConfigService();
                const result = await service.getProjectState();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe('fresh');
                }
            });

            it('should return fresh when config exists but no artifacts', async () => {
                const validConfig = `
project_name: Test Project
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
`;
                // Specific access mock for this test case
                mockFsAccess.mockImplementation(async (filePath: string) => {
                    // _bmad folder and config.yaml exist
                    if (filePath.includes('_bmad/bmm/config.yaml')) {
                        return undefined;
                    }
                    if (filePath.endsWith('_bmad')) {
                        return undefined;
                    }
                    // All artifact files don't exist
                    throw new Error('ENOENT');
                });
                mockFsReadFile.mockResolvedValue(validConfig);

                // Reset singleton to get fresh instance with new mocks
                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectState();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe('fresh');
                }
            });

            it('should return in-progress when prd.md exists', async () => {
                const validConfig = `
project_name: Test Project
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
`;
                mockFsAccess.mockImplementation(async (filePath: string) => {
                    // _bmad folder, config.yaml, and prd.md exist
                    if (filePath.includes('_bmad/bmm/config.yaml')) {
                        return undefined;
                    }
                    if (filePath.endsWith('_bmad')) {
                        return undefined;
                    }
                    if (filePath.endsWith('prd.md')) {
                        return undefined;
                    }
                    // epics.md doesn't exist, architecture.md doesn't exist
                    throw new Error('ENOENT');
                });
                mockFsReadFile.mockResolvedValue(validConfig);

                // Reset singleton
                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectState();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe('in-progress');
                }
            });

            it('should return in-progress when architecture.md exists but no prd', async () => {
                const validConfig = `
project_name: Test Project
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
`;
                mockFsAccess.mockImplementation(async (filePath: string) => {
                    // _bmad folder, config.yaml, and architecture.md exist (no prd.md, no epics.md)
                    if (filePath.includes('_bmad/bmm/config.yaml')) {
                        return undefined;
                    }
                    if (filePath.endsWith('_bmad')) {
                        return undefined;
                    }
                    if (filePath.endsWith('architecture.md')) {
                        return undefined;
                    }
                    // epics.md and prd.md don't exist
                    throw new Error('ENOENT');
                });
                mockFsReadFile.mockResolvedValue(validConfig);

                // Reset singleton
                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectState();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe('in-progress');
                }
            });

            it('should return epics-ready when epics.md exists', async () => {
                const validConfig = `
project_name: Test Project
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
`;
                mockFsAccess.mockImplementation(async (filePath: string) => {
                    // _bmad, config, and epics.md exist
                    if (
                        filePath.includes('_bmad') ||
                        filePath.includes('config.yaml') ||
                        filePath.endsWith('epics.md')
                    ) {
                        return undefined;
                    }
                    throw new Error('ENOENT');
                });
                mockFsReadFile.mockResolvedValue(validConfig);

                const service = getConfigService();
                const result = await service.getProjectState();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe('epics-ready');
                }
            });
        });

        describe('Edge cases', () => {
            it('should handle no workspace folder', async () => {
                // Temporarily override workspace folders
                const vscode = await import('vscode');
                const originalFolders = vscode.workspace.workspaceFolders;
                Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                    value: undefined,
                    configurable: true,
                });

                // Need fresh instance
                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectState();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe('no-project');
                }

                // Restore
                Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                    value: originalFolders,
                    configurable: true,
                });
            });
        });
    });

    describe('getArtifactProgress (Story 3.5)', () => {
        const validConfig = `
project_name: Test Project
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
`;

        describe('Task 8.1: Artifact detection logic', () => {
            it('should detect product-brief.md presence', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['product-brief-2026-02-12.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasProductBrief).toBe(true);
                }
            });

            it('should detect prd.md presence', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['prd.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasPrd).toBe(true);
                }
            });

            it('should detect architecture.md presence', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['architecture.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasArchitecture).toBe(true);
                }
            });

            it('should detect epics.md presence', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['epics.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasEpics).toBe(true);
                }
            });

            it('should return false for missing artifacts', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockRejectedValue(new Error('ENOENT'));

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasProductBrief).toBe(false);
                    expect(result.data.hasPrd).toBe(false);
                    expect(result.data.hasArchitecture).toBe(false);
                    expect(result.data.hasEpics).toBe(false);
                }
            });
        });

        describe('Task 8.3: Phase indicator logic', () => {
            it('should return brainstorming phase when no artifacts exist', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue([] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.currentPhase).toBe('brainstorming');
                }
            });

            it('should return analysis phase when PRD exists but no architecture', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['product-brief.md', 'prd.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.currentPhase).toBe('analysis');
                }
            });

            it('should return design phase when architecture exists but no epics', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['product-brief.md', 'prd.md', 'architecture.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.currentPhase).toBe('design');
                }
            });

            it('should return ready phase when epics exist', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['product-brief.md', 'prd.md', 'architecture.md', 'epics.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.currentPhase).toBe('ready');
                }
            });
        });

        describe('Task 8.2: Artifact combination tests', () => {
            it('should handle mixed artifact states correctly', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue(['product-brief-vscode-bmad-2026-02-12.md'] as any);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactProgress();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.hasProductBrief).toBe(true);
                    expect(result.data.hasPrd).toBe(false);
                    expect(result.data.hasArchitecture).toBe(false);
                    expect(result.data.hasEpics).toBe(false);
                    expect(result.data.currentPhase).toBe('brainstorming');
                }
            });
        });
    });

    describe('getProjectSummary (Story 3.6)', () => {
        const validConfig = `
project_name: Test Project
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
`;

        const sprintStatusYaml = `
generated: 2026-02-12
project: test-project
development_status:
  epic-1: in-progress
  1-1-story-one: done
  1-2-story-two: done
  epic-2: in-progress
  2-1-story-three: ready-for-dev
  2-2-story-four: in-progress
  2-3-story-five: review
  epic-3: backlog
  3-1-story-six: backlog
`;

        describe('Task 8.3: Project summary calculations', () => {
            it('should parse sprint-status.yaml and count epics', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockImplementation(async (filePath: string) => {
                    if (filePath.includes('sprint-status.yaml')) {
                        return sprintStatusYaml;
                    }
                    return validConfig;
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectSummary();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epicCount).toBe(3);
                }
            });

            it('should count stories by status correctly', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockImplementation(async (filePath: string) => {
                    if (filePath.includes('sprint-status.yaml')) {
                        return sprintStatusYaml;
                    }
                    return validConfig;
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectSummary();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.storyCount.total).toBe(6);
                    expect(result.data.storyCount.done).toBe(2);
                    expect(result.data.storyCount.inProgress).toBe(2); // ready-for-dev + in-progress
                    expect(result.data.storyCount.review).toBe(1);
                    expect(result.data.storyCount.backlog).toBe(1);
                }
            });

            it('should identify current in-progress story', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockImplementation(async (filePath: string) => {
                    if (filePath.includes('sprint-status.yaml')) {
                        return sprintStatusYaml;
                    }
                    return validConfig;
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectSummary();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.currentSprintStory).toBe('2-2-story-four');
                }
            });

            it('should return zeros when sprint-status.yaml does not exist', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockImplementation(async (filePath: string) => {
                    if (filePath.includes('sprint-status.yaml')) {
                        throw new Error('ENOENT');
                    }
                    return validConfig;
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectSummary();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epicCount).toBe(0);
                    expect(result.data.storyCount.total).toBe(0);
                    expect(result.data.currentSprintStory).toBeUndefined();
                }
            });

            it('should not count retrospectives as epics', async () => {
                const statusWithRetro = `
development_status:
  epic-1: done
  epic-1-retrospective: done
  epic-2: in-progress
`;
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockImplementation(async (filePath: string) => {
                    if (filePath.includes('sprint-status.yaml')) {
                        return statusWithRetro;
                    }
                    return validConfig;
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getProjectSummary();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.epicCount).toBe(2);
                }
            });
        });
    });

    describe('getArtifactFiles (Story 3.7)', () => {
        const validConfig = `
project_name: Test Project
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
`;

        describe('Task 1: File discovery service', () => {
            it('should return config file and artifact folders (AC #1)', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockImplementation(async (folderPath: string) => {
                    if (folderPath.includes('planning-artifacts')) {
                        return [
                            { name: 'prd.md', isDirectory: () => false },
                            { name: 'architecture.md', isDirectory: () => false },
                        ];
                    }
                    if (folderPath.includes('implementation-artifacts')) {
                        return [
                            { name: '1-1-setup.md', isDirectory: () => false },
                        ];
                    }
                    return [];
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactFiles();

                expect(result.success).toBe(true);
                if (result.success) {
                    // Config file
                    expect(result.data.configFile.type).toBe('file');
                    expect(result.data.configFile.name).toBe('config.yaml');
                    expect(result.data.configFile.icon).toBe('settings-gear');

                    // Planning artifacts folder
                    expect(result.data.planningArtifacts.type).toBe('folder');
                    expect(result.data.planningArtifacts.name).toBe('Planning Artifacts');
                    expect(result.data.planningArtifacts.children).toBeDefined();
                    expect(result.data.planningArtifacts.children?.length).toBe(2);

                    // Implementation artifacts folder
                    expect(result.data.implementationArtifacts.type).toBe('folder');
                    expect(result.data.implementationArtifacts.name).toBe('Implementation Artifacts');
                    expect(result.data.implementationArtifacts.children?.length).toBe(1);
                }
            });

            it('should handle empty folders gracefully', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockResolvedValue([]);

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactFiles();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.planningArtifacts.children).toEqual([]);
                    expect(result.data.implementationArtifacts.children).toEqual([]);
                }
            });

            it('should handle non-existent folders gracefully', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockRejectedValue(new Error('ENOENT'));

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactFiles();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.planningArtifacts.children).toEqual([]);
                    expect(result.data.implementationArtifacts.children).toEqual([]);
                }
            });

            it('should scan nested folders recursively', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockImplementation(async (folderPath: string) => {
                    if (folderPath.includes('planning-artifacts') && !folderPath.includes('subfolder')) {
                        return [
                            { name: 'subfolder', isDirectory: () => true },
                            { name: 'prd.md', isDirectory: () => false },
                        ];
                    }
                    if (folderPath.includes('subfolder')) {
                        return [
                            { name: 'nested.md', isDirectory: () => false },
                        ];
                    }
                    return [];
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactFiles();

                expect(result.success).toBe(true);
                if (result.success) {
                    const planningChildren = result.data.planningArtifacts.children;
                    expect(planningChildren).toBeDefined();
                    // Folders come first due to sorting
                    const subfolder = planningChildren?.find(c => c.name === 'subfolder');
                    expect(subfolder).toBeDefined();
                    expect(subfolder?.type).toBe('folder');
                    expect(subfolder?.children?.length).toBe(1);
                    expect(subfolder?.children?.[0].name).toBe('nested.md');
                }
            });

            it('should assign correct icons based on file extension (AC #4)', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockImplementation(async (folderPath: string) => {
                    if (folderPath.includes('planning-artifacts')) {
                        return [
                            { name: 'readme.md', isDirectory: () => false },
                            { name: 'config.yaml', isDirectory: () => false },
                            { name: 'data.json', isDirectory: () => false },
                            { name: 'script.ts', isDirectory: () => false },
                            { name: 'unknown.txt', isDirectory: () => false },
                        ];
                    }
                    return [];
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactFiles();

                expect(result.success).toBe(true);
                if (result.success) {
                    const children = result.data.planningArtifacts.children ?? [];
                    const findByName = (name: string) => children.find(c => c.name === name);

                    expect(findByName('readme.md')?.icon).toBe('markdown');
                    expect(findByName('config.yaml')?.icon).toBe('settings-gear');
                    expect(findByName('data.json')?.icon).toBe('json');
                    expect(findByName('script.ts')?.icon).toBe('symbol-field');
                    expect(findByName('unknown.txt')?.icon).toBe('file');
                }
            });

            it('should sort folders before files, both alphabetically', async () => {
                mockFsAccess.mockResolvedValue(undefined);
                mockFsReadFile.mockResolvedValue(validConfig);
                mockFsReaddir.mockImplementation(async (folderPath: string) => {
                    // Use endsWith to avoid infinite recursion when scanning subfolders
                    if (folderPath.endsWith('planning-artifacts')) {
                        return [
                            { name: 'zebra.md', isDirectory: () => false },
                            { name: 'alpha-folder', isDirectory: () => true },
                            { name: 'apple.md', isDirectory: () => false },
                            { name: 'beta-folder', isDirectory: () => true },
                        ];
                    }
                    return [];
                });

                (ConfigService as any).instance = null;
                const service = getConfigService();
                const result = await service.getArtifactFiles();

                expect(result.success).toBe(true);
                if (result.success) {
                    const names = result.data.planningArtifacts.children?.map(c => c.name);
                    // Folders first (alphabetically), then files (alphabetically)
                    expect(names).toEqual(['alpha-folder', 'beta-folder', 'apple.md', 'zebra.md']);
                }
            });
        });
    });
});
