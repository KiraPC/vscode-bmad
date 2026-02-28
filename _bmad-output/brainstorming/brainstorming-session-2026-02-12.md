---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'VS Code Extension for BMAD Method'
session_goals: 'Create an integrated extension for developing with BMAD in VS Code - project initialization, Kanban for epics/stories, agent/command selection, workflow guidance'
selected_approach: 'AI-Recommended'
techniques_used: ['Role Playing', 'SCAMPER Method', 'Decision Tree Mapping']
ideas_generated: 39
context_file: '{project-root}/_bmad/bmm/data/project-context-template.md'
status: 'complete'
completedAt: '2026-02-12'
---

# Brainstorming Session Results

**Facilitator:** Pasquale
**Date:** 2026-02-12

## Session Overview

**Topic:** VS Code Extension for BMAD Method

**Goals:**
- Create an integrated experience for developing with BMAD directly in VS Code
- Project initialization (detect _bmad folder, new project wizard)
- Kanban visualization for epics and stories
- Agent selection and command dispatch with custom prompt
- Workflow guidance based on docs.bmad-method.org/reference/workflow-map/

### Context Guidance

Focus on software and product development considerations:
- User Problems and Pain Points
- Feature Ideas and Capabilities
- Technical Approaches
- User Experience
- Business Model and Value
- Market Differentiation
- Technical Risks and Challenges
- Success Metrics

### Session Setup

**Selected Approach:** AI-Recommended Techniques — personalized suggestions based on the project's specific goals.

---

## Phase 1: Role Playing (Completed)

### Persona 1: Newbie Developer

**Ideas Generated:**

| # | Idea | Description |
|---|------|-------------|
| 1 | One-Click Install | "Start New BMAD Project" button → runs `npx bmad-method install`. Zero config upfront. |
| 2 | Minimal Doc Access | Subtle "?" icon linking to docs.bmad-method.org |
| 3 | Auto-Guided First Step | Post-install, automatic guidance to the first step of the workflow-map |
| 4 | Extension Panel First | Sidebar WebView with 3 initial buttons, not immediate chat |
| 5 | Sidebar WebView Panel | Rich UI in WebView, not a limited TreeView |
| 6 | Progressive Panel Evolution | UI that evolves: Fresh → In Progress → Epics Ready |
| 7 | Document Import Flow | "I already have documents" → dialog to import existing files |
| 8 | Clickable File Tree | Clickable files in the panel → open in editor |
| 9 | Kanban as Editor Tab | [Epics] button opens WebView in an editor tab |
| 10 | Config-Driven Epic Detection | Reads config.yaml to find epics path |

### Persona 2: Experienced BMAD Developer

**Ideas Generated:**

| # | Idea | Description |
|---|------|-------------|
| 11 | BMAD File Structure | epics.md in planning-artifacts, stories in implementation-artifacts |
| 12 | Dual-Source Story Parsing | Parse epics.md + match with implementation files |
| 13 | BMAD File Structure Understanding | Status trackable in frontmatter |
| 14 | Kanban State Derivation | State derived from file presence/content |
| 15 | Story States Mapping | Backlog/In Progress/Review/Done |
| 16 | Derived Epic Status | Epic status calculated from its stories |
| 17 | Dual-View Kanban Navigation | Epics View ↔ Stories View with filter |
| 18 | Tab-Based View Switching | [Epics] [Stories] tabs at the top |
| 19 | Agent Launcher UI | Dropdown: Agent + Model + Command + Custom Prompt |
| 20 | Command Discovery | Commands dynamically parsed from agent files |
| 21 | Model Selector | Dropdown of available models in VS Code |
| 22 | Workflow Progress Tracker | "You are here" view in the BMAD process |
| 23 | Progress Detection | State derived from presence of artifact files |
| 24 | Story Quick Actions | Contextual menu on story card |
| 25 | Story → Dev Agent Integration | One click from Kanban to implementation |

---

## Phase 2: SCAMPER Method (Completed)

### S - Substitute
*Decision: maintain defined architecture, no substitution needed*

### C - Combine

| # | Idea | Description |
|---|------|-------------|
| 26 | Kanban + Progress Combo | Workflow progress bar above Kanban columns |
| 27 | Auto-Context Injection | Agent receives story + epic + architecture as automatic context |

### A - Adapt

| # | Idea | Description |
|---|------|-------------|
| 28 | Adapt VS Code Patterns | Use familiar patterns: Source Control style, Problems panel, Command Palette |
| 29 | Drag-and-Drop Status | Drag story between columns → updates Status in the .md file |

### M - Modify

| # | Idea | Description |
|---|------|-------------|
| 30 | Modify Story Status via Drag | Drag-drop automatically updates frontmatter |
| 31 | Modify Panel Size | Collapsible sidebar, mini mode with icons only |

### P - Put to Other Uses

| # | Idea | Description |
|---|------|-------------|
| 32 | Export Kanban to Image | Screenshot for standup meetings or documentation |
| 33 | Story as GitHub Issue | "Create GitHub Issue" button from story card |

### E - Eliminate

| # | Idea | Description |
|---|------|-------------|
| 34 | Eliminate Menu Memorization | Dropdown eliminates the need to remember BP, CB, MR codes |
| 35 | Eliminate Manual File Navigation | Everything accessible from panel, no manual navigation |

### R - Reverse

| # | Idea | Description |
|---|------|-------------|
| 36 | Reverse Flow - Story First | Start from a single Story and build upward |
| 37 | Reverse: Stories Generate Epics | Group loose stories into suggested epics |

### Additional Ideas from Discussion

| # | Idea | Description |
|---|------|-------------|
| 38 | Markdown Preview on Click | Click story → opens rendered Markdown Preview, not source |
| 39 | Drag Confirmation Dialog | Confirmation dialog before updating status via drag |

---

## Phase 3: Decision Tree Mapping (Completed)

### Main Application Flow

```
┌─────────────────────┐
│   Open VS Code      │
│   with workspace    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  BMAD Extension     │
│  checks _bmad/      │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
┌─────▼─────┐ ┌─▼───────────┐
│ NOT FOUND │ │   FOUND     │
│ (Fresh)   │ │ (Existing)  │
└─────┬─────┘ └─────┬───────┘
      │             │
┌─────▼─────┐ ┌─────▼───────┐
│  "Start   │ │ Load config │
│ Project"  │ │ Parse state │
└─────┬─────┘ └─────┬───────┘
      │             │
      └──────┬──────┘
             │
┌────────────▼────────────┐
│ Show Panel Based on     │
│ State: Fresh/Progress/  │
│ Epics Ready             │
└─────────────────────────┘
```

### Kanban Flow

```
Click [Epics] → Open Kanban Tab (WebView Editor)
              → Parse epics.md + implementation-artifacts/
              → Show [Epics] [Stories] tabs + Progress Bar

EPICS VIEW                    STORIES VIEW
├─ Backlog | Progress | Done  ├─ Backlog | Progress | Review | Done
├─ Click Epic → Switch to     ├─ Filter chip [✕ Epic X]
│  Stories + auto-filter      ├─ Click Story → MD Preview
└─ Derived status from        └─ Drag → Confirm → Update Status
   stories
```

### Agent Launcher Flow

```
Entry Points:
├─ Sidebar [🎭 Agents] button
└─ Kanban Right-click → "Dev with Agent"
         │
         ▼
┌─────────────────────────┐
│ AGENT LAUNCHER UI       │
├─────────────────────────┤
│ Agent:  [▼ Dropdown]    │
│ Model:  [▼ Dropdown]    │
│ Command:[▼ Dropdown]    │
│ Custom Prompt: [____]   │
├─────────────────────────┤
│ [Launch in Chat]        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Open Copilot Chat with  │
│ agent mode + command +  │
│ context attached        │
└─────────────────────────┘
```

### Fresh Project Flow

```
STATE: Fresh (3 buttons)
├─ [🧠 Brainstorm]   → Chat + Analyst + BP command
├─ [💡 I have an idea] → Chat + Analyst + CB command
└─ [📄 I have docs]  → File Picker → Copy to planning-artifacts/
         │
         ▼
Panel updates to "In Progress" state
```

---

## Session Summary

### Total Ideas Generated: 39

### Key Feature Categories

| Category | Ideas | Priority |
|----------|-------|----------|
| **Onboarding & Init** | #1-7 | MVP |
| **File & Config Management** | #8-14, #35 | MVP |
| **Kanban Board** | #15-18, #26, #29-30, #38-39 | MVP |
| **Agent Integration** | #19-21, #24-25, #27, #34 | MVP |
| **Workflow Tracking** | #22-23 | MVP |
| **Advanced Features** | #28, #31-33, #36-37 | Nice-to-have |

### MVP Feature Set (Prioritized)

**Must Have (P0):**
1. One-Click Install (#1)
2. Sidebar WebView Panel (#5)
3. Progressive Panel Evolution (#6)
4. Kanban as Editor Tab (#9)
5. Config-Driven Detection (#10)
6. Story States Mapping (#15)
7. Derived Epic Status (#16)
8. Dual-View Kanban (#17)
9. Tab-Based View Switching (#18)
10. Agent Launcher UI (#19)
11. Workflow Progress Tracker (#22)
12. Markdown Preview on Click (#38)

**Should Have (P1):**
1. Drag-and-Drop Status (#29, #30, #39)
2. Command Discovery from agents (#20)
3. Model Selector (#21)
4. Story Quick Actions (#24)
5. Auto-Context Injection (#27)
6. Kanban + Progress Combo (#26)

**Nice to Have (P2):**
1. Document Import Flow (#7)
2. Export Kanban to Image (#32)
3. Story as GitHub Issue (#33)
4. Reverse Flow options (#36, #37)

### Technical Architecture Summary

```
vscode-bmad-extension/
├── src/
│   ├── extension.ts              # Entry point, activation
│   ├── providers/
│   │   ├── SidebarProvider.ts    # Main sidebar WebView
│   │   ├── KanbanProvider.ts     # Kanban WebView panel
│   │   └── AgentLauncherProvider.ts
│   ├── parsers/
│   │   ├── ConfigParser.ts       # Parse _bmad/bmm/config.yaml
│   │   ├── EpicsParser.ts        # Parse epics.md
│   │   └── StoryParser.ts        # Parse implementation-artifacts/
│   ├── models/
│   │   ├── Epic.ts
│   │   ├── Story.ts
│   │   └── AgentCommand.ts
│   ├── webviews/
│   │   ├── sidebar/              # Svelte components
│   │   └── kanban/               # Svelte components
│   └── utils/
│       ├── fileWatcher.ts        # Watch _bmad-output changes
│       └── copilotIntegration.ts # Launch agents in chat
├── package.json
└── README.md
```

### Next Steps

1. **Create Product Brief** → Use Analyst agent with this brainstorming as input
2. **Create PRD** → Detail all MVP features with acceptance criteria
3. **Architecture Design** → Technical spec for VS Code extension
4. **Epic & Story Breakdown** → Implementation plan

---

**Session Completed:** 2026-02-12
**Duration:** ~45 minutes
**Techniques Used:** Role Playing, SCAMPER, Decision Tree Mapping
**Facilitator:** Mary (Business Analyst Agent)

