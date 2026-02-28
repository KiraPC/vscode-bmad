/**
 * ShellService Unit Tests
 * Story 2.1: Shell Detection Service
 * Task 4.1-4.5: Unit tests for platform detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as os from 'os';
import { ShellService, getShellService, Platform } from '../../../src/services/ShellService';

// Mock os module
vi.mock('os', () => ({
    platform: vi.fn(),
}));
const mockOs = os as unknown as { platform: ReturnType<typeof vi.fn> };

// Mock ErrorService
vi.mock('../../../src/services/ErrorService', () => ({
    getErrorService: () => ({
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    }),
}));

describe('ShellService', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Reset singleton
        ShellService.resetInstance();
        // Save original env
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        // Restore original env
        process.env = originalEnv;
    });

    describe('getPlatform', () => {
        it('should return darwin for macOS', () => {
            mockOs.platform.mockReturnValue('darwin');
            const service = getShellService();
            expect(service.getPlatform()).toBe('darwin');
        });

        it('should return linux for Linux', () => {
            mockOs.platform.mockReturnValue('linux');
            const service = getShellService();
            expect(service.getPlatform()).toBe('linux');
        });

        it('should return win32 for Windows', () => {
            mockOs.platform.mockReturnValue('win32');
            const service = getShellService();
            expect(service.getPlatform()).toBe('win32');
        });

        it('should return unknown for unsupported platforms', () => {
            mockOs.platform.mockReturnValue('freebsd' as NodeJS.Platform);
            const service = getShellService();
            expect(service.getPlatform()).toBe('unknown');
        });
    });

    describe('getDefaultShell - macOS (Task 4.2)', () => {
        beforeEach(() => {
            mockOs.platform.mockReturnValue('darwin');
        });

        it('should return SHELL env if set', () => {
            process.env.SHELL = '/bin/bash';
            const service = getShellService();
            expect(service.getDefaultShell()).toBe('/bin/bash');
        });

        it('should return /bin/zsh as default on macOS', () => {
            delete process.env.SHELL;
            const service = getShellService();
            expect(service.getDefaultShell()).toBe('/bin/zsh');
        });

        it('should handle zsh SHELL variable', () => {
            process.env.SHELL = '/bin/zsh';
            const service = getShellService();
            expect(service.getDefaultShell()).toBe('/bin/zsh');
        });
    });

    describe('getDefaultShell - Linux (Task 4.3)', () => {
        beforeEach(() => {
            mockOs.platform.mockReturnValue('linux');
        });

        it('should return SHELL env if set', () => {
            process.env.SHELL = '/usr/bin/fish';
            const service = getShellService();
            expect(service.getDefaultShell()).toBe('/usr/bin/fish');
        });

        it('should return /bin/bash as default on Linux', () => {
            delete process.env.SHELL;
            const service = getShellService();
            expect(service.getDefaultShell()).toBe('/bin/bash');
        });
    });

    describe('getDefaultShell - Windows (Task 4.4)', () => {
        beforeEach(() => {
            mockOs.platform.mockReturnValue('win32');
        });

        it('should return PowerShell path', () => {
            process.env.SystemRoot = 'C:\\Windows';
            const service = getShellService();
            const shell = service.getDefaultShell();
            expect(shell).toContain('powershell');
        });

        it('should use ComSpec for cmd fallback when PWSH_PATH not set', () => {
            delete process.env.PWSH_PATH;
            process.env.SystemRoot = 'C:\\Windows';
            const service = getShellService();
            const shell = service.getDefaultShell();
            // Should return PowerShell path from SystemRoot
            expect(shell).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
        });

        it('should use PWSH_PATH if available', () => {
            process.env.PWSH_PATH = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';
            const service = getShellService();
            expect(service.getDefaultShell()).toBe('C:\\Program Files\\PowerShell\\7\\pwsh.exe');
        });
    });

    describe('singleton pattern', () => {
        it('should return same instance', () => {
            mockOs.platform.mockReturnValue('darwin');
            const service1 = getShellService();
            const service2 = getShellService();
            expect(service1).toBe(service2);
        });

        it('should create new instance after reset', () => {
            mockOs.platform.mockReturnValue('darwin');
            const service1 = getShellService();
            ShellService.resetInstance();
            const service2 = getShellService();
            expect(service1).not.toBe(service2);
        });
    });
});
