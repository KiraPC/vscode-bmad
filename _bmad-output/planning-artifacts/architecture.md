---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-vscode-bmad-2026-02-12.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-12.md'
workflowType: 'architecture'
project_name: 'vscode-bmad'
user_name: 'Pasquale'
date: '2026-02-12'
lastStep: 8
status: 'complete'
completedAt: '2026-02-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
44 requisiti funzionali organizzati in 6 categorie:
- Project Initialization & Configuration (6 FRs): Rilevamento progetto BMAD esistente, esecuzione comandi install, parsing config.yaml con risoluzione template variables
- Visual Story Management (10 FRs): Kanban board come editor tab, dual-view Epics/Stories, file watching real-time, stato epic derivato automaticamente da storie child
- Agent Integration & Workflow Guidance (9 FRs): Agent Launcher UI con discovery dinamico comandi, integrazione Copilot Chat, workflow progress tracker
- Sidebar Panel & Progressive UI (6 FRs): UI che evolve in base a stato progetto (Fresh → In Progress → Epics Ready)
- File System Integration & Parsing (8 FRs): YAML frontmatter parsing, FileSystemWatcher con debounce 200ms, graceful error handling
- Cross-Platform Compatibility (5 FRs): Path resolution via Uri API, shell detection, line ending normalization

**Non-Functional Requirements:**
- Performance: Kanban render <500ms (50 stories), activation <1s, file parsing <200ms, PostMessage latency <50ms
- Security: Strict CSP per WebView, command whitelist, input sanitization, no external telemetry
- Accessibility: High contrast support, keyboard navigation, ARIA labels, WCAG AA compliance
- Integration: VS Code 1.85+, Copilot Chat graceful fallback, workspace type compatibility (local, SSH, WSL, Dev Containers)
- Reliability: Graceful malformed file handling, FileSystemWatcher retry logic, state persistence across reloads
- Cross-Platform: macOS 12+, Windows 10+, Ubuntu 20.04+, platform-specific shell detection

**Scale & Complexity:**
- Primary domain: VS Code Extension (Developer Tool)
- Complexity level: Medium-High
- Estimated architectural components: 8-10 major components (Extension Host, Sidebar Provider, Kanban Provider, Agent Launcher Provider, Config Parser, Epics Parser, Story Parser, File Watcher, Copilot Integration)

### Technical Constraints & Dependencies

**Platform Constraints:**
- VS Code Engine minimum: 1.85.0 (stable API surface)
- Node.js 18+ (VS Code requirement)
- WebView runs in isolated Chromium context with CSP restrictions
- GitHub Copilot Chat API may be in proposed/preview state requiring special enablement

**External Dependencies:**
- `gray-matter`: Industry standard YAML frontmatter parsing
- `yaml`: Robust YAML parsing with error handling
- `@vscode/webview-ui-toolkit`: VS Code-styled UI components
- Svelte 4.x: Reactive framework for WebView UI
- Vite: WebView bundle tooling

**BMAD Method Constraints:**
- Targets BMAD Method 6.0.0+ file structure
- File locations derived from config.yaml paths (planning_artifacts, implementation_artifacts)
- Story status schema: Backlog, In Progress, Review, Done
- Epic status derived from child story aggregation

### Cross-Cutting Concerns Identified

1. **File System Watching & Parsing:** Pervasive across all data-dependent components; requires unified debouncing strategy and error handling
2. **Error Handling & Graceful Degradation:** Malformed files must not crash extension; user-friendly error messages with actionable guidance
3. **Cross-Platform Path Resolution:** All path operations via VS Code Uri API; shell detection for terminal commands
4. **Performance Budgets:** Strict timing requirements across activation, rendering, and file operations
5. **State Synchronization:** WebView ↔ Extension Host via PostMessage; file state ↔ UI state consistency
6. **Security Boundaries:** CSP for WebView, command whitelist, input sanitization throughout

## Starter Template Evaluation

### Primary Technology Domain

VS Code Extension (Developer Tool) - richiede scaffolding specifico per estensioni con WebView.

### Starter Options Considered

**Option 1: Yeoman Generator (`yo code`)**
- Pro: Strumento ufficiale Microsoft, struttura standard, debug config inclusa
- Contro: Non supporta Svelte, WebView richiede setup manuale

**Option 2: Custom Manual Setup**
- Pro: Controllo completo, struttura allineata al PRD, bundling ottimizzato
- Contro: Più setup iniziale (mitigato da documentazione architettura)

**Option 3: Fork Open Source Reference**
- Pro: Patterns collaudati da estensioni esistenti
- Contro: Tech debt ereditato, possibile disallineamento con requisiti

### Selected Approach: Custom Manual Setup

**Rationale:**
- Requisiti WebView con Svelte non coperti da generatori standard
- PRD definisce già struttura progetto precisa
- Dual-build system richiede configurazione custom (esbuild + Vite)
- Controllo completo su dipendenze e bundling

**Initialization Sequence:**

```bash
# 1. Create project structure
mkdir vscode-bmad-extension && cd vscode-bmad-extension

# 2. Initialize npm package
npm init -y

# 3. Install TypeScript and VS Code types
npm install -D typescript @types/vscode @types/node

# 4. Install extension bundler
npm install -D esbuild

# 5. Install Svelte and Vite for WebViews
npm install -D svelte vite @sveltejs/vite-plugin-svelte

# 6. Install runtime dependencies
npm install yaml gray-matter

# 7. Install VS Code WebView UI toolkit
npm install -D @vscode/webview-ui-toolkit

# 8. Install testing framework
npm install -D @vscode/test-electron vitest
```

**Architectural Decisions Provided:**

**Language & Runtime:**
- TypeScript 5.0+ with strict mode
- Node.js 18+ (VS Code 1.85 requirement)
- ES2022 target for modern features

**Build System:**
- esbuild for extension host bundling (fast, minimal output)
- Vite + @sveltejs/vite-plugin-svelte for WebView bundling
- Separate build pipelines for extension vs WebView code

**WebView Framework:**
- Svelte 4.x for reactive UI components
- @vscode/webview-ui-toolkit for native VS Code styling
- Component isolation per WebView (sidebar, kanban)

**Parsing Libraries:**
- `yaml` for config.yaml parsing
- `gray-matter` for markdown frontmatter extraction

**Testing Infrastructure:**
- @vscode/test-electron for integration tests
- vitest for unit tests (fast, ESM-native)

**Project Structure:**
- `src/` for extension host code (TypeScript)
- `webviews/` for WebView source (Svelte)
- Providers pattern for WebView management
- Parsers isolated in dedicated module

**Note:** Project initialization using this sequence should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Extension architecture pattern (Provider + Services hybrid)
- State management strategy (Extension Host as source of truth)
- WebView ↔ Extension communication protocol (Typed messages)
- File watching strategy (VS Code API + debounce)

**Important Decisions (Shape Architecture):**
- Copilot Chat integration approach (Graceful degradation)
- Error handling and logging pattern (Centralized service)

**Deferred Decisions (Post-MVP):**
- Telemetry implementation (opt-in, post-beta)
- Drag-drop bidirectional sync (Phase 2)
- CI/CD specific tooling (post-Marketplace submission)

### Extension Architecture Pattern

**Decision:** Hybrid Provider + Services Pattern

**Rationale:**
- Providers manage WebView lifecycles per VS Code API best practices
- Services encapsulate reusable logic (parsing, file watching, config)
- Clear separation of concerns between UI management and data operations

**Component Structure:**
```
src/
├── providers/           # WebView lifecycle management
│   ├── SidebarProvider.ts
│   ├── KanbanProvider.ts
│   └── AgentLauncherProvider.ts
├── services/            # Shared business logic
│   ├── ConfigService.ts
│   ├── ParserService.ts
│   ├── FileWatcherService.ts
│   ├── CopilotService.ts
│   └── ErrorService.ts
├── models/              # Data types
└── utils/               # Pure utilities
```

**Affects:** All components - this is the foundational organization pattern

### State Management Strategy

**Decision:** Extension Host as Single Source of Truth + Local Svelte Stores for UI State

**Rationale:**
- Data state (epics, stories, config) lives in Extension Host services
- UI state (selected card, scroll position, expanded sections) lives in Svelte stores
- Clear boundary reduces PostMessage traffic while ensuring data consistency
- State persists across WebView dispose/recreate cycles

**Data Flow:**
```
File System → ParserService → Extension State → PostMessage → WebView Svelte Store → UI
User Action → WebView Event → PostMessage → Service Update → File Write → File Watcher → Sync
```

**Affects:** All WebView components, service design, testing strategy

### WebView ↔ Extension Communication Protocol

**Decision:** Typed Message Protocol with Shared Interfaces

**Rationale:**
- Type safety catches errors at compile time, not runtime
- Shared types between extension and WebView build pipelines
- IntelliSense support improves developer experience
- Explicit message contracts document the API

**Implementation:**
```typescript
// shared/messages.ts
export type ExtensionMessage = 
  | { type: 'dataLoaded'; payload: { epics: Epic[]; stories: Story[] } }
  | { type: 'storyUpdated'; payload: Story }
  | { type: 'error'; payload: { code: string; message: string } };

export type WebViewMessage =
  | { type: 'selectStory'; payload: { storyId: string } }
  | { type: 'openFile'; payload: { filePath: string } }
  | { type: 'launchAgent'; payload: AgentLaunchRequest };
```

**Affects:** All Provider ↔ WebView communication, testing (can mock messages)

### File Watching Strategy

**Decision:** VS Code FileSystemWatcher API + Custom Debounce Service

**Rationale:**
- VS Code API ensures compatibility with all workspace types (local, SSH, WSL, Dev Containers) per NFR-I3
- Custom debounce service provides configurable 200ms delay per NFR-P7
- Unified debouncing strategy prevents cascading re-renders

**Implementation:**
```typescript
// FileWatcherService.ts
class FileWatcherService {
  private debounceMs = 200;
  private watchers: vscode.FileSystemWatcher[] = [];
  
  watchArtifacts(callback: () => void): void {
    // Watch config.yaml, epics.md, implementation-artifacts/**
    // Debounce multiple rapid changes into single callback
  }
}
```

**Affects:** All data-dependent components, performance, reliability testing

### Copilot Chat Integration

**Decision:** Graceful Degradation Hybrid (Try Chat API, Fallback to Commands)

**Rationale:**
- Per NFR-I2, integration must work even if Copilot Chat unavailable
- Chat API (if available) provides best user experience with agent mode
- Command fallback ensures functionality on all VS Code installations
- Feature detection at runtime, not compile time

**Implementation:**
```typescript
// CopilotService.ts
class CopilotService {
  async launchAgent(request: AgentLaunchRequest): Promise<void> {
    if (this.isChatApiAvailable()) {
      await this.launchViaChatApi(request);
    } else {
      await this.launchViaCommandPalette(request);
    }
  }
}
```

**Affects:** Agent Launcher feature, user experience, testing (need both paths)

### Error Handling & Logging

**Decision:** Centralized Error Service + VS Code OutputChannel

**Rationale:**
- Per NFR-R4, all critical errors logged to "BMAD Extension" output channel
- Centralized service ensures consistent error handling policies
- Service decides: log only, show notification, both
- User-friendly error messages with actionable guidance

**Implementation:**
```typescript
// ErrorService.ts
class ErrorService {
  private outputChannel: vscode.OutputChannel;
  
  handleError(error: BmadError): void {
    this.log(error);
    if (error.shouldNotify) {
      vscode.window.showErrorMessage(error.userMessage, ...error.actions);
    }
  }
}
```

**Affects:** All components - consistent error handling throughout

### Decision Impact Analysis

**Implementation Sequence:**
1. ErrorService (foundation for all error handling)
2. ConfigService + ParserService (data foundation)
3. FileWatcherService (reactive updates)
4. Typed Message Protocol definitions
5. Providers with Svelte WebViews
6. CopilotService (agent integration)

**Cross-Component Dependencies:**
- All services depend on ErrorService
- All Providers depend on ConfigService and ParserService
- KanbanProvider depends on FileWatcherService for auto-refresh
- AgentLauncherProvider depends on CopilotService

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
11 aree dove AI agent potrebbero fare scelte diverse - tutte risolte con pattern espliciti.

### Naming Patterns

**File & Directory Naming:**
- TypeScript classes: PascalCase → `ConfigService.ts`, `SidebarProvider.ts`
- Svelte components: kebab-case → `story-card.svelte`, `epic-badge.svelte`  
- Pure utilities: kebab-case → `path-resolver.ts`, `debounce.ts`
- Test files: co-located with `.test.ts` suffix → `ConfigService.test.ts`

**Export Conventions:**
- Always use named exports (no default exports)
- One primary export per file
- Re-export via barrel files (`index.ts`) for public APIs

**Interface vs Type:**
- Interfaces for contracts/APIs: `interface IWebViewProvider`
- Types for data models: `type Story`, `type Epic`
- No `I` prefix for data model types

### Structure Patterns

**Test Organization:**
```
src/
├── services/
│   ├── ConfigService.ts
│   └── ConfigService.test.ts      # Unit tests co-located
├── providers/
│   └── KanbanProvider.ts
tests/
└── integration/                    # Integration tests separate
    └── extension.test.ts
```

**Svelte Component Organization:**
```
webviews/kanban/src/
├── components/     # Reusable UI components
│   ├── StoryCard.svelte
│   ├── EpicBadge.svelte
│   └── ColumnHeader.svelte
├── stores/         # Svelte stores (state)
│   ├── stories.ts
│   └── ui.ts
├── lib/            # Utilities, types, helpers
│   ├── types.ts
│   └── formatters.ts
├── App.svelte      # Root component
└── main.ts         # Entry point
```

**Shared Types Location:**
```
src/
└── shared/
    ├── messages.ts    # WebView ↔ Extension message types
    ├── models.ts      # Epic, Story, BmadConfig types
    └── errors.ts      # BmadError type definitions
```

### Format Patterns

**PostMessage Format:**
```typescript
// Always nested payload structure
{ type: 'storySelected', payload: { storyId: string } }
{ type: 'dataLoaded', payload: { epics: Epic[], stories: Story[] } }
{ type: 'error', payload: BmadError }
```

**Error Format:**
```typescript
interface BmadError {
  code: string;           // 'CONFIG_PARSE_ERROR', 'FILE_NOT_FOUND'
  message: string;        // Technical message for logging
  userMessage: string;    // Human-friendly message for notifications
  recoverable: boolean;   // Can user retry?
  actions?: string[];     // Button labels for notification
}
```

**Service Result Pattern:**
```typescript
// All service methods return Result-like structure
type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: BmadError };
```

### Communication Patterns

**Svelte Store Naming:**
- Direct naming: `stories`, `config`, `selectedStoryId`
- Use Svelte's `$` auto-subscribe syntax in components
- Writable stores for mutable state, derived for computed

**Event Handler Naming:**
- Internal handlers: `handleStoryClick`, `handleFilterChange`
- Svelte dispatch events: `dispatch('select', { story })`
- VS Code commands: `bmad.openKanban`, `bmad.launchAgent`

**PostMessage Handler Pattern:**
```typescript
// Extension side
webview.onDidReceiveMessage((message: WebViewMessage) => {
  switch (message.type) {
    case 'selectStory':
      this.handleSelectStory(message.payload);
      break;
    // ... exhaustive switch
  }
});
```

### Process Patterns

**Loading State:**
```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// In stores
export const loadingState = writable<LoadingState>('idle');
```

**Service Method Pattern:**
```typescript
// ALWAYS async/await, even for sync operations
class ConfigService {
  async getConfig(): Promise<ServiceResult<BmadConfig>> {
    // ...
  }
  
  async resolveTemplatePath(path: string): Promise<string> {
    // Even if sync internally, expose as async for consistency
  }
}
```

**Error Recovery Pattern:**
```typescript
// Try operation → Log → Notify if needed → Return result
async parseStoryFile(path: string): Promise<ServiceResult<Story>> {
  try {
    const content = await this.readFile(path);
    const story = this.parseContent(content);
    return { success: true, data: story };
  } catch (error) {
    const bmadError = this.errorService.handle(error, {
      code: 'STORY_PARSE_ERROR',
      userMessage: `Unable to parse story: ${path}`,
      recoverable: true
    });
    return { success: false, error: bmadError };
  }
}
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow file naming conventions exactly (PascalCase for classes, kebab-case for Svelte)
2. Use named exports only (no default exports)
3. Use async/await for all service methods
4. Use typed PostMessage format with payload wrapper
5. Use LoadingState enum, not boolean flags
6. Handle errors via ErrorService, return ServiceResult
7. Place tests co-located with source files

**Pattern Verification:**
- TypeScript strict mode catches type mismatches
- ESLint rules enforce naming conventions
- PR review checklist includes pattern compliance

### Anti-Patterns to Avoid

**❌ DON'T:**
```typescript
// Wrong: default export
export default class ConfigService { }

// Wrong: boolean loading
let isLoading = true;

// Wrong: flat message structure  
{ type: 'storySelected', storyId: '001' }

// Wrong: sync method when others are async
getConfigSync(): BmadConfig { }

// Wrong: throwing errors instead of returning Result
throw new Error('Parse failed');
```

**✅ DO:**
```typescript
// Correct: named export
export class ConfigService { }

// Correct: enum loading state
let loadingState: LoadingState = 'loading';

// Correct: nested payload
{ type: 'storySelected', payload: { storyId: '001' } }

// Correct: always async
async getConfig(): Promise<ServiceResult<BmadConfig>> { }

// Correct: return result
return { success: false, error: bmadError };
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
vscode-bmad-extension/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # PR checks: lint, test, build
│       └── release.yml               # Marketplace publishing
├── .vscode/
│   ├── launch.json                   # Extension debug config
│   ├── tasks.json                    # Build tasks
│   └── settings.json                 # Workspace settings
├── src/
│   ├── extension.ts                  # Entry point, activation
│   ├── providers/
│   │   ├── SidebarProvider.ts        # Sidebar WebView lifecycle
│   │   ├── SidebarProvider.test.ts
│   │   ├── KanbanProvider.ts         # Kanban WebView lifecycle
│   │   ├── KanbanProvider.test.ts
│   │   └── index.ts                  # Barrel export
│   ├── services/
│   │   ├── ConfigService.ts          # Parse _bmad/bmm/config.yaml
│   │   ├── ConfigService.test.ts
│   │   ├── ParserService.ts          # Parse epics.md + stories
│   │   ├── ParserService.test.ts
│   │   ├── FileWatcherService.ts     # Watch artifacts, debounce
│   │   ├── FileWatcherService.test.ts
│   │   ├── CopilotService.ts         # Copilot Chat integration
│   │   ├── CopilotService.test.ts
│   │   ├── ErrorService.ts           # Centralized error handling
│   │   ├── ErrorService.test.ts
│   │   └── index.ts
│   ├── shared/
│   │   ├── messages.ts               # ExtensionMessage, WebViewMessage types
│   │   ├── models.ts                 # Epic, Story, BmadConfig types
│   │   ├── errors.ts                 # BmadError, error codes
│   │   └── index.ts
│   └── utils/
│       ├── path-resolver.ts          # Cross-platform path handling
│       ├── path-resolver.test.ts
│       ├── debounce.ts               # Debounce utility
│       ├── debounce.test.ts
│       └── index.ts
├── webviews/
│   ├── sidebar/
│   │   ├── src/
│   │   │   ├── App.svelte            # Sidebar root component
│   │   │   ├── main.ts               # Svelte mount
│   │   │   ├── components/
│   │   │   │   ├── ActionButtons.svelte
│   │   │   │   ├── FileTree.svelte
│   │   │   │   ├── AgentLauncher.svelte
│   │   │   │   └── ProgressTracker.svelte
│   │   │   ├── stores/
│   │   │   │   ├── state.ts          # Project state store
│   │   │   │   └── ui.ts             # UI state (expanded, selected)
│   │   │   └── lib/
│   │   │       ├── types.ts          # Re-export shared types
│   │   │       └── messaging.ts      # postMessage helpers
│   │   ├── index.html                # WebView HTML template
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── kanban/
│       ├── src/
│       │   ├── App.svelte            # Kanban root component
│       │   ├── main.ts
│       │   ├── components/
│       │   │   ├── Board.svelte
│       │   │   ├── Column.svelte
│       │   │   ├── StoryCard.svelte
│       │   │   ├── EpicCard.svelte
│       │   │   ├── EpicBadge.svelte
│       │   │   ├── FilterBar.svelte
│       │   │   └── ProgressBar.svelte
│       │   ├── stores/
│       │   │   ├── stories.ts        # Stories data store
│       │   │   ├── epics.ts          # Epics data store
│       │   │   ├── filters.ts        # Filter state
│       │   │   └── ui.ts             # View mode, selected items
│       │   └── lib/
│       │       ├── types.ts
│       │       ├── messaging.ts
│       │       └── formatters.ts     # Status badges, dates
│       ├── index.html
│       ├── vite.config.ts
│       └── tsconfig.json
├── tests/
│   └── integration/
│       ├── extension.test.ts         # Full extension integration
│       ├── fixtures/
│       │   ├── sample-config.yaml
│       │   ├── sample-epics.md
│       │   └── sample-stories/
│       │       ├── story-001.md
│       │       └── story-002.md
│       └── helpers/
│           └── vscode-mock.ts
├── media/
│   ├── icon.png                      # Extension icon
│   └── screenshots/
│       ├── kanban.png
│       └── sidebar.png
├── package.json                      # Extension manifest + contributes
├── tsconfig.json                     # Root TypeScript config
├── esbuild.js                        # Extension bundler script
├── .vscodeignore                     # Files excluded from .vsix
├── .gitignore
├── .eslintrc.json                    # Linting rules
├── .prettierrc                       # Formatting
├── CHANGELOG.md
├── README.md
└── LICENSE
```

### Architectural Boundaries

**Extension Host ↔ WebView Boundary:**
- Extension Host (`src/`): Node.js context, VS Code API access
- WebViews (`webviews/`): Chromium context, isolated, CSP-restricted
- Communication: PostMessage only via typed `ExtensionMessage` / `WebViewMessage`
- No shared runtime state - all data passed via messages

**Service Boundaries:**
```
┌─────────────────────────────────────────────────────────┐
│                    Extension Host                        │
├──────────────┬──────────────┬──────────────────────────┤
│   Providers  │   Services   │   Shared Types           │
├──────────────┼──────────────┼──────────────────────────┤
│ SidebarProv  │ ConfigSvc    │ messages.ts              │
│ KanbanProv   │ ParserSvc    │ models.ts                │
│              │ FileWatchSvc │ errors.ts                │
│              │ CopilotSvc   │                          │
│              │ ErrorSvc     │                          │
└──────┬───────┴──────┬───────┴──────────────────────────┘
       │              │
       │ postMessage  │ file system
       ▼              ▼
┌──────────────┐ ┌─────────────────────────────────────┐
│   WebViews   │ │           Workspace Files            │
├──────────────┤ ├─────────────────────────────────────┤
│ sidebar/     │ │ _bmad/bmm/config.yaml               │
│ kanban/      │ │ _bmad-output/planning-artifacts/    │
└──────────────┘ │ _bmad-output/implementation-artifacts/│
                 └─────────────────────────────────────┘
```

**Data Flow Boundaries:**
1. File System → ParserService (read-only in MVP)
2. ParserService → Provider (parsed data)
3. Provider → WebView (via postMessage)
4. WebView → Provider (user actions via postMessage)
5. Provider → CopilotService (agent launch requests)

### Requirements to Structure Mapping

**FR1-6: Project Initialization**
- `src/services/ConfigService.ts` - Config detection and parsing
- `src/utils/path-resolver.ts` - Template variable resolution
- `src/providers/SidebarProvider.ts` - "Start New Project" UI

**FR7-16: Visual Story Management**
- `webviews/kanban/` - Entire Kanban WebView
- `src/providers/KanbanProvider.ts` - Kanban lifecycle
- `src/services/ParserService.ts` - Epic/story parsing
- `src/services/FileWatcherService.ts` - Auto-refresh

**FR17-25: Agent Integration**
- `webviews/sidebar/src/components/AgentLauncher.svelte` - UI
- `src/services/CopilotService.ts` - Copilot Chat integration
- `src/shared/models.ts` - AgentCommand, AgentLaunchRequest types

**FR26-31: Sidebar Panel**
- `webviews/sidebar/` - Entire Sidebar WebView
- `src/providers/SidebarProvider.ts` - Sidebar lifecycle
- Progressive UI states in `stores/state.ts`

**FR32-39: File System Integration**
- `src/services/ParserService.ts` - YAML/frontmatter parsing
- `src/services/FileWatcherService.ts` - FileSystemWatcher + debounce
- `src/services/ErrorService.ts` - Graceful error handling

**FR40-44: Cross-Platform**
- `src/utils/path-resolver.ts` - Uri API usage
- All file operations via `vscode.workspace.fs`

### Integration Points

**Internal Communication:**
- Providers ↔ Services: Direct method calls, dependency injection via constructor
- Providers ↔ WebViews: Typed PostMessage protocol
- Services ↔ Services: Direct calls (all services instantiated in extension.ts)

**External Integrations:**
- GitHub Copilot Chat: `CopilotService.ts` handles API detection + fallback
- VS Code Terminal: For `npx bmad-method install` execution
- File System: Via `vscode.workspace.fs` API

**Data Flow:**
```
config.yaml ──┐
              │
epics.md ─────┼──► ParserService ──► KanbanProvider ──► Kanban WebView
              │         │
stories/*.md ─┘         │
                        ▼
              FileWatcherService ──► onChange() ──► Re-parse ──► Update WebView
```

### File Organization Patterns

**Configuration Files (Root):**
| File | Purpose |
|------|--------|
| `package.json` | Extension manifest, contributes, dependencies |
| `tsconfig.json` | TypeScript config (extension code) |
| `esbuild.js` | Extension bundler script |
| `.vscodeignore` | Exclude dev files from .vsix |
| `.eslintrc.json` | Linting (naming conventions, no-default-export) |

**WebView Build (per webview):**
| File | Purpose |
|------|--------|
| `vite.config.ts` | Svelte bundling config |
| `tsconfig.json` | WebView-specific TS config |
| `index.html` | HTML template with CSP meta |

**Package.json Contributes:**
```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [{ "id": "bmad", "title": "BMAD", "icon": "media/icon.png" }]
    },
    "views": {
      "bmad": [{ "type": "webview", "id": "bmad-sidebar", "name": "BMAD Method" }]
    },
    "commands": [
      { "command": "bmad.openKanban", "title": "Open Kanban Board" },
      { "command": "bmad.launchAgent", "title": "Launch BMAD Agent" },
      { "command": "bmad.initProject", "title": "Start New BMAD Project" }
    ]
  }
}
```

### Development Workflow

**Build Commands:**
```bash
# Development
npm run watch          # esbuild watch + vite watch (parallel)
npm run dev:extension  # esbuild watch only
npm run dev:webviews   # vite watch only

# Production
npm run build          # esbuild + vite build
npm run package        # vsce package → .vsix

# Testing
npm run test           # vitest (unit)
npm run test:e2e       # @vscode/test-electron (integration)

# Quality
npm run lint           # ESLint
npm run format         # Prettier
```

**Debug Configuration (.vscode/launch.json):**
- "Run Extension" - Launch Extension Development Host
- "Run Extension Tests" - Run integration tests in VS Code

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices verified compatible:
- TypeScript 5.0+ → Node.js 18+ → VS Code 1.85+ (tested combination)
- esbuild + Vite (separate build pipelines, no conflicts)
- Svelte 4.x + @vscode/webview-ui-toolkit (validated combo)
- gray-matter + yaml (complementary parsing roles)
- vitest + @vscode/test-electron (unit + integration coverage)

**Pattern Consistency:**
Implementation patterns fully support architectural decisions:
- Named exports enforced via ESLint rules
- async/await consistent across all service methods
- ServiceResult pattern uniform for error handling
- Typed PostMessage with payload wrapper throughout

**Structure Alignment:**
Project structure enables all architectural decisions:
- Clear Extension Host / WebView boundary
- Services isolated with single responsibility
- Shared types accessible to both contexts
- Test co-location supports rapid development

### Requirements Coverage Validation ✅

**Functional Requirements: 44/44 Covered**

| FR Category | Count | Coverage |
|-------------|-------|----------|
| Project Initialization | 6 | ConfigService, SidebarProvider |
| Visual Story Management | 10 | KanbanProvider, ParserService, FileWatcherService |
| Agent Integration | 9 | CopilotService, AgentLauncher.svelte |
| Sidebar Panel | 6 | SidebarProvider, state stores |
| File System Integration | 8 | ParserService, FileWatcherService, ErrorService |
| Cross-Platform | 5 | path-resolver, vscode.workspace.fs |

**Non-Functional Requirements: All Addressed**

| Category | Architectural Support |
|----------|----------------------|
| Performance | Lazy loading, 200ms debounce, <500ms render targets |
| Security | CSP in WebView HTML, command whitelist, ErrorService sanitization |
| Accessibility | @vscode/webview-ui-toolkit components, ARIA support |
| Integration | CopilotService with graceful degradation |
| Reliability | ServiceResult pattern, ErrorService centralization |
| Cross-Platform | Uri API usage, platform-specific shell detection |

### Implementation Readiness Validation ✅

**Decision Completeness:** HIGH
- All technology choices documented with versions
- 6 core architectural decisions with rationale
- Code examples for all major patterns
- Anti-patterns documented to prevent conflicts

**Structure Completeness:** HIGH
- Complete directory tree (70+ files/directories)
- Purpose comments for each file
- FR → file mapping explicit
- Build and dev commands documented

**Pattern Completeness:** HIGH
- 11 conflict points identified and resolved
- Naming conventions for all categories
- Communication patterns fully specified
- Process patterns with code examples

### Gap Analysis Results

**Critical Gaps:** None ✅

**Important Gaps (Non-blocking, enhance during implementation):**
1. Testing mock patterns for VS Code API - document as stories are implemented
2. CI/CD pipeline details - configure when setting up GitHub Actions
3. CSP exact policy string - define when creating WebView HTML templates

**Nice-to-Have (Post-MVP):**
1. Formal schema for epics.md and story frontmatter
2. Internationalization patterns
3. Telemetry implementation guidelines

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (VS Code API, Copilot Chat)
- [x] Cross-cutting concerns mapped (6 identified)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (Provider + Services)
- [x] Performance considerations addressed (debounce, lazy load)

**✅ Implementation Patterns**
- [x] Naming conventions established (11 patterns)
- [x] Structure patterns defined
- [x] Communication patterns specified (typed PostMessage)
- [x] Process patterns documented (ServiceResult, async/await)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
1. Clear separation between Extension Host and WebViews
2. Comprehensive pattern documentation with examples
3. All 44 FRs mapped to specific architectural components
4. Strong type safety with TypeScript and typed messages
5. Graceful degradation for external dependencies (Copilot Chat)

**Areas for Future Enhancement:**
1. Testing utilities and mocks (implement as needed)
2. CI/CD pipeline specifics (Phase 2)
3. Performance monitoring instrumentation (post-beta)

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries
4. Use named exports only (no default exports)
5. All service methods must be async/await
6. Return ServiceResult, never throw exceptions
7. Refer to this document for all architectural questions

**First Implementation Priority:**
```bash
# Step 1: Initialize project structure
mkdir vscode-bmad-extension && cd vscode-bmad-extension
npm init -y

# Step 2: Install dependencies (see Starter Template section)

# Step 3: Create directory structure (see Project Structure section)

# Step 4: Implement ErrorService first (foundation for all error handling)
```

**Implementation Sequence:**
1. Project scaffolding and configuration
2. ErrorService (all services depend on it)
3. ConfigService + ParserService (data foundation)
4. FileWatcherService (reactive updates)
5. Shared types (messages.ts, models.ts)
6. SidebarProvider + sidebar WebView
7. KanbanProvider + kanban WebView
8. CopilotService (agent integration)

