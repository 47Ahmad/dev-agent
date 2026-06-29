/**
 * Agent State Manager - Phase 4A
 * Manages the lifecycle state of all agents in the system.
 * Provides persistence, recovery, and monitoring capabilities.
 */

import { nanoid } from "nanoid";
import type { AgentState, AgentStatus, AgentType, AgentTask, TaskCheckpoint } from "./types";

// ============================================
// IN-MEMORY STATE STORE
// ============================================

const agentStates = new Map<string, AgentState>();
const taskCheckpoints = new Map<string, TaskCheckpoint>();
const completedTaskIds = new Set<string>();
const failedTaskIds = new Set<string>();

// ============================================
// AGENT STATE OPERATIONS
// ============================================

/**
 * Initialize or reset an agent's state
 */
export function initializeAgentState(agentType: AgentType): AgentState {
  const agentId = `agent-${agentType}-${nanoid(8)}`;
  const state: AgentState = {
    agentId,
    agentType,
    status: "idle",
    processedTaskIds: [],
    failedTaskIds: [],
    startedAt: new Date(),
    lastHeartbeat: new Date(),
    metadata: {},
  };
  agentStates.set(agentType, state);
  return state;
}

/**
 * Get the current state of an agent by type
 */
export function getAgentState(agentType: AgentType): AgentState | undefined {
  return agentStates.get(agentType);
}

/**
 * Get all agent states
 */
export function getAllAgentStates(): AgentState[] {
  return Array.from(agentStates.values());
}

/**
 * Update an agent's status
 */
export function updateAgentStatus(
  agentType: AgentType,
  status: AgentStatus,
  currentTaskId?: string
): void {
  const state = agentStates.get(agentType);
  if (!state) {
    initializeAgentState(agentType);
    return updateAgentStatus(agentType, status, currentTaskId);
  }
  state.status = status;
  state.lastHeartbeat = new Date();
  if (currentTaskId !== undefined) {
    state.currentTaskId = currentTaskId;
  }
  agentStates.set(agentType, state);
}

/**
 * Mark a task as completed in agent state
 */
export function markTaskCompleted(agentType: AgentType, taskId: string): void {
  const state = agentStates.get(agentType);
  if (state) {
    if (!state.processedTaskIds.includes(taskId)) {
      state.processedTaskIds.push(taskId);
    }
    if (state.currentTaskId === taskId) {
      state.currentTaskId = undefined;
    }
    state.status = "idle";
    state.lastHeartbeat = new Date();
    agentStates.set(agentType, state);
  }
  completedTaskIds.add(taskId);
}

/**
 * Mark a task as failed in agent state
 */
export function markTaskFailed(agentType: AgentType, taskId: string): void {
  const state = agentStates.get(agentType);
  if (state) {
    if (!state.failedTaskIds.includes(taskId)) {
      state.failedTaskIds.push(taskId);
    }
    if (state.currentTaskId === taskId) {
      state.currentTaskId = undefined;
    }
    state.status = "idle";
    state.lastHeartbeat = new Date();
    agentStates.set(agentType, state);
  }
  failedTaskIds.add(taskId);
}

/**
 * Update agent metadata
 */
export function updateAgentMetadata(
  agentType: AgentType,
  metadata: Record<string, unknown>
): void {
  const state = agentStates.get(agentType);
  if (state) {
    state.metadata = { ...state.metadata, ...metadata };
    agentStates.set(agentType, state);
  }
}

/**
 * Send a heartbeat for an agent
 */
export function sendHeartbeat(agentType: AgentType): void {
  const state = agentStates.get(agentType);
  if (state) {
    state.lastHeartbeat = new Date();
    agentStates.set(agentType, state);
  }
}

// ============================================
// TASK DEDUPLICATION
// ============================================

/**
 * Check if a task has already been completed (prevents duplicate execution)
 */
export function isTaskCompleted(taskId: string): boolean {
  return completedTaskIds.has(taskId);
}

/**
 * Check if a task has failed
 */
export function isTaskFailed(taskId: string): boolean {
  return failedTaskIds.has(taskId);
}

/**
 * Check if a task is already being processed by any agent
 */
export function isTaskInProgress(taskId: string): boolean {
  for (const state of agentStates.values()) {
    if (state.currentTaskId === taskId && state.status === "executing") {
      return true;
    }
  }
  return false;
}

// ============================================
// CHECKPOINT MANAGEMENT (Resume Support)
// ============================================

/**
 * Save a checkpoint for a task to allow resumption after interruption
 */
export function saveCheckpoint(checkpoint: TaskCheckpoint): void {
  taskCheckpoints.set(checkpoint.taskId, checkpoint);
}

/**
 * Get the checkpoint for a task
 */
export function getCheckpoint(taskId: string): TaskCheckpoint | undefined {
  return taskCheckpoints.get(taskId);
}

/**
 * Delete a checkpoint after successful completion
 */
export function deleteCheckpoint(taskId: string): void {
  taskCheckpoints.delete(taskId);
}

/**
 * Get all pending checkpoints (for recovery after system restart)
 */
export function getPendingCheckpoints(): TaskCheckpoint[] {
  return Array.from(taskCheckpoints.values());
}

// ============================================
// SYSTEM HEALTH
// ============================================

/**
 * Get system health summary
 */
export function getSystemHealth(): {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  completedTasks: number;
  failedTasks: number;
  pendingCheckpoints: number;
} {
  const states = getAllAgentStates();
  return {
    totalAgents: states.length,
    activeAgents: states.filter((s) => s.status === "executing" || s.status === "thinking").length,
    idleAgents: states.filter((s) => s.status === "idle").length,
    completedTasks: completedTaskIds.size,
    failedTasks: failedTaskIds.size,
    pendingCheckpoints: taskCheckpoints.size,
  };
}

/**
 * Reset all agent states (for testing or system restart)
 */
export function resetAllAgentStates(): void {
  agentStates.clear();
  taskCheckpoints.clear();
  completedTaskIds.clear();
  failedTaskIds.clear();
}
