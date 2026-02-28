import { mount } from 'svelte';
import App from './App.svelte';

// Expose vscode API on window for child components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).vscode = acquireVsCodeApi();

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
