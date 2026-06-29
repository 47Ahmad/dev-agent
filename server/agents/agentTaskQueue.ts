/**
 * Agent Task Queue - Phase 4A
 * Priority-based task queue with deduplication, dependency resolution,
 * and support for task resumption after interruption.
 */

import { nanoid } from "nanoid";
import type { AgentTask, TaskStatus, TaskPriority, AgentType } from "./types";
import { isTaskCompleted, isTaskFailed, isTaskInProgress } from "./agentStateManager";

// ============================================
// QUEUE STORAGE
// ============================================

const taskQueue = new Map<string, AgentTask>();
const tasksByProject = new Map<string, Set<string>>();

// Priority weights for ordering
const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ============================================
// TASK CREATION
// ============================================

/**
 * Create and enqueue a new task
 */
export function createTask(params: {
  projectId: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  priority?: TaskPriority;
  assignedAgent?: AgentType;
  input?: Record<string, unknown>;
  dependencies?: string[];
  parentTaskId?: string;
  maxRetries?: number;
}): AgentTask {
  const task: AgentTask = {
    id: `task-${nanoid()}`,
    parentTaskId: params.parentTaskId,
    projectId: params.projectId,
    userId: params.userId,
    type: params.type,
    title: params.title,
    description: params.description,
    priority: params.priority ?? "medium",
    status: "pending",
    assignedAgent: params.assignedAgent,
    input: params.input ?? {},
    retryCount: 0,
    maxRetries: params.maxRetries ?? 3,
    dependencies: params.dependencies ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  enqueueTask(task);
  return task;
}

/**
 * Enqueue an existing task object
 */
export function enqueueTask(task: AgentTask): void {
  // Deduplication: skip if already completed or in progress
  if (isTaskCompleted(task.id)) {
    console.log(`[TaskQueue] Task ${task.id} already completed, skipping.`);
    return;
  }
  if (isTaskInProgress(task.id)) {
    console.log(`[TaskQueue] Task ${task.id} already in progress, skipping.`);
    return;
  }

  task.status = "queued";
  task.updatedAt = new Date();
  taskQueue.set(task.id, task);

  // Track by project
  if (!tasksByProject.has(task.projectId)) {
    tasksByProject.set(task.projectId, new Set());
  }
  tasksByProject.get(task.projectId)!.add(task.id);
}

// ============================================
// TASK RETRIEVAL
// ============================================

/**
 * Get the next available task for a specific agent type,
 * respecting priority and dependency resolution.
 */
export function dequeueTask(agentType: AgentType): AgentTask | null {
  const availableTasks = Array.from(taskQueue.values())
    .filter((task) => {
      if (task.status !== "queued" && task.status !== "pending") return false;
      if (task.assignedAgent && task.assignedAgent !== agentType) return false;
      if (!areDependenciesMet(task)) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by priority (higher first), then by creation time (older first)
      const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  if (availableTasks.length === 0) return null;

  const task = availableTasks[0];
  task.status = "in_progress";
  task.startedAt = new Date();
  task.updatedAt = new Date();
  taskQueue.set(task.id, task);

  return task;
}

/**
 * Get a task by ID
 */
export function getTask(taskId: string): AgentTask | undefined {
  return taskQueue.get(taskId);
}

/**
 * Get all tasks for a project
 */
export function getProjectTasks(projectId: string): AgentTask[] {
  const taskIds = tasksByProject.get(projectId) ?? new Set();
  return Array.from(taskIds)
    .map((id) => taskQueue.get(id))
    .filter((t): t is AgentTask => t !== undefined);
}

/**
 * Get all pending/queued tasks
 */
export function getPendingTasks(): AgentTask[] {
  return Array.from(taskQueue.values()).filter(
    (t) => t.status === "pending" || t.status === "queued"
  );
}

/**
 * Get queue statistics
 */
export function getQueueStats(): {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  cancelled: number;
} {
  const tasks = Array.from(taskQueue.values());
  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending" || t.status === "queued").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };
}

// ============================================
// TASK STATUS MANAGEMENT
// ============================================

/**
 * Mark a task as completed with output
 */
export function completeTask(taskId: string, output?: Record<string, unknown>): void {
  const task = taskQueue.get(taskId);
  if (!task) return;

  task.status = "completed";
  task.output = output;
  task.completedAt = new Date();
  task.updatedAt = new Date();
  taskQueue.set(taskId, task);
}

/**
 * Mark a task as failed with error message
 */
export function failTask(taskId: string, error: string): void {
  const task = taskQueue.get(taskId);
  if (!task) return;

  task.retryCount += 1;
  task.error = error;
  task.updatedAt = new Date();

  if (task.retryCount < task.maxRetries) {
    // Re-queue for retry
    task.status = "queued";
    task.startedAt = undefined;
    console.log(`[TaskQueue] Task ${taskId} failed, retrying (${task.retryCount}/${task.maxRetries})`);
  } else {
    task.status = "failed";
    task.completedAt = new Date();
    console.log(`[TaskQueue] Task ${taskId} permanently failed after ${task.retryCount} retries`);
  }

  taskQueue.set(taskId, task);
}

/**
 * Cancel a task
 */
export function cancelTask(taskId: string, reason?: string): void {
  const task = taskQueue.get(taskId);
  if (!task) return;

  task.status = "cancelled";
  task.error = reason ?? "Cancelled by user";
  task.updatedAt = new Date();
  taskQueue.set(taskId, task);
}

/**
 * Update task with checkpoint data (for resumption support)
 */
export function updateTaskCheckpoint(
  taskId: string,
  checkpointData: Record<string, unknown>
): void {
  const task = taskQueue.get(taskId);
  if (!task) return;

  task.checkpointData = checkpointData;
  task.updatedAt = new Date();
  taskQueue.set(taskId, task);
}

// ============================================
// DEPENDENCY RESOLUTION
// ============================================

/**
 * Check if all dependencies of a task are completed
 */
function areDependenciesMet(task: AgentTask): boolean {
  if (task.dependencies.length === 0) return true;

  return task.dependencies.every((depId) => {
    const dep = taskQueue.get(depId);
    return dep?.status === "completed" || isTaskCompleted(depId);
  });
}

/**
 * Get tasks that are blocked by a specific task
 */
export function getDependentTasks(taskId: string): AgentTask[] {
  return Array.from(taskQueue.values()).filter((t) => t.dependencies.includes(taskId));
}

// ============================================
// CLEANUP
// ============================================

/**
 * Remove completed/cancelled tasks older than the given age (ms)
 */
export function cleanupOldTasks(maxAgeMs = 3600000): number {
  const cutoff = new Date(Date.now() - maxAgeMs);
  let removed = 0;

  for (const [id, task] of taskQueue.entries()) {
    if (
      (task.status === "completed" || task.status === "cancelled") &&
      task.updatedAt < cutoff
    ) {
      taskQueue.delete(id);
      tasksByProject.get(task.projectId)?.delete(id);
      removed++;
    }
  }

  return removed;
}

/**
 * Clear all tasks (for testing)
 */
export function clearAllTasks(): void {
  taskQueue.clear();
  tasksByProject.clear();
}
