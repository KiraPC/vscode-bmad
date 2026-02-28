/**
 * WorkflowProgressService
 * Story 5.8: Calculate workflow progress based on artifact file presence
 *
 * AC #2: Detect planning, solutioning, implementation, and testing artifacts
 * AC #4: Recalculate on file changes (called from KanbanProvider)
 *
 * Phase Detection Logic (FR25):
 * - Planning: brainstorming/*.md OR *product-brief*.md exists
 * - Solutioning: prd.md AND architecture.md exist
 * - Implementation: epics.md exists; COMPLETED when >90% stories 'done'
 * - Testing: stories with status='done'; COMPLETED when all stories 'done'
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
    BmadConfig,
    ServiceResult,
    WorkflowProgress,
    WorkflowPhase,
    PhaseStatus,
} from '../shared/types';
import type { Story } from '../shared/models';

export class WorkflowProgressService {
    private static instance: WorkflowProgressService;

    public static getInstance(): WorkflowProgressService {
        if (!WorkflowProgressService.instance) {
            WorkflowProgressService.instance = new WorkflowProgressService();
        }
        return WorkflowProgressService.instance;
    }

    /**
     * Calculate workflow progress based on artifact files and story status
     * @param config BmadConfig with artifact paths
     * @param stories Array of parsed stories
     * @returns ServiceResult with WorkflowProgress
     */
    public async calculateProgress(
        config: BmadConfig,
        stories: Story[]
    ): Promise<ServiceResult<WorkflowProgress>> {
        try {
            // 1. Check planning artifacts
            const planningComplete = await this.checkPlanningPhase(config);

            // 2. Check solutioning artifacts
            const solutioningComplete = await this.checkSolutioningPhase(config);

            // 3. Check implementation phase (based on stories)
            const implementationComplete = this.checkImplementationPhase(stories);

            // 4. Check testing phase (based on story completion)
            const testingComplete = this.checkTestingPhase(stories);

            // 5. Determine current phase and statuses
            const progress = this.determinePhaseStatuses(
                planningComplete,
                solutioningComplete,
                implementationComplete,
                testingComplete
            );

            return { success: true, data: progress };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'WORKFLOW_PROGRESS_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    userMessage: 'Failed to calculate workflow progress',
                    recoverable: true,
                },
            };
        }
    }

    /**
     * Check planning phase completion
     * Planning is complete when brainstorming files or product-brief exists
     */
    private async checkPlanningPhase(config: BmadConfig): Promise<boolean> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            return false;
        }

        // Check for brainstorming files
        const brainstormPath = path.join(workspaceFolder, '_bmad-output', 'brainstorming');
        try {
            const files = await fs.readdir(brainstormPath);
            if (files.filter((f) => f.endsWith('.md')).length > 0) {
                return true;
            }
        } catch {
            // Brainstorming folder doesn't exist, check product-brief
        }

        // Check for product-brief in planning artifacts
        try {
            const planningFiles = await fs.readdir(config.planningArtifacts);
            return planningFiles.some((f) => f.toLowerCase().includes('product-brief'));
        } catch {
            return false;
        }
    }

    /**
     * Check solutioning phase completion
     * Solutioning is complete when both prd.md and architecture.md exist
     */
    private async checkSolutioningPhase(config: BmadConfig): Promise<boolean> {
        try {
            // Both PRD and Architecture must exist
            await fs.access(path.join(config.planningArtifacts, 'prd.md'));
            await fs.access(path.join(config.planningArtifacts, 'architecture.md'));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check implementation phase completion
     * Implementation is complete when >90% of stories are 'done'
     */
    private checkImplementationPhase(stories: Story[]): boolean {
        if (stories.length === 0) {
            return false;
        }
        const doneCount = stories.filter((s) => s.status === 'done').length;
        return doneCount / stories.length >= 0.9;
    }

    /**
     * Check testing phase completion
     * Testing is complete when ALL stories are 'done'
     */
    private checkTestingPhase(stories: Story[]): boolean {
        if (stories.length === 0) {
            return false;
        }
        return stories.every((s) => s.status === 'done');
    }

    /**
     * Determine phase statuses based on completion flags
     * Returns WorkflowProgress with proper current/completed/future markers
     */
    private determinePhaseStatuses(
        planningDone: boolean,
        solutioningDone: boolean,
        implementationDone: boolean,
        testingDone: boolean
    ): WorkflowProgress {
        let currentPhase: WorkflowPhase;
        let statuses: Record<WorkflowPhase, PhaseStatus>;

        if (!planningDone) {
            currentPhase = 'planning';
            statuses = {
                planning: 'current',
                solutioning: 'future',
                implementation: 'future',
                testing: 'future',
            };
        } else if (!solutioningDone) {
            currentPhase = 'solutioning';
            statuses = {
                planning: 'completed',
                solutioning: 'current',
                implementation: 'future',
                testing: 'future',
            };
        } else if (!implementationDone) {
            currentPhase = 'implementation';
            statuses = {
                planning: 'completed',
                solutioning: 'completed',
                implementation: 'current',
                testing: 'future',
            };
        } else if (!testingDone) {
            currentPhase = 'testing';
            statuses = {
                planning: 'completed',
                solutioning: 'completed',
                implementation: 'completed',
                testing: 'current',
            };
        } else {
            // All phases complete
            currentPhase = 'testing';
            statuses = {
                planning: 'completed',
                solutioning: 'completed',
                implementation: 'completed',
                testing: 'completed',
            };
        }

        return { ...statuses, currentPhase };
    }
}

/**
 * Get singleton instance of WorkflowProgressService
 */
export function getWorkflowProgressService(): WorkflowProgressService {
    return WorkflowProgressService.getInstance();
}
