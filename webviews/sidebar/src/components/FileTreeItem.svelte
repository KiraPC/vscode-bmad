<!-- webviews/sidebar/src/components/FileTreeItem.svelte -->
<!-- Story 3.7 Task 5: File tree item component -->
<!-- AC #2: Click to open file in editor -->
<!-- AC #4: Appropriate icon based on file type -->
<!-- AC #5: Folder toggle functionality -->
<script lang="ts">
  import type { FileTreeNode, VsCodeApi } from '../lib/types';
  import FileTreeItem from './FileTreeItem.svelte';

  interface Props {
    node: FileTreeNode;
    depth?: number;
    vscode: VsCodeApi;
  }

  let { node, depth = 0, vscode }: Props = $props();

  // Top-level folders expanded by default, nested ones collapsed
  // svelte-ignore state_referenced_locally
  let expanded = $state(depth === 0);

  function handleClick() {
    if (node.type === 'folder') {
      expanded = !expanded;
    } else {
      // Story 3.7 AC #2: Send openFile message to extension
      vscode.postMessage({
        type: 'openFile',
        payload: { filePath: node.path },
      });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div class="tree-item">
  <button
    class="item-row"
    style="padding-left: {(depth * 12) + 8}px"
    onclick={handleClick}
    onkeydown={handleKeydown}
    role="treeitem"
    aria-selected="false"
    aria-expanded={node.type === 'folder' ? expanded : undefined}
  >
    {#if node.type === 'folder'}
      <span class="codicon codicon-{expanded ? 'chevron-down' : 'chevron-right'}" aria-hidden="true"></span>
    {:else}
      <span class="spacer"></span>
    {/if}
    
    <span class="codicon codicon-{node.icon || 'file'}" aria-hidden="true"></span>
    <span class="name">{node.name}</span>
  </button>

  {#if node.type === 'folder' && expanded && node.children}
    <div class="children" role="group">
      {#each node.children as child (child.path)}
        <FileTreeItem node={child} depth={depth + 1} {vscode} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .item-row {
    width: 100%;
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    text-align: left;
  }

  .item-row:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .item-row:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  .spacer {
    width: 16px;
    flex-shrink: 0;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .children {
    display: flex;
    flex-direction: column;
  }

  .codicon {
    flex-shrink: 0;
  }
</style>
