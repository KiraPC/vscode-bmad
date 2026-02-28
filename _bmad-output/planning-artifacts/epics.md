---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
status: 'complete'
completedAt: '2026-02-12'
totalEpics: 6
totalStories: 34
frCoverage: '44/44'
---

# vscode-bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for vscode-bmad, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Project Initialization & Configuration**
- FR1: Users can initialize a new BMAD project with one click that executes `npx bmad-method install` and creates the complete `_bmad/` folder structure
- FR2: Extension can detect existing BMAD projects by reading `_bmad/bmm/config.yaml` on workspace open
- FR3: Extension can parse config.yaml to extract project name, artifact paths, user preferences, and communication language
- FR4: Extension can resolve template variables in config paths (e.g., `{project-root}` replaced with actual workspace path)
- FR5: Users can view project initialization progress and command output in a VS Code terminal
- FR6: Extension can display appropriate error messages with actionable guidance when config.yaml is missing or malformed

**Visual Story Management**
- FR7: Users can open a Kanban board as an editor tab that displays all project stories organized by status columns
- FR8: Users can view stories organized in four status columns: Backlog, In Progress, Review, Done
- FR9: Users can switch between [Epics] view and [Stories] view using tab navigation in the Kanban board
- FR10: Users can see epic cards in Epics view that display epic title, description, and derived status based on child story states
- FR11: Users can see story cards in Stories view that display story title, epic parent, assignee, and current status
- FR12: Users can filter stories by epic by clicking an epic card, which automatically switches to Stories view with epic filter applied
- FR13: Users can click a story card to open the story markdown file as a rendered preview in the editor
- FR14: Extension can automatically refresh Kanban board when story or epic files change on disk (via git pull, agent modifications, or manual edits)
- FR15: Users can see workflow progress bar above Kanban columns showing current phase in BMAD workflow-map (Planning, Solutioning, Implementation, Testing)
- FR16: Users can see story counts displayed in each Kanban column header (e.g., "In Progress (3)")

**Agent Integration & Workflow Guidance**
- FR17: Users can access an Agent Launcher UI from the sidebar panel that provides dropdown selectors for Agent, Model, and Command
- FR18: Extension can dynamically discover and parse available agents from `_bmad/bmm/agents/` folder markdown files
- FR19: Extension can dynamically discover and parse agent commands from agent markdown file menu sections
- FR20: Users can select an AI model from a dropdown populated with available models in VS Code (Claude, GPT-4, etc.)
- FR21: Users can enter a custom prompt text that will be included when launching the agent
- FR22: Users can launch an agent in GitHub Copilot Chat with one click, which opens Chat with agent mode, command, and optional custom prompt pre-filled
- FR23: Extension can provide graceful fallback by opening Chat with pre-filled text if Copilot Chat API is unavailable
- FR24: Users can see workflow progress tracker showing "you are here" indicator in BMAD process workflow-map
- FR25: Extension can derive workflow state from presence/absence of artifact files in planning and implementation folders

**Sidebar Panel & Progressive UI**
- FR26: Users can view a sidebar panel that displays project state and contextual actions based on detected BMAD project phase
- FR27: Users in a fresh project (no artifacts) can see three initial action buttons: [🧠 Brainstorm], [💡 Ho un'idea], [📄 Ho docs]
- FR28: Users in an in-progress project can see context-appropriate actions based on existing artifacts
- FR29: Users in a project with epics ready can see [Open Kanban Board] button prominently displayed
- FR30: Users can access a clickable file tree in sidebar panel showing key artifact files (config.yaml, epics.md, stories)
- FR31: Users can click file tree items to open those files in the editor

**File System Integration & Parsing**
- FR32: Extension can parse YAML frontmatter from markdown files (epics.md and story files) to extract metadata
- FR33: Extension can parse epics.md to extract list of epics with title, description, and epic identifier
- FR34: Extension can scan `{implementation_artifacts}/` folder to discover all story markdown files
- FR35: Extension can parse story files to extract story ID, title, status, epic parent, assignee, and content
- FR36: Extension can watch for file changes in config.yaml, epics.md, and implementation-artifacts folder using VS Code FileSystemWatcher API
- FR37: Extension can debounce file change events (200ms delay) to batch multiple rapid changes and prevent excessive re-parsing
- FR38: Extension can derive epic status (Backlog, In Progress, Done) by aggregating child story statuses
- FR39: Extension can handle malformed YAML or markdown files gracefully with error logging and user-friendly error messages

**Cross-Platform Compatibility**
- FR40: Extension can resolve file paths correctly on macOS, Windows, and Linux using VS Code's Uri and path APIs
- FR41: Extension can handle case-insensitive file systems (Windows, macOS) and case-sensitive file systems (Linux) without data corruption
- FR42: Extension can normalize line endings (CRLF on Windows, LF on Unix) when parsing markdown frontmatter
- FR43: Extension can execute shell commands (`npx bmad-method install`) using appropriate shell for each platform (bash for macOS/Linux, cmd/PowerShell for Windows)
- FR44: Extension can display consistent UI across all platforms using VS Code's WebView Chromium renderer and built-in codicons

### NonFunctional Requirements

**Performance**
- NFR-P1: Kanban board WebView renders initial view in <500ms for projects with up to 50 stories
- NFR-P2: File parsing operations (config.yaml, epics.md, story files) complete in <200ms total for typical projects (<100 stories)
- NFR-P3: Kanban board auto-refresh after file changes completes in <300ms (from FileSystemWatcher event to UI update)
- NFR-P4: Agent Launcher dropdown population completes in <100ms when opening sidebar panel
- NFR-P5: Extension activation time (workspace with BMAD project detected) completes in <1 second
- NFR-P6: WebView PostMessage communication latency <50ms for user interactions (card click, filter selection)
- NFR-P7: File watching debounce window set to 200ms to batch rapid file changes without blocking UI

**Security**
- NFR-S1: WebView Content Security Policy (CSP) enforces strict policy
- NFR-S2: All terminal command executions validated against whitelist of allowed commands before execution
- NFR-S3: User-provided custom prompts sanitized to prevent command injection
- NFR-S4: Extension never reads or writes files outside of workspace root directory without explicit user permission
- NFR-S5: No telemetry or analytics data sent to external servers without explicit user opt-in
- NFR-S6: WebView HTML generated with escaped user-provided content to prevent XSS attacks
- NFR-S7: Extension packaged without debug symbols or source maps in production .vsix bundle

**Accessibility**
- NFR-A1: Kanban board WebView supports VS Code high contrast themes
- NFR-A2: All interactive elements keyboard-navigable with visible focus indicators
- NFR-A3: Story cards include ARIA labels for screen reader compatibility
- NFR-A4: Sidebar panel buttons include descriptive labels and support keyboard activation
- NFR-A5: Error messages displayed with sufficient color contrast ratio (WCAG AA standard)

**Integration**
- NFR-I1: Extension compatible with VS Code API versions 1.85.0 through latest stable release
- NFR-I2: GitHub Copilot Chat integration gracefully degrades if Copilot extension not installed
- NFR-I3: File watching compatible with all VS Code workspace types (local, SSH, WSL, Dev Containers)
- NFR-I4: Extension detects and handles VS Code workspace changes without requiring reload
- NFR-I5: Kanban board WebView interoperable with VS Code editor state
- NFR-I6: Extension respects VS Code file exclusion settings when scanning for BMAD artifacts

**Reliability**
- NFR-R1: Extension handles malformed config.yaml gracefully with specific error message
- NFR-R2: Extension handles missing frontmatter gracefully, displaying warning icon
- NFR-R3: FileSystemWatcher automatically recovers from errors with retry logic
- NFR-R4: Extension logs all critical errors to VS Code Output panel
- NFR-R5: Kanban board maintains scroll position when auto-refreshing
- NFR-R6: Extension state persists across VS Code window reloads
- NFR-R7: Extension handles concurrent file modifications without data loss

**Cross-Platform**
- NFR-C1: Extension tested on macOS (12+), Windows (10+), and Linux (Ubuntu 20.04+)
- NFR-C2: File path operations use VS Code Uri API exclusively
- NFR-C3: Terminal command execution adapts shell selection to platform
- NFR-C4: Extension handles case-sensitive and case-insensitive file systems
- NFR-C5: WebView UI renders consistently across all platforms

### Additional Requirements

**From Architecture - Starter Template:**
- Custom Manual Setup approach (not Yeoman generator)
- Initialization sequence: npm init → TypeScript → esbuild → Svelte → Vite → gray-matter/yaml → WebView UI toolkit → testing framework
- TypeScript 5.0+ with strict mode
- ES2022 target
- Dual-build system: esbuild for extension, Vite for WebView

**From Architecture - Core Patterns:**
- Hybrid Provider + Services pattern
- Extension Host as single source of truth + Svelte stores for UI state
- Typed PostMessage protocol with shared interfaces
- VS Code FileSystemWatcher + custom debounce service
- Graceful degradation for Copilot Chat integration
- Centralized ErrorService + VS Code OutputChannel

**From Architecture - Project Structure:**
- `src/providers/` - WebView lifecycle management (SidebarProvider, KanbanProvider, AgentLauncherProvider)
- `src/services/` - Shared business logic (ConfigService, ParserService, FileWatcherService, CopilotService, ErrorService)
- `src/shared/` - Message types, models, error definitions
- `webviews/` - Svelte components for sidebar and kanban
- `tests/` - Unit and integration tests with `.test.ts` suffix (Vitest)

**From Architecture - Implementation Patterns:**
- Named exports only (no default exports)
- ServiceResult pattern for error handling
- LoadingState enum (`idle | loading | success | error`)
- Async/await for all service methods
- Typed PostMessage with payload wrapper

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | One-click BMAD project initialization |
| FR2 | Epic 1 | Detect existing BMAD projects via config.yaml |
| FR3 | Epic 1 | Parse config.yaml for project settings |
| FR4 | Epic 1 | Resolve template variables in config paths |
| FR5 | Epic 2 | Display project init progress in terminal |
| FR6 | Epic 1 | Error messages for missing/malformed config |
| FR7 | Epic 5 | Kanban board as editor tab |
| FR8 | Epic 5 | Four status columns (Backlog, In Progress, Review, Done) |
| FR9 | Epic 5 | Tab navigation [Epics] / [Stories] |
| FR10 | Epic 5 | Epic cards with derived status |
| FR11 | Epic 5 | Story cards with title, epic, assignee, status |
| FR12 | Epic 5 | Filter stories by epic |
| FR13 | Epic 5 | Click story → Markdown preview |
| FR14 | Epic 5 | Auto-refresh Kanban on file changes |
| FR15 | Epic 5 | Workflow progress bar above columns |
| FR16 | Epic 5 | Story counts in column headers |
| FR17 | Epic 6 | Agent Launcher UI with dropdowns |
| FR18 | Epic 6 | Dynamic agent discovery |
| FR19 | Epic 6 | Parse agent commands from markdown |
| FR20 | Epic 6 | AI model selector dropdown |
| FR21 | Epic 6 | Custom prompt input field |
| FR22 | Epic 6 | Launch agent in Copilot Chat |
| FR23 | Epic 6 | Graceful fallback if Copilot unavailable |
| FR24 | Epic 6 | Workflow progress tracker "you are here" |
| FR25 | Epic 6 | Derive workflow state from artifacts |
| FR26 | Epic 3 | Sidebar panel with project state |
| FR27 | Epic 3 | Fresh project action buttons |
| FR28 | Epic 3 | Context-appropriate actions for in-progress |
| FR29 | Epic 3 | [Open Kanban Board] button when epics ready |
| FR30 | Epic 3 | Clickable file tree in sidebar |
| FR31 | Epic 3 | Click file tree items to open in editor |
| FR32 | Epic 4 | Parse YAML frontmatter from markdown |
| FR33 | Epic 4 | Parse epics.md for epic list |
| FR34 | Epic 4 | Scan implementation_artifacts for stories |
| FR35 | Epic 4 | Parse story files for metadata |
| FR36 | Epic 4 | FileSystemWatcher for file changes |
| FR37 | Epic 4 | Debounce file change events (200ms) |
| FR38 | Epic 4 | Derive epic status from child stories |
| FR39 | Epic 4 | Graceful handling of malformed files |
| FR40 | Epic 1 | Cross-platform path resolution |
| FR41 | Epic 1 | Case-sensitive/insensitive filesystem handling |
| FR42 | Epic 1 | Line ending normalization |
| FR43 | Epic 2 | Platform-specific shell execution |
| FR44 | Epic 4 | Consistent UI across platforms |

## Epic List

### Epic 1: Extension Foundation & Project Detection

When users open VS Code in a folder with `_bmad/`, the extension automatically recognizes the BMAD project and activates, showing it's ready to work. This epic establishes the core architecture and cross-platform foundation.

**FRs Covered:** FR2, FR3, FR4, FR6, FR40, FR41, FR42

**Key Deliverables:**
- Extension activation and lifecycle management
- ConfigService for parsing config.yaml
- ErrorService for centralized error handling
- Template variable resolution (`{project-root}`)
- Cross-platform path handling via VS Code Uri API
- TypeScript + esbuild build pipeline foundation

---

### Epic 2: Project Initialization

BMAD newcomers (Marco's journey) can start a new BMAD project with one click, without memorizing commands or manually opening terminal. They see real-time progress and the complete `_bmad/` structure gets created.

**FRs Covered:** FR1, FR5, FR43

**Key Deliverables:**
- "Start New BMAD Project" button in sidebar
- Execute `npx bmad-method install` command
- Output visible in VS Code Terminal
- Shell detection for cross-platform (bash/PowerShell)
- Progress indication during installation

---

### Epic 3: Sidebar Panel & Progressive UI

Users have a "headquarters" in VS Code's sidebar showing project state. They can see artifact files and open them directly. The panel adapts based on project phase (Fresh → In Progress → Epics Ready).

**FRs Covered:** FR26, FR27, FR28, FR29, FR30, FR31

**Key Deliverables:**
- SidebarProvider with Svelte WebView
- Progressive panel evolution based on artifact presence
- Clickable file tree for artifacts
- Contextual buttons [🧠 Brainstorm] [💡 Ho un'idea] [📄 Ho docs]
- [Open Kanban Board] button when epics exist
- Vite + Svelte build pipeline for WebViews

---

### Epic 4: File Parsing & State Management

The extension understands project structure - epics, stories, statuses - and keeps this knowledge automatically updated when files change (via git pull, manual edits, or agent updates).

**FRs Covered:** FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR44

**Key Deliverables:**
- ParserService with gray-matter for frontmatter
- EpicsParser for epics.md structure
- StoryParser for implementation-artifacts folder
- FileWatcherService with 200ms debounce
- Derived epic status from child story states
- Graceful handling for malformed files
- Shared message types and data models

---

### Epic 5: Kanban Board

BMAD practitioners (Sofia's journey) can open a visual Kanban board showing all stories organized by status. They can switch between Epics and Stories views, filter by epic, and click to open markdown previews. The workflow progress bar shows current phase.

**FRs Covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16

**Key Deliverables:**
- KanbanProvider with Svelte WebView in editor tab
- Four columns: Backlog | In Progress | Review | Done
- Dual-view [Epics] / [Stories] with tab navigation
- Epic cards with derived status from children
- Story cards with title, epic parent, assignee
- Epic filter on card click
- Click card → Markdown preview in editor
- Auto-refresh via FileWatcherService subscription
- Workflow progress bar above columns
- Story counts in column headers

---

### Epic 6: Agent Launcher & Workflow Guidance

Users (Marco's cognitive load elimination) can launch any BMAD agent directly from VS Code without memorizing commands. They select Agent, Model, Command from dropdowns, add optional prompt, and click "Lancia in Chat". The workflow tracker shows "you are here" in BMAD process.

**FRs Covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25

**Key Deliverables:**
- AgentLauncherProvider component in sidebar
- Dynamic agent discovery from `_bmad/bmm/agents/`
- Parse menu sections for available commands
- AI model selector with available models
- Custom prompt input field
- CopilotService for Chat integration
- Graceful fallback when Copilot unavailable
- Workflow progress tracker based on artifact presence

---

## Epic 1: Extension Foundation & Project Detection

**Goal:** When users open VS Code in a folder with `_bmad/`, the extension automatically recognizes the BMAD project and activates, showing it's ready to work.

### Story 1.1: Extension Project Setup

As a **developer**,
I want **a properly configured VS Code extension project with TypeScript, esbuild, and the correct folder structure**,
So that **I have the foundation to build all extension features**.

**Acceptance Criteria:**

**Given** an empty project directory
**When** the initialization sequence is run (npm init, install dependencies)
**Then** the project has:
- `package.json` with extension manifest (name: "vscode-bmad", engines.vscode: "^1.85.0")
- TypeScript 5.0+ with strict mode configured (`tsconfig.json`)
- esbuild configured for extension bundling
- Folder structure: `src/`, `src/providers/`, `src/services/`, `src/shared/`
- VS Code debug configuration (`.vscode/launch.json`)
- Extension entry point (`src/extension.ts`) with `activate()` and `deactivate()` functions

**And** running `npm run compile` successfully builds the extension
**And** pressing F5 launches Extension Development Host

---

### Story 1.2: ErrorService Implementation

As a **developer**,
I want **a centralized error handling service**,
So that **all extension components handle errors consistently with user-friendly messages**.

**Acceptance Criteria:**

**Given** the extension project from Story 1.1
**When** I create ErrorService following the architecture patterns
**Then** the service:
- Has a VS Code OutputChannel named "BMAD Extension"
- Implements `BmadError` type with `code`, `message`, `userMessage`, `recoverable`, `actions` properties
- Implements `handleError(error: BmadError)` method that logs to OutputChannel
- Shows VS Code notification when `shouldNotify` is true
- Returns `ServiceResult<T>` pattern (`{ success: true, data: T } | { success: false, error: BmadError }`)

**And** ErrorService is registered in `extension.ts` during activation
**And** unit tests verify error logging and notification behavior

---

### Story 1.3: ConfigService - Basic YAML Parsing

As a **user**,
I want **the extension to read my `_bmad/bmm/config.yaml` file**,
So that **it knows my project name, artifact paths, and preferences**.

**Acceptance Criteria:**

**Given** a workspace with `_bmad/bmm/config.yaml` present
**When** ConfigService.getConfig() is called
**Then** it returns a `BmadConfig` object containing:
- `projectName` (from `project_name`)
- `planningArtifacts` path (from `planning_artifacts`)
- `implementationArtifacts` path (from `implementation_artifacts`)
- `userName`, `communicationLanguage`, `documentOutputLanguage`

**Given** a workspace without `_bmad/bmm/config.yaml`
**When** ConfigService.getConfig() is called
**Then** it returns `{ success: false, error: { code: 'CONFIG_NOT_FOUND', ... } }`

**Given** a workspace with malformed YAML in config.yaml
**When** ConfigService.getConfig() is called
**Then** it returns error with specific line number and YAML syntax issue (FR6)

---

### Story 1.4: ConfigService - Template Variable Resolution

As a **user**,
I want **the extension to resolve `{project-root}` in config paths**,
So that **artifact paths work correctly regardless of my workspace location**.

**Acceptance Criteria:**

**Given** config.yaml contains `planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"`
**And** workspace root is `/Users/dev/my-project`
**When** ConfigService resolves the path
**Then** the result is `/Users/dev/my-project/_bmad-output/planning-artifacts`

**Given** a path without `{project-root}` variables
**When** ConfigService resolves the path
**Then** it returns the path unchanged

**And** path resolution uses VS Code's `Uri.fsPath` and `path.join()` for cross-platform compatibility (FR40)

---

### Story 1.5: Extension Activation with BMAD Detection

As a **user**,
I want **the extension to automatically detect my BMAD project when I open VS Code**,
So that **I don't need to manually configure anything**.

**Acceptance Criteria:**

**Given** a workspace with `_bmad/bmm/config.yaml` present
**When** VS Code opens the workspace
**Then** the extension activates (within <1 second per NFR-P5)
**And** ConfigService parses the config successfully
**And** extension logs "BMAD project detected: {projectName}" to output channel

**Given** a workspace without BMAD structure
**When** VS Code opens the workspace
**Then** extension activates but operates in "fresh/no-project" mode
**And** no error is shown (graceful handling)

**And** extension uses `onStartupFinished` activation event
**And** handles case-sensitive (Linux) and case-insensitive (macOS, Windows) file systems (FR41)
**And** normalizes line endings when parsing YAML (FR42)

---

## Epic 2: Project Initialization

**Goal:** BMAD newcomers can start a new BMAD project with one click, without memorizing commands or manually opening terminal.

### Story 2.1: Shell Detection Service

As a **developer**,
I want **a service that detects the appropriate shell for the current platform**,
So that **terminal commands work correctly on macOS, Windows, and Linux**.

**Acceptance Criteria:**

**Given** the extension is running on macOS or Linux
**When** ShellService.getDefaultShell() is called
**Then** it returns `/bin/bash` or `/bin/zsh` based on system default

**Given** the extension is running on Windows
**When** ShellService.getDefaultShell() is called
**Then** it returns `powershell.exe` or `cmd.exe` based on availability

**And** the service uses `os.platform()` for detection
**And** unit tests cover all three platforms (FR43)

---

### Story 2.2: Terminal Command Execution

As a **developer**,
I want **a service to execute commands in VS Code's integrated terminal**,
So that **users can see command output in real-time**.

**Acceptance Criteria:**

**Given** ShellService from Story 2.1 is available
**When** TerminalService.executeCommand("npx bmad-method install") is called
**Then** a new VS Code terminal is created with name "BMAD"
**And** the command is executed in that terminal
**And** the terminal becomes visible to the user (FR5)

**Given** a command is on the allowed whitelist
**When** TerminalService.executeCommand() is called
**Then** the command executes

**Given** a command is NOT on the allowed whitelist
**When** TerminalService.executeCommand() is called
**Then** it returns error and does not execute (NFR-S2)

---

### Story 2.3: Project Init Button in Sidebar

As a **BMAD newcomer**,
I want **a "Start New BMAD Project" button in the sidebar**,
So that **I can initialize my project with one click**.

**Acceptance Criteria:**

**Given** a workspace without `_bmad/` folder (fresh project state)
**When** user views the sidebar panel
**Then** a prominent button "Start New BMAD Project" is visible

**Given** user clicks the "Start New BMAD Project" button
**When** the click event is handled
**Then** TerminalService executes `npx bmad-method install` (FR1)
**And** user sees terminal output in real-time (FR5)

**Given** the command completes successfully
**When** `_bmad/` folder is created
**Then** the sidebar automatically refreshes to show the new project state
**And** ConfigService is called to load the new config

---

## Epic 3: Sidebar Panel & Progressive UI

**Goal:** Users have a "headquarters" in VS Code's sidebar showing project state, with UI that adapts based on project phase.

### Story 3.1: WebView Build Pipeline (Vite + Svelte)

As a **developer**,
I want **a Vite + Svelte build pipeline for WebView components**,
So that **I can create reactive UI components for the sidebar and Kanban**.

**Acceptance Criteria:**

**Given** the extension project from Epic 1
**When** I set up the WebView build configuration
**Then** the project has:
- `webviews/` folder with Svelte source files
- `vite.config.ts` configured for WebView bundling
- `@sveltejs/vite-plugin-svelte` configured
- `@vscode/webview-ui-toolkit` available for VS Code styling
- Build outputs to `dist/webviews/`

**And** running `npm run build:webviews` produces bundled JS/CSS
**And** WebViews load successfully in Extension Development Host

---

### Story 3.2: Shared Message Types

As a **developer**,
I want **typed message interfaces shared between extension and WebView**,
So that **PostMessage communication is type-safe**.

**Acceptance Criteria:**

**Given** the architecture specifies typed PostMessage protocol
**When** I create shared types in `src/shared/messages.ts`
**Then** the file contains:
- `ExtensionMessage` union type with all message types from extension to WebView
- `WebViewMessage` union type with all message types from WebView to extension
- Each message has `type` discriminator and `payload` object

**And** types are importable in both extension code and WebView code
**And** TypeScript compiler catches message type mismatches

---

### Story 3.3: SidebarProvider Base Implementation

As a **user**,
I want **to see a sidebar panel when I open a BMAD project**,
So that **I have a central place for BMAD actions**.

**Acceptance Criteria:**

**Given** the extension is activated and WebView build pipeline exists
**When** SidebarProvider is registered
**Then** a sidebar view appears in VS Code's activity bar with BMAD icon

**Given** user clicks on the BMAD sidebar icon
**When** the sidebar opens
**Then** a WebView loads with basic Svelte component
**And** PostMessage communication works between extension and WebView
**And** the WebView uses VS Code's theme colors (NFR-A1)

**And** SidebarProvider implements `vscode.WebviewViewProvider` interface
**And** CSP is configured correctly (NFR-S1)

---

### Story 3.4: Progressive Panel - Fresh Project State

As a **user in a fresh project (no artifacts)**,
I want **to see action buttons that guide me on what to do first**,
So that **I know how to start my BMAD workflow**.

**Acceptance Criteria:**

**Given** ConfigService detects no BMAD project or fresh project state
**When** sidebar WebView renders
**Then** three buttons are displayed:
- [🧠 Brainstorm] - launches brainstorming workflow
- [💡 Ho un'idea] - launches idea capture workflow  
- [📄 Ho docs] - launches document import workflow (FR27)

**Given** user clicks any of the action buttons
**When** the click handler executes
**Then** the appropriate agent/workflow is triggered via CopilotService or similar

---

### Story 3.5: Progressive Panel - In Progress State

As a **user with an in-progress project**,
I want **to see context-appropriate actions based on my existing artifacts**,
So that **I can continue where I left off**.

**Acceptance Criteria:**

**Given** ConfigService detects BMAD project with some artifacts (e.g., product-brief exists, no PRD)
**When** sidebar WebView renders
**Then** context-appropriate actions are shown:
- If product-brief exists but no PRD: "Create PRD" button prominent
- If PRD exists but no architecture: "Create Architecture" button prominent
- Shows which phase the project is in (FR28)

**And** the panel shows a mini workflow progress indicator

---

### Story 3.6: Progressive Panel - Epics Ready State

As a **user with epics created**,
I want **a prominent button to open the Kanban board**,
So that **I can quickly access my story management view**.

**Acceptance Criteria:**

**Given** ConfigService detects epics.md exists in planning_artifacts
**When** sidebar WebView renders
**Then** [Open Kanban Board] button is prominently displayed (FR29)

**Given** user clicks [Open Kanban Board]
**When** the click handler executes
**Then** KanbanProvider opens the Kanban WebView in an editor tab

---

### Story 3.7: Artifact File Tree

As a **user**,
I want **to see my key artifact files in a clickable tree**,
So that **I can quickly open any artifact in the editor**.

**Acceptance Criteria:**

**Given** a BMAD project with artifacts present
**When** sidebar WebView renders the file tree section
**Then** it shows:
- config.yaml (always present)
- planning-artifacts/ folder with files (if exists)
- implementation-artifacts/ folder with files (if exists) (FR30)

**Given** user clicks a file in the tree
**When** the click event is handled
**Then** that file opens in VS Code editor (FR31)

**And** the tree updates when files change (via FileWatcherService subscription)
**And** icons use VS Code codicons for consistency

---

## Epic 4: File Parsing & State Management

**Goal:** The extension understands project structure and keeps knowledge updated automatically when files change.

### Story 4.1: Shared Data Models

As a **developer**,
I want **TypeScript interfaces for Epic, Story, and BmadConfig**,
So that **data structures are consistent across the codebase**.

**Acceptance Criteria:**

**Given** the architecture specifies data models
**When** I create `src/shared/models.ts`
**Then** it contains:
- `Epic` type with: id, title, description, status, storyIds
- `Story` type with: id, title, status, epicId, assignee, content, filePath
- `BmadConfig` type with: projectName, planningArtifacts, implementationArtifacts, userName, etc.
- `StoryStatus` enum: 'backlog' | 'in-progress' | 'review' | 'done'
- `EpicStatus` enum: 'backlog' | 'in-progress' | 'done'

**And** types use named exports
**And** types are usable in both extension and WebView code

---

### Story 4.2: ParserService - YAML Frontmatter Extraction

As a **developer**,
I want **a parser that extracts YAML frontmatter from markdown files**,
So that **I can read metadata from epics.md and story files**.

**Acceptance Criteria:**

**Given** a markdown file with YAML frontmatter
**When** ParserService.parseFrontmatter(content) is called
**Then** it returns parsed frontmatter object and remaining content

**Given** a markdown file without frontmatter
**When** ParserService.parseFrontmatter(content) is called
**Then** it returns null frontmatter and full content (graceful handling)

**Given** a markdown file with malformed YAML frontmatter
**When** ParserService.parseFrontmatter(content) is called
**Then** it returns error with details and logs to ErrorService (FR39)

**And** uses `gray-matter` library (FR32)
**And** handles line ending normalization

---

### Story 4.3: EpicsParser - Parse epics.md Structure

As a **developer**,
I want **a parser that extracts epic definitions from epics.md**,
So that **I can display epics in the Kanban board**.

**Acceptance Criteria:**

**Given** epics.md file exists with epic sections formatted as `## Epic N: Title`
**When** EpicsParser.parseEpics(filePath) is called
**Then** it returns array of Epic objects with:
- id extracted from "Epic N"
- title extracted from section header
- description from content below header
- storyIds initially empty (FR33)

**Given** epics.md has malformed structure
**When** EpicsParser.parseEpics() is called
**Then** it parses what it can and logs warnings for unparseable sections

**And** parsing completes in <100ms for typical files (NFR-P2)

---

### Story 4.4: StoryParser - Scan and Parse Story Files

As a **developer**,
I want **a parser that discovers and parses story files from implementation_artifacts folder**,
So that **I can display stories in the Kanban board**.

**Acceptance Criteria:**

**Given** implementation_artifacts folder exists with story markdown files
**When** StoryParser.scanAndParse(folderPath) is called
**Then** it:
- Scans folder for all `*.md` files (FR34)
- Parses each file's frontmatter for: status, epic, assignee, title
- Returns array of Story objects (FR35)

**Given** a story file has missing or invalid frontmatter
**When** StoryParser parses it
**Then** it uses defaults (status: 'backlog', epic: null) and logs warning (FR39)

**And** total parsing for 100 stories completes in <200ms (NFR-P2)

---

### Story 4.5: FileWatcherService Implementation

As a **user**,
I want **the extension to detect when files change**,
So that **the Kanban board stays up-to-date automatically**.

**Acceptance Criteria:**

**Given** a BMAD project is detected
**When** FileWatcherService is initialized
**Then** it creates watchers for:
- `_bmad/bmm/config.yaml`
- `{planning_artifacts}/epics.md`  
- `{implementation_artifacts}/**/*.md` (FR36)

**Given** a watched file changes (created, modified, deleted)
**When** the change event fires
**Then** FileWatcherService debounces events (200ms window) (FR37)
**And** emits a single consolidated "files-changed" event
**And** the event includes list of changed files

**And** watcher uses VS Code `workspace.createFileSystemWatcher` API
**And** handles watcher errors with retry logic (NFR-R3)

---

### Story 4.6: Derived Epic Status

As a **user**,
I want **epic status to be calculated from child story statuses**,
So that **I can see overall epic progress without manual updates**.

**Acceptance Criteria:**

**Given** an epic has multiple stories
**When** epic status is derived
**Then**:
- If all stories are 'backlog' → epic is 'backlog'
- If all stories are 'done' → epic is 'done'
- Otherwise → epic is 'in-progress' (FR38)

**Given** an epic has no stories
**When** epic status is derived
**Then** epic status is 'backlog'

**And** derivation is recalculated when stories change
**And** calculation happens in ParserService or dedicated function

---

### Story 4.7: State Persistence Across Reloads

As a **user**,
I want **extension state to persist across VS Code window reloads**,
So that **I don't lose my view state**.

**Acceptance Criteria:**

**Given** extension stores state (last view, scroll position, etc.)
**When** VS Code window is reloaded
**Then** the state is restored from `context.workspaceState` (NFR-R6)

**Given** state storage fails
**When** restoration is attempted
**Then** graceful fallback to default state (no crash)

---

## Epic 5: Kanban Board

**Goal:** BMAD practitioners can open a visual Kanban board showing all stories organized by status with dual-view navigation.

### Story 5.1: KanbanProvider Base Implementation

As a **user**,
I want **to open a Kanban board as an editor tab**,
So that **I have a dedicated visual space for story management**.

**Acceptance Criteria:**

**Given** the command `bmad.openKanban` exists
**When** user executes the command (via button or command palette)
**Then** a WebView panel opens in the editor area (not sidebar) (FR7)
**And** panel has title "BMAD Kanban"
**And** panel uses Svelte components

**Given** Kanban panel is already open
**When** user executes `bmad.openKanban` again
**Then** existing panel is focused (not duplicated)

**And** KanbanProvider implements `WebviewPanel` management
**And** panel state serializes for workspace reload (NFR-R6)

---

### Story 5.2: Kanban Column Layout

As a **user**,
I want **to see stories organized in four status columns**,
So that **I can visualize workflow at a glance**.

**Acceptance Criteria:**

**Given** Kanban WebView is loaded with story data
**When** Stories view is rendered
**Then** four columns appear: Backlog | In Progress | Review | Done (FR8)
**And** each column has a header with column name
**And** columns are horizontally scrollable if content overflows

**Given** stories exist with various statuses
**When** columns render
**Then** each story appears in the correct column based on status

**And** renders in <500ms for 50 stories (NFR-P1)
**And** column headers show story counts (FR16)

---

### Story 5.3: Story Card Component

As a **user**,
I want **to see story cards with key information**,
So that **I can quickly understand each story's context**.

**Acceptance Criteria:**

**Given** a story with title, epic, assignee, and status
**When** StoryCard Svelte component renders
**Then** it displays:
- Story title prominently
- Epic badge/tag showing parent epic
- Assignee name (if present)
- Visual status indicator (FR11)

**And** cards support keyboard focus (NFR-A2)
**And** cards have ARIA labels for accessibility (NFR-A3)
**And** cards use VS Code theme colors

---

### Story 5.4: Dual-View Tab Navigation

As a **user**,
I want **to switch between Epics view and Stories view with tab navigation**,
So that **I can see either high-level epic progress or detailed stories**.

**Acceptance Criteria:**

**Given** Kanban board is open
**When** user views the tab bar
**Then** two tabs are visible: [Epics] and [Stories] (FR9)

**Given** user clicks [Epics] tab
**When** view switches
**Then** Epic cards are displayed (see Story 5.5)

**Given** user clicks [Stories] tab
**When** view switches
**Then** Story columns are displayed (see Story 5.2)

**And** active tab has visual indicator
**And** tab switching is keyboard accessible

---

### Story 5.5: Epic Card Component

As a **user**,
I want **to see epic cards showing epic progress**,
So that **I can understand overall project progress**.

**Acceptance Criteria:**

**Given** epics view is active
**When** EpicCard Svelte components render
**Then** each epic displays:
- Epic title
- Description (truncated)
- Status badge (derived from stories)
- Story count (e.g., "4/7 stories done") (FR10)

**Given** user clicks an epic card
**When** click handler executes
**Then** view switches to Stories view with epic filter applied (FR12)

---

### Story 5.6: Story Card Click - Markdown Preview

As a **user**,
I want **to click a story card to see its markdown preview**,
So that **I can quickly read story details without opening file manager**.

**Acceptance Criteria:**

**Given** user clicks a story card
**When** PostMessage is sent to extension
**Then** VS Code opens the story markdown file in editor with preview mode (FR13)

**Given** story file path is valid
**When** file opens
**Then** Markdown preview is shown (not raw text)

**Given** story file doesn't exist
**When** user clicks card
**Then** error notification shows with guidance

---

### Story 5.7: Kanban Auto-Refresh

As a **user**,
I want **the Kanban board to automatically refresh when files change**,
So that **I always see current status without manual refresh**.

**Acceptance Criteria:**

**Given** Kanban board is open
**And** FileWatcherService detects changes to story or epic files
**When** debounced change event fires
**Then** KanbanProvider reloads data from ParserService
**And** sends updated data to WebView via PostMessage (FR14)
**And** update completes in <300ms (NFR-P3)

**Given** board receives new data
**When** Svelte store updates
**Then** UI re-renders with new data
**And** scroll position is maintained (NFR-R5)

---

### Story 5.8: Workflow Progress Bar

As a **user**,
I want **to see a workflow progress bar above the Kanban**,
So that **I know where I am in the overall BMAD process**.

**Acceptance Criteria:**

**Given** Kanban board is open
**When** the header section renders
**Then** a progress bar shows BMAD phases: Planning | Solutioning | Implementation | Testing (FR15)
**And** current phase is highlighted based on artifact presence

**Given** planning artifacts exist but no implementation artifacts
**When** progress is calculated
**Then** "Solutioning" or appropriate phase is highlighted (FR25)

**And** progress calculation uses artifact file detection logic

---

### Story 5.9: Epic Filter in Stories View

As a **user**,
I want **to filter stories by epic**,
So that **I can focus on one epic at a time**.

**Acceptance Criteria:**

**Given** Stories view is active
**When** an epic filter is applied (via epic card click or dropdown)
**Then** only stories belonging to that epic are shown (FR12)

**Given** filter is active
**When** user clears filter
**Then** all stories from all epics are shown

**And** filter state is visually indicated (badge or highlight)
**And** filtering happens client-side in Svelte (no re-fetch)

---

## Epic 6: Agent Launcher & Workflow Guidance

**Goal:** Users can launch any BMAD agent directly from VS Code without memorizing commands.

### Story 6.1: AgentParserService - Discover Agents

As a **developer**,
I want **a service that discovers available agents from the file system**,
So that **the Agent Launcher can show a dropdown of agents**.

**Acceptance Criteria:**

**Given** `_bmad/bmm/agents/` folder exists with agent markdown files
**When** AgentParserService.discoverAgents() is called
**Then** it returns array of Agent objects with:
- name (from filename or frontmatter)
- displayName
- description
- filePath (FR18)

**And** discovery completes in <100ms (NFR-P4)
**And** handles nested folders (e.g., `agents/tech-writer/tech-writer.md`)

---

### Story 6.2: AgentParserService - Parse Commands

As a **developer**,
I want **to parse agent commands from agent markdown files**,
So that **users can see available commands in a dropdown**.

**Acceptance Criteria:**

**Given** an agent markdown file with `<menu>` section
**When** AgentParserService.parseCommands(agentFile) is called
**Then** it extracts:
- Command code (e.g., "CP", "MH")
- Command description (e.g., "Create PRD")
- Full menu item text (FR19)

**Given** agent file has no menu section
**When** parseCommands is called
**Then** it returns empty array (graceful handling)

---

### Story 6.3: Agent Launcher UI Component

As a **user**,
I want **an Agent Launcher panel with dropdown selectors**,
So that **I can easily select and launch any agent**.

**Acceptance Criteria:**

**Given** sidebar panel is open
**When** Agent Launcher section renders
**Then** it shows:
- Agent dropdown populated from AgentParserService (FR17)
- Command dropdown (populated when agent selected)
- Model dropdown (populated from VS Code) (FR20)
- Custom prompt text field (FR21)
- "Lancia in Chat" button

**Given** user selects an agent
**When** agent selection changes
**Then** Command dropdown updates with that agent's commands

**And** dropdowns use VS Code styling
**And** component is keyboard accessible (NFR-A4)

---

### Story 6.4: CopilotService - Chat Integration

As a **developer**,
I want **a service that launches agents in GitHub Copilot Chat**,
So that **the "Lancia in Chat" button works**.

**Acceptance Criteria:**

**Given** Copilot Chat API is available
**When** CopilotService.launchAgent({ agent, command, model, prompt }) is called
**Then** it opens Copilot Chat with:
- Agent mode pre-selected
- Command pre-filled
- Custom prompt appended (FR22)

**Given** Copilot Chat API is NOT available
**When** CopilotService.launchAgent() is called
**Then** it opens standard Chat with pre-filled text as fallback (FR23)

**And** graceful degradation is logged
**And** user is notified if Copilot not installed

---

### Story 6.5: Model Selector Integration

As a **user**,
I want **to select which AI model to use for the agent**,
So that **I can choose Claude, GPT-4, or other available models**.

**Acceptance Criteria:**

**Given** Agent Launcher is rendered
**When** model dropdown is populated
**Then** it shows available AI models from VS Code API (FR20)

**Given** no models are available (fallback)
**When** dropdown renders
**Then** it shows "Default" or appropriate fallback option

**And** selected model is passed to CopilotService.launchAgent()

---

### Story 6.6: Custom Prompt Field

As a **user**,
I want **to add custom context or questions when launching an agent**,
So that **I can guide the agent with additional information**.

**Acceptance Criteria:**

**Given** Agent Launcher is rendered
**When** user types in custom prompt field
**Then** text is captured in component state (FR21)

**Given** user clicks "Lancia in Chat" with custom prompt
**When** CopilotService.launchAgent() is called
**Then** custom prompt is included in the chat context

**And** custom prompt is sanitized before use (NFR-S3)
**And** field supports multi-line input

---

### Story 6.7: Workflow Progress Tracker

As a **user**,
I want **to see a "you are here" indicator in the BMAD workflow**,
So that **I always know what phase my project is in**.

**Acceptance Criteria:**

**Given** sidebar panel is open
**When** workflow tracker section renders
**Then** it shows BMAD workflow phases:
- Analysis
- Planning
- Solutioning
- Implementation
- Testing (FR24)

**Given** project has artifacts in planning-artifacts but no implementation
**When** state is derived
**Then** "Solutioning" or appropriate phase is highlighted

**And** state derivation uses file presence detection (FR25)
**And** tracker updates when artifacts change (via FileWatcherService)
