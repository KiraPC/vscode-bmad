---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-02-12.md
date: 2026-02-12
author: Pasquale
project_name: vscode-bmad
---

# Product Brief: vscode-bmad

## Executive Summary

**vscode-bmad** is a VS Code extension that brings the BMAD Method workflow directly into the developer's IDE. It eliminates the cognitive overhead of remembering complex workflows and commands, provides unified visibility into story status through an integrated Kanban board, and embeds interactive documentation - all without leaving VS Code.

The extension targets all users of the BMAD Method, from newcomers struggling to remember installation commands to experienced practitioners frustrated by scattered story files and invisible state changes. By integrating workflow guidance, story management, and agent launching into a single panel, vscode-bmad transforms the fragmented BMAD experience into a cohesive, productive flow.

---

## Core Vision

### Problem Statement

Developers using BMAD Method face a fragmented workflow experience that creates unnecessary friction. The methodology is powerful but complex, requiring users to constantly reference external documentation for commands and workflow steps.

### Problem Impact

- **Cognitive overload**: Users cannot remember all commands and workflow sequences
- **Invisible state changes**: When agents modify story status, changes go unnoticed in scattered files
- **Lost productivity**: Context switching between VS Code and documentation breaks flow
- **No unified view**: Stories exist as isolated markdown files with no visual tracking

### Why Existing Solutions Fall Short

Currently, BMAD users rely on:
- Browser-based documentation (constant context switching)
- Memory (unreliable for complex workflows)
- Manual file navigation (time-consuming, error-prone)
- No project management tooling (zero visibility into progress)

No extension exists specifically for BMAD Method integration.

### Proposed Solution

A VS Code extension featuring:
1. **Embedded Workflow Guide** - Interactive WebView showing "you are here" workflow navigation
2. **Kanban Board** - Visual story management with drag-drop that auto-updates frontmatter
3. **Agent Launcher** - One-click access to agents with context injection
4. **Progressive UI** - Panel evolves based on project state (Fresh → In Progress → Epics Ready)

### Key Differentiators

| Differentiator | Description |
|----------------|-------------|
| **First-to-market** | No VS Code extension exists for BMAD Method |
| **Deep integration** | Reads config.yaml, parses epics.md, syncs with implementation-artifacts |
| **Bidirectional sync** | Kanban changes update files, file changes update Kanban |
| **Zero context switch** | Documentation, workflow, stories - all inside VS Code |

---

## Target Users

### Primary Users

**1. The BMAD Newcomer**
- **Profile:** Developers new to BMAD Method who struggle to remember commands and workflow sequences
- **Pain Points:** Cognitive overload from complex methodology, constant need to reference documentation, fear of making mistakes
- **How vscode-bmad Helps:** Embedded workflow guide eliminates memorization, provides "you are here" navigation, one-click commands
- **Success Moment:** "I can focus on building instead of remembering steps!"

**2. The BMAD Practitioner**
- **Profile:** Experienced BMAD users (solo or team) who know the methodology but are frustrated by tooling gaps
- **Pain Points:** Context switching to documentation, scattered story files with no unified view, invisible state changes from agents
- **How vscode-bmad Helps:** Kanban board provides instant visibility, drag-drop updates files automatically, everything in one place
- **Success Moment:** "Finally, I can see all my stories at a glance!"

**3. The Tech Lead**
- **Profile:** Technical leaders overseeing teams using BMAD Method
- **Pain Points:** Difficulty tracking team progress across scattered files, ensuring process consistency
- **How vscode-bmad Helps:** Unified project view, workflow tracking, team visibility into epic and story status
- **Success Moment:** "Now I can see the whole project status instantly!"

### User Journey

**Discovery → Adoption:**
1. **Discovery:** User finds extension in VS Code marketplace or through BMAD Method documentation
2. **First Launch:** Extension detects existing `_bmad/` folder or offers "Start New BMAD Project" wizard
3. **Initial Value:** Progressive panel shows relevant actions based on project state (Fresh/In Progress/Epics Ready)
4. **Core Usage:** User accesses embedded docs, launches agents, manages stories via Kanban - all without leaving VS Code
5. **Long-term:** Extension becomes central hub for BMAD workflow, eliminating friction and fragmentation

---

## Success Metrics

### User Success Indicators

**Primary Success Signals:**

1. **Immediate Value Realization**
   - Users open Kanban board within first 5 minutes of installation
   - Successful project initialization via one-click wizard
   - Zero external documentation lookups during first session

2. **Core Engagement Metrics**
   - Kanban board opened every coding session
   - Stories viewed and managed through board instead of file navigation
   - Agents launched directly from extension panel

3. **Workflow Integration**
   - Daily active usage - extension becomes part of regular workflow
   - Reduced context switching (no browser tabs for BMAD docs)
   - Story status updates via drag-drop instead of manual file editing

4. **User Satisfaction**
   - Users report "can't work without it" sentiment
   - Immediate perceived value - no learning curve required
   - Positive marketplace reviews highlighting time savings

### Business Objectives

**Current Focus:** User value and adoption over monetization

- **Short-term:** Build a useful tool that solves real problems for BMAD users
- **Long-term:** Establish as the standard VS Code extension for BMAD Method workflows
- Revenue model: Not a priority at this stage

### Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| **First-session success** | 80%+ complete initial setup | Wizard completion rate |
| **Feature adoption** | 90%+ open Kanban in first week | Board open events |
| **Daily retention** | 70%+ return daily | Active users per day |
| **Engagement depth** | 5+ board interactions per session | Drag-drop, click events |
| **User satisfaction** | 4.5+ stars average | Marketplace ratings |

---

## MVP Scope

### Core Features

**Must-Have MVP Features (P0):**

1. **Project Initialization**
   - One-Click Install: "Start New BMAD Project" button executes `npx bmad-method install`
   - Config-Driven Detection: Reads `_bmad/bmm/config.yaml` to detect project state and file paths

2. **Sidebar WebView Panel**
   - Progressive Panel Evolution: UI adapts based on project state (Fresh → In Progress → Epics Ready)
   - Three initial buttons for fresh projects: [🧠 Brainstorm] [💡 Ho un'idea] [📄 Ho docs]
   - Clickable file tree that opens files in editor

3. **Kanban Board Management**
   - Kanban as Editor Tab: WebView opens in editor tab, not sidebar
   - Dual-View Navigation: [Epics] and [Stories] tabs with seamless switching
   - Tab-Based View Switching: Clean tab interface at top of Kanban view
   - Story States Mapping: Backlog → In Progress → Review → Done columns
   - Derived Epic Status: Epic status calculated automatically from child stories
   - Markdown Preview on Click: Click story card opens rendered preview, not source

4. **Agent Integration**
   - Agent Launcher UI: Dropdown for Agent + Model + Command + Custom Prompt
   - Command Discovery: Commands parsed dynamically from agent files
   - Model Selector: Dropdown of available models in VS Code
   - "Lancia in Chat" button: Opens Copilot Chat with agent mode, command, and context

5. **Workflow Tracking**
   - Workflow Progress Tracker: "You are here" visual indicator in BMAD process
   - Progress Detection: State derived from presence/absence of artifact files
   - Kanban + Progress Combo: Progress bar displayed above Kanban columns

### Out of Scope for MVP

**Should Have (P1) - Deferred to v1.1:**
- Drag-and-Drop Status: Drag stories between columns to update status (with confirmation dialog)
- Auto-Context Injection: Agent automatically receives story + epic + architecture as context
- Story Quick Actions: Right-click menu on story cards
- Document Import Flow: Dialog to upload existing documents

**Nice to Have (P2) - Future Versions:**
- Export Kanban to Image: Screenshot for standup meetings or documentation
- Story as GitHub Issue: "Create GitHub Issue" button from story card
- Reverse Flow options: Story-first workflow, generating epics from grouped stories
- Minimal Doc Access: Discrete "?" icon linking to docs.bmad-method.org

### MVP Success Criteria

**Launch Readiness:**
- Project initialization works for both fresh and existing BMAD projects
- Kanban displays epics and stories accurately from markdown files
- Agent launcher successfully opens Copilot Chat with correct parameters
- All UI states (Fresh/In Progress/Epics Ready) display correctly

**User Validation:**
- 5+ beta testers successfully use extension end-to-end
- Zero critical bugs in core functionality
- Positive feedback on Kanban usability and agent integration
- Users report immediate value and reduced context switching

**Decision Point:**
- If users adopt core features (80%+ Kanban usage, 70%+ agent launches), proceed to v1.1
- If feedback indicates MVP scope too large, reduce and re-release
- If critical feature missing, add before wider release

### Future Vision

**v1.1 - Enhanced Interactivity (Q2 2026):**
- Drag-drop story status updates with frontmatter auto-save
- Auto-context injection for agents
- Story quick actions menu

**v2.0 - Collaboration Features (Q3 2026):**
- Team visibility: see who's working on what story
- Export capabilities: Kanban to image, stories to GitHub Issues
- Sync with external project management tools

**v3.0+ - AI-Powered Intelligence (2027):**
- Story recommendations based on project context
- Automated epic generation from loose stories
- Workflow optimization suggestions based on team patterns
- Integration with CI/CD for automatic story status updates

**Long-term Vision:**
- Become the de facto VS Code extension for BMAD Method
- Expand to support multiple project management methodologies
- Marketplace for community-contributed agents and workflows
- Enterprise features: team analytics, compliance reporting, advanced integrations




