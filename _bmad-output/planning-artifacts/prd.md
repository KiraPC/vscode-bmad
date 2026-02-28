---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-vscode-bmad-2026-02-12.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-12.md'
workflowType: 'prd'
project_name: 'vscode-bmad'
author: 'Pasquale'
date: '2026-02-12'
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: developer_tool
  domain: general
  complexity: low-medium
  projectContext: greenfield
---

# Product Requirements Document - vscode-bmad

**Author:** Pasquale
**Date:** 2026-02-12

## Success Criteria

### User Success

**Primary Success Signals:**

**1. Immediate Value Realization**
- Users open Kanban board within first 5 minutes of installation
- Successful project initialization via one-click wizard on first launch
- Zero external documentation lookups during first coding session with the extension

**2. The "Aha!" Moments**
- **BMAD Newcomer:** "I can focus on building instead of remembering steps!" - experienced when launching first agent via dropdown without memorizing command codes
- **BMAD Practitioner:** "Finally, I can see all my stories at a glance!" - experienced when opening Kanban and seeing visual project status instantly
- **Tech Lead:** "Now I can see the whole project status instantly!" - experienced when viewing Epic progress derived from story states

**3. Core Engagement Patterns**
- Kanban board opened every coding session (daily active usage)
- Stories viewed and managed through board instead of manual file navigation
- Agents launched directly from extension panel instead of remembering chat commands
- Extension becomes part of regular workflow within first week

**4. Workflow Integration Success**
- Reduced context switching: no browser tabs open for BMAD docs during development
- Story status updates performed via Kanban (not manual file editing)
- Users report "can't work without it" sentiment after 2 weeks of usage

### Business Success

**Short-term (3 months):**
- Complete MVP development with all P0 features functional
- 5+ beta testers successfully complete end-to-end workflows (init → Kanban → agent launch)
- Zero critical bugs in core functionality (project init, Kanban display, agent integration)
- Positive qualitative feedback: users report time savings and reduced friction

**Medium-term (6-12 months):**
- Public launch on VS Code Marketplace
- Achieve 4.5+ stars average rating from early adopters
- 100+ active installations with 70%+ daily retention rate
- Establish as the standard VS Code extension for BMAD Method workflows

**Long-term Vision:**
- Become essential tooling for all BMAD Method users
- Community contributions: custom agents and workflows
- Enterprise adoption: team analytics and advanced integrations

**Revenue Model:** Not a priority at this stage - focus is on user value and adoption.

### Technical Success

**Performance:**
- Kanban renders <500ms for projects with up to 50 stories
- File system watching detects changes within 100ms
- WebView panel loads in <300ms on extension activation

**Reliability:**
- Zero data loss in file system sync (frontmatter updates are atomic)
- Graceful degradation when config.yaml or artifact files are malformed
- Extension never crashes VS Code (robust error handling)

**Compatibility:**
- Supports VS Code version 1.85.0+ (stable API surface)
- Works on macOS, Windows, Linux (cross-platform file path handling)
- Compatible with GitHub Copilot Chat API for agent launching

**Maintainability:**
- Clean separation between parsers, providers, and WebView components
- TypeScript with strict typing for core logic
- Svelte for WebView UI (reactive, maintainable)
- Comprehensive error logging for debugging user issues

**Extensibility:**
- Modular architecture allows future feature additions without core refactoring
- Clear API boundaries for potential community extensions

### Measurable Outcomes

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **First-session success** | 80%+ complete initial setup | Track wizard completion events via telemetry |
| **Feature adoption** | 90%+ open Kanban in first week | Track Kanban panel open events |
| **Daily retention** | 70%+ return daily after first week | Active users per day metric |
| **Engagement depth** | 5+ board interactions per session | Track clicks, card opens, tab switches |
| **User satisfaction** | 4.5+ stars average | VS Code Marketplace ratings and reviews |
| **Agent usage** | 50%+ launch agent via extension in first week | Track agent launcher button clicks |
| **Beta success** | 5+ testers complete full workflow | Manual tracking during beta phase |

## Product Scope

### MVP - Minimum Viable Product

**Must-Have Features (P0) - Beta Launch:**

1. **Project Initialization**
   - One-Click Install: "Start New BMAD Project" button executes `npx bmad-method install`
   - Config-Driven Detection: Reads `_bmad/bmm/config.yaml` to detect project state and artifact paths

2. **Sidebar WebView Panel**
   - Progressive Panel Evolution: UI adapts based on project state (Fresh → In Progress → Epics Ready)
   - Three initial buttons for fresh projects: [🧠 Brainstorm] [💡 Ho un'idea] [📄 Ho docs]
   - Clickable file tree that opens artifact files in editor

3. **Kanban Board Management**
   - Kanban as Editor Tab: WebView opens in editor area, not sidebar
   - Dual-View Navigation: [Epics] and [Stories] tabs with seamless switching
   - Story States Mapping: Backlog → In Progress → Review → Done columns
   - Derived Epic Status: Epic status calculated automatically from aggregated child story states
   - Markdown Preview on Click: Click story card opens rendered preview in editor

4. **Agent Integration**
   - Agent Launcher UI: Dropdown selectors for Agent + Model + Command + Custom Prompt field
   - Command Discovery: Commands parsed dynamically from agent markdown files
   - Model Selector: Dropdown of available AI models in VS Code
   - "Lancia in Chat" button: Opens GitHub Copilot Chat with agent mode, command, and optional context

5. **Workflow Tracking**
   - Workflow Progress Tracker: Visual "you are here" indicator in BMAD process workflow-map
   - Progress Detection: State derived from presence/absence of artifact files in planning and implementation folders
   - Kanban + Progress Combo: Progress bar displayed above Kanban columns

**MVP Success Criteria:**
- All P0 features functional and tested
- Works for both fresh and existing BMAD projects
- 5+ beta testers complete full workflow without blockers
- Zero critical bugs preventing core usage

### Growth Features (Post-MVP)

**Should Have (P1) - v1.1 Release (Q2 2026):**
- Drag-and-Drop Status Updates: Drag stories between columns to update status with confirmation dialog
- Auto-Context Injection: Agent automatically receives relevant story + epic + architecture as context when launched
- Story Quick Actions: Right-click context menu on story cards (edit, delete, create branch)
- Document Import Flow: Dialog to upload existing documents into planning-artifacts
- Enhanced Error Handling: Better feedback when files are malformed or missing

**Nice to Have (P2) - v2.0 and Beyond:**
- Export Kanban to Image: Screenshot functionality for standup meetings or documentation
- Story as GitHub Issue: "Create GitHub Issue" button from story card with auto-population
- Reverse Flow Options: Story-first workflow, generating epics from grouped loose stories
- Team Visibility: See who's working on what story (local annotation, no cloud sync)
- CI/CD Integration: Automatic story status updates based on branch/PR status

### Vision (Future)

**v3.0+ - AI-Powered Intelligence (2027+):**
- Story recommendations based on project context and patterns
- Automated epic generation from loose stories using AI clustering
- Workflow optimization suggestions based on team usage patterns
- Natural language story creation: describe feature → generated story structure
- Integration with external project management tools (Jira, Linear, etc.)
- Marketplace for community-contributed agents and custom workflows
- Enterprise features: team analytics dashboards, compliance reporting, advanced integrations

**Long-term Vision:**
- Become the de facto VS Code extension for BMAD Method (100% of BMAD users adopt it)
- Expand to support multiple project management methodologies beyond BMAD
- Community ecosystem: agents, workflows, and integrations contributed by users
- Enterprise-grade features for larger teams and organizations

## User Journeys

### Journey 1: The BMAD Newcomer - Marco's First Project

**Opening Scene: Monday Morning Confusion**

Marco è un frontend developer di 28 anni che ha appena unito un team che usa BMAD Method. Ha passato il weekend a leggere docs.bmad-method.org, prendendo appunti su comandi e workflow. Lunedì mattina, deve iniziare il suo primo progetto BMAD.

Apre VS Code. I suoi appunti dicono "npx bmad-method install" ma... dove lo esegue? Integrated terminal? Quale directory? E dopo? Quali file deve creare? In che ordine? Apre tre tab nel browser: workflow-map, agent reference, command cheatsheet.

**Punto di svolta:** Vede un collega usare vscode-bmad. "Aspetta, c'è un'extension?"

**Rising Action: Discovery Through Guidance**

Marco installa vscode-bmad dal Marketplace. Al reload, appare un sidebar panel con un pulsante grande: **[Start New BMAD Project]**. Lo clicca con speranza.

L'extension esegue automaticamente `npx bmad-method install`, crea la struttura `_bmad/`, e gli mostra un panel progressivo con tre opzioni chiare:
- [🧠 Brainstorm] 
- [💡 Ho un'idea]
- [📄 Ho docs]

Marco clicca [💡 Ho un'idea]. Il panel si espande mostrando un Agent Launcher con dropdown:
- Agent: **Analyst**
- Model: **Claude 3.5 Sonnet**  
- Command: **CB - Create Brief**
- Custom Prompt: _[vuoto]_

Clicca **[Lancia in Chat]**. GitHub Copilot Chat si apre con l'analyst agent già attivo, comando CB precaricato. Marco descrive la sua feature. L'agent lo guida nella creazione del product brief - nessun comando da ricordare, nessuna sintassi da verificare.

**Climax: The Moment of Liberation**

È giovedì. Marco sta implementando una storia. Ha bisogno dell'agent Dev per aiutarlo. Due settimane fa avrebbe: aperto browser → cercato "BMAD dev agent commands" → copiato sintassi → sperato di aver scritto giusto.

Oggi: apre sidebar → Agent Launcher → seleziona "Dev" → seleziona comando "DS - Dev Story" → clicca Lancia. 3 secondi. Zero cognitive load.

Realizza: **"Non ho aperto la documentazione da 3 giorni. Sto solo... costruendo."**

**Resolution: The New Normal**

Dopo due settimane con vscode-bmad:
- Marco lancia progetti BMAD con un click, non più panico da "cosa faccio per primo?"
- Gli agent sono accessibili come features native di VS Code
- Il workflow progress tracker gli mostra sempre "sei qui" - nessuna confusione su quale step seguire
- I suoi browser tab sono passati da 5+ (docs, cheatsheet, workflow) a 0

Marco ora mentora un nuovo developer: "Prima installa questa extension, ti cambia la vita."

---

### Journey 2: The BMAD Practitioner - Sofia's Visibility Problem

**Opening Scene: The Scattered Story Problem**

Sofia è una full-stack developer che usa BMAD Method da 8 mesi. Ha 3 progetti attivi, ciascuno con 12-20 storie in `_bmad-output/implementation-artifacts/`.

È martedì mattina. Il PM le chiede: "Quante storie sono In Progress? Quali sono bloccate in Review?"

Sofia apre File Explorer. Naviga a `implementation-artifacts/`. Clicca story-001.md → legge frontmatter → Status: In Progress. Clicca story-002.md → Status: Done. Clicca story-003.md...

Dopo 10 minuti: "3 In Progress, 2 In Review, ho dovuto aprire 18 file per saperlo."

**L'insight devastante:** Gli agent modificano gli story status automaticamente. Sofia non si accorge quando story-005 passa da "In Progress" a "Review" finché non apre casualmente quel file. **Le informazioni esistono ma sono invisibili.**

**Rising Action: Visual Awakening**

Sofia installa vscode-bmad dopo aver visto un tweet di un BMAD user. Al primo reload, il sidebar mostra il project state: "Epics Ready". C'è un pulsante: **[Open Kanban Board]**.

Clicca. Una WebView si apre nell'editor tab. Vede immediatamente:

**[Epics] [Stories]** - tab navigation  
**Workflow Progress:** Planning ✓ → Solutioning ✓ → Implementation (75%) → Testing (0%)

Colonne: **Backlog (8) | In Progress (3) | Review (2) | Done (12)**

Ogni story è una card con titolo, epic parent, assignee. Può vedere TUTTO in un colpo d'occhio.

**Sofia clicca tab [Epics]:** Vede le 4 epic del progetto. Epic 2 mostra "Status: In Progress (4/7 stories done)". Lo status è **derivato automaticamente** dalle storie child.

**Climax: The Moment of Control**

Venerdì standup. Il PM chiede la solita domanda: "Dove siamo con le storie?"

Sofia: *[apre Kanban in VS Code, condivide schermo]*  
"3 storie In Progress - qui le vedete. 2 In Review - queste. 4 storie completate questa settimana - queste qui in Done. Epic 1 completo, Epic 2 al 70%."

PM: "Quanto ci hai messo?"  
Sofia: "5 secondi."

Realizza: **"La mia gestione progetto è finalmente visuale. Non cerco più file a caso."**

**Resolution: The New Workflow**

Dopo un mese con vscode-bmad:
- Sofia apre Kanban ogni mattina come prima azione - è il suo project dashboard
- Quando un agent aggiorna uno story status, lo vede immediatamente nel board (file watcher auto-refresh)
- Ha smesso di navigare `implementation-artifacts/` manualmente - clicca card → Markdown preview opens
- Sta convincendo il team a adottare l'extension: "Non posso più lavorare senza vedere tutto in una board"

---

### Journey 3: The Tech Lead - Alessandro's Oversight Challenge

**Opening Scene: The Invisible Progress Problem**

Alessandro è tech lead di un team di 4 developer che usano BMAD Method su un progetto enterprise di 6 mesi. Ha 3 epic attive, 28 storie totali distribuite tra i developer.

Ogni mattina fa la stessa routine:
1. Chiede in Slack: "Update su storie?"
2. Aspetta risposte asincrone per 30+ minuti
3. Prova a correlate manualmente: "Ok, Epic 2 è al 60%? 70%? Boh."
4. Cerca di capire se ci sono blockers nascosti

**Il problema:** I developer lavorano in modo autonomo, modificano story status, committano codice. Alessandro **non ha visibilità in real-time**. Ogni epic status è nella sua testa, concatenato da Slack messages e meeting notes.

**Rising Action: Team Adoption**

Dopo aver testato vscode-bmad personalmente per 2 settimane, Alessandro chiede al team di installarlo. Obiettivo: unified visibility.

Ogni developer installa l'extension. Tutti condividono lo stesso workspace Git repo con `_bmad/` e artifact folders.

**Il setup è locale:** niente cloud sync, niente server centrale. Ogni developer usa la propria istanza vscode-bmad che legge gli stessi file markdown nel repo.

Lunedì mattina, standup virtuale:

Alessandro: *[condivide schermo - Kanban aperto in VS Code]*

**Epics View:**
- Epic 1: Authentication System - **Status: Done (7/7 stories)** ✓
- Epic 2: Dashboard UI - **Status: In Progress (4/9 stories)** 🟡
- Epic 3: API Integration - **Status: In Progress (2/8 stories)** 🟡

Alessandro **clicca Epic 2** → Kanban switcha a Stories view, filtrato automaticamente su Epic 2:
- Backlog: 3 stories
- In Progress: 2 stories (vede chi: story-012 assigned to Marco, story-015 assigned to Sofia)
- Review: 2 stories
- Done: 4 stories

**Climax: The Moment of Clarity**

Mercoledì pomeriggio. Alessandro apre VS Code per review codice. Apre Kanban board per controllare velocemente lo stato.

Nota: Story-015 è passata da "In Progress" a "Review" 20 minuti fa (file watcher ha rilevato il cambiamento nel frontmatter quando Sofia ha committato).

Clicca sulla card story-015 → Markdown preview opens nell'editor. Legge acceptance criteria, note, vede che è pronta per review.

Apre Agent Launcher → seleziona "Dev" agent → Command "CR - Code Review" → Custom Prompt: "Review story-015 implementation against acceptance criteria" → Lancia in Chat.

**Tutto senza lasciare VS Code. Tutto in < 2 minuti.**

Alessandro realizza: **"Ho visibilità completa del progetto senza meeting o Slack marathons. Posso agire immediatamente quando serve."**

**Resolution: The Leadership Advantage**

Dopo 6 settimane con vscode-bmad adoption nel team:

- **Daily standups ridotti da 30 a 15 minuti:** Alessandro mostra Kanban, team discute solo blockers
- **Visibilità real-time:** Quando un developer aggiorna story status (manualmente o via agent), tutti vedono il cambiamento al prossimo git pull + Kanban refresh
- **Decision making più veloce:** Alessandro vede immediatamente Epic progress derivato, identifica epic a rischio di slittamento
- **Zero overhead di coordinamento:** Niente più "chi sta lavorando su cosa?" - Kanban mostra tutto
- **Team autonomy + oversight:** Developer lavorano indipendentemente, Alessandro ha visibility senza micromanaging

Alessandro in una retro: "Questa extension ha reso BMAD Method scalabile per il team. Prima era caos organizzativo. Ora è chiaro."

---

### Journey Requirements Summary

Queste tre journey rivelano requisiti chiave per capability areas:

**1. Onboarding & Project Initialization**
- One-click project setup (Marco's journey)
- Progressive panel that adapts to project state
- Clear entry points for fresh vs existing projects
- Zero-config detection of BMAD structure

**2. Visual Story Management**
- Kanban board as central project dashboard (Sofia's journey)
- Dual-view navigation: Epics ↔ Stories with filtering
- Real-time status visibility across scattered files
- Derived epic status from child stories (Alessandro's journey)
- File watcher to detect changes and auto-refresh board

**3. Agent & Workflow Guidance**
- Agent Launcher with dropdown UI (Marco's journey)
- Command discovery without memorization
- Model selector integrated with VS Code
- Context injection into GitHub Copilot Chat
- Workflow progress tracker: "you are here" visibility

**4. File System Integration**
- Config-driven artifact path detection
- Markdown file parsing (frontmatter + content)
- Story card click → Markdown preview in editor
- Bidirectional sync: files change → board updates

**5. Team Collaboration (Local)**
- Multi-developer support via shared Git repo
- No cloud sync required - local instances read shared files
- Real-time visibility through file system watching
- Each developer uses own extension instance independently

**6. Performance & Reliability**
- Fast rendering for 50+ stories
- Robust frontmatter parsing with error handling
- Cross-platform compatibility (macOS, Windows, Linux)
- Graceful degradation when files are malformed

## Domain-Specific Requirements

### VS Code Marketplace Compliance

**Publication Requirements:**
- **Quality Standards:** Extension must meet VS Code Marketplace quality guidelines for acceptance
- **Content Policy:** No invasive telemetry, no advertisements, no content that violates Marketplace policies
- **Performance Monitoring:** Extensions that significantly slow VS Code startup or operation are flagged and may be rejected
- **Security Review:** Extensions using WebView, network requests, or command execution undergo enhanced security review
- **Bundle Size:** Target <10MB for optimal Marketplace acceptance and user download experience

**Versioning & Updates:**
- Follow semantic versioning (semver) for extension releases
- Provide clear changelog describing features, fixes, and breaking changes
- Support auto-update mechanism via VS Code's built-in extension updater

### VS Code Extension API Constraints

**WebView Security:**
- **Content Security Policy (CSP):** Strict CSP must be configured to prevent XSS attacks in Kanban WebView
- **Resource Loading:** Only allowlisted scripts and styles can be loaded in WebView
- **Message Passing:** Secure messaging between WebView and extension host using VS Code's postMessage API
- **Context Isolation:** WebView runs in isolated context with limited access to VS Code APIs

**GitHub Copilot Chat Integration:**
- Verify API availability - Copilot Chat API may be in proposed/preview state requiring special enablement
- Handle graceful fallback if Copilot Chat extension is not installed or API unavailable
- Use official VS Code Chat API interfaces when stable
- Test with multiple Copilot models (Claude, GPT-4, etc.) to ensure compatibility

**File System Operations:**
- **Watchers:** Use VS Code FileSystemWatcher API with targeted glob patterns - avoid watching entire workspace
- **Path Handling:** Use VS Code's Uri and path APIs for cross-platform file path resolution
- **Async Operations:** All file I/O must be async to avoid blocking main thread
- **Error Handling:** Graceful degradation when files are missing, malformed, or inaccessible

**Extension Activation:**
- Use `onStartupFinished` activation event to avoid impacting VS Code initial load time
- Lazy-load heavy dependencies (parsers, WebView content) only when needed
- Target <300ms activation time to maintain responsive user experience

### Performance Standards (VS Code Specific)

**Extension Startup:**
- **Activation Time:** <300ms from activation event to extension ready
- **Initial Load:** Defer all non-critical operations until after activation complete
- **Memory Footprint:** <50MB baseline memory usage, <100MB with Kanban board active

**File Parsing & Processing:**
- **Async Parsing:** All markdown parsing (epics.md, stories) must be async and non-blocking
- **Throttling:** File watcher debouncing with 200ms delay to batch multiple rapid changes
- **Incremental Updates:** Parse only changed files, not entire artifact set on every update
- **Scale Target:** Support projects with 100+ stories without performance degradation

**WebView Rendering:**
- **Initial Render:** Kanban board renders in <500ms for projects with up to 50 stories
- **Update Performance:** Board updates in <100ms when single story status changes
- **Virtual Scrolling:** Implement for projects with 100+ stories to maintain smooth scrolling
- **Memory Management:** Properly dispose WebView resources when panel closed

**Resource Efficiency:**
- **File Watchers:** Target <10 active file watchers (config.yaml, epics.md, implementation-artifacts folder)
- **Event Throttling:** Debounce file change events to prevent excessive re-rendering
- **Lazy Initialization:** Load Kanban components only when user opens board, not on activation

### Security & Data Handling

**Command Execution:**
- **User Confirmation:** Confirm before executing `npx bmad-method install` - display command preview
- **Terminal Integration:** Use VS Code's Terminal API for safe command execution with user visibility
- **Path Validation:** Validate workspace paths to prevent command injection or path traversal
- **Permissions:** Request minimal necessary permissions - no network access required for MVP

**File Content Security:**
- **Markdown Parsing:** Sanitize markdown content to prevent script injection in WebView previews
- **YAML Parsing:** Robust error handling for malformed config.yaml and frontmatter with security validation
- **Input Validation:** Validate all user inputs in custom prompts and form fields before processing
- **CSP for WebView:** Configure strict Content Security Policy: `default-src 'none'; img-src vscode-resource:; script-src 'nonce-XXXXX'; style-src 'nonce-XXXXX'`

**Data Privacy:**
- **Local Only:** All data processing happens locally - no external network calls for core functionality
- **No Telemetry in MVP:** Basic usage telemetry only with explicit opt-in (post-MVP)
- **Workspace Isolation:** Extension operates only within workspace boundaries, no access to system files

### Testing Requirements

**VS Code Extension Test Framework:**
- **Integration Tests:** Use `@vscode/test-electron` for running tests in real VS Code environment
- **Unit Tests:** Vitest for parser logic, utility functions, and data models
- **WebView Tests:** Playwright or similar for UI integration tests of Kanban board
- **Coverage Target:** 70%+ code coverage for core logic (parsers, providers, file operations)

**Test Scenarios:**
- Project initialization (fresh and existing BMAD projects)
- Config.yaml parsing with various configurations
- Epics and stories parsing with different frontmatter formats
- File watcher functionality with rapid file changes
- Kanban board rendering with varying story counts (0, 10, 50, 100+)
- Agent launcher integration with Copilot Chat
- Cross-platform path handling

**CI/CD Testing:**
- GitHub Actions workflow with matrix testing (macOS, Windows, Linux)
- Automated tests run on every PR and commit to main
- Pre-release smoke tests with packaged .vsix file

### Cross-Platform Compatibility

**File System:**
- **Path Separators:** Use VS Code's `Uri.fsPath` and `path.join()` for cross-platform paths (handles `/` vs `\`)
- **Case Sensitivity:** Handle case-insensitive file systems (Windows, macOS default) vs case-sensitive (Linux)
- **Line Endings:** Normalize CRLF (Windows) vs LF (Unix) when parsing markdown frontmatter
- **File Permissions:** Handle readonly filesystems and permission errors gracefully

**Terminal & Commands:**
- **Shell Detection:** Use appropriate shell: `/bin/bash` (macOS/Linux), `cmd.exe` or PowerShell (Windows)
- **npx Execution:** Verify npx availability on all platforms - provide fallback instructions if missing
- **Path Variables:** Handle differences in PATH environment variable resolution across platforms
- **Command Syntax:** Test "npx bmad-method install" execution on Windows cmd, PowerShell, and Unix shells

**UI Rendering:**
- **WebView Chromium:** Consistent rendering across platforms but test for OS-specific quirks
- **Fonts:** Use VS Code's built-in codicons and system fonts for consistent appearance
- **Keyboard Shortcuts:** Follow platform conventions (Cmd on macOS, Ctrl on Windows/Linux)
- **File Icons:** Use VS Code's icon theme API for consistent file tree icons

**Testing Strategy:**
- **Beta Testing:** Recruit beta testers across all three platforms (target: 2+ per platform)
- **Local Testing:** Dev team tests on macOS primarily, use VMs for Windows/Linux validation
- **CI Matrix:** Automated tests run on ubuntu-latest, windows-latest, macos-latest in GitHub Actions

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Methodology-Aware IDE Integration (New Paradigm)**

vscode-bmad introduces a fundamentally new paradigm in software development tooling: **methodology-aware IDE integration**. Unlike generic project management tools (Jira, Trello, Linear) that remain separate from the developer's coding environment, vscode-bmad deeply integrates the BMAD Method execution model directly into VS Code.

**What makes this unique:**
- Extension understands BMAD-specific concepts: epics.md structure, implementation-artifacts folder patterns, workflow-map states, agent command syntax
- Not a generic Kanban viewer adapted for dev work - it's purpose-built to interpret and execute BMAD Method workflows
- Bridges the gap between "project management" and "development environment" - traditionally separate domains

**Paradigm shift:** Challenges the assumption that project management tools must be external to the IDE. Demonstrates that methodology execution can be native to the development environment when deeply integrated.

**2. Bidirectional File-UI Synchronization**

The Kanban board maintains bidirectional sync with markdown files on disk without requiring database or cloud backend:
- File system watcher monitors changes to epics.md and story files
- Kanban UI updates in real-time when files change (via git pull, agent modifications, manual edits)
- User interactions in Kanban (drag-drop, status changes) update markdown frontmatter atomically
- All state lives in version-controlled markdown files - no external state store

**Technical innovation:** Most project management tools rely on centralized databases. vscode-bmad proves that local file-based state with intelligent watching can provide equivalent real-time collaboration for distributed teams using Git.

**3. First-to-Market for BMAD Method Tooling**

vscode-bmad is the first VS Code extension (and potentially first dedicated tooling) specifically built for BMAD Method workflows:
- No competing BMAD-specific IDE extensions exist in any editor (VS Code, JetBrains, etc.)
- Establishes the category of "methodology-specific IDE tooling"
- Opportunity to define the standard for how BMAD Method users work

**Market position:** First-mover advantage in niche market of BMAD Method practitioners. As BMAD Method adoption grows, extension becomes essential infrastructure.

### Market Context & Competitive Landscape

**Existing Solutions and Their Limitations:**

**Generic Project Management Tools (Jira, Trello, Linear, Asana):**
- **Limitation:** Require constant context switching - developer must leave IDE to check story status
- **Limitation:** Not BMAD-aware - don't understand epic/story relationships, workflow-map states, or agent patterns
- **Limitation:** Cloud-based with complexity overhead for solo developers and small teams
- **Why vscode-bmad is different:** Lives in IDE, understands BMAD natively, no cloud dependency

**VS Code Extensions (Project Manager, Todo Tree, GitLens):**
- **Limitation:** Generic file management or Git tooling - not methodology-aware
- **Limitation:** Don't provide visual project management (Kanban, epic tracking)
- **Limitation:** No integration with AI agents or workflow guidance
- **Why vscode-bmad is different:** Purpose-built for BMAD workflows with visual management and agent integration

**BMAD Method Current State (Documentation + Manual Execution):**
- **Limitation:** Users must remember commands, workflow sequences, and agent syntax
- **Limitation:** Story status scattered across files with no unified view
- **Limitation:** No visibility into project progress without manual file inspection
- **Why vscode-bmad is different:** Embedded guidance, visual status, automated workflow tracking

**Competitive Moat:**
- **Deep BMAD Integration:** Competitor would need to reverse-engineer BMAD file structures, workflow patterns, and agent command syntax
- **Community Network Effects:** As BMAD users adopt extension, it becomes the de facto standard
- **First-Mover Positioning:** Establishing "BMAD IDE tooling" category before competitors enter

### Validation Approach

**MVP Validation Strategy:**

**Phase 1: Beta Testing with BMAD Users (Months 1-3)**
- Recruit 5-10 existing BMAD Method users for closed beta
- **Success metric:** 70%+ complete full workflow (init → Kanban → agent launch) without critical blockers
- **Key validation:** Do users actually adopt Kanban as their primary project view? Track daily usage.
- **Feedback focus:** Is bidirectional sync reliable? Any data loss or sync conflicts?

**Phase 2: First-Session Value (Months 3-6)**
- Track new user onboarding completion rate
- **Success metric:** 80%+ users open Kanban board within first 5 minutes
- **Key validation:** Does "one-click install" actually reduce friction compared to manual BMAD setup?
- **Risk signal:** If users don't open Kanban immediately, visual management value isn't clear

**Phase 3: Retention & Engagement (Months 6-12)**
- Monitor daily active usage after initial adoption
- **Success metric:** 70%+ users return daily, 90%+ open Kanban in first week
- **Key validation:** Does extension become part of regular workflow or is it novelty that fades?
- **Risk signal:** If retention drops below 50%, core value proposition may be flawed

**Technical Validation:**

**Bidirectional Sync Reliability:**
- **Test:** Simulate concurrent file changes (agent updates story, user drags card simultaneously)
- **Validation:** Zero data loss, graceful conflict resolution with user notification
- **Fallback:** If sync proves unreliable, implement explicit "refresh" button with version conflict detection

**Performance at Scale:**
- **Test:** Projects with 100+ stories, rapid file changes, multiple simultaneous updates
- **Validation:** Kanban renders <500ms, updates <100ms, no UI freezing
- **Fallback:** If performance degrades, implement pagination or virtual scrolling earlier than planned

**Cross-Platform Compatibility:**
- **Test:** Beta testers on macOS, Windows, Linux (target: 2+ per platform)
- **Validation:** All core features work identically across platforms
- **Fallback:** If platform-specific issues arise, document limitations and prioritize most-used platform

### Risk Mitigation

**Risk 1: Low BMAD Method Adoption Limits Market Size**

**Risk Description:** If BMAD Method doesn't gain significant adoption, addressable market remains small.

**Mitigation Strategies:**
- **Pivot Option 1:** Expand to support multiple methodologies (Shape Up, Basecamp, custom workflows) - become generic "workflow-aware IDE extension"
- **Pivot Option 2:** Partner with BMAD Method governance to grow methodology adoption alongside extension
- **Early Warning Signal:** If Marketplace installs plateau below 100 after 6 months, consider pivot

**Risk 2: Bidirectional Sync Fails to Be Reliable (Data Loss/Conflicts)**

**Risk Description:** Users lose trust if file ↔ board sync causes data corruption or conflicting states.

**Mitigation Strategies:**
- **Technical Safeguard:** Implement atomic file writes with backup before modification
- **User Safeguard:** Conflict detection with explicit user resolution UI - never silently overwrite
- **Fallback UX:** If sync proves unreliable, add manual "sync" button and clearly show sync status
- **Early Warning Signal:** If beta testers report any data loss incidents, pause drag-drop feature until resolved

**Risk 3: GitHub Copilot Chat API Changes or Deprecation**

**Risk Description:** Agent launcher depends on Copilot Chat API which may be in preview/proposed state.

**Mitigation Strategies:**
- **API Monitoring:** Track VS Code and GitHub Copilot extension updates for API changes
- **Graceful Degradation:** If Copilot Chat API unavailable, fall back to opening chat with pre-filled command string
- **Alternative Integration:** Explore other AI chat extensions (Cody, Continue) as backup integration points
- **Early Warning Signal:** Monitor VS Code extension API changelog for Copilot Chat deprecation notices

**Risk 4: VS Code Marketplace Rejection Due to Quality/Security Concerns**

**Risk Description:** Extension may not pass Marketplace review due to WebView security, performance, or quality issues.

**Mitigation Strategies:**
- **Pre-Review Checklist:** Follow all Marketplace guidelines before submission (CSP config, performance benchmarks, security audit)
- **Soft Launch:** Distribute .vsix file directly to beta testers before Marketplace submission to identify issues
- **Security Audit:** Third-party review of WebView implementation and command execution before submission
- **Early Warning Signal:** If initial Marketplace submission rejected, address feedback immediately before user base expectations build

**Risk 5: Extension Slows VS Code (Performance Rejection by Users)**

**Risk Description:** Users uninstall if extension impacts VS Code startup time or responsiveness.

**Mitigation Strategies:**
- **Lazy Loading:** Defer all heavy operations until user explicitly opens features (Kanban, agent launcher)
- **Performance Budget:** Strict <300ms activation, <500ms Kanban render, <100ms updates
- **Monitoring:** Implement telemetry (opt-in) to detect performance degradation in wild
- **Early Warning Signal:** If beta testers report VS Code slowdown, immediately profile and optimize

## Developer Tool Specific Requirements

### Project-Type Overview

vscode-bmad is a VS Code extension (developer tool) that provides native IDE integration for BMAD Method workflows. As a developer tool, it must meet specific technical requirements for VS Code extension architecture, package distribution, and API integration.

**Core Technology Stack:**
- **TypeScript** - Primary language for extension logic, type-safe development
- **Svelte** - Reactive framework for WebView UI components (Kanban board, sidebar panel)
- **Node.js** - Runtime environment (VS Code extensions run in Node.js context)
- **VS Code Extension API** - Official API for extension development

### Technical Architecture Considerations

**Extension Architecture:**

**Source Structure:**
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
├── package.json                  # Extension manifest
└── README.md                     # Marketplace documentation
```

**Activation Events:**
- `onStartupFinished` - Activate after VS Code finishes loading to avoid impacting startup time
- `onView:bmad-sidebar` - Activate when sidebar view is opened
- `onCommand:bmad.*` - Activate on any BMAD command invocation

**Extension Host vs WebView:**
- Extension logic runs in Node.js extension host
- UI components run in isolated WebView (Chromium-based)
- Communication via VS Code's postMessage API

### Language & Technology Matrix

| Technology | Purpose | Version Requirements |
|------------|---------|---------------------|
| **TypeScript** | Extension logic, type safety | 5.0+ |
| **Node.js** | Runtime environment | 18.x+ (VS Code 1.85+ requirement) |
| **Svelte** | WebView UI framework | 4.x (SvelteKit for build) |
| **VS Code Engine** | Extension API compatibility | ^1.85.0 (stable API surface) |

**Key Node.js Dependencies:**

| Package | Purpose | Rationale |
|---------|---------|-----------||
| `yaml` | Parse config.yaml | Robust YAML parsing with error handling |
| `gray-matter` | Parse markdown frontmatter | Industry standard for frontmatter extraction |
| `chokidar` (optional) | File watching alternative | More robust than native fs.watch if needed |
| `fast-glob` | File pattern matching | Efficient glob matching for artifact discovery |
| `@vscode/test-electron` | Testing framework | Official VS Code extension testing |

**WebView Dependencies:**

| Package | Purpose |
|---------|---------||
| `svelte` | Reactive UI framework |
| `vite` | Build tool for WebView bundles |
| `@vscode/webview-ui-toolkit` | VS Code-styled UI components |

### Installation & Distribution Methods

**Primary Distribution: VS Code Marketplace**

**Installation Flow:**
1. User searches "BMAD" in VS Code Extensions panel
2. Clicks "Install" on vscode-bmad extension
3. VS Code downloads and installs .vsix package automatically
4. Extension activates on next workspace open or reload

**Alternative Distribution (Beta Testing):**
- Direct .vsix file distribution to beta testers
- Installation via `code --install-extension vscode-bmad-X.Y.Z.vsix`
- Useful for pre-Marketplace testing and private beta

**Package Manager Alternative:**
- Not applicable - VS Code extensions are not distributed via npm/pip
- Extension code is packaged as .vsix (zip format with manifest)

**Update Mechanism:**
- VS Code automatically checks for extension updates from Marketplace
- Users can enable/disable auto-update in VS Code settings
- CHANGELOG.md displayed on update to communicate changes

### API Surface & Integration Points

**VS Code APIs Used:**

**Core Extension APIs:**
- `vscode.ExtensionContext` - Lifecycle management, storage, subscriptions
- `vscode.commands.registerCommand()` - Register command palette commands
- `vscode.window.registerWebviewViewProvider()` - Sidebar panel provider
- `vscode.window.registerWebviewPanelSerializer()` - Kanban panel restoration
- `vscode.workspace.fs` - File system operations (read config, parse artifacts)
- `vscode.workspace.createFileSystemWatcher()` - Monitor file changes
- `vscode.window.createTerminal()` - Execute `npx bmad-method install`

**GitHub Copilot Chat Integration:**
- Extension depends on GitHub Copilot Chat extension being installed
- Uses Chat API (may be proposed API requiring special enablement)
- `vscode.chat.sendChatMessage()` or equivalent to open chat with agent context
- Graceful fallback if Copilot Chat unavailable: open chat panel with pre-filled text

**WebView Communication:**
- `webview.postMessage()` - Send data from extension to WebView
- `webview.onDidReceiveMessage()` - Receive actions from WebView (e.g., "user dragged story")
- Message protocol: JSON-based with action types and payloads

**File System Operations:**
- Read `_bmad/bmm/config.yaml` to detect project and get paths
- Parse `{planning_artifacts}/epics.md` for epic list
- Scan `{implementation_artifacts}/` folder for story files
- Watch for file changes using FileSystemWatcher API

**API Constraints:**
- No Network APIs required for MVP (all local file operations)
- No Authentication APIs (no cloud services)
- No Database APIs (state lives in markdown files)
- Minimal permissions footprint for security review

### Code Examples & Usage Patterns

**Example 1: Extension Activation**

```typescript
// src/extension.ts
export function activate(context: vscode.ExtensionContext) {
    // Register sidebar provider
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('bmad-sidebar', sidebarProvider)
    );
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('bmad.openKanban', () => {
            KanbanPanel.createOrShow(context.extensionUri);
        })
    );
    
    // Initialize file watcher
    const watcher = new BmadFileWatcher();
    context.subscriptions.push(watcher);
}
```

**Example 2: Config Parsing**

```typescript
// src/parsers/ConfigParser.ts
export async function parseConfig(workspaceRoot: string): Promise<BmadConfig> {
    const configPath = path.join(workspaceRoot, '_bmad', 'bmm', 'config.yaml');
    const configContent = await vscode.workspace.fs.readFile(vscode.Uri.file(configPath));
    const configText = Buffer.from(configContent).toString('utf8');
    
    const parsed = yaml.parse(configText);
    return {
        projectName: parsed.project_name,
        planningArtifacts: parsed.planning_artifacts.replace('{project-root}', workspaceRoot),
        implementationArtifacts: parsed.implementation_artifacts.replace('{project-root}', workspaceRoot)
    };
}
```

**Example 3: Story Parsing with Frontmatter**

```typescript
// src/parsers/StoryParser.ts
import matter from 'gray-matter';

export async function parseStory(filePath: string): Promise<Story> {
    const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
    const text = Buffer.from(content).toString('utf8');
    
    const { data: frontmatter, content: markdown } = matter(text);
    
    return {
        id: path.basename(filePath, '.md'),
        title: frontmatter.title || 'Untitled',
        status: frontmatter.status || 'backlog',
        epic: frontmatter.epic,
        assignee: frontmatter.assignee,
        content: markdown
    };
}
```

**Example 4: WebView Message Passing**

```typescript
// Kanban WebView receives drag-drop event
webview.postMessage({
    type: 'storyStatusChanged',
    payload: {
        storyId: 'story-015',
        newStatus: 'in-progress'
    }
});

// Extension receives message and updates file
webview.onDidReceiveMessage(async (message) => {
    if (message.type === 'storyStatusChanged') {
        await updateStoryStatus(message.payload.storyId, message.payload.newStatus);
        // Notify WebView of success
        webview.postMessage({ type: 'updateConfirmed', payload: message.payload });
    }
});
```

### Implementation Considerations

**Development Workflow:**

1. **Local Development:**
   - Use VS Code Extension Development Host (F5) for debugging
   - Extension runs in separate VS Code instance for testing
   - Hot reload available for code changes (requires restart for some changes)

2. **Build Process:**
   - TypeScript compilation via `tsc`
   - Svelte component bundling via Vite
   - WebView assets bundled separately from extension code
   - Package via `vsce package` to create .vsix

3. **Testing Strategy:**
   - Unit tests: Vitest for parsers, models, utilities
   - Integration tests: @vscode/test-electron for VS Code API interactions
   - WebView tests: Playwright for UI testing
   - Manual testing: Beta testers on macOS, Windows, Linux

**Performance Optimization:**

- **Lazy Loading:** Load Kanban WebView only when user opens board
- **Incremental Parsing:** Parse only changed files, cache parsed results
- **Debounced File Watching:** Batch file change events with 200ms debounce
- **Virtual Lists:** Implement virtual scrolling for 100+ stories in Kanban
- **WebView Resource Management:** Properly dispose WebView when panel closed

**Documentation Strategy:**

**README.md (Marketplace Listing):**
- Feature overview with screenshots
- Quick start guide (install → open project → see Kanban)
- Link to BMAD Method documentation for methodology context
- Requirements: VS Code 1.85+, GitHub Copilot (optional for agent launcher)

**CHANGELOG.md:**
- Semantic versioning (semver) for releases
- Detailed changelog for each version
- Breaking changes clearly marked

**In-Extension Help:**
- Tooltips on all buttons and UI elements
- "?" icon linking to docs.bmad-method.org when needed
- Error messages with actionable guidance (e.g., "config.yaml not found - run 'npx bmad-method install'")

**No Sample Project Required:**
- Extension works with any existing BMAD project
- "Start New BMAD Project" button handles fresh setup
- No need for pre-configured sample repository

**Version Compatibility:**

**BMAD Method Version Support:**
- Extension targets current BMAD Method file structure (version 6.0.0+ based on your installer output)
- No backward compatibility for older BMAD versions in MVP
- Assumes latest BMAD Method format (config.yaml, epics.md structure, story frontmatter schema)
- Future versions may add migration tools if BMAD format changes

**VS Code Version Support:**
- Minimum: VS Code 1.85.0 (stable API surface, GitHub Copilot Chat compatible)
- Target: Latest stable VS Code release
- No Insiders-only features in MVP (avoid API instability)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP

vscode-bmad MVP focuses on eliminating the core pain points experienced by BMAD Method users: cognitive overload from remembering commands, invisible project state scattered across files, and constant context switching between IDE and documentation. The MVP delivers immediate value by transforming BMAD from a documentation-driven methodology into an IDE-native workflow system.

**Philosophy:** Ship the smallest feature set that makes BMAD practitioners say "I can't work without this anymore" within their first week of use.

**Resource Requirements:**
- **Team Size:** Solo developer (MVP scope designed for individual contributor)
- **Timeline:** 3-6 months to beta launch (based on beta testing success criteria)
- **Skills Required:** TypeScript, VS Code Extension API, Svelte, Node.js, markdown parsing
- **Infrastructure:** None required - local-only extension with no backend services

**MVP Success Gate:**
- 5+ beta testers complete full workflow (init → Kanban → agent launch) without critical blockers
- 70%+ beta testers report daily Kanban usage
- Zero data loss incidents during beta period

### MVP Feature Set (Phase 1 - Beta Launch)

**Core User Journeys Supported:**

**1. Marco's Journey (BMAD Newcomer):**
- One-click project initialization eliminates setup confusion
- Agent Launcher provides guided access to all agents without memorizing command syntax
- Progressive sidebar panel shows contextual next actions based on project state

**2. Sofia's Journey (BMAD Practitioner):**
- Kanban Board displays all stories at a glance - no more manual file navigation
- Real-time file watcher auto-refreshes board when story status changes
- Click story card → Markdown preview opens instantly

**3. Alessandro's Journey (Tech Lead):**
- Epics View shows derived status from child stories automatically
- Filter stories by epic with one click for focused team discussions
- Visual progress tracking replaces Slack status update requests

**Must-Have Capabilities (P0):**

**1. Project Initialization**
- One-Click Install: "Start New BMAD Project" button executes `npx bmad-method install`
- Config-Driven Detection: Reads `_bmad/bmm/config.yaml` to detect project state and artifact paths
- **User Value:** Eliminates setup confusion for newcomers (Marco's pain point)

**2. Sidebar WebView Panel**
- Progressive Panel Evolution: UI adapts based on project state (Fresh → In Progress → Epics Ready)
- Three initial buttons for fresh projects: [🧠 Brainstorm] [💡 Ho un'idea] [📄 Ho docs]
- Clickable file tree that opens artifact files in editor
- **User Value:** Contextual guidance without external documentation

**3. Kanban Board Management**
- Kanban as Editor Tab: WebView opens in editor area, not sidebar
- Dual-View Navigation: [Epics] and [Stories] tabs with seamless switching
- Story States Mapping: Backlog → In Progress → Review → Done columns
- Derived Epic Status: Epic status calculated automatically from aggregated child story states
- Markdown Preview on Click: Click story card opens rendered preview in editor
- **User Value:** Visual project management eliminating scattered file navigation (Sofia's core pain)

**4. Agent Integration**
- Agent Launcher UI: Dropdown selectors for Agent + Model + Command + Custom Prompt field
- Command Discovery: Commands parsed dynamically from agent markdown files
- Model Selector: Dropdown of available AI models in VS Code
- "Lancia in Chat" button: Opens GitHub Copilot Chat with agent mode, command, and optional context
- **User Value:** Zero-memorization agent access (Marco's cognitive load elimination)

**5. Workflow Tracking**
- Workflow Progress Tracker: Visual "you are here" indicator in BMAD process workflow-map
- Progress Detection: State derived from presence/absence of artifact files in planning and implementation folders
- Kanban + Progress Combo: Progress bar displayed above Kanban columns
- **User Value:** Always know where you are in the BMAD workflow (orientation for all users)

**MVP Exclusions (Explicitly NOT in Phase 1):**
- Drag-and-Drop Status Updates → Deferred to Phase 2 (technical risk: bidirectional sync reliability)
- Auto-Context Injection for Agents → Deferred to Phase 2 (complexity: determining relevant context)
- Story Quick Actions (right-click menus) → Deferred to Phase 2 (not essential for core value)
- Document Import Flow → Deferred to Phase 2 (users can copy files manually initially)
- Export Kanban to Image → Deferred to Phase 3 (nice-to-have, not core workflow)

### Post-MVP Features

**Phase 2: Growth Features (v1.1 - Q2 2026)**

**Should Have (P1) - Post-Beta Refinements:**

**Enhanced Interactivity:**
- **Drag-and-Drop Status Updates:** Drag stories between columns to update status with confirmation dialog
  - Unlocks bidirectional sync MVP innovation
  - Requires robust conflict resolution and atomic file writes
  
- **Auto-Context Injection:** Agent automatically receives relevant story + epic + architecture as context when launched
  - Reduces manual context setup for developers
  - Requires intelligent context relevance detection

- **Story Quick Actions:** Right-click context menu on story cards (edit, delete, create branch, assign)
  - Power user efficiency improvements
  - Extends Sofia's and Alessandro's workflows

**Onboarding Improvements:**
- **Document Import Flow:** Dialog to upload existing documents into planning-artifacts
  - Lowers barrier for users with existing documentation
  - Guided flow for brownfield project setup

**Robustness:**
- **Enhanced Error Handling:** Better feedback when files are malformed or missing
  - Improved developer experience during edge cases
  - Reduces support burden

**Phase 2 Success Criteria:**
- Drag-drop feature used by 80%+ of active users
- Zero data loss incidents with drag-drop in production
- Auto-context improves agent interaction success rate by 30%+

**Phase 3: Vision Features (v2.0+ - 2026-2027)**

**Nice to Have (P2) - Platform & Collaboration:**

**Export & Integration:**
- **Export Kanban to Image:** Screenshot functionality for standup meetings or documentation
  - Team communication enhancement
  - Useful for remote teams and async updates

- **Story as GitHub Issue:** "Create GitHub Issue" button from story card with auto-population
  - Integration with existing project management workflows
  - Bridges BMAD Method with GitHub Issues for teams using both

**Advanced Workflows:**
- **Reverse Flow Options:** Story-first workflow, generating epics from grouped loose stories
  - Alternative workflow pattern for exploratory projects
  - Challenges traditional top-down epic → stories approach

**Team Features:**
- **Team Visibility:** See who's working on what story (local annotation, no cloud sync)
  - Enhanced team coordination without complexity of cloud sync
  - Maintains local-first architecture

- **CI/CD Integration:** Automatic story status updates based on branch/PR status
  - Reduces manual status updates
  - Tight integration with development workflow

**Phase 3 Success Criteria:**
- 50%+ teams use export or GitHub Issue integration features
- Reverse flow adopted by 20%+ users for exploratory projects
- CI/CD integration reduces manual status updates by 60%

**Long-Term Vision (v3.0+ - 2027+):**

**AI-Powered Intelligence:**
- Story recommendations based on project context and patterns
- Automated epic generation from loose stories using AI clustering
- Workflow optimization suggestions based on team usage patterns
- Natural language story creation: describe feature → generated story structure

**Platform Expansion:**
- Integration with external project management tools (Jira, Linear, Notion)
- Marketplace for community-contributed agents and custom workflows
- Enterprise features: team analytics dashboards, compliance reporting, advanced integrations

**Market Expansion:**
- Support for multiple methodologies beyond BMAD (Shape Up, Basecamp, custom workflows)
- Become generic "methodology-aware IDE extension" platform
- Community ecosystem with plugins and extensions

### Risk Mitigation Strategy

**Technical Risks:**

**Risk: Bidirectional Sync Reliability**
- **Mitigation:** MVP excludes drag-drop to defer sync complexity to Phase 2 when more testing capacity available
- **Validation:** Beta testing focuses on read-only Kanban board reliability first
- **Contingency:** If Phase 2 sync proves unreliable, add manual "refresh" button and conflict detection UI

**Risk: GitHub Copilot Chat API Instability**
- **Mitigation:** Implement graceful fallback - if Copilot Chat API unavailable, open chat with pre-filled command text
- **Validation:** Test with multiple Copilot models during beta
- **Contingency:** Explore alternative chat extensions (Cody, Continue) if Copilot Chat deprecated

**Risk: Cross-Platform File System Differences**
- **Mitigation:** Use VS Code's Uri and path APIs for cross-platform compatibility, beta test on all three platforms
- **Validation:** Recruit 2+ beta testers per platform (macOS, Windows, Linux)
- **Contingency:** Document platform-specific limitations if full compatibility proves infeasible

**Market Risks:**

**Risk: BMAD Method Adoption Remains Niche**
- **Mitigation:** Monitor Marketplace installs and user growth rate
- **Validation:** Define success threshold (100+ installs in 6 months, 70%+ retention)
- **Contingency:** Pivot to support multiple methodologies if BMAD market proves too small (Shape Up, Basecamp, custom)

**Risk: Users Don't Adopt Kanban View**
- **Mitigation:** Track Kanban open events in first week - target 90%+ adoption
- **Validation:** User interviews to understand why Kanban not opened
- **Contingency:** Redesign entry point or onboarding flow if visual management value unclear

**Resource Risks:**

**Risk: Solo Development Takes Longer Than Expected**
- **Mitigation:** Aggressive MVP scope keeps implementation timeline manageable (3-6 months)
- **Validation:** Monthly milestone check-ins - if behind schedule, cut non-essential features
- **Contingency:** Further scope reduction - eliminate workflow progress tracker if critical path blocked

**Risk: Beta Testing Reveals Critical Usability Issues**
- **Mitigation:** Private beta with engaged BMAD users who provide detailed feedback
- **Validation:** Weekly beta feedback sessions during 3-month beta period
- **Contingency:** Extend beta period and iterate on critical issues before Marketplace launch

**Risk: VS Code Marketplace Rejection**
- **Mitigation:** Follow all Marketplace guidelines, pre-submission security audit, soft launch via .vsix
- **Validation:** Security review of WebView CSP and command execution
- **Contingency:** Address rejection feedback immediately, delay public launch if necessary

## Functional Requirements

### Project Initialization & Configuration

- **FR1:** Users can initialize a new BMAD project with one click that executes `npx bmad-method install` and creates the complete `_bmad/` folder structure
- **FR2:** Extension can detect existing BMAD projects by reading `_bmad/bmm/config.yaml` on workspace open
- **FR3:** Extension can parse config.yaml to extract project name, artifact paths, user preferences, and communication language
- **FR4:** Extension can resolve template variables in config paths (e.g., `{project-root}` replaced with actual workspace path)
- **FR5:** Users can view project initialization progress and command output in a VS Code terminal
- **FR6:** Extension can display appropriate error messages with actionable guidance when config.yaml is missing or malformed

### Visual Story Management

- **FR7:** Users can open a Kanban board as an editor tab that displays all project stories organized by status columns
- **FR8:** Users can view stories organized in four status columns: Backlog, In Progress, Review, Done
- **FR9:** Users can switch between [Epics] view and [Stories] view using tab navigation in the Kanban board
- **FR10:** Users can see epic cards in Epics view that display epic title, description, and derived status based on child story states
- **FR11:** Users can see story cards in Stories view that display story title, epic parent, assignee, and current status
- **FR12:** Users can filter stories by epic by clicking an epic card, which automatically switches to Stories view with epic filter applied
- **FR13:** Users can click a story card to open the story markdown file as a rendered preview in the editor
- **FR14:** Extension can automatically refresh Kanban board when story or epic files change on disk (via git pull, agent modifications, or manual edits)
- **FR15:** Users can see workflow progress bar above Kanban columns showing current phase in BMAD workflow-map (Planning, Solutioning, Implementation, Testing)
- **FR16:** Users can see story counts displayed in each Kanban column header (e.g., "In Progress (3)")

### Agent Integration & Workflow Guidance

- **FR17:** Users can access an Agent Launcher UI from the sidebar panel that provides dropdown selectors for Agent, Model, and Command
- **FR18:** Extension can dynamically discover and parse available agents from `_bmad/bmm/agents/` folder markdown files
- **FR19:** Extension can dynamically discover and parse agent commands from agent markdown file menu sections
- **FR20:** Users can select an AI model from a dropdown populated with available models in VS Code (Claude, GPT-4, etc.)
- **FR21:** Users can enter a custom prompt text that will be included when launching the agent
- **FR22:** Users can launch an agent in GitHub Copilot Chat with one click, which opens Chat with agent mode, command, and optional custom prompt pre-filled
- **FR23:** Extension can provide graceful fallback by opening Chat with pre-filled text if Copilot Chat API is unavailable
- **FR24:** Users can see workflow progress tracker showing "you are here" indicator in BMAD process workflow-map
- **FR25:** Extension can derive workflow state from presence/absence of artifact files in planning and implementation folders

### Sidebar Panel & Progressive UI

- **FR26:** Users can view a sidebar panel that displays project state and contextual actions based on detected BMAD project phase
- **FR27:** Users in a fresh project (no artifacts) can see three initial action buttons: [🧠 Brainstorm], [💡 Ho un'idea], [📄 Ho docs]
- **FR28:** Users in an in-progress project can see context-appropriate actions based on existing artifacts
- **FR29:** Users in a project with epics ready can see [Open Kanban Board] button prominently displayed
- **FR30:** Users can access a clickable file tree in sidebar panel showing key artifact files (config.yaml, epics.md, stories)
- **FR31:** Users can click file tree items to open those files in the editor

### File System Integration & Parsing

- **FR32:** Extension can parse YAML frontmatter from markdown files (epics.md and story files) to extract metadata
- **FR33:** Extension can parse epics.md to extract list of epics with title, description, and epic identifier
- **FR34:** Extension can scan `{implementation_artifacts}/` folder to discover all story markdown files
- **FR35:** Extension can parse story files to extract story ID, title, status, epic parent, assignee, and content
- **FR36:** Extension can watch for file changes in config.yaml, epics.md, and implementation-artifacts folder using VS Code FileSystemWatcher API
- **FR37:** Extension can debounce file change events (200ms delay) to batch multiple rapid changes and prevent excessive re-parsing
- **FR38:** Extension can derive epic status (Backlog, In Progress, Done) by aggregating child story statuses
- **FR39:** Extension can handle malformed YAML or markdown files gracefully with error logging and user-friendly error messages

### Cross-Platform Compatibility

- **FR40:** Extension can resolve file paths correctly on macOS, Windows, and Linux using VS Code's Uri and path APIs
- **FR41:** Extension can handle case-insensitive file systems (Windows, macOS) and case-sensitive file systems (Linux) without data corruption
- **FR42:** Extension can normalize line endings (CRLF on Windows, LF on Unix) when parsing markdown frontmatter
- **FR43:** Extension can execute shell commands (`npx bmad-method install`) using appropriate shell for each platform (bash for macOS/Linux, cmd/PowerShell for Windows)
- **FR44:** Extension can display consistent UI across all platforms using VS Code's WebView Chromium renderer and built-in codicons

## Non-Functional Requirements

### Performance

- **NFR-P1:** Kanban board WebView renders initial view in <500ms for projects with up to 50 stories
- **NFR-P2:** File parsing operations (config.yaml, epics.md, story files) complete in <200ms total for typical projects (<100 stories)
- **NFR-P3:** Kanban board auto-refresh after file changes completes in <300ms (from FileSystemWatcher event to UI update)
- **NFR-P4:** Agent Launcher dropdown population completes in <100ms when opening sidebar panel
- **NFR-P5:** Extension activation time (workspace with BMAD project detected) completes in <1 second
- **NFR-P6:** WebView PostMessage communication latency <50ms for user interactions (card click, filter selection)
- **NFR-P7:** File watching debounce window set to 200ms to batch rapid file changes without blocking UI

### Security

- **NFR-S1:** WebView Content Security Policy (CSP) enforces strict policy: `default-src 'none'; script-src 'nonce-{random}'; style-src 'unsafe-inline'; img-src ${webview.cspSource} https:;`
- **NFR-S2:** All terminal command executions (`npx bmad-method install`) validated against whitelist of allowed commands before execution
- **NFR-S3:** User-provided custom prompts in Agent Launcher sanitized to prevent command injection when passed to GitHub Copilot Chat API
- **NFR-S4:** Extension never reads or writes files outside of workspace root directory without explicit user permission
- **NFR-S5:** No telemetry or analytics data sent to external servers without explicit user opt-in
- **NFR-S6:** WebView HTML generated with escaped user-provided content (story titles, descriptions) to prevent XSS attacks
- **NFR-S7:** Extension packaged without debug symbols or source maps in production .vsix bundle

### Accessibility

- **NFR-A1:** Kanban board WebView supports VS Code high contrast themes (light and dark variants)
- **NFR-A2:** All interactive elements in WebView (story cards, buttons, dropdowns) keyboard-navigable with visible focus indicators
- **NFR-A3:** Story cards include ARIA labels for screen reader compatibility (e.g., "Story: Implement sidebar panel, Status: In Progress, Epic: Visual Story Management")
- **NFR-A4:** Sidebar panel buttons include descriptive labels and support keyboard activation
- **NFR-A5:** Error messages displayed with sufficient color contrast ratio (WCAG AA standard: 4.5:1 for normal text)

### Integration

- **NFR-I1:** Extension compatible with VS Code API versions 1.85.0 through latest stable release
- **NFR-I2:** GitHub Copilot Chat integration gracefully degrades if Copilot extension not installed (opens standard Chat with pre-filled text)
- **NFR-I3:** File watching compatible with all VS Code workspace types (local folder, remote SSH, WSL, Dev Containers)
- **NFR-I4:** Extension detects and handles VS Code workspace changes (folder added/removed) without requiring reload
- **NFR-I5:** Kanban board WebView interoperable with VS Code editor state (preserves editor tabs, focus, layout when opening/closing board)
- **NFR-I6:** Extension respects VS Code file exclusion settings (files.exclude, search.exclude) when scanning for BMAD artifacts

### Reliability

- **NFR-R1:** Extension handles malformed config.yaml gracefully with specific error message indicating line number and YAML syntax issue
- **NFR-R2:** Extension handles missing frontmatter in story/epic files gracefully, displaying warning icon with "Invalid metadata" tooltip
- **NFR-R3:** FileSystemWatcher automatically recovers from file watching errors (e.g., too many files, permission issues) with retry logic (3 attempts, exponential backoff)
- **NFR-R4:** Extension logs all critical errors to VS Code Output panel (channel: "BMAD Extension") for debugging
- **NFR-R5:** Kanban board maintains scroll position when auto-refreshing after file changes
- **NFR-R6:** Extension state persists across VS Code window reloads (last opened Kanban view, sidebar state)
- **NFR-R7:** Extension handles concurrent file modifications (e.g., git pull while user editing) without data loss or UI corruption

### Cross-Platform Compatibility

- **NFR-C1:** Extension tested and validated on macOS (12+), Windows (10+), and Linux (Ubuntu 20.04+)
- **NFR-C2:** File path operations use VS Code Uri API exclusively (no hardcoded path separators or drive letters)
- **NFR-C3:** Terminal command execution adapts shell selection to platform (bash for macOS/Linux, PowerShell for Windows)
- **NFR-C4:** Extension handles case-sensitive (Linux) and case-insensitive (macOS, Windows) file systems without file corruption
- **NFR-C5:** WebView UI renders consistently across all platforms using VS Code's embedded Chromium renderer
