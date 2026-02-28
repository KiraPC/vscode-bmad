/**
 * ModelService Unit Tests
 * Story 6.5: Model Selector Integration
 * Task 12.1-12.7: Unit tests for AI model discovery and management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';

// ============================================================================
// Mocks
// ============================================================================

// Track all model change listeners
const modelChangeListeners: Array<() => void> = [];

// Mock vscode module - must be before imports
vi.mock('vscode', () => {
    // Mock EventEmitter
    class MockEventEmitter<T> {
        private listeners: ((e: T) => void)[] = [];
        event = (listener: (e: T) => void) => {
            this.listeners.push(listener);
            return { dispose: () => { this.listeners = this.listeners.filter(l => l !== listener); } };
        };
        fire = (data: T) => { this.listeners.forEach(l => l(data)); };
        dispose = () => { this.listeners = []; };
    }

    const mockSelectChatModels = vi.fn();
    const mockOnDidChangeChatModels = vi.fn((callback: () => void) => {
        modelChangeListeners.push(callback);
        return { dispose: () => { const idx = modelChangeListeners.indexOf(callback); if (idx >= 0) modelChangeListeners.splice(idx, 1); } };
    });

    return {
        EventEmitter: MockEventEmitter,
        lm: {
            selectChatModels: mockSelectChatModels,
            onDidChangeChatModels: mockOnDidChangeChatModels,
        },
        __mocks: {
            selectChatModels: mockSelectChatModels,
            onDidChangeChatModels: mockOnDidChangeChatModels,
        },
    };
});

// Mock ErrorService
const mockInfo = vi.fn();
const mockHandleError = vi.fn();

vi.mock('../../../src/services/ErrorService', () => ({
    getErrorService: () => ({
        info: mockInfo,
        warn: vi.fn(),
        error: vi.fn(),
        handleError: mockHandleError,
    }),
}));

// Import after mocks
import { ModelService, getModelService } from '../../../src/services/ModelService';
import type { ModelOption } from '../../../src/shared/models';

// ============================================================================
// Test Data
// ============================================================================

const mockLanguageModelChat = [
    { id: 'model-1', name: 'GPT-4', vendor: 'copilot', family: 'gpt4', version: '1.0', maxInputTokens: 8000 },
    { id: 'model-2', name: 'Claude Sonnet', vendor: 'anthropic', family: 'claude-3', version: '1.0', maxInputTokens: 100000 },
    { id: 'model-3', name: 'GPT-3.5', vendor: 'copilot', family: 'gpt-3.5-turbo', version: '1.0', maxInputTokens: 4000 },
];

// ============================================================================
// Tests
// ============================================================================

describe('ModelService', () => {
    let mockSelectChatModels: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        modelChangeListeners.length = 0;

        // Reset singleton instance
        ModelService.resetInstance();

        // Get mock references from vscode module
        const vscodeMock = vscode as any;
        mockSelectChatModels = vscodeMock.__mocks.selectChatModels;
    });

    afterEach(() => {
        ModelService.resetInstance();
    });

    describe('getInstance and Singleton (Task 3.2)', () => {
        it('should return same instance on multiple calls', () => {
            const instance1 = ModelService.getInstance();
            const instance2 = ModelService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should return new instance after reset', () => {
            const instance1 = ModelService.getInstance();
            ModelService.resetInstance();
            const instance2 = ModelService.getInstance();

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('getModelService helper (Task 8)', () => {
        it('should return ModelService instance', () => {
            const service = getModelService();

            expect(service).toBeInstanceOf(ModelService);
        });
    });

    describe('getAvailableModels (Task 5, AC #1, #5)', () => {
        it('should return models from API (Task 12.3)', async () => {
            mockSelectChatModels.mockResolvedValue(mockLanguageModelChat);

            const service = getModelService();
            const result = await service.getAvailableModels();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(3);
            }
        });

        it('should format displayName as vendor: name (Task 5.5)', async () => {
            mockSelectChatModels.mockResolvedValue(mockLanguageModelChat);

            const service = getModelService();
            const result = await service.getAvailableModels();

            expect(result.success).toBe(true);
            if (result.success) {
                // Check one of the models
                const gpt4 = result.data.find((m: ModelOption) => m.id === 'model-1');
                expect(gpt4?.displayName).toBe('copilot: GPT-4');
            }
        });

        it('should sort models by vendor then name (Task 5.6)', async () => {
            mockSelectChatModels.mockResolvedValue(mockLanguageModelChat);

            const service = getModelService();
            const result = await service.getAvailableModels();

            expect(result.success).toBe(true);
            if (result.success) {
                const models = result.data;
                // anthropic should come before copilot
                expect(models[0].vendor).toBe('anthropic');
                // copilot models should be in order
                expect(models[1].vendor).toBe('copilot');
                expect(models[2].vendor).toBe('copilot');
            }
        });

        it('should include all required ModelOption fields', async () => {
            mockSelectChatModels.mockResolvedValue(mockLanguageModelChat);

            const service = getModelService();
            const result = await service.getAvailableModels();

            expect(result.success).toBe(true);
            if (result.success) {
                const model = result.data[0];
                expect(model).toHaveProperty('id');
                expect(model).toHaveProperty('displayName');
                expect(model).toHaveProperty('vendor');
                expect(model).toHaveProperty('family');
            }
        });
    });

    describe('Fallback when API unavailable (Task 4, Task 7, AC #2)', () => {
        it('should return default when API returns empty array (Task 12.5)', async () => {
            mockSelectChatModels.mockResolvedValue([]);

            const service = getModelService();
            const result = await service.getAvailableModels();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].id).toBe('default');
                expect(result.data[0].displayName).toBe('Default');
            }
        });

        it('should log info message when using fallback', async () => {
            mockSelectChatModels.mockResolvedValue([]);

            const service = getModelService();
            await service.getAvailableModels();

            expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('No language models'));
        });

        it('should return default on API error', async () => {
            mockSelectChatModels.mockRejectedValue(new Error('API Error'));

            const service = getModelService();
            const result = await service.getAvailableModels();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].id).toBe('default');
            }
            expect(mockHandleError).toHaveBeenCalled();
        });
    });

    describe('Model caching (Task 5.7, Task 3.3)', () => {
        it('should cache models after fetch', async () => {
            mockSelectChatModels.mockResolvedValue(mockLanguageModelChat);

            const service = getModelService();
            await service.getAvailableModels();

            const cached = service.getCachedModels();
            expect(cached).toHaveLength(3);
        });

        it('should return default from cache if empty', () => {
            const service = getModelService();
            const cached = service.getCachedModels();

            expect(cached).toHaveLength(1);
            expect(cached[0].id).toBe('default');
        });
    });

    describe('Model change watching (Task 6, AC #3)', () => {
        it('should subscribe to vscode.lm.onDidChangeChatModels (Task 12.6)', () => {
            const vscodeMock = vscode as any;

            const service = getModelService();
            service.watchModelChanges();

            expect(vscodeMock.__mocks.onDidChangeChatModels).toHaveBeenCalled();
        });

        it('should fire onDidChangeModels when models change (Task 12.7)', async () => {
            mockSelectChatModels.mockResolvedValue(mockLanguageModelChat);

            const service = getModelService();
            const callback = vi.fn();

            // Subscribe to model changes
            service.onDidChangeModels(callback);

            // Start watching
            service.watchModelChanges();

            // Simulate model change event
            expect(modelChangeListeners.length).toBe(1);
            await modelChangeListeners[0]();

            // Callback should have been called with models
            expect(callback).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ id: 'model-1' }),
                    expect.objectContaining({ id: 'model-2' }),
                ])
            );
        });

        it('should return disposable for cleanup', () => {
            const service = getModelService();
            const disposable = service.watchModelChanges();

            expect(disposable).toHaveProperty('dispose');
            expect(typeof disposable.dispose).toBe('function');
        });
    });

    describe('Default models (Task 7)', () => {
        it('should have default model with correct structure', async () => {
            mockSelectChatModels.mockResolvedValue([]);

            const service = getModelService();
            const result = await service.getAvailableModels();

            expect(result.success).toBe(true);
            if (result.success) {
                const defaultModel = result.data[0];
                expect(defaultModel).toEqual({
                    id: 'default',
                    displayName: 'Default',
                    vendor: 'auto',
                    family: 'auto',
                });
            }
        });
    });
});
