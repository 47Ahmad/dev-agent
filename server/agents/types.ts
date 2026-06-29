/**
 * Multi-Agent Core Types - Phase 4A
 * Shared type definitions for the multi-agent system.
 */

// ============================================
// AGENT IDENTITY & STATUS
// ============================================

export type AgentType = "orchestrator" | "planner" | "architect" | "executor";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "executing"
  | "waiting"
  | "completed"
  | "failed"
  | "paused";

export interface AgentIdentity {
  id: string;
  type: AgentType;
  name: string;
  description: string;
}

// ============================================
// TASK DEFINITIONS
// ============================================

export type TaskStatus =
  | "pending"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface AgentTask {
  id: string;
  parentTaskId?: string;
  projectId: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent?: AgentType;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  dependencies: string[]; // IDs of tasks that must complete first
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  checkpointData?: Record<string, unknown>; // For resuming after interruption
}

export interface TaskCheckpoint {
  taskId: string;
  step: string;
  stepIndex: number;
  totalSteps: number;
  partialOutput: Record<string, unknown>;
  savedAt: Date;
}

// ============================================
// AGENT MESSAGES
// ============================================

export type MessageType =
  | "task_assignment"
  | "task_result"
  | "task_error"
  | "status_update"
  | "request_help"
  | "coordination"
  | "heartbeat";

export interface AgentMessage {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType | "broadcast";
  type: MessageType;
  taskId?: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================
// EXECUTION PLAN
// ============================================

export interface ExecutionStep {
  id: string;
  order: number;
  title: string;
  description: string;
  agentType: AgentType;
  taskType: string;
  input: Record<string, unknown>;
  estimatedDuration?: number; // ms
  isOptional: boolean;
  dependsOn: string[]; // step IDs
}

export interface ExecutionPlan {
  id: string;
  projectId: string;
  userId: string;
  originalCommand: string;
  steps: ExecutionStep[];
  totalSteps: number;
  estimatedDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AGENT STATE
// ============================================

export interface AgentState {
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  currentTaskId?: string;
  currentPlanId?: string;
  processedTaskIds: string[];
  failedTaskIds: string[];
  startedAt: Date;
  lastHeartbeat: Date;
  metadata: Record<string, unknown>;
}

// ============================================
// ORCHESTRATION RESULT
// ============================================

export interface OrchestrationResult {
  success: boolean;
  planId: string;
  tasksCreated: number;
  tasksCompleted: number;
  tasksFailed: number;
  output?: Record<string, unknown>;
  errors?: string[];
  logs: string[];
  duration: number; // ms
}
