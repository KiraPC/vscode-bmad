/**
 * ModelService - AI Model Discovery and Management
 * Story 6.5: Model Selector Integration
 *
 * Discovers available AI models from VS Code Language Model API,
 * provides fallback for unavailable API, and watches for model changes.
 *
 * FR20: Populate model dropdown with available VS Code models
 * NFR-P4: Model discovery < 100ms
 */

import * as vscode from 'vscode';
import { ServiceResult, BmadError, ErrorCodes } from '../shared/types';
import { ModelOption } from '../shared/models';
import { getErrorService } from './ErrorService';

// ============================================================================
// ModelService Class
// ============================================================================

/**
 * Service for discovering and managing AI models
 * Task 3.2: Singleton pattern matching AgentParserService
 */
export class ModelService {
    private static instance: ModelService | null = null;

    /** Task 3.3: Cached available models */
    private _modelsCache: ModelOption[] = [];

    /** Task 3.4: Event emitter for model changes */
    private readonly _onDidChangeModels = new vscode.EventEmitter<ModelOption[]>();

    /** Task 3.5: Public event for providers to subscribe */
    public readonly onDidChangeModels = this._onDidChangeModels.event;

    /** Watcher disposable for cleanup */
    private _watcherDisposable: vscode.Disposable | null = null;

    /** Task 4.3: API availability (cached after first check) */
    private _apiAvailable: boolean | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance of ModelService
     */
    public static getInstance(): ModelService {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        ModelService.instance?._dispose();
        ModelService.instance = null;
    }

    // ========================================================================
    // Task 4: API Availability Detection
    // ========================================================================

    /**
     * Check if VS Code Language Model API is available
     * Task 4.1, 4.2: API exists in VS Code 1.90+ with Copilot installed
     */
    private isLanguageModelApiAvailable(): boolean {
        if (this._apiAvailable !== null) {
            return this._apiAvailable;
        }

        // Task 4.2: Check for vscode.lm namespace and selectChatModels function
        this._apiAvailable =
            typeof vscode.lm !== 'undefined' &&
            typeof vscode.lm.selectChatModels === 'function';

        return this._apiAvailable;
    }

    // ========================================================================
    // Task 5: Get Available Models
    // ========================================================================

    /**
     * Get available AI models for selection
     * Task 5.1: Returns formatted ModelOption[] from API or fallback
     * AC #1, #2, #5: Graceful fallback with default when API unavailable
     */
    public async getAvailableModels(): Promise<ServiceResult<ModelOption[]>> {
        const errorService = getErrorService();

        // Task 5.2: If API not available, return success with fallback
        if (!this.isLanguageModelApiAvailable()) {
            errorService.info('Language Model API not available, using default model');
            const defaults = this.getDefaultModels();
            this._modelsCache = defaults;
            return { success: true, data: defaults };
        }

        try {
            // Task 5.3: Call selectChatModels without filter to get all models
            const models = await vscode.lm.selectChatModels();

            // Task 5.5: Empty array means no models available
            if (models.length === 0) {
                errorService.info('No language models available from API');
                const defaults = this.getDefaultModels();
                this._modelsCache = defaults;
                return { success: true, data: defaults };
            }

            // Task 5.4: Map LanguageModelChat to ModelOption
            const modelOptions: ModelOption[] = models.map((model) => ({
                id: model.id,
                // Task 5.5: Format displayName as vendor: name
                displayName: `${model.vendor}: ${model.name}`,
                vendor: model.vendor,
                family: model.family,
            }));

            // Task 5.6: Sort models by vendor, then by name
            modelOptions.sort((a, b) => {
                const vendorCmp = a.vendor.localeCompare(b.vendor);
                if (vendorCmp !== 0) return vendorCmp;
                return a.displayName.localeCompare(b.displayName);
            });

            // Task 5.7: Update cache
            this._modelsCache = modelOptions;
            return { success: true, data: modelOptions };
        } catch (error) {
            const bmadError: BmadError = {
                code: ErrorCodes.UNKNOWN_ERROR,
                message: `Model fetch failed: ${error instanceof Error ? error.message : String(error)}`,
                userMessage: 'Could not fetch available AI models',
                recoverable: true,
                shouldNotify: false,
            };
            errorService.handleError(bmadError);

            // Return defaults on error
            const defaults = this.getDefaultModels();
            this._modelsCache = defaults;
            return { success: true, data: defaults };
        }
    }

    // ========================================================================
    // Task 6: Model Change Watching
    // ========================================================================

    /**
     * Watch for model changes at runtime
     * Task 6.1: Subscribe to API changes and emit events
     * AC #3: Refresh models when Copilot installed/uninstalled
     */
    public watchModelChanges(): vscode.Disposable {
        // Task 6.4: Return no-op Disposable if API not available
        if (!this.isLanguageModelApiAvailable() || !vscode.lm.onDidChangeChatModels) {
            return { dispose: () => {} };
        }

        // Task 6.2, 6.3: Subscribe to model changes
        this._watcherDisposable = vscode.lm.onDidChangeChatModels(async () => {
            const result = await this.getAvailableModels();
            if (result.success && result.data) {
                this._onDidChangeModels.fire(result.data);
            }
        });

        // Task 6.5: Return disposable for cleanup
        return this._watcherDisposable;
    }

    // ========================================================================
    // Task 7: Fallback Model List
    // ========================================================================

    /**
     * Get fallback model list when API unavailable
     * Task 7.1, 7.2: Single "Default" option
     * AC #2: Graceful fallback with "Default" only
     */
    private getDefaultModels(): ModelOption[] {
        return [
            {
                id: 'default',
                displayName: 'Default',
                vendor: 'auto',
                family: 'auto',
            },
        ];
    }

    /**
     * Get cached models (sync access)
     * Returns default if cache empty
     */
    public getCachedModels(): ModelOption[] {
        return this._modelsCache.length > 0 ? this._modelsCache : this.getDefaultModels();
    }

    /**
     * Dispose resources
     */
    private _dispose(): void {
        this._watcherDisposable?.dispose();
        this._onDidChangeModels.dispose();
    }
}

// ============================================================================
// Export Helper Function
// ============================================================================

/**
 * Get singleton instance of ModelService
 * Task 8.2: Convenience function for service access
 */
export function getModelService(): ModelService {
    return ModelService.getInstance();
}
