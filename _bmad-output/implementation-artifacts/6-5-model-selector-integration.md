# Story 6.5: Model Selector Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to select which AI model to use for the agent from a dropdown populated with available models**,
So that **I can choose Claude, GPT-4, or other available models based on my needs**.

## Acceptance Criteria

1. **Given** Agent Launcher is rendered in the sidebar
   **When** model dropdown is populated
   **Then** it shows available AI models from VS Code Language Model API (FR20)
   **And** each model option displays a human-readable name
   **And** models are grouped or prefixed by vendor (e.g., "Copilot: GPT-4")

2. **Given** VS Code Language Model API is NOT available (VS Code < 1.90 or Copilot not installed)
   **When** model dropdown renders
   **Then** it shows graceful fallback options: "Default" only
   **And** logs informational message via ErrorService (not error notification)
   **And** user can still launch agents with default model

3. **Given** available models change at runtime (Copilot installed/uninstalled, new models added)
   **When** `vscode.lm.onDidChangeChatModels` event fires
   **Then** ModelService refreshes available models
   **And** sends `modelsUpdated` message to WebView
   **And** dropdown updates without full page refresh

4. **Given** user selects a model from the dropdown
   **When** user clicks "Lancia in Chat" button
   **Then** selected model ID is passed to CopilotService.launchAgent() as `model` parameter
   **And** model is included in chat launch context

5. **Given** ModelService.getAvailableModels() is called
   **When** models are fetched successfully
   **Then** response includes for each model: id, displayName, vendor, family
   **And** operation completes in <100ms (NFR-P4)

6. **Given** model dropdown is rendered
   **When** using keyboard navigation
   **Then** all standard select behaviors work (arrow keys, Enter, Tab)
   **And** focus indicator is visible (NFR-A4)

## Tasks / Subtasks

- [x] Task 1: Define Model types in shared types (AC: #1, #5)
  - [x] 1.1: Add `ModelOption` interface to `src/shared/models.ts`
  - [x] 1.2: Define fields: id (string), displayName (string), vendor (string), family (string)
  - [x] 1.3: Add `ModelsLoadedPayload` interface with `models: ModelOption[]` field
  - [x] 1.4: Export types from `src/shared/index.ts`

- [x] Task 2: Extend PostMessage protocol (AC: #1, #3)
  - [x] 2.1: Add `modelsLoaded` message type to `ExtensionMessage` union in `src/shared/messages.ts`
  - [x] 2.2: Add `ModelsLoadedPayload` type to messages import
  - [x] 2.3: Add `requestModels` to `WebViewMessage` union (to request refresh from WebView)

- [x] Task 3: Create ModelService class (AC: #1, #2, #5)
  - [x] 3.1: Create `src/services/ModelService.ts`
  - [x] 3.2: Implement singleton pattern matching AgentParserService
  - [x] 3.3: Add `_modelsCache: ModelOption[]` for caching
  - [x] 3.4: Add `_onDidChangeModels: vscode.EventEmitter<ModelOption[]>` for change events
  - [x] 3.5: Expose `onDidChangeModels` event for providers to subscribe

- [x] Task 4: Implement API availability detection (AC: #2)
  - [x] 4.1: Implement `isLanguageModelApiAvailable(): boolean` private method
  - [x] 4.2: Check `typeof vscode.lm !== 'undefined' && typeof vscode.lm.selectChatModels === 'function'`
  - [x] 4.3: Cache availability check result (API won't appear mid-session)

- [x] Task 5: Implement getAvailableModels method (AC: #1, #5)
  - [x] 5.1: Implement `async getAvailableModels(): Promise<ServiceResult<ModelOption[]>>`
  - [x] 5.2: If API not available, return success with empty array + log info
  - [x] 5.3: Call `vscode.lm.selectChatModels()` without filter to get all models
  - [x] 5.4: Map `LanguageModelChat` to `ModelOption` interface
  - [x] 5.5: Format displayName as `${vendor}: ${name}` for clarity
  - [x] 5.6: Sort models by vendor, then by name
  - [x] 5.7: Update `_modelsCache` with results

- [x] Task 6: Implement model change watching (AC: #3)
  - [x] 6.1: Implement `watchModelChanges(): vscode.Disposable` method
  - [x] 6.2: Subscribe to `vscode.lm.onDidChangeChatModels` if available
  - [x] 6.3: On change event, call `getAvailableModels()` and fire `_onDidChangeModels`
  - [x] 6.4: Return no-op Disposable if API not available
  - [x] 6.5: Track watcher Disposable for cleanup in deactivate()

- [x] Task 7: Implement fallback model list (AC: #2)
  - [x] 7.1: Create `getDefaultModels(): ModelOption[]` private method
  - [x] 7.2: Return single option: `{ id: 'default', displayName: 'Default', vendor: 'auto', family: 'auto' }`
  - [x] 7.3: Use this when API returns empty array or is unavailable

- [x] Task 8: Export ModelService (AC: #1)
  - [x] 8.1: Add `export { ModelService, getModelService }` to `src/services/index.ts`
  - [x] 8.2: Add JSDoc comments for exported functions

- [x] Task 9: Integrate ModelService with SidebarProvider (AC: #1, #3)
  - [x] 9.1: Import `getModelService` in SidebarProvider
  - [x] 9.2: In `_setupWebview()`, get models and send `modelsLoaded` message
  - [x] 9.3: Subscribe to `modelService.onDidChangeModels` event
  - [x] 9.4: On model change, send `modelsLoaded` message to WebView
  - [x] 9.5: Add watcher Disposable to `_disposables`

- [x] Task 10: Update AgentLauncher.svelte for dynamic models (AC: #1)
  - [x] 10.1: Add `models: ModelOption[]` prop to AgentLauncher component
  - [x] 10.2: Replace hardcoded model list with `models` prop
  - [x] 10.3: Render each model with displayName as option text, id as value
  - [x] 10.4: Show "No models available" if array empty and default not present

- [x] Task 11: Handle modelsLoaded message in App.svelte (AC: #1, #3)
  - [x] 11.1: Add `models` state variable: `let models = $state<ModelOption[]>([{ id: 'default', displayName: 'Default', vendor: 'auto', family: 'auto' }])`
  - [x] 11.2: Handle `modelsLoaded` message type in handleMessage switch
  - [x] 11.3: Update models state with received payload
  - [x] 11.4: Pass models to AgentLauncher component

- [x] Task 12: Add unit tests for ModelService (AC: #1-6)
  - [x] 12.1: Create `tests/unit/services/ModelService.test.ts`
  - [x] 12.2: Mock `vscode.lm.selectChatModels()` to return test models
  - [x] 12.3: Test getAvailableModels returns formatted ModelOption[]
  - [x] 12.4: Test fallback when API unavailable (vscode.lm undefined)
  - [x] 12.5: Test empty array from API uses default fallback
  - [x] 12.6: Mock `vscode.lm.onDidChangeChatModels` for watch tests
  - [x] 12.7: Test event emitter fires when models change

- [x] Task 13: Add integration test for model in launch payload (AC: #4)
  - [x] 13.1: Verify launchAgent PostMessage includes selected model ID
  - [x] 13.2: Verify CopilotService receives model parameter

## Dev Notes

### Architecture References

From [architecture.md](../_bmad-output/planning-artifacts/architecture.md):
- **Pattern:** Centralized Services with singleton + ErrorService dependency
- **Location:** `src/services/ModelService.ts`
- **Export:** via `src/services/index.ts` barrel file

### VS Code Language Model API (vscode.lm)

Available in VS Code 1.90+. The API provides:

```typescript
// Get all available chat models
const models = await vscode.lm.selectChatModels();

// Filter by vendor
const copilotModels = await vscode.lm.selectChatModels({ vendor: 'copilot' });

// Listen for model changes
const disposable = vscode.lm.onDidChangeChatModels(() => {
    // Refresh models
});
```

**LanguageModelChat object properties:**
- `id`: Opaque unique identifier
- `name`: Human-readable name
- `vendor`: e.g., "copilot"
- `family`: e.g., "gpt-3.5-turbo", "gpt4"
- `version`: Model version string
- `maxInputTokens`: Max tokens for input

### ModelService Implementation Pattern

```typescript
// src/services/ModelService.ts

import * as vscode from 'vscode';
import { ServiceResult, BmadError, ErrorCodes } from '../shared/types';
import { ModelOption } from '../shared/models';
import { getErrorService } from './ErrorService';

/**
 * ModelService - AI Model Discovery and Management
 * Story 6.5: Model Selector Integration
 *
 * FR20: Populate model dropdown with available VS Code models
 * NFR-P4: Model discovery < 100ms
 */
export class ModelService {
    private static instance: ModelService | null = null;
    
    /** Cached available models */
    private _modelsCache: ModelOption[] = [];
    
    /** Event emitter for model changes */
    private _onDidChangeModels = new vscode.EventEmitter<ModelOption[]>();
    
    /** Public event for subscribers */
    public readonly onDidChangeModels = this._onDidChangeModels.event;
    
    /** Watcher disposable for cleanup */
    private _watcherDisposable: vscode.Disposable | null = null;
    
    /** API availability (cached after first check) */
    private _apiAvailable: boolean | null = null;

    private constructor() {}

    public static getInstance(): ModelService {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }

    public static resetInstance(): void {
        ModelService.instance?._dispose();
        ModelService.instance = null;
    }

    /**
     * Check if VS Code Language Model API is available
     * API exists in VS Code 1.90+
     */
    private isLanguageModelApiAvailable(): boolean {
        if (this._apiAvailable !== null) {
            return this._apiAvailable;
        }
        
        this._apiAvailable = 
            typeof vscode.lm !== 'undefined' && 
            typeof vscode.lm.selectChatModels === 'function';
        
        return this._apiAvailable;
    }

    /**
     * Get available AI models for selection
     * AC #1, #2, #5: Returns models from API or fallback
     */
    public async getAvailableModels(): Promise<ServiceResult<ModelOption[]>> {
        const errorService = getErrorService();
        
        // Check API availability
        if (!this.isLanguageModelApiAvailable()) {
            errorService.info('Language Model API not available, using default model');
            const defaults = this.getDefaultModels();
            this._modelsCache = defaults;
            return { success: true, data: defaults };
        }
        
        try {
            const models = await vscode.lm.selectChatModels();
            
            // Empty array means no models available (Copilot not installed, etc.)
            if (models.length === 0) {
                errorService.info('No language models available from API');
                const defaults = this.getDefaultModels();
                this._modelsCache = defaults;
                return { success: true, data: defaults };
            }
            
            // Map to ModelOption
            const modelOptions: ModelOption[] = models.map(model => ({
                id: model.id,
                displayName: `${model.vendor}: ${model.name}`,
                vendor: model.vendor,
                family: model.family,
            }));
            
            // Sort by vendor, then name
            modelOptions.sort((a, b) => {
                const vendorCmp = a.vendor.localeCompare(b.vendor);
                if (vendorCmp !== 0) return vendorCmp;
                return a.displayName.localeCompare(b.displayName);
            });
            
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

    /**
     * Watch for model changes
     * AC #3: Subscribe to API changes and emit events
     */
    public watchModelChanges(): vscode.Disposable {
        if (!this.isLanguageModelApiAvailable() || !vscode.lm.onDidChangeChatModels) {
            return { dispose: () => {} };
        }
        
        this._watcherDisposable = vscode.lm.onDidChangeChatModels(async () => {
            const result = await this.getAvailableModels();
            if (result.success) {
                this._onDidChangeModels.fire(result.data);
            }
        });
        
        return this._watcherDisposable;
    }

    /**
     * Get fallback model list when API unavailable
     * AC #2: Graceful fallback with "Default" option
     */
    private getDefaultModels(): ModelOption[] {
        return [{
            id: 'default',
            displayName: 'Default',
            vendor: 'auto',
            family: 'auto',
        }];
    }

    /**
     * Get cached models (sync access)
     */
    public getCachedModels(): ModelOption[] {
        return this._modelsCache.length > 0 
            ? this._modelsCache 
            : this.getDefaultModels();
    }

    private _dispose(): void {
        this._watcherDisposable?.dispose();
        this._onDidChangeModels.dispose();
    }
}

export function getModelService(): ModelService {
    return ModelService.getInstance();
}
```

### ModelOption Interface

Add to `src/shared/models.ts`:

```typescript
/**
 * AI Model option for Model Selector dropdown
 * Story 6.5: Model Selector Integration
 * FR20: Available models from VS Code API
 */
export interface ModelOption {
    /** Unique model identifier from VS Code API */
    id: string;
    /** Human-readable display name (e.g., "copilot: GPT-4") */
    displayName: string;
    /** Model vendor (e.g., "copilot") */
    vendor: string;
    /** Model family (e.g., "gpt4", "gpt-3.5-turbo") */
    family: string;
}
```

### ModelsLoaded Message

Add to `src/shared/messages.ts`:

```typescript
import type { ModelOption } from './models';

export interface ModelsLoadedPayload {
    models: ModelOption[];
}

export type ExtensionMessage =
    | { type: 'configLoaded'; payload: ConfigPayload }
    | { type: 'projectStateChanged'; payload: ProjectStatePayload }
    | { type: 'dataLoaded'; payload: DataLoadedPayload }
    | { type: 'filesLoaded'; payload: FilesLoadedPayload }
    | { type: 'modelsLoaded'; payload: ModelsLoadedPayload }  // Add this
    | { type: 'error'; payload: ErrorPayload };
```

### SidebarProvider Integration

In [SidebarProvider.ts](../src/providers/SidebarProvider.ts), add to `_setupWebview()`:

```typescript
// After sending projectState and files...
const modelService = getModelService();
const modelResult = await modelService.getAvailableModels();
if (modelResult.success) {
    this._webviewView?.webview.postMessage({
        type: 'modelsLoaded',
        payload: { models: modelResult.data }
    });
}

// Subscribe to model changes
const modelWatcher = modelService.onDidChangeModels((models) => {
    this._webviewView?.webview.postMessage({
        type: 'modelsLoaded',
        payload: { models }
    });
});
this._disposables.push(modelWatcher);

// Start watching
const watcherDisposable = modelService.watchModelChanges();
this._disposables.push(watcherDisposable);
```

### AgentLauncher.svelte Updates

Update component props:

```svelte
<script lang="ts">
  import type { Agent, AgentCommand, ModelOption, VsCodeApi } from '../lib/types';

  interface Props {
    agents: Agent[];
    models: ModelOption[];  // Add this prop
    vscode: VsCodeApi;
  }

  let { agents, models, vscode }: Props = $props();
  
  // ...existing state...
  let selectedModel = $state(models[0]?.id ?? 'default');
```

Update model select element:

```svelte
<label for="model-select">Model</label>
<select 
  id="model-select" 
  class="vscode-select"
  bind:value={selectedModel}
>
  {#each models as model}
    <option value={model.id}>{model.displayName}</option>
  {/each}
</select>
```

### WebView Types

Add to `webviews/sidebar/src/lib/types.ts`:

```typescript
export interface ModelOption {
    id: string;
    displayName: string;
    vendor: string;
    family: string;
}
```

### Project Structure Notes

- **New service file:** `src/services/ModelService.ts`
- **Export update:** `src/services/index.ts`
- **Type definitions:** `src/shared/models.ts`, `src/shared/messages.ts`
- **Test file:** `tests/unit/services/ModelService.test.ts`
- **WebView update:** `webviews/sidebar/src/components/AgentLauncher.svelte`
- **WebView types:** `webviews/sidebar/src/lib/types.ts`

### Dependencies from Previous Stories

This story depends on:
- **Story 6.3:** AgentLauncher.svelte component exists with model dropdown placeholder
- **Story 6.4:** CopilotService.launchAgent accepts `model` parameter in AgentLaunchRequest

### Test Fixtures

```typescript
// tests/unit/services/ModelService.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModelService } from '../../../src/services/ModelService';

// Mock vscode module
vi.mock('vscode', () => ({
    lm: {
        selectChatModels: vi.fn(),
        onDidChangeChatModels: vi.fn(() => ({ dispose: vi.fn() })),
    },
    EventEmitter: vi.fn(() => ({
        event: vi.fn(),
        fire: vi.fn(),
        dispose: vi.fn(),
    })),
}));

const mockModels = [
    { id: 'model-1', name: 'GPT-4', vendor: 'copilot', family: 'gpt4', version: '1.0', maxInputTokens: 8000 },
    { id: 'model-2', name: 'Claude', vendor: 'anthropic', family: 'claude-3', version: '1.0', maxInputTokens: 100000 },
];

describe('ModelService', () => {
    beforeEach(() => {
        ModelService.resetInstance();
    });

    it('should return models from API', async () => {
        const vscode = await import('vscode');
        vi.mocked(vscode.lm.selectChatModels).mockResolvedValue(mockModels as any);
        
        const service = ModelService.getInstance();
        const result = await service.getAvailableModels();
        
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toHaveLength(2);
            expect(result.data[0].displayName).toContain('copilot');
        }
    });

    it('should return default when API returns empty', async () => {
        const vscode = await import('vscode');
        vi.mocked(vscode.lm.selectChatModels).mockResolvedValue([]);
        
        const service = ModelService.getInstance();
        const result = await service.getAvailableModels();
        
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('default');
        }
    });
});
```

### References

- [Source: architecture.md#CoreDecisions] - Service patterns and graceful degradation
- [Source: epics.md#Story-6.5] - Original story requirements
- [Source: 6-4-copilotservice-chat-integration.md] - CopilotService AgentLaunchRequest interface
- [Source: 6-3-agent-launcher-ui-component.md] - AgentLauncher component structure
- [Source: VS Code API - Language Model](https://code.visualstudio.com/api/extension-guides/language-model) - Official API documentation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Fixed SidebarProvider test mocks to include EventEmitter, vscode.lm, and ModelService mock
- Fixed Svelte warning about capturing initial value of `models` prop - used $effect for reactive updates
- Updated AgentLauncher test to use CopilotService mock instead of checking info log

### Completion Notes List

- All 13 tasks completed with 565 tests passing
- ModelService implements singleton pattern with caching, event-driven model changes, and API availability detection
- Graceful fallback to "Default" model when VS Code Language Model API unavailable
- Dynamic model dropdown in AgentLauncher updates without full page refresh
- Full test coverage for ModelService including API mocking and event emitter tests

### File List

- src/shared/models.ts - Added ModelOption interface and isModelOption type guard
- src/shared/messages.ts - Added ModelsLoadedPayload, modelsLoaded message, requestModels message
- src/services/ModelService.ts - New ModelService with getAvailableModels, watchModelChanges
- src/services/index.ts - Export ModelService
- src/providers/SidebarProvider.ts - Integrated ModelService, _sendModels, _setupModelWatcher
- webviews/sidebar/src/lib/types.ts - Re-export ModelOption
- webviews/sidebar/src/components/AgentLauncher.svelte - Dynamic models prop, removed hardcoded options
- webviews/sidebar/src/App.svelte - Handle modelsLoaded message, pass models to AgentLauncher
- tests/unit/services/ModelService.test.ts - New test file with 16 tests
- tests/unit/providers/SidebarProvider.test.ts - Updated mocks for vscode.lm and ModelService

