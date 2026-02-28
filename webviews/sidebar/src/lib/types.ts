/**
 * Sidebar WebView types re-export
 * Provides shared types from extension for WebView components
 * Story 6.3: Added Agent and AgentCommand types for Agent Launcher
 * Story 6.5: Added ModelOption for Model Selector
 */

// Re-export all shared types from extension
export * from '@shared/types';
export * from '@shared/messages';

// Story 6.3: Re-export Agent types for Agent Launcher component
// Story 6.5: Re-export ModelOption for Model Selector
export type { Agent, AgentCommand, AgentCommandAttributes, ModelOption } from '@shared/models';
