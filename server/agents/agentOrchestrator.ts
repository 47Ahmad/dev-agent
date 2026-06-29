/**
 * Agent Orchestrator - Phase 4A
 * The central coordinator of the multi-agent system.
 * Manages task distribution, agent coordination, and execution flow.
 * Integrates with the existing AI Execution Engine without rebuilding it.
 */

import { nanoid } from "nanoid";
import type { AgentType, OrchestrationResult, AgentTask, ExecutionStep } from "./types";
import {
  initializeAgentState,
  updateAgentStatus,
  markTaskCompleted,
  markTaskFailed,
  isTaskCompleted,
  isTaskInProgress,
  saveCheckpoint,
  getCheckpoint,
  deleteCheckpoint,
  getSystemHealth,
} from "./agentStateManager";
import {
  createTask,
  enqueueTask,
  dequeueTask,
  completeTask,
  failTask,
  getTask,
  getProjectTasks,
  getQueueStats,
} from "./agentTaskQueue";
import {
  sendMessage,
  registerMessageHandler,
  getInboxMessages,
  acknowledgeAllMessages,
} from "./agentCommunication";
import { createExecutionPlan, getExecutionPlan } from "./plannerAgent";
import { designSolution } from "./architectAgent";
import { executeAICommand } from "../services/aiExecutionEngine";
import { readProjectFiles } from "../services/aiExecutionEngine";

// ============================================
// ORCHESTRATOR IDENTITY
// ============================================

const ORCHESTRATOR_TYPE: AgentType = "orchestrator";

// ============================================
// ORCHESTRATOR INITIALIZATION
// ============================================

let isInitialized = false;

/**
 * Initialize the orchestrator and all sub-agents
 */
export function initializeOrchestrator(): void {
  if (isInitialized) return;

  // Initialize all agent states
  initializeAgentState(ORCHESTRATOR_TYPE);
  initializeAgentState("planner");
  initializeAgentState("architect");
  initializeAgentState("executor");

  // Register message handlers
  registerMessageHandler(ORCHESTRATOR_TYPE, handleIncomingMessage);

  isInitialized = true;
  console.log("[Orchestrator] Multi-Agent Core initialized successfully.");
}

// ============================================
// MAIN ORCHESTRATION ENTRY POINT
// ============================================

/**
 * Execute a user command through the multi-agent pipeline.
 * This is the primary entry point for the orchestrator.
 */
export async function orchestrateCommand(params: {
  projectId: string;
  userId: string;
  command: string;
}): Promise<OrchestrationResult> {
  if (!isInitialized) {
    initializeOrchestrator();
  }

  const startTime = Date.now();
  const logs: string[] = [];
  let tasksCreated = 0;
  let tasksCompleted = 0;
  let tasksFailed = 0;

  updateAgentStatus(ORCHESTRATOR_TYPE, "thinking");
  logs.push(`[Orchestrator] Starting orchestration for command: "${params.command}"`);

  try {
    // ── STEP 1: Create Execution Plan ──────────────────────────────
    logs.push("[Orchestrator] Requesting execution plan from Planner Agent...");
    updateAgentStatus("planner", "thinking");

    let projectContext: string | undefined;
    try {
      const files = await readProjectFiles(params.projectId);
      const fileList = Object.keys(files).slice(0, 20).join(", ");
      projectContext = `Project has ${Object.keys(files).length} files. Key files: ${fileList}`;
    } catch {
      logs.push("[Orchestrator] Could not read project files for context.");
    }

    const plan = await createExecutionPlan({
      projectId: params.projectId,
      userId: params.userId,
      command: params.command,
      projectContext,
    });

    logs.push(`[Orchestrator] Plan created: ${plan.id} with ${plan.totalSteps} steps`);

    // ── STEP 2: Create Tasks from Plan Steps ───────────────────────
    const stepTasks: AgentTask[] = [];

    for (const step of plan.steps) {
      const task = createTask({
        projectId: params.projectId,
        userId: params.userId,
        type: step.taskType,
        title: step.title,
        description: step.description,
        priority: "high",
        assignedAgent: step.agentType,
        input: { ...step.input, command: params.command, planId: plan.id, stepId: step.id },
        dependencies: step.dependsOn
          .map((depStepId) => {
            const depTask = stepTasks.find((t) => t.input.stepId === depStepId);
            return depTask?.id ?? "";
          })
          .filter(Boolean),
        maxRetries: 2,
      });

      stepTasks.push(task);
      tasksCreated++;
      logs.push(`[Orchestrator] Task created: ${task.id} -> ${step.agentType}: ${step.title}`);
    }

    // ── STEP 3: Execute Tasks in Order ─────────────────────────────
    logs.push("[Orchestrator] Starting task execution...");

    let finalOutput: Record<string, unknown> = {};
    let architectDesignId: string | undefined;

    for (const task of stepTasks) {
      // Check for duplicate execution
      if (isTaskCompleted(task.id)) {
        logs.push(`[Orchestrator] Task ${task.id} already completed, skipping.`);
        tasksCompleted++;
        continue;
      }

      if (isTaskInProgress(task.id)) {
        logs.push(`[Orchestrator] Task ${task.id} already in progress, skipping.`);
        continue;
      }

      logs.push(`[Orchestrator] Executing task: ${task.title} (${task.assignedAgent})`);
      updateAgentStatus(task.assignedAgent!, "executing", task.id);

      try {
        // Check for checkpoint (resume support)
        const checkpoint = getCheckpoint(task.id);
        if (checkpoint) {
          logs.push(`[Orchestrator] Resuming task from checkpoint: step ${checkpoint.stepIndex}/${checkpoint.totalSteps}`);
        }

        let taskOutput: Record<string, unknown> = {};

        // ── ARCHITECT AGENT ──────────────────────────────────────
        if (task.assignedAgent === "architect") {
          let projectFiles: Record<string, string> = {};
          try {
            projectFiles = await readProjectFiles(params.projectId);
          } catch {
            logs.push("[Orchestrator] Could not read project files for architect.");
          }

          const design = await designSolution({
            taskId: task.id,
            projectId: params.projectId,
            command: params.command,
            projectFiles,
          });

          architectDesignId = design.id;
          taskOutput = {
            designId: design.id,
            approach: design.solution.approach,
            complexity: design.solution.estimatedComplexity,
            filesToModify: design.solution.filesToModify,
            filesToCreate: design.solution.filesToCreate,
          };

          // Save checkpoint
          saveCheckpoint({
            taskId: task.id,
            step: "design_complete",
            stepIndex: 1,
            totalSteps: 1,
            partialOutput: taskOutput,
            savedAt: new Date(),
          });
        }

        // ── EXECUTOR AGENT ───────────────────────────────────────
        else if (task.assignedAgent === "executor") {
          // Use the existing AI Execution Engine (no rebuild)
          const executionResult = await executeAICommand(
            params.projectId,
            params.userId,
            params.command
          );

          taskOutput = {
            success: executionResult.success,
            message: executionResult.message,
            filesChanged: executionResult.filesChanged?.length ?? 0,
            newFiles: executionResult.newFiles?.length ?? 0,
            errors: executionResult.errors ?? [],
          };

          finalOutput = { ...finalOutput, ...taskOutput };

          // Save checkpoint
          saveCheckpoint({
            taskId: task.id,
            step: "execution_complete",
            stepIndex: 1,
            totalSteps: 1,
            partialOutput: taskOutput,
            savedAt: new Date(),
          });
        }

        // Mark task as completed
        completeTask(task.id, taskOutput);
        markTaskCompleted(task.assignedAgent!, task.id);
        deleteCheckpoint(task.id);
        tasksCompleted++;

        logs.push(`[Orchestrator] Task completed: ${task.title}`);

        // Notify about completion
        sendMessage({
          fromAgent: ORCHESTRATOR_TYPE,
          toAgent: "broadcast",
          type: "status_update",
          taskId: task.id,
          payload: { status: "completed", taskTitle: task.title },
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logs.push(`[Orchestrator] Task failed: ${task.title} - ${errMsg}`);

        failTask(task.id, errMsg);
        markTaskFailed(task.assignedAgent!, task.id);
        tasksFailed++;

        // If not optional, abort remaining tasks
        const step = plan.steps.find((s) => s.id === (task.input.stepId as string));
        if (!step?.isOptional) {
          logs.push("[Orchestrator] Critical task failed, aborting remaining tasks.");
          break;
        }
      }
    }

    // ── STEP 4: Finalize ───────────────────────────────────────────
    updateAgentStatus(ORCHESTRATOR_TYPE, "idle");
    acknowledgeAllMessages(ORCHESTRATOR_TYPE);

    const duration = Date.now() - startTime;
    logs.push(`[Orchestrator] Orchestration completed in ${duration}ms`);
    logs.push(`[Orchestrator] Tasks: ${tasksCompleted} completed, ${tasksFailed} failed`);

    return {
      success: tasksFailed === 0,
      planId: plan.id,
      tasksCreated,
      tasksCompleted,
      tasksFailed,
      output: finalOutput,
      errors: tasksFailed > 0 ? [`${tasksFailed} task(s) failed`] : undefined,
      logs,
      duration,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logs.push(`[Orchestrator] Fatal error: ${errMsg}`);
    updateAgentStatus(ORCHESTRATOR_TYPE, "failed");

    return {
      success: false,
      planId: "",
      tasksCreated,
      tasksCompleted,
      tasksFailed: tasksCreated - tasksCompleted,
      errors: [errMsg],
      logs,
      duration: Date.now() - startTime,
    };
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

function handleIncomingMessage(message: import("./types").AgentMessage): void {
  console.log(
    `[Orchestrator] Received message from ${message.fromAgent}: [${message.type}]`
  );
}

// ============================================
// STATUS & MONITORING
// ============================================

/**
 * Get the current status of the multi-agent system
 */
export function getOrchestratorStatus(): {
  initialized: boolean;
  systemHealth: ReturnType<typeof getSystemHealth>;
  queueStats: ReturnType<typeof getQueueStats>;
} {
  return {
    initialized: isInitialized,
    systemHealth: getSystemHealth(),
    queueStats: getQueueStats(),
  };
}

/**
 * Get all tasks for a project with their current status
 */
export function getProjectExecutionStatus(projectId: string): {
  tasks: AgentTask[];
  stats: ReturnType<typeof getQueueStats>;
} {
  return {
    tasks: getProjectTasks(projectId),
    stats: getQueueStats(),
  };
}
