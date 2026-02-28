# Story 1.1: Extension Project Setup

Status: done

## Story

As a **developer**,
I want **a properly configured VS Code extension project with TypeScript, esbuild, and the correct folder structure**,
So that **I have the foundation to build all extension features**.

## Acceptance Criteria

1. **Given** an empty project directory
   **When** the initialization sequence is run (npm init, install dependencies)
   **Then** the project has:
   - `package.json` with extension manifest (name: "vscode-bmad", engines.vscode: "^1.85.0")
   - TypeScript 5.0+ with strict mode configured (`tsconfig.json`)
   - esbuild configured for extension bundling
   - Folder structure: `src/`, `src/providers/`, `src/services/`, `src/shared/`
   - VS Code debug configuration (`.vscode/launch.json`)
   - Extension entry point (`src/extension.ts`) with `activate()` and `deactivate()` functions

2. **Given** dependencies are installed
   **When** running `npm run compile`
   **Then** the extension builds successfully without errors

3. **Given** the extension is compiled
   **When** pressing F5 in VS Code
   **Then** Extension Development Host launches with the extension loaded

## Tasks / Subtasks

- [ ] Task 1: Initialize npm package and TypeScript (AC: #1)
  - [ ] 1.1: Run `npm init -y` to create package.json
  - [ ] 1.2: Install TypeScript and types: `npm install -D typescript @types/vscode @types/node`
  - [ ] 1.3: Create `tsconfig.json` with strict mode, ES2022 target
  - [ ] 1.4: Update `package.json` with extension manifest fields

- [ ] Task 2: Configure esbuild bundler (AC: #1, #2)
  - [ ] 2.1: Install esbuild: `npm install -D esbuild`
  - [ ] 2.2: Create `esbuild.js` bundler script
  - [ ] 2.3: Add `compile` and `watch` scripts to package.json

- [ ] Task 3: Create source folder structure (AC: #1)
  - [ ] 3.1: Create `src/` directory
  - [ ] 3.2: Create `src/providers/` with `index.ts`
  - [ ] 3.3: Create `src/services/` with `index.ts`
  - [ ] 3.4: Create `src/shared/` with `index.ts`
  - [ ] 3.5: Create `src/utils/` with `index.ts`

- [ ] Task 4: Create extension entry point (AC: #1)
  - [ ] 4.1: Create `src/extension.ts` with `activate()` and `deactivate()` functions
  - [ ] 4.2: Add activation event configuration to package.json

- [ ] Task 5: Configure VS Code debug environment (AC: #3)
  - [ ] 5.1: Create `.vscode/launch.json` for Extension Development Host
  - [ ] 5.2: Create `.vscode/tasks.json` for build tasks
  - [ ] 5.3: Create `.vscode/settings.json` with workspace settings

- [ ] Task 6: Add development tooling (AC: #2)
  - [ ] 6.1: Create `.gitignore` for Node.js/TypeScript projects
  - [ ] 6.2: Create `.vscodeignore` to exclude dev files from .vsix
  - [ ] 6.3: Verify build works with `npm run compile`

## Dev Notes

### Technology Stack (from Architecture)

| Component | Version/Details |
|-----------|-----------------|
| TypeScript | 5.0+ with strict mode |
| Node.js | 18+ (VS Code 1.85 requirement) |
| Target | ES2022 |
| Bundler | esbuild (fast, minimal output) |
| VS Code Engine | ^1.85.0 minimum |

### Initialization Commands Sequence

```bash
# 1. Initialize npm package
npm init -y

# 2. Install TypeScript and VS Code types
npm install -D typescript @types/vscode @types/node

# 3. Install extension bundler
npm install -D esbuild

# 4. Add testing framework (for later stories)
npm install -D @vscode/test-electron vitest
```

### package.json Extension Manifest

The `package.json` MUST include these fields for VS Code extension:

```json
{
  "name": "vscode-bmad",
  "displayName": "BMAD Method",
  "description": "Visual orchestrator for BMAD methodology in VS Code",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "scripts": {
    "compile": "node esbuild.js",
    "watch": "node esbuild.js --watch"
  }
}
```

### tsconfig.json Configuration

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "webviews"]
}
```

### esbuild.js Bundler Script

```javascript
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

### Extension Entry Point (src/extension.ts)

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('BMAD Extension is now active');
  
  // Services and providers will be registered here in subsequent stories
}

export function deactivate() {
  // Cleanup will be added here
}
```

### VS Code Debug Configuration (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/dist/**/*.js"
      ],
      "preLaunchTask": "npm: compile"
    }
  ]
}
```

### Folder Structure to Create

```
vscode-bmad-extension/
├── .vscode/
│   ├── launch.json
│   ├── tasks.json
│   └── settings.json
├── src/
│   ├── extension.ts
│   ├── providers/
│   │   └── index.ts
│   ├── services/
│   │   └── index.ts
│   ├── shared/
│   │   └── index.ts
│   └── utils/
│       └── index.ts
├── package.json
├── tsconfig.json
├── esbuild.js
├── .gitignore
└── .vscodeignore
```

### Project Structure Notes

This is the foundation story - all patterns established here will be followed in subsequent stories:

- **Named exports only** - No default exports (enforced in ESLint later)
- **Barrel files** - Each folder has `index.ts` for public API exports
- **Co-located tests** - Tests go next to source files with `.test.ts` suffix
- **Strict TypeScript** - `strict: true` catches errors early

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter-Template-Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled with created/modified files_
