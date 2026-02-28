# Story 6.3: Agent Launcher UI Component

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **an Agent Launcher panel with dropdown selectors**,
So that **I can easily select and launch any agent without memorizing commands**.

## Acceptance Criteria

1. **Given** sidebar panel is open and agents have been discovered
   **When** Agent Launcher section renders
   **Then** it shows:
   - Agent dropdown populated from AgentParserService (FR17)
   - Command dropdown (initially disabled until agent selected)
   - Model dropdown (populated from VS Code available models) (FR20)
   - Custom prompt text field (multiline) (FR21)
   - "Lancia in Chat" button (disabled until agent selected)

2. **Given** user selects an agent from the Agent dropdown
   **When** agent selection changes
   **Then** Command dropdown:
   - Enables and populates with that agent's commands from AgentParserService.parseCommands()
   - Shows commands in format "[CODE] Description" (e.g., "[SP] Sprint Planning")
   - Resets to empty/placeholder state when agent changes

3. **Given** user has selected an agent (command optional)
   **When** user clicks "Lancia in Chat" button
   **Then** component sends `launchAgent` PostMessage with:
   - `agentId`: selected agent's ID
   - `command`: selected command code (optional)
   - `customPrompt`: text from prompt field (optional)
   - `model`: selected model (optional)

4. **Given** Agent Launcher component renders
   **When** displayed in sidebar
   **Then** it uses VS Code styling:
   - Dropdowns use `vscode-dropdown` styling patterns
   - Button uses `vscode-button` styling
   - Textarea uses `vscode-text-area` styling
   - Respects theme variables (`--vscode-*`)

5. **Given** Agent Launcher component is displayed
   **When** user navigates via keyboard
   **Then** all elements are keyboard accessible:
   - Tab navigation through all elements
   - Enter/Space activates buttons
   - Arrow keys navigate dropdowns
   - Visible focus indicators (NFR-A4)

6. **Given** AgentParserService.discoverAgents() returns an error or empty array
   **When** Agent Launcher section renders
   **Then** it shows:
   - Informative message "No agents found"
   - Help text suggesting to check `_bmad/bmm/agents/` folder exists

## Tasks / Subtasks

- [x] Task 1: Define Agent and AgentCommand types for WebView (AC: #1)
  - [x] 1.1: Add `Agent` type to `webviews/sidebar/src/lib/types.ts` (re-export or duplicate from shared)
  - [x] 1.2: Add `AgentCommand` type to sidebar types
  - [x] 1.3: Add `AgentsLoadedPayload` interface for extension message

- [x] Task 2: Extend PostMessage protocol (AC: #1, #3)
  - [x] 2.1: Add `agentsLoaded` message type to `ExtensionMessage` union in `src/shared/messages.ts`
  - [x] 2.2: Add `AgentsLoadedPayload` to messages with `agents: Agent[]` field
  - [x] 2.3: Add `commandsLoaded` message type for async command loading
  - [x] 2.4: Add `requestCommands` WebView message type (to request commands for selected agent)

- [x] Task 3: Create AgentLauncher.svelte component (AC: #1, #4)
  - [x] 3.1: Create `webviews/sidebar/src/components/AgentLauncher.svelte`
  - [x] 3.2: Add reactive state: selectedAgent, selectedCommand, selectedModel, customPrompt
  - [x] 3.3: Add Props interface with `agents: Agent[]` and `vscode: VsCodeApi`
  - [x] 3.4: Add `loading` and `error` states for async operations

- [x] Task 4: Implement Agent dropdown (AC: #1, #2)
  - [x] 4.1: Create `<select>` element with VS Code styling
  - [x] 4.2: Render options from agents array with icon + displayName
  - [x] 4.3: Bind to selectedAgent state
  - [x] 4.4: On change, request commands from extension via PostMessage

- [x] Task 5: Implement Command dropdown (AC: #2)
  - [x] 5.1: Create Command `<select>` element (disabled when no agent)
  - [x] 5.2: Handle `commandsLoaded` message to populate options
  - [x] 5.3: Format options as "[CODE] Description"
  - [x] 5.4: Bind to selectedCommand state

- [x] Task 6: Implement Model dropdown (AC: #1)
  - [x] 6.1: Create Model `<select>` element
  - [x] 6.2: Populate with hardcoded model list initially (Claude, GPT-4, Default)
  - [x] 6.3: Bind to selectedModel state
  - [x] 6.4: Note: Full model API integration in Story 6.5

- [x] Task 7: Implement Custom Prompt field (AC: #1)
  - [x] 7.1: Create multiline `<textarea>` with VS Code styling
  - [x] 7.2: Bind to customPrompt state
  - [x] 7.3: Add placeholder text "Additional context for agent..."
  - [x] 7.4: Set reasonable default rows (3-4)

- [x] Task 8: Implement Launch button (AC: #3)
  - [x] 8.1: Create button with "Lancia in Chat" label and rocket icon
  - [x] 8.2: Disable when no agent selected
  - [x] 8.3: onClick: call `vscode.postMessage({ type: 'launchAgent', payload: {...} })`
  - [x] 8.4: Include all 4 payload fields (agentId, command, customPrompt, model)

- [x] Task 9: Implement keyboard accessibility (AC: #5)
  - [x] 9.1: Add proper tabindex to all interactive elements
  - [x] 9.2: Ensure focus styles are visible (outline or box-shadow)
  - [x] 9.3: Test tab navigation order is logical

- [x] Task 10: Implement error/empty state (AC: #6)
  - [x] 10.1: Check if agents array is empty or null
  - [x] 10.2: Show "No agents found" message with help text
  - [x] 10.3: Style appropriately with VS Code colors

- [x] Task 11: Integrate into App.svelte (AC: #1)
  - [x] 11.1: Import AgentLauncher component in App.svelte
  - [x] 11.2: Add `agents` state variable for received agent data
  - [x] 11.3: Handle `agentsLoaded` message in handleMessage
  - [x] 11.4: Render AgentLauncher when in `epics-ready` or `in-progress` state
  - [x] 11.5: Pass agents and vscode props to AgentLauncher

- [x] Task 12: Add unit tests (AC: #1-6)
  - [x] 12.1: Create `tests/unit/webviews/sidebar/AgentLauncher.test.ts`
  - [x] 12.2: Test component renders with agents array
  - [x] 12.3: Test agent selection updates command dropdown
  - [x] 12.4: Test launch button PostMessage payload
  - [x] 12.5: Test empty agents shows error state
  - [x] 12.6: Create mock agents/commands fixtures

## Dev Notes

### Component Structure

The AgentLauncher component should be a Svelte 5 component using runes (`$state`, `$props`) following the pattern established in existing sidebar components:

```svelte
<!-- webviews/sidebar/src/components/AgentLauncher.svelte -->
<script lang="ts">
  import type { Agent, AgentCommand, VsCodeApi } from '../lib/types';

  interface Props {
    agents: Agent[];
    vscode: VsCodeApi;
  }

  let { agents, vscode }: Props = $props();

  // Reactive state
  let selectedAgent = $state<Agent | null>(null);
  let commands = $state<AgentCommand[]>([]);
  let selectedCommand = $state<AgentCommand | null>(null);
  let selectedModel = $state('default');
  let customPrompt = $state('');
  let loadingCommands = $state(false);

  // Computed: can launch if agent selected
  let canLaunch = $derived(selectedAgent !== null);

  // Handler: agent selection changed
  function onAgentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const agentId = select.value;
    selectedAgent = agents.find(a => a.id === agentId) ?? null;
    selectedCommand = null;
    commands = [];
    
    if (selectedAgent) {
      loadingCommands = true;
      vscode.postMessage({
        type: 'requestCommands',
        payload: { agentFilePath: selectedAgent.filePath }
      });
    }
  }

  // Handler: launch agent
  function launchAgent() {
    if (!selectedAgent) return;
    
    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: selectedAgent.id,
        command: selectedCommand?.code,
        customPrompt: customPrompt || undefined,
        model: selectedModel !== 'default' ? selectedModel : undefined
      }
    });
  }
</script>
```

### Agent and AgentCommand Types

Use types from Story 6.1 and 6.2 (already defined in shared/models.ts):

```typescript
// From Story 6.1 - to be added
export interface Agent {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  filePath: string;
  icon?: string;
}

// From Story 6.2 - to be added
export interface AgentCommand {
  code: string;           // e.g., "SP"
  description: string;    // e.g., "Sprint Planning..."
  fullText: string;       // "[SP] Sprint Planning: ..."
  attributes?: AgentCommandAttributes;
}
```

### PostMessage Protocol Extensions

Add these to `src/shared/messages.ts`:

```typescript
// Extension → WebView (add to ExtensionMessage union)
| { type: 'agentsLoaded'; payload: AgentsLoadedPayload }
| { type: 'commandsLoaded'; payload: CommandsLoadedPayload }

// WebView → Extension (add to WebViewMessage union)  
| { type: 'requestCommands'; payload: RequestCommandsPayload }

// New payload types
export interface AgentsLoadedPayload {
  agents: Agent[];
}

export interface CommandsLoadedPayload {
  agentId: string;
  commands: AgentCommand[];
}

export interface RequestCommandsPayload {
  agentFilePath: string;
}
```

### Project Structure Notes

Files to create/modify:

```
webviews/sidebar/src/
├── components/
│   └── AgentLauncher.svelte    # NEW - main component
├── lib/
│   └── types.ts                # MODIFY - add/re-export Agent types
└── App.svelte                  # MODIFY - integrate AgentLauncher

src/shared/
├── messages.ts                 # MODIFY - add message types
└── models.ts                   # MODIFY - add Agent, AgentCommand types
```

### VS Code Styling Patterns

Follow existing EpicsReadyActions.svelte patterns for styling:

```css
/* Dropdown styling */
.dropdown {
  width: 100%;
  padding: 6px 8px;
  background: var(--vscode-dropdown-background);
  color: var(--vscode-dropdown-foreground);
  border: 1px solid var(--vscode-dropdown-border);
  border-radius: 2px;
  font-size: 13px;
}

.dropdown:focus {
  outline: 1px solid var(--vscode-focusBorder);
  outline-offset: -1px;
}

.dropdown:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button styling */
.launch-button {
  width: 100%;
  padding: 8px 16px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-weight: 600;
}

.launch-button:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground);
}

.launch-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Textarea styling */
.prompt-field {
  width: 100%;
  padding: 6px 8px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 2px;
  resize: vertical;
  min-height: 60px;
  font-family: var(--vscode-font-family);
  font-size: 13px;
}
```

### Model Options (Placeholder)

Story 6.5 will implement full model API integration. For now, use these placeholders:

```typescript
const modelOptions = [
  { value: 'default', label: 'Default Model' },
  { value: 'claude-sonnet', label: 'Claude Sonnet' },
  { value: 'claude-opus', label: 'Claude Opus' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
];
```

### Integration with App.svelte

Add AgentLauncher below EpicsReadyActions or InProgressActions:

```svelte
<!-- In App.svelte -->
{#if agents && agents.length > 0}
  <AgentLauncher {agents} {vscode} />
{/if}
```

### Message Handler Extension

In App.svelte, extend handleMessage:

```typescript
case 'agentsLoaded':
  agents = message.payload.agents;
  break;
case 'commandsLoaded':
  // Forward to AgentLauncher via store or props
  break;
```

### Testing Guidelines

Use Vitest with Svelte testing library. Mock VS Code API:

```typescript
// tests/unit/webviews/sidebar/AgentLauncher.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import AgentLauncher from '../../../../webviews/sidebar/src/components/AgentLauncher.svelte';

const mockVsCode = {
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn()
};

const mockAgents = [
  { id: 'sm', name: 'sm', displayName: 'Scrum Master', filePath: '/path/sm.md', icon: '🏃' },
  { id: 'pm', name: 'pm', displayName: 'Product Manager', filePath: '/path/pm.md', icon: '📋' }
];

describe('AgentLauncher', () => {
  it('renders agent dropdown with options', () => {
    const { getByRole, getAllByRole } = render(AgentLauncher, {
      props: { agents: mockAgents, vscode: mockVsCode }
    });
    
    const agentSelect = getByRole('combobox', { name: /agent/i });
    expect(agentSelect).toBeInTheDocument();
    
    const options = getAllByRole('option');
    expect(options.length).toBe(mockAgents.length + 1); // +1 for placeholder
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Component-Structure] - Provider + Services pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management-Strategy] - Extension Host as source of truth
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.3] - Acceptance criteria
- [Source: webviews/sidebar/src/components/EpicsReadyActions.svelte] - Component pattern reference
- [Source: src/shared/messages.ts] - PostMessage protocol types

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (via GitHub Copilot)

### Debug Log References

N/A - Clean implementation with no blocking issues

### Completion Notes List

- Implemented AgentLauncher.svelte component with full Svelte 5 runes pattern ($state, $props, $derived)
- Extended PostMessage protocol with `agentsLoaded`, `commandsLoaded`, and `requestCommands` message types
- Re-exported Agent and AgentCommand types from shared/models to sidebar types
- Component includes Agent dropdown, Command dropdown (async populated), Model dropdown, Custom Prompt textarea, and "Lancia in Chat" launch button
- Full VS Code theming using CSS variables (--vscode-dropdown-*, --vscode-button-*, --vscode-input-*)
- Keyboard accessibility with proper tabindex, focus styles, and ARIA labels
- Empty/error state shows helpful message pointing to `_bmad/bmm/agents/` folder
- Integrated into App.svelte with message handlers for agentsLoaded and commandsLoaded
- Created 27 unit tests covering all acceptance criteria

### File List

**New Files:**
- webviews/sidebar/src/components/AgentLauncher.svelte
- tests/unit/webviews/sidebar/AgentLauncher.test.ts

**Modified Files:**
- src/shared/messages.ts (added agentsLoaded, commandsLoaded, requestCommands message types)
- webviews/sidebar/src/lib/types.ts (re-exported Agent, AgentCommand, AgentCommandAttributes)
- webviews/sidebar/src/App.svelte (integrated AgentLauncher component with message handling)
