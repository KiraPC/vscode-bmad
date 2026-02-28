// Global type declaration for VS Code WebView API
import type { VsCodeApi } from './lib/types';

declare global {
  function acquireVsCodeApi(): VsCodeApi;
}

export {};
