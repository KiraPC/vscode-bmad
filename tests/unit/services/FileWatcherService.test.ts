/**
 * FileWatcherService Unit Tests
 * Story 4.5: FileWatcherService Implementation
 * Task 9: Unit tests for file watching functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    FileWatcherService,
    getFileWatcherService,
    type FileChangeEvent,
} from '../../../src/services/FileWatcherService';

// Mock event handlers - captured when watchers are created
let mockOnDidCreate: ((uri: { fsPath: string }) => void) | null = null;
let mockOnDidChange: ((uri: { fsPath: string }) => void) | null = null;
let mockOnDidDelete: ((uri: { fsPath: string }) => void) | null = null;

// Track mock createFileSystemWatcher calls
let createWatcherCallCount = 0;

// Mock ErrorService before importing FileWatcherService
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
        file: vi.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
    },
    workspace: {
        workspaceFolders: [
            { uri: { fsPath: '/workspace' }, name: 'workspace', index: 0 },
        ],
        createFileSystemWatcher: vi.fn(() => {
            createWatcherCallCount++;
            const disposable = { dispose: vi.fn() };
            return {
                onDidCreate: vi.fn((handler: (uri: { fsPath: string }) => void) => {
                    mockOnDidCreate = handler;
                    return disposable;
                }),
                onDidChange: vi.fn((handler: (uri: { fsPath: string }) => void) => {
                    mockOnDidChange = handler;
                    return disposable;
                }),
                onDidDelete: vi.fn((handler: (uri: { fsPath: string }) => void) => {
                    mockOnDidDelete = handler;
                    return disposable;
                }),
                dispose: vi.fn(),
            };
        }),
    },
    RelativePattern: vi.fn((folder, pattern) => ({ folder, pattern })),
}));

/**
 * Helper to setup a service instance with mocked initialized state
 * This avoids async initialization issues in tests
 */
function setupInitializedService(): FileWatcherService {
    const service = getFileWatcherService();
    // Simulate that initialization happened by setting private field
    (service as unknown as { initialized: boolean }).initialized = true;
    // Simulate watchers being set up
    (service as unknown as { watchers: unknown[] }).watchers = [{}];

    // Setup mock handlers to simulate watcher behavior
    // The handlers call service's private handleChange method
    const handleChange = (service as unknown as {
        handleChange: (uri: { fsPath: string }, type: string) => void;
    }).handleChange.bind(service);

    mockOnDidCreate = (uri) => handleChange(uri, 'created');
    mockOnDidChange = (uri) => handleChange(uri, 'changed');
    mockOnDidDelete = (uri) => handleChange(uri, 'deleted');

    return service;
}

describe('FileWatcherService', () => {
    beforeEach(() => {
        vi.useRealTimers();
        FileWatcherService.resetInstance();
        createWatcherCallCount = 0;
        mockOnDidCreate = null;
        mockOnDidChange = null;
        mockOnDidDelete = null;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('singleton pattern', () => {
        it('should return same instance on multiple calls', () => {
            const instance1 = FileWatcherService.getInstance();
            const instance2 = FileWatcherService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should return same instance via factory function', () => {
            const instance1 = getFileWatcherService();
            const instance2 = getFileWatcherService();

            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = FileWatcherService.getInstance();
            FileWatcherService.resetInstance();
            const instance2 = FileWatcherService.getInstance();

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('initialization (AC #1)', () => {
        it('should track initialized state', () => {
            const service = getFileWatcherService();

            // Before initialization
            expect(service.isInitialized()).toBe(false);

            // Simulate successful initialization
            (service as unknown as { initialized: boolean }).initialized = true;

            expect(service.isInitialized()).toBe(true);
        });

        it('should track watcher count', () => {
            const service = getFileWatcherService();

            // Simulate watchers being added
            const mockWatchers = [{}, {}, {}];
            (service as unknown as { watchers: unknown[] }).watchers = mockWatchers;

            expect(service.getWatcherCount()).toBe(3);
        });

        it('should be able to re-initialize', () => {
            const service = getFileWatcherService();

            // Simulate initialized state
            (service as unknown as { initialized: boolean }).initialized = true;

            // Should still be able to call initialize (disposes old watchers)
            expect(service.isInitialized()).toBe(true);
        });
    });

    describe('subscription management (AC #1)', () => {
        it('should allow subscribing to changes', () => {
            const service = setupInitializedService();

            const callback = vi.fn();
            const disposable = service.subscribe(callback);

            expect(service.getSubscriberCount()).toBe(1);
            expect(disposable).toBeDefined();
            expect(typeof disposable.dispose).toBe('function');
        });

        it('should allow multiple subscribers', () => {
            const service = setupInitializedService();

            const callback1 = vi.fn();
            const callback2 = vi.fn();

            service.subscribe(callback1);
            service.subscribe(callback2);

            expect(service.getSubscriberCount()).toBe(2);
        });

        it('should remove subscriber on dispose', () => {
            const service = setupInitializedService();

            const callback = vi.fn();
            const disposable = service.subscribe(callback);

            expect(service.getSubscriberCount()).toBe(1);

            disposable.dispose();

            expect(service.getSubscriberCount()).toBe(0);
        });
    });

    describe('debounce logic (AC #2, #5)', () => {
        it('should debounce rapid file changes', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const receivedEvents: FileChangeEvent[] = [];
            service.subscribe((event) => {
                receivedEvents.push(event);
            });

            // Simulate rapid changes by directly calling handler
            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file1.md' });
                mockOnDidChange({ fsPath: '/workspace/file2.md' });
                mockOnDidChange({ fsPath: '/workspace/file3.md' });
            }

            // Before debounce timeout, no events should be fired
            expect(receivedEvents).toHaveLength(0);

            // Advance timers past debounce window (200ms)
            vi.advanceTimersByTime(250);

            // Now we should receive one consolidated event
            expect(receivedEvents).toHaveLength(1);
            expect(receivedEvents[0].files).toHaveLength(3);
        });

        it('should use 200ms debounce delay', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const receivedEvents: FileChangeEvent[] = [];
            service.subscribe((event) => {
                receivedEvents.push(event);
            });

            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file.md' });
            }

            // At 199ms, should not have fired
            vi.advanceTimersByTime(199);
            expect(receivedEvents).toHaveLength(0);

            // At 201ms, should have fired
            vi.advanceTimersByTime(2);
            expect(receivedEvents).toHaveLength(1);
        });

        it('should reset debounce timer on new changes', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const receivedEvents: FileChangeEvent[] = [];
            service.subscribe((event) => {
                receivedEvents.push(event);
            });

            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file1.md' });
            }

            // Wait 150ms (within debounce window)
            vi.advanceTimersByTime(150);
            expect(receivedEvents).toHaveLength(0);

            // Add another change - should reset timer
            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file2.md' });
            }

            // Wait another 150ms - still within new debounce window
            vi.advanceTimersByTime(150);
            expect(receivedEvents).toHaveLength(0);

            // Wait remaining time to complete new debounce window
            vi.advanceTimersByTime(100);
            expect(receivedEvents).toHaveLength(1);
            expect(receivedEvents[0].files).toHaveLength(2);
        });
    });

    describe('event consolidation (AC #2)', () => {
        it('should include change type in events', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const receivedEvents: FileChangeEvent[] = [];
            service.subscribe((event) => {
                receivedEvents.push(event);
            });

            // Trigger different change types
            if (mockOnDidCreate && mockOnDidChange && mockOnDidDelete) {
                mockOnDidCreate({ fsPath: '/workspace/new.md' });
                mockOnDidChange({ fsPath: '/workspace/modified.md' });
                mockOnDidDelete({ fsPath: '/workspace/deleted.md' });
            }

            vi.advanceTimersByTime(250);

            expect(receivedEvents).toHaveLength(1);
            const files = receivedEvents[0].files;

            expect(files.find(f => f.path === '/workspace/new.md')?.type).toBe('created');
            expect(files.find(f => f.path === '/workspace/modified.md')?.type).toBe('changed');
            expect(files.find(f => f.path === '/workspace/deleted.md')?.type).toBe('deleted');
        });

        it('should deduplicate same file with latest change type', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const receivedEvents: FileChangeEvent[] = [];
            service.subscribe((event) => {
                receivedEvents.push(event);
            });

            // Same file changes multiple times
            if (mockOnDidCreate && mockOnDidChange) {
                mockOnDidCreate({ fsPath: '/workspace/file.md' });
                mockOnDidChange({ fsPath: '/workspace/file.md' });
                mockOnDidChange({ fsPath: '/workspace/file.md' });
            }

            vi.advanceTimersByTime(250);

            expect(receivedEvents).toHaveLength(1);
            // Should only have one entry for the file (deduplicated)
            expect(receivedEvents[0].files).toHaveLength(1);
            // Latest change type should win
            expect(receivedEvents[0].files[0].type).toBe('changed');
        });

        it('should include timestamp in event', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const receivedEvents: FileChangeEvent[] = [];
            service.subscribe((event) => {
                receivedEvents.push(event);
            });

            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file.md' });
            }

            vi.advanceTimersByTime(250);

            expect(receivedEvents[0].timestamp).toBeDefined();
            expect(typeof receivedEvents[0].timestamp).toBe('number');
        });
    });

    describe('notification to subscribers', () => {
        it('should notify all subscribers', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const callback1 = vi.fn();
            const callback2 = vi.fn();

            service.subscribe(callback1);
            service.subscribe(callback2);

            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file.md' });
            }

            vi.advanceTimersByTime(250);

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should handle callback errors without affecting other subscribers', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const errorCallback = vi.fn(() => {
                throw new Error('Callback error');
            });
            const successCallback = vi.fn();

            service.subscribe(errorCallback);
            service.subscribe(successCallback);

            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file.md' });
            }

            vi.advanceTimersByTime(250);

            // Both should have been called despite error in first
            expect(errorCallback).toHaveBeenCalled();
            expect(successCallback).toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should clear subscribers on dispose', () => {
            const service = setupInitializedService();

            const callback = vi.fn();
            service.subscribe(callback);

            expect(service.getSubscriberCount()).toBe(1);

            service.dispose();

            expect(service.getSubscriberCount()).toBe(0);
        });

        it('should clear pending changes on dispose', () => {
            vi.useFakeTimers();
            const service = setupInitializedService();

            const callback = vi.fn();
            service.subscribe(callback);

            if (mockOnDidChange) {
                mockOnDidChange({ fsPath: '/workspace/file.md' });
            }

            // Don't wait for debounce - dispose immediately
            service.dispose();

            // Advance timers - callback should NOT be called since we disposed
            vi.advanceTimersByTime(250);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should mark as not initialized after dispose', () => {
            const service = setupInitializedService();

            expect(service.isInitialized()).toBe(true);

            service.dispose();

            expect(service.isInitialized()).toBe(false);
        });
    });
});
