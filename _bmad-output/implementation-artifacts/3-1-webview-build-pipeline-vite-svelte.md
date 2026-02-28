# Story 3.1: WebView Build Pipeline (Vite + Svelte)

Status: review-ready

## Story

As a **developer**,
I want **a Vite + Svelte build pipeline for WebView components**,
So that **I can create reactive UI components for the sidebar and Kanban**.

## Acceptance Criteria

1. **Given** the extension project from Epic 1
   **When** I set up the WebView build configuration
   **Then** the project has:
   - `webviews/` folder with Svelte source files
   - `vite.config.ts` configured for WebView bundling
   - `@sveltejs/vite-plugin-svelte` configured
   - `@vscode/webview-ui-toolkit` available for VS Code styling
   - Build outputs to `dist/webviews/`

2. **Given** the build system is configured
   **When** running `npm run build:webviews`
   **Then** produces bundled JS/CSS for each WebView

3. **Given** the extension development host is running
   **When** a WebView loads
   **Then** Svelte components render correctly with VS Code theme support

## Tasks / Subtasks

- [x] Task 1: Install WebView dependencies (AC: #1)
  - [x] 1.1: Install `svelte`, `vite`, `@sveltejs/vite-plugin-svelte`
  - [x] 1.2: Install `@vscode/webview-ui-toolkit`
  - [x] 1.3: Install TypeScript types for Svelte `@tsconfig/svelte`

- [x] Task 2: Create WebView folder structure (AC: #1)
  - [x] 2.1: Create `webviews/sidebar/src/` directory
  - [x] 2.2: Create `webviews/kanban/src/` directory
  - [x] 2.3: Create shared types re-export in each `lib/types.ts`

- [x] Task 3: Configure Vite for sidebar WebView (AC: #1, #2)
  - [x] 3.1: Create `webviews/sidebar/vite.config.ts` with Svelte plugin
  - [x] 3.2: Create `webviews/sidebar/tsconfig.json` extending root
  - [x] 3.3: Create `webviews/sidebar/index.html` with CSP meta tag
  - [x] 3.4: Configure output to `dist/webviews/sidebar/`

- [x] Task 4: Configure Vite for kanban WebView (AC: #1, #2)
  - [x] 4.1: Create `webviews/kanban/vite.config.ts` similar to sidebar
  - [x] 4.2: Create `webviews/kanban/tsconfig.json`
  - [x] 4.3: Create `webviews/kanban/index.html` with CSP meta tag
  - [x] 4.4: Configure output to `dist/webviews/kanban/`

- [x] Task 5: Create base Svelte components (AC: #3)
  - [x] 5.1: Create `webviews/sidebar/src/App.svelte` with basic layout
  - [x] 5.2: Create `webviews/sidebar/src/main.ts` mounting entry point
  - [x] 5.3: Create `webviews/kanban/src/App.svelte` with basic layout
  - [x] 5.4: Create `webviews/kanban/src/main.ts` mounting entry point

- [x] Task 6: Add npm scripts for WebView build (AC: #2)
  - [x] 6.1: Add `build:webviews` script to package.json
  - [x] 6.2: Add `dev:webviews` script for watch mode
  - [x] 6.3: Update main `build` script to include WebView build
  - [x] 6.4: Update main `watch` script for parallel dev

- [x] Task 7: Verify build and integration (AC: #2, #3)
  - [x] 7.1: Run `npm run build:webviews` and verify output
  - [x] 7.2: Test loading WebView in Extension Development Host
  - [x] 7.3: Verify VS Code theme colors apply correctly

## Dev Notes

### Project Structure After This Story

```
vscode-bmad/
├── webviews/
│   ├── sidebar/
│   │   ├── src/
│   │   │   ├── App.svelte          # Root Svelte component
│   │   │   ├── main.ts             # Mount entry point
│   │   │   ├── components/         # (empty, for future stories)
│   │   │   ├── stores/             # (empty, for future stories)
│   │   │   └── lib/
│   │   │       └── types.ts        # Re-export shared types
│   │   ├── index.html              # WebView HTML with CSP
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── kanban/
│       ├── src/
│       │   ├── App.svelte
│       │   ├── main.ts
│       │   ├── components/
│       │   ├── stores/
│       │   └── lib/
│       │       └── types.ts
│       ├── index.html
│       ├── vite.config.ts
│       └── tsconfig.json
├── dist/
│   └── webviews/
│       ├── sidebar/
│       │   ├── index.js
│       │   └── index.css
│       └── kanban/
│           ├── index.js
│           └── index.css
└── package.json
```

### Vite Configuration Template

```typescript
// webviews/sidebar/vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: '../../dist/webviews/sidebar',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.css',
      },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../src/shared'),
    },
  },
});
```

### WebView HTML Template with CSP (NFR-S1)

```html
<!-- webviews/sidebar/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'none'; 
                 style-src ${webview.cspSource} 'unsafe-inline'; 
                 script-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>BMAD Sidebar</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>
```

**Note:** The `${webview.cspSource}`, `${styleUri}`, and `${scriptUri}` placeholders will be replaced by the Provider at runtime. The actual index.html for Vite dev should use standard paths, and the Provider will generate the runtime HTML.

### Svelte Entry Point Pattern

```typescript
// webviews/sidebar/src/main.ts
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

### Base App.svelte Template

```svelte
<!-- webviews/sidebar/src/App.svelte -->
<script lang="ts">
  // VS Code WebView API will be passed via acquireVsCodeApi()
  const vscode = acquireVsCodeApi();
</script>

<main>
  <h1>BMAD Method</h1>
  <p>Sidebar loaded successfully</p>
</main>

<style>
  main {
    padding: 1rem;
  }
  
  h1 {
    color: var(--vscode-foreground);
    font-size: 1.2rem;
  }
  
  p {
    color: var(--vscode-descriptionForeground);
  }
</style>
```

### Package.json Scripts to Add

```json
{
  "scripts": {
    "build:webviews": "npm run build:sidebar && npm run build:kanban",
    "build:sidebar": "cd webviews/sidebar && vite build",
    "build:kanban": "cd webviews/kanban && vite build",
    "dev:webviews": "concurrently \"npm run dev:sidebar\" \"npm run dev:kanban\"",
    "dev:sidebar": "cd webviews/sidebar && vite build --watch",
    "dev:kanban": "cd webviews/kanban && vite build --watch",
    "build": "npm run compile && npm run build:webviews",
    "watch": "concurrently \"npm run watch:extension\" \"npm run dev:webviews\""
  }
}
```

### Dependencies to Install

```bash
# Production dependencies (none for WebView build itself)

# Dev dependencies
npm install -D svelte vite @sveltejs/vite-plugin-svelte
npm install -D @vscode/webview-ui-toolkit
npm install -D @tsconfig/svelte
npm install -D concurrently  # For parallel builds
```

### TypeScript Configuration for WebView

```json
// webviews/sidebar/tsconfig.json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": {
      "@shared/*": ["../../src/shared/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../../tsconfig.json" }]
}
```

### Theme Integration Notes

Per NFR-A1 (high contrast support), all colors must use VS Code CSS variables:
- `var(--vscode-foreground)` - Main text
- `var(--vscode-descriptionForeground)` - Secondary text
- `var(--vscode-button-background)` - Button backgrounds
- `var(--vscode-button-foreground)` - Button text
- `var(--vscode-input-background)` - Input fields
- `var(--vscode-focusBorder)` - Focus indicators (NFR-A2)

### Project Structure Notes

- WebViews are isolated and bundled separately from extension code
- Each WebView has its own Vite config for independent builds
- Shared types are imported via path alias `@shared/*`
- Output goes to `dist/webviews/` to be loaded by Providers

### References

- [Source: architecture.md#Starter Template Evaluation] - Vite + Svelte decision
- [Source: architecture.md#Project Structure] - WebView folder structure
- [Source: architecture.md#Pattern Categories] - Svelte component naming (kebab-case)
- [Source: architecture.md#Implementation Patterns] - Build commands

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Installed all dependencies: svelte, vite, @sveltejs/vite-plugin-svelte, @vscode/webview-ui-toolkit (deprecated but functional), @tsconfig/svelte, concurrently
- Created complete folder structure with sidebar and kanban webviews
- Both webviews compile successfully with Vite + Svelte
- Added svelte.config.js files for proper Svelte preprocessing
- All 43 existing unit tests continue to pass
- Build outputs to dist/webviews/{sidebar,kanban}/ with index.js, index.css, index.html
- Svelte components use VS Code CSS variables for theme support (--vscode-foreground, --vscode-descriptionForeground)
- Added npm scripts: build:webviews, dev:webviews, build:sidebar, build:kanban, dev:sidebar, dev:kanban
- Updated main build and watch scripts to include webviews

### File List

- package.json (modified - added dependencies and scripts)
- webviews/sidebar/vite.config.ts (created)
- webviews/sidebar/tsconfig.json (created)
- webviews/sidebar/index.html (created)
- webviews/sidebar/svelte.config.js (created)
- webviews/sidebar/src/App.svelte (created)
- webviews/sidebar/src/main.ts (created)
- webviews/sidebar/src/lib/types.ts (created)
- webviews/kanban/vite.config.ts (created)
- webviews/kanban/tsconfig.json (created)
- webviews/kanban/index.html (created)
- webviews/kanban/svelte.config.js (created)
- webviews/kanban/src/App.svelte (created)
- webviews/kanban/src/main.ts (created)
- webviews/kanban/src/lib/types.ts (created)
