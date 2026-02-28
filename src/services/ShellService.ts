/**
 * ShellService - Platform-specific shell detection
 * Story 2.1: Shell Detection Service
 */

import * as os from 'os';
import { getErrorService } from './ErrorService';

export type Platform = 'darwin' | 'linux' | 'win32' | 'unknown';

export interface IShellService {
    getDefaultShell(): string;
    getPlatform(): Platform;
}

export class ShellService implements IShellService {
    private static instance: ShellService | null = null;

    private constructor() {}

    /**
     * Get singleton instance of ShellService
     */
    public static getInstance(): ShellService {
        if (!ShellService.instance) {
            ShellService.instance = new ShellService();
        }
        return ShellService.instance;
    }

    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        ShellService.instance = null;
    }

    /**
     * Get the current platform
     */
    public getPlatform(): Platform {
        const platform = os.platform();
        switch (platform) {
            case 'darwin':
            case 'linux':
            case 'win32':
                return platform;
            default:
                return 'unknown';
        }
    }

    /**
     * Get the default shell for the current platform
     * AC #1: macOS/Linux returns /bin/bash or /bin/zsh
     * AC #2: Windows returns powershell.exe or cmd.exe
     * AC #3: Uses os.platform() for detection
     */
    public getDefaultShell(): string {
        const errorService = getErrorService();
        const platform = this.getPlatform();

        try {
            switch (platform) {
                case 'darwin':
                    return this.getMacOSShell();
                case 'linux':
                    return this.getLinuxShell();
                case 'win32':
                    return this.getWindowsShell();
                default:
                    errorService.warn(`Unknown platform: ${os.platform()}, falling back to /bin/sh`);
                    return '/bin/sh';
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            errorService.error(`Shell detection failed: ${message}`);
            return platform === 'win32' ? 'cmd.exe' : '/bin/sh';
        }
    }

    /**
     * Get shell for macOS
     * Task 2.1-2.4: Check SHELL env, fallback to /bin/zsh (default since Catalina)
     */
    private getMacOSShell(): string {
        // Check SHELL environment variable first
        const shellEnv = process.env.SHELL;
        if (shellEnv && this.isValidShellPath(shellEnv)) {
            return shellEnv;
        }
        // Fallback to /bin/zsh (default since macOS Catalina)
        return '/bin/zsh';
    }

    /**
     * Get shell for Linux
     * Task 2.1-2.4: Check SHELL env, fallback to /bin/bash
     */
    private getLinuxShell(): string {
        // Check SHELL environment variable first
        const shellEnv = process.env.SHELL;
        if (shellEnv && this.isValidShellPath(shellEnv)) {
            return shellEnv;
        }
        // Fallback to /bin/bash
        return '/bin/bash';
    }

    /**
     * Get shell for Windows
     * Task 3.1-3.4: Check for PowerShell, fallback to cmd.exe
     */
    private getWindowsShell(): string {
        // Check for PowerShell availability
        const psPath = this.getPowerShellPath();
        if (psPath) {
            return psPath;
        }

        // Fallback to cmd.exe using ComSpec
        const comSpec = process.env.ComSpec;
        if (comSpec) {
            return comSpec;
        }

        // Ultimate fallback
        return 'cmd.exe';
    }

    /**
     * Get PowerShell path if available
     */
    private getPowerShellPath(): string | null {
        // PowerShell Core (cross-platform)
        const pwshPath = process.env.PWSH_PATH;
        if (pwshPath) {
            return pwshPath;
        }

        // Windows PowerShell
        const systemRoot = process.env.SystemRoot ?? 'C:\\Windows';
        return `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
    }

    /**
     * Validate shell path format
     */
    private isValidShellPath(shellPath: string): boolean {
        // Basic validation - path should exist and be absolute
        if (!shellPath || shellPath.length === 0) {
            return false;
        }
        // Unix paths start with /
        if (shellPath.startsWith('/')) {
            return true;
        }
        // Windows paths contain :\ or start with \
        if (shellPath.includes(':\\') || shellPath.startsWith('\\')) {
            return true;
        }
        return false;
    }
}

/**
 * Get singleton instance of ShellService
 */
export function getShellService(): ShellService {
    return ShellService.getInstance();
}
