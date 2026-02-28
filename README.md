# BMAD Method — VS Code Extension

A Visual Studio Code extension that brings the [BMAD Method](https://docs.bmad-method.org) workflow directly into your editor. Manage epics and stories with a Kanban board, launch AI agents through GitHub Copilot Chat, track workflow progress, and initialize new BMAD projects — all without leaving VS Code.

---

## Features

### Sidebar Panel (Progressive UI)
The BMAD sidebar adapts to the state of your project:

- **Fresh state** — No `_bmad/` folder detected. Shows onboarding actions: Brainstorm, I have an idea, I have docs.
- **In Progress state** — Project initialized, planning artifacts present. Shows the artifact file tree with clickable links.
- **Epics Ready state** — Epics file detected. Shows a link to open the Kanban board.

### Kanban Board
A full-featured Kanban view (opens as an editor tab) with:

- **Epics View** — Cards grouped into Backlog / In Progress / Done columns, with status derived automatically from story progress.
- **Stories View** — Cards grouped into Backlog / In Progress / Review / Done columns.
- **Dual-tab navigation** — Switch between Epics and Stories views instantly. Clicking an epic auto-filters the Stories view.
- **Workflow progress bar** — Visual indicator of overall BMAD workflow completion.
- **Markdown preview on click** — Clicking a story card opens the rendered Markdown preview.
- **Auto-refresh** — The board reacts to file changes in `_bmad-output/` automatically.

### Agent Launcher
A UI component that lets you dispatch BMAD agents directly into GitHub Copilot Chat:

- Select the **agent** (parsed dynamically from your `_bmad/` agent files).
- Select the **model** (integrated with VS Code's available models).
- Select the **command** (parsed from agent command definitions).
- Optionally add a **custom prompt**.
- Click **Launch in Chat** to open Copilot Chat with the agent mode, command, and context pre-populated.

### Project Initialization
- Detects whether `_bmad/` exists in the current workspace.
- If not found, provides a one-click **"Start New BMAD Project"** button that runs `npx bmad-method install` in the integrated terminal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension host | TypeScript, VS Code API |
| Webviews (Sidebar & Kanban) | Svelte 5, Vite |
| Webview UI primitives | `@vscode/webview-ui-toolkit` |
| YAML/frontmatter parsing | `gray-matter`, `yaml` |
| Build | esbuild (extension), Vite (webviews) |
| Tests | Vitest |

---

## Project Structure

```
vscode-bmad/
├── src/
│   ├── extension.ts                  # Activation entry point
│   ├── providers/
│   │   ├── SidebarProvider.ts        # Sidebar WebView provider
│   │   ├── KanbanProvider.ts         # Kanban WebView panel provider
│   │   └── SidebarTreeProvider.ts
│   ├── services/
│   │   ├── AgentParserService.ts     # Discover agents & parse commands
│   │   ├── ConfigService.ts          # Parse _bmad/bmm/config.yaml
│   │   ├── CopilotService.ts         # Launch agents in Copilot Chat
│   │   ├── EpicsParser.ts            # Parse epics.md structure
│   │   ├── ErrorService.ts           # Centralized error handling
│   │   ├── FileWatcherService.ts     # Watch _bmad-output/ for changes
│   │   ├── ModelService.ts           # VS Code model integration
│   │   ├── ParserService.ts          # YAML frontmatter extraction
│   │   ├── ShellService.ts           # Shell detection
│   │   ├── StateService.ts           # State persistence across reloads
│   │   ├── StoryParser.ts            # Scan and parse story files
│   │   ├── TerminalService.ts        # Terminal command execution
│   │   └── WorkflowProgressService.ts
│   ├── shared/                       # Shared message types & data models
│   └── utils/
├── webviews/
│   ├── sidebar/                      # Svelte app for the sidebar panel
│   └── kanban/                       # Svelte app for the Kanban board
├── tests/
│   ├── fixtures/
│   └── unit/
└── _bmad-output/                     # BMAD project artifacts (auto-generated)
    ├── planning-artifacts/
    └── implementation-artifacts/
```

---

## Development Status

The project follows the BMAD Method's own epic/story workflow. Current status as of **2026-02-28**:

| Epic | Description | Status |
|------|-------------|--------|
| Epic 1 | Extension Foundation & Project Detection | In Progress |
| Epic 2 | Project Initialization | **Done** |
| Epic 3 | Sidebar Panel & Progressive UI | In Progress |
| Epic 4 | File Parsing & State Management | **Done** |
| Epic 5 | Kanban Board | In Progress |
| Epic 6 | Agent Launcher & Workflow Guidance | In Progress |

Stories for Epics 5 and 6 are in the **review** stage. The core architecture is fully in place and functional.

---

## Getting Started (Development)

### Prerequisites

- Node.js 18+
- VS Code 1.85+

### Install dependencies

```bash
npm install
cd webviews/sidebar && npm install
cd webviews/kanban && npm install
```

### Build

```bash
# Full build (extension + webviews)
npm run build

# Development watch mode
npm run watch
```

### Run tests

```bash
npm test
```

### Launch the extension

Press `F5` in VS Code to open a new Extension Development Host window.

---

## Key Commands

| Command | Keybinding | Description |
|---------|-----------|-------------|
| `BMAD: Open Kanban Board` | `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` | Opens the Kanban board as an editor tab |
| `Start New BMAD Project` | — | Initializes a new BMAD project in the workspace |
| `BMAD: Refresh Sidebar` | — | Forces a sidebar refresh |

---

## Related

- [BMAD Method Documentation](https://docs.bmad-method.org)
- [BMAD Workflow Map](https://docs.bmad-method.org/reference/workflow-map/)

---

## License

MIT
