/**
 * Advanced Checkpoint System - Phase 4B
 * Provides automatic checkpoints, rollback, recovery,
 * and full execution history tracking.
 */

import { nanoid } from "nanoid";
import type {
  AdvancedCheckpoint,
  ExecutionState,
  MemorySnapshot,
  RollbackResult,
  ExecutionHistoryEntry,
} from "./types";
import { exportContextSnapshot } from "./sharedContextEngine";
import { getMemoryStats } from "./memoryStore";
import { saveMemory } from "./memoryStore";

// ============================================
// CHECKPOINT STORE
// ============================================

const checkpoints = new Map<string, AdvancedCheckpoint>();
const checkpointsByTask = new Map<string, string[]>();    // taskId -> checkpointIds
const checkpointsByProject = new Map<string, string[]>(); // projectId -> checkpointIds
const executionHistory = new Map<string, ExecutionHistoryEntry[]>(); // projectId -> history

// ============================================
// CHECKPOINT CREATION
// ============================================

/**
 * Create a checkpoint for a task execution
 */
export function createCheckpoint(params: {
  taskId: string;
  planId?: string;
  projectId: string;
  userId: string;
  label: string;
  description?: string;
  stepIndex: number;
  totalSteps: number;
  executionState: Partial<ExecutionState>;
  isAutomatic?: boolean;
}): AdvancedCheckpoint {
  const contextSnapshot = exportContextSnapshot(params.projectId);

  const memorySnapshot: MemorySnapshot = {
    workingMemoryEntries: [],  // IDs captured at checkpoint time
    shortTermEntries: [],
    contextVersion: contextSnapshot.version,
    timestamp: new Date(),
  };

  const fullExecutionState: ExecutionState = {
    completedStepIds: params.executionState.completedStepIds ?? [],
    pendingStepIds: params.executionState.pendingStepIds ?? [],
    failedStepIds: params.executionState.failedStepIds ?? [],
    partialOutputs: params.executionState.partialOutputs ?? {},
    agentStates: params.executionState.agentStates ?? {},
    variables: params.executionState.variables ?? {},
  };

  const checkpoint: AdvancedCheckpoint = {
    id: `ckpt-${nanoid()}`,
    taskId: params.taskId,
    planId: params.planId,
    projectId: params.projectId,
    userId: params.userId,
    label: params.label,
    description: params.description ?? `Checkpoint at step ${params.stepIndex}/${params.totalSteps}`,
    stepIndex: params.stepIndex,
    totalSteps: params.totalSteps,
    executionState: fullExecutionState,
    memorySnapshot,
    createdAt: new Date(),
    isAutomatic: params.isAutomatic ?? true,
    canRollback: true,
  };

  checkpoints.set(checkpoint.id, checkpoint);

  // Index by task
  if (!checkpointsByTask.has(params.taskId)) {
    checkpointsByTask.set(params.taskId, []);
  }
  checkpointsByTask.get(params.taskId)!.push(checkpoint.id);

  // Index by project
  if (!checkpointsByProject.has(params.projectId)) {
    checkpointsByProject.set(params.projectId, []);
  }
  checkpointsByProject.get(params.projectId)!.push(checkpoint.id);

  // Persist to memory store
  saveMemory({
    tier: "long_term",
    category: "task_result",
    key: `checkpoint:${checkpoint.id}`,
    content: JSON.stringify({
      id: checkpoint.id,
      taskId: params.taskId,
      label: params.label,
      stepIndex: params.stepIndex,
      totalSteps: params.totalSteps,
      createdAt: checkpoint.createdAt,
    }),
    projectId: params.projectId,
    userId: params.userId,
    importance: 0.8,
    tags: ["checkpoint", params.isAutomatic ? "auto" : "manual"],
  });

  return checkpoint;
}

/**
 * Auto-checkpoint: creates a checkpoint at regular intervals
 */
export function autoCheckpoint(
  taskId: string,
  projectId: string,
  userId: string,
  stepIndex: number,
  totalSteps: number,
  executionState: Partial<ExecutionState>
): AdvancedCheckpoint {
  return createCheckpoint({
    taskId,
    projectId,
    userId,
    label: `Auto-checkpoint ${stepIndex}/${totalSteps}`,
    stepIndex,
    totalSteps,
    executionState,
    isAutomatic: true,
  });
}

// ============================================
// CHECKPOINT RETRIEVAL
// ============================================

/**
 * Get a checkpoint by ID
 */
export function getCheckpoint(id: string): AdvancedCheckpoint | undefined {
  return checkpoints.get(id);
}

/**
 * Get the latest checkpoint for a task
 */
export function getLatestCheckpoint(taskId: string): AdvancedCheckpoint | undefined {
  const ids = checkpointsByTask.get(taskId) ?? [];
  if (ids.length === 0) return undefined;

  const latestId = ids[ids.length - 1];
  return checkpoints.get(latestId);
}

/**
 * Get all checkpoints for a task
 */
export function getTaskCheckpoints(taskId: string): AdvancedCheckpoint[] {
  const ids = checkpointsByTask.get(taskId) ?? [];
  return ids
    .map((id) => checkpoints.get(id))
    .filter((c): c is AdvancedCheckpoint => !!c)
    .sort((a, b) => a.stepIndex - b.stepIndex);
}

/**
 * Get all checkpoints for a project
 */
export function getProjectCheckpoints(projectId: string): AdvancedCheckpoint[] {
  const ids = checkpointsByProject.get(projectId) ?? [];
  return ids
    .map((id) => checkpoints.get(id))
    .filter((c): c is AdvancedCheckpoint => !!c)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============================================
// ROLLBACK & RECOVERY
// ============================================

/**
 * Rollback to a specific checkpoint
 */
export function rollbackToCheckpoint(checkpointId: string): RollbackResult {
  const checkpoint = checkpoints.get(checkpointId);
  if (!checkpoint) {
    return {
      success: false,
      checkpointId,
      restoredSteps: [],
      message: `Checkpoint ${checkpointId} not found`,
    };
  }

  if (!checkpoint.canRollback) {
    return {
      success: false,
      checkpointId,
      restoredSteps: [],
      message: `Checkpoint ${checkpointId} cannot be rolled back`,
    };
  }

  // Restore execution state
  const restoredSteps = checkpoint.executionState.completedStepIds;

  // Mark all checkpoints after this one as non-rollbackable
  const taskCheckpoints = getTaskCheckpoints(checkpoint.taskId);
  for (const ckpt of taskCheckpoints) {
    if (ckpt.stepIndex > checkpoint.stepIndex) {
      ckpt.canRollback = false;
      checkpoints.set(ckpt.id, ckpt);
    }
  }

  // Log rollback to history
  addHistoryEntry({
    taskId: checkpoint.taskId,
    projectId: checkpoint.projectId,
    userId: checkpoint.userId,
    command: `Rollback to checkpoint: ${checkpoint.label}`,
    status: "rolled_back",
    checkpointIds: [checkpointId],
    summary: `Rolled back to step ${checkpoint.stepIndex}/${checkpoint.totalSteps}`,
    filesChanged: 0,
  });

  return {
    success: true,
    checkpointId,
    restoredSteps,
    message: `Successfully rolled back to checkpoint: ${checkpoint.label} (step ${checkpoint.stepIndex}/${checkpoint.totalSteps})`,
  };
}

/**
 * Resume execution from the latest checkpoint
 */
export function resumeFromLatestCheckpoint(taskId: string): {
  checkpoint: AdvancedCheckpoint | null;
  canResume: boolean;
  message: string;
} {
  const checkpoint = getLatestCheckpoint(taskId);

  if (!checkpoint) {
    return {
      checkpoint: null,
      canResume: false,
      message: "No checkpoint found for this task",
    };
  }

  const pendingSteps = checkpoint.executionState.pendingStepIds;
  const canResume = pendingSteps.length > 0;

  return {
    checkpoint,
    canResume,
    message: canResume
      ? `Resuming from step ${checkpoint.stepIndex}/${checkpoint.totalSteps} with ${pendingSteps.length} pending steps`
      : "All steps completed, nothing to resume",
  };
}

// ============================================
// EXECUTION HISTORY
// ============================================

/**
 * Add an entry to execution history
 */
export function addHistoryEntry(params: {
  taskId: string;
  projectId: string;
  userId: string;
  command: string;
  status: ExecutionHistoryEntry["status"];
  checkpointIds?: string[];
  summary: string;
  filesChanged: number;
  startedAt?: Date;
  completedAt?: Date;
}): ExecutionHistoryEntry {
  const entry: ExecutionHistoryEntry = {
    id: `hist-${nanoid()}`,
    taskId: params.taskId,
    projectId: params.projectId,
    userId: params.userId,
    command: params.command,
    status: params.status,
    checkpointIds: params.checkpointIds ?? [],
    startedAt: params.startedAt ?? new Date(),
    completedAt: params.completedAt,
    duration:
      params.startedAt && params.completedAt
        ? params.completedAt.getTime() - params.startedAt.getTime()
        : undefined,
    summary: params.summary,
    filesChanged: params.filesChanged,
  };

  if (!executionHistory.has(params.projectId)) {
    executionHistory.set(params.projectId, []);
  }
  executionHistory.get(params.projectId)!.push(entry);

  // Persist to memory
  saveMemory({
    tier: "episodic",
    category: "task_result",
    key: `history:${entry.id}`,
    content: `[${params.status}] ${params.command}\n${params.summary}`,
    projectId: params.projectId,
    userId: params.userId,
    importance: params.status === "failed" ? 0.8 : 0.6,
    tags: ["execution_history", params.status],
  });

  return entry;
}

/**
 * Get execution history for a project
 */
export function getExecutionHistory(
  projectId: string,
  limit = 20
): ExecutionHistoryEntry[] {
  const history = executionHistory.get(projectId) ?? [];
  return history
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, limit);
}

/**
 * Get checkpoint statistics
 */
export function getCheckpointStats(): {
  total: number;
  automatic: number;
  manual: number;
  rollbackable: number;
  historyEntries: number;
} {
  const allCheckpoints = Array.from(checkpoints.values());
  let historyTotal = 0;
  for (const entries of executionHistory.values()) {
    historyTotal += entries.length;
  }

  return {
    total: allCheckpoints.length,
    automatic: allCheckpoints.filter((c) => c.isAutomatic).length,
    manual: allCheckpoints.filter((c) => !c.isAutomatic).length,
    rollbackable: allCheckpoints.filter((c) => c.canRollback).length,
    historyEntries: historyTotal,
  };
}

/**
 * Clean up old checkpoints
 */
export function cleanupOldCheckpoints(maxAgeMs = 7 * 24 * 60 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - maxAgeMs);
  let removed = 0;

  for (const [id, checkpoint] of checkpoints.entries()) {
    if (checkpoint.createdAt < cutoff && checkpoint.isAutomatic) {
      checkpoints.delete(id);
      checkpointsByTask.get(checkpoint.taskId)?.splice(
        checkpointsByTask.get(checkpoint.taskId)!.indexOf(id),
        1
      );
      checkpointsByProject.get(checkpoint.projectId)?.splice(
        checkpointsByProject.get(checkpoint.projectId)!.indexOf(id),
        1
      );
      removed++;
    }
  }

  return removed;
}

/**
 * Clear all checkpoints (for testing)
 */
export function clearAllCheckpoints(): void {
  checkpoints.clear();
  checkpointsByTask.clear();
  checkpointsByProject.clear();
  executionHistory.clear();
}
