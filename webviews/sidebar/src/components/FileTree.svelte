<!-- webviews/sidebar/src/components/FileTree.svelte -->
<!-- Story 3.7 Task 4: File tree section component -->
<!-- AC #1: Shows config.yaml, planning-artifacts/, implementation-artifacts/ -->
<!-- AC #4: Uses codicons for file type consistency -->
<!-- AC #5: Folders are collapsible -->
<script lang="ts">
  import FileTreeItem from './FileTreeItem.svelte';
  import type { FilesLoadedPayload, VsCodeApi } from '../lib/types';

  interface Props {
    files: FilesLoadedPayload;
    vscode: VsCodeApi;
  }

  let { files, vscode }: Props = $props();

  let expanded = $state(true);

  function toggleExpanded() {
    expanded = !expanded;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  }
</script>

<section class="file-tree">
  <button 
    class="section-header" 
    onclick={toggleExpanded}
    onkeydown={handleKeydown}
    aria-expanded={expanded}
    aria-controls="file-tree-content"
  >
    <span class="codicon codicon-{expanded ? 'chevron-down' : 'chevron-right'}"></span>
    <span class="label">Project Files</span>
  </button>

  {#if expanded}
    <div id="file-tree-content" class="tree-content" role="tree">
      <!-- Config file (always shown) -->
      <FileTreeItem node={files.configFile} depth={0} {vscode} />

      <!-- Planning artifacts (show if has children) -->
      {#if files.planningArtifacts.children && files.planningArtifacts.children.length > 0}
        <FileTreeItem node={files.planningArtifacts} depth={0} {vscode} />
      {/if}

      <!-- Implementation artifacts (show if has children) -->
      {#if files.implementationArtifacts.children && files.implementationArtifacts.children.length > 0}
        <FileTreeItem node={files.implementationArtifacts} depth={0} {vscode} />
      {/if}
    </div>
  {/if}
</section>

<style>
  .file-tree {
    border-top: 1px solid var(--vscode-widget-border);
    margin-top: 1rem;
  }

  .section-header {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-header:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .section-header:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  .tree-content {
    padding-bottom: 0.5rem;
  }
</style>
