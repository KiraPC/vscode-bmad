# Story 6.6: Custom Prompt Field

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to add custom context or questions when launching an agent**,
So that **I can guide the agent with additional information specific to my current task**.

## Acceptance Criteria

1. **Given** Agent Launcher is rendered in the sidebar
   **When** the Custom Prompt field is displayed
   **Then** it shows:
   - A multiline `<textarea>` with placeholder text "Additional context for agent..."
   - VS Code styling matching input elements (`--vscode-input-*` variables)
   - Reasonable default height (3-4 rows) with vertical resize enabled

2. **Given** user types in the custom prompt field
   **When** text is entered
   **Then** the input is captured in component state (FR21)
   **And** the text is bound to `customPrompt` reactive state variable

3. **Given** user clicks "Lancia in Chat" with custom prompt text
   **When** CopilotService.launchAgent() is called
   **Then** custom prompt is included in the chat context (FR22)
   **And** custom prompt is passed through the `launchAgent` PostMessage payload

4. **Given** custom prompt contains potentially dangerous content
   **When** CopilotService processes the prompt
   **Then** the prompt is sanitized before use (NFR-S3):
   - Command prefixes (`@`, `/`) at line starts are removed
   - Control characters (0x00-0x1F, 0x7F) are stripped
   - Length is limited to 2000 characters maximum

5. **Given** Custom Prompt field is displayed
   **When** user navigates via keyboard
   **Then** the textarea is keyboard accessible:
   - Tab navigation reaches the field
   - Standard textarea behaviors work (Enter for newline)
   - Visible focus indicator present (NFR-A4)

6. **Given** custom prompt is empty or undefined
   **When** launchAgent is called
   **Then** the `customPrompt` field is omitted from payload or sent as undefined
   **And** no sanitization errors occur

## Tasks / Subtasks

- [x] Task 1: Verify customPrompt in LaunchAgentPayload (AC: #2, #3)
  - [x] 1.1: Confirm `customPrompt?: string` exists in `src/shared/messages.ts` `LaunchAgentPayload`
  - [x] 1.2: Verify type is exported correctly for WebView consumption

- [x] Task 2: Implement customPrompt state in AgentLauncher.svelte (AC: #1, #2)
  - [x] 2.1: Add `let customPrompt = $state('')` in AgentLauncher component
  - [x] 2.2: Create `<textarea>` element with VS Code styling class `.prompt-field`
  - [x] 2.3: Add `bind:value={customPrompt}` to capture input
  - [x] 2.4: Set `placeholder="Additional context for agent..."`
  - [x] 2.5: Set `rows="4"` for default height with `resize: vertical`

- [x] Task 3: Style Custom Prompt field (AC: #1)
  - [x] 3.1: Add `.prompt-field` CSS class in AgentLauncher styles
  - [x] 3.2: Apply VS Code variables: `--vscode-input-background`, `--vscode-input-foreground`, `--vscode-input-border`
  - [x] 3.3: Set `font-family: var(--vscode-font-family)`, `font-size: 13px`
  - [x] 3.4: Set `min-height: 60px`, `width: 100%`, `border-radius: 2px`
  - [x] 3.5: Add focus styles with `--vscode-focusBorder`

- [x] Task 4: Include customPrompt in launchAgent PostMessage (AC: #3)
  - [x] 4.1: Update launchAgent function to include customPrompt in payload
  - [x] 4.2: Only include if non-empty: `customPrompt: customPrompt.trim() || undefined`
  - [x] 4.3: Verify payload matches `LaunchAgentPayload` interface

- [x] Task 5: Implement sanitizePrompt in CopilotService (AC: #4)
  - [x] 5.1: Add `private sanitizePrompt(prompt: string | undefined): string` method
  - [x] 5.2: Handle undefined/empty input returning empty string
  - [x] 5.3: Remove command prefixes: `prompt.replace(/^[@/]/gm, '')`
  - [x] 5.4: Strip control characters: `prompt.replace(/[\x00-\x1F\x7F]/g, '')`
  - [x] 5.5: Limit to 2000 chars: `substring(0, 2000)` with `...` suffix if truncated
  - [x] 5.6: Trim whitespace

- [x] Task 6: Update SidebarProvider to pass customPrompt (AC: #3)
  - [x] 6.1: Update `_launchAgent()` signature to accept `customPrompt?: string`
  - [x] 6.2: Extract `message.payload.customPrompt` in case handler
  - [x] 6.3: Pass customPrompt to CopilotService.launchAgent()

- [x] Task 7: Apply sanitization in CopilotService.launchAgent (AC: #4)
  - [x] 7.1: Call `sanitizePrompt(request.customPrompt)` at start of launchAgent
  - [x] 7.2: Use sanitized prompt when constructing chat message
  - [x] 7.3: Log if prompt was truncated (info level, not error)

- [x] Task 8: Implement keyboard accessibility (AC: #5)
  - [x] 8.1: Ensure textarea is in tab order naturally (no manual tabindex needed)
  - [x] 8.2: Add focus style: `outline: 1px solid var(--vscode-focusBorder)`
  - [x] 8.3: Verify Enter key creates newlines (default textarea behavior)

- [x] Task 9: Add unit tests for sanitizePrompt (AC: #4, #6)
  - [x] 9.1: Create test in `tests/unit/services/CopilotService.test.ts`
  - [x] 9.2: Test empty/undefined input returns empty string
  - [x] 9.3: Test `@mention` at line start is stripped
  - [x] 9.4: Test `/command` at line start is stripped
  - [x] 9.5: Test control characters are removed
  - [x] 9.6: Test prompt over 2000 chars is truncated with `...`
  - [x] 9.7: Test normal text passes through unchanged

- [x] Task 10: Add unit tests for customPrompt in AgentLauncher (AC: #2, #3)
  - [x] 10.1: Create/extend `tests/unit/webviews/sidebar/AgentLauncher.test.ts`
  - [x] 10.2: Test customPrompt state updates on input
  - [x] 10.3: Test launchAgent PostMessage includes customPrompt when present
  - [x] 10.4: Test customPrompt is undefined/omitted when empty

## Dev Notes

### Dependencies

**⚠️ CRITICAL: This story depends on:**
- **Story 6.3** (AgentLauncher.svelte) - Must exist first to add the textarea
- **Story 6.4** (CopilotService.ts) - Must exist for sanitizePrompt implementation

If 6.3/6.4 are not yet implemented, implement the Custom Prompt field as part of AgentLauncher component creation.

### Existing Infrastructure

**LaunchAgentPayload already includes customPrompt:**
```typescript
// src/shared/messages.ts (ALREADY EXISTS)
export interface LaunchAgentPayload {
    agentId: string;
    command?: string;
    customPrompt?: string;  // ✅ Already defined!
    model?: string;
}
```

**Current SidebarProvider ignores customPrompt - FIX NEEDED:**
```typescript
// src/providers/SidebarProvider.ts L94-95 (NEEDS UPDATE)
case 'launchAgent':
    this._launchAgent(message.payload.agentId, message.payload.command ?? '');
    // BUG: customPrompt is NOT passed through - must fix!
```

### Sanitization Implementation

**Security-critical function (NFR-S3):**
```typescript
// src/services/CopilotService.ts

/**
 * Sanitizes user prompt to prevent command injection
 * NFR-S3: User-provided custom prompts sanitized
 * 
 * @param prompt - Raw user input
 * @returns Sanitized prompt safe for chat context
 */
private sanitizePrompt(prompt: string | undefined): string {
    if (!prompt) return '';
    
    const MAX_PROMPT_LENGTH = 2000;
    
    let sanitized = prompt
        // Remove @ and / at start of lines (command injection prevention)
        .replace(/^[@/]/gm, '')
        // Remove control characters
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Trim whitespace
        .trim();
    
    // Truncate if too long
    if (sanitized.length > MAX_PROMPT_LENGTH) {
        sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH) + '...';
    }
    
    return sanitized;
}
```

### Svelte Component Pattern

**Custom Prompt textarea implementation:**
```svelte
<!-- webviews/sidebar/src/components/AgentLauncher.svelte -->
<script lang="ts">
  // ... existing imports and props
  
  let customPrompt = $state('');
  
  function launchAgent() {
    if (!selectedAgent) return;
    
    vscode.postMessage({
      type: 'launchAgent',
      payload: {
        agentId: selectedAgent.id,
        command: selectedCommand?.code,
        customPrompt: customPrompt.trim() || undefined,  // Only include if non-empty
        model: selectedModel !== 'default' ? selectedModel : undefined
      }
    });
  }
</script>

<div class="form-group">
  <label for="custom-prompt">Additional Context (optional)</label>
  <textarea
    id="custom-prompt"
    class="prompt-field"
    bind:value={customPrompt}
    placeholder="Additional context for agent..."
    rows="4"
  ></textarea>
</div>

<style>
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
  
  .prompt-field:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }
  
  .prompt-field::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
</style>
```

### SidebarProvider Update Required

```typescript
// src/providers/SidebarProvider.ts - UPDATE NEEDED

case 'launchAgent':
    this._launchAgent(
        message.payload.agentId, 
        message.payload.command ?? '',
        message.payload.customPrompt  // ADD THIS!
    );
    break;

// Update method signature
private _launchAgent(agentId: string, command: string, customPrompt?: string): void {
    // Pass to CopilotService when available
    // For now, include in info message
    const promptInfo = customPrompt ? ` with prompt: "${customPrompt.substring(0, 50)}..."` : '';
    vscode.window.showInformationMessage(
        `Launch: @${agentId} /${command}${promptInfo}`
    );
}
```

### Project Structure Notes

**Files to create/modify:**

| File | Action | Purpose |
|------|--------|---------|
| `webviews/sidebar/src/components/AgentLauncher.svelte` | Create/Modify | Add textarea with customPrompt state |
| `src/services/CopilotService.ts` | Create/Modify | Add sanitizePrompt() method |
| `src/providers/SidebarProvider.ts` | Modify | Pass customPrompt through to launch |
| `tests/unit/services/CopilotService.test.ts` | Create/Extend | Test sanitization logic |

### Test Fixtures

```typescript
// tests/unit/services/CopilotService.test.ts

describe('sanitizePrompt', () => {
    it('returns empty string for undefined input', () => {
        expect(sanitizePrompt(undefined)).toBe('');
    });
    
    it('removes @ at start of line', () => {
        expect(sanitizePrompt('@agent help me')).toBe('agent help me');
    });
    
    it('removes / at start of line', () => {
        expect(sanitizePrompt('/command do something')).toBe('command do something');
    });
    
    it('removes @ and / from multiple lines', () => {
        const input = '@first line\n/second line\nnormal line';
        const expected = 'first line\nsecond line\nnormal line';
        expect(sanitizePrompt(input)).toBe(expected);
    });
    
    it('strips control characters', () => {
        expect(sanitizePrompt('hello\x00world\x1F')).toBe('helloworld');
    });
    
    it('truncates prompt over 2000 chars', () => {
        const longPrompt = 'a'.repeat(2100);
        const result = sanitizePrompt(longPrompt);
        expect(result.length).toBe(2003); // 2000 + '...'
        expect(result.endsWith('...')).toBe(true);
    });
    
    it('preserves normal text unchanged', () => {
        const normal = 'Please help me debug this TypeScript code';
        expect(sanitizePrompt(normal)).toBe(normal);
    });
});
```

### References

- [Source: epics.md - Story 6.6 definition](../_bmad-output/planning-artifacts/epics.md#story-66-custom-prompt-field)
- [Source: architecture.md - NFR-S3 Sanitization](../_bmad-output/planning-artifacts/architecture.md#security)
- [Source: 6-3-agent-launcher-ui-component.md - UI Component spec](6-3-agent-launcher-ui-component.md)
- [Source: 6-4-copilotservice-chat-integration.md - Service patterns](6-4-copilotservice-chat-integration.md)
- [Source: src/shared/messages.ts - LaunchAgentPayload](../src/shared/messages.ts#L85-91)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Found existing implementation mostly complete from Story 6.3/6.4
- BUG FIX: SidebarProvider.ts L97 wasn't passing customPrompt to _launchAgent()
- Updated rows from 3 to 4 per spec requirement
- Fixed sanitization to omit empty/whitespace-only prompts from message

### Completion Notes List

- Task 1: `customPrompt?: string` already existed in LaunchAgentPayload ✅
- Task 2: customPrompt state, textarea, binding already implemented in AgentLauncher.svelte - updated rows=4 ✅
- Task 3: .prompt-field CSS already fully styled with VS Code variables ✅
- Task 4: launchAgent PostMessage already includes customPrompt ✅
- Task 5: sanitizePrompt() already existed in CopilotService - enhanced to handle empty strings after sanitization ✅
- Task 6: Fixed SidebarProvider to pass customPrompt in case handler ✅
- Task 7: Sanitization already applied in constructChatMessage() - enhanced for empty/whitespace handling ✅
- Task 8: Keyboard accessibility already implemented with tab order and focus styles ✅
- Task 9: Added 6 new tests for AC #6 (undefined/empty/whitespace), multi-line, and normal text ✅
- Task 10: Tests already existed in AgentLauncher.test.ts for customPrompt payload ✅

### File List

**Modified:**
- src/providers/SidebarProvider.ts - Fixed customPrompt passthrough to _launchAgent()
- src/services/CopilotService.ts - Enhanced constructChatMessage/constructFallbackMessage for empty prompt handling
- webviews/sidebar/src/components/AgentLauncher.svelte - Updated rows="4" for textarea
- tests/unit/services/CopilotService.test.ts - Added 6 new sanitization tests for AC #6

**Already Existed (no changes needed):**
- src/shared/messages.ts - LaunchAgentPayload already had customPrompt
- tests/unit/webviews/sidebar/AgentLauncher.test.ts - Tests already covered customPrompt