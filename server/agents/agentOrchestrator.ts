/**
 * Agent Orchestrator - Phase 4A + 4B Integration
 * The central coordinator of the multi-agent system.
 * Now integrated with Shared Intelligence & Memory System (Phase 4B).
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
import { executeAICommand, readProjectFiles } from "../services/aiExecutionEngine";

// Phase 4B Memory System Integration
import {
  getOrCreateContext,
  registerAgent,
  updateAgentContext,
  setCurrentGoal,
  addConversationTurn,
  buildContextSummary,
  updateFileStructure,
} from "../memory/sharedContextEngine";
import {
  getOrCreateWorkspace,
  joinWorkspace,
  leaveWorkspace,
  proposeDecision,
  autoApproveDecision,
} from "../memory/agentCollaboration";
import {
  createCheckpoint as createAdvancedCheckpoint,
  autoCheckpoint,
  resumeFromLatestCheckpoint,
  addHistoryEntry,
  rollbackToCheckpoint,
} from "../memory/checkpointSystem";
import {
  SaveMemory,
  RememberTaskResult,
  RememberErrorSolution,
  RecallContext,
} from "../memory/memoryAPI";

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
  console.log("[Orchestrator] Multi-Agent Core initialized successfully (Phase 4A + 4B).");
}

// ============================================
// MAIN ORCHESTRATION ENTRY POINT
// ============================================

/**
 * Execute a user command through the multi-agent pipeline.
 * Enhanced with Phase 4B: Shared Context, Memory, and Checkpoints.
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

  // ── Phase 4B: Initialize shared context and workspace ─────────────
  const sharedCtx = getOrCreateContext(params.projectId, params.userId);
  const workspace = getOrCreateWorkspace(params.projectId, params.userId);

  // Register all agents in workspace
  joinWorkspace(params.projectId, "orchestrator");
  joinWorkspace(params.projectId, "planner");
  joinWorkspace(params.projectId, "architect");
  joinWorkspace(params.projectId, "executor");

  // Register agents in shared context
  registerAgent(params.projectId, "orchestrator");
  registerAgent(params.projectId, "planner");
  registerAgent(params.projectId, "architect");
  registerAgent(params.projectId, "executor");

  // Set current goal
  setCurrentGoal(params.projectId, params.command);

  // Add user command to conversation history
  addConversationTurn(params.projectId, {
    role: "user",
    content: params.command,
  });

  // Recall relevant context from memory
  const relevantContext = RecallContext({
    query: params.command,
    projectId: params.projectId,
    limit: 5,
  });
  if (relevantContext.length > 0) {
    logs.push(`[Orchestrator] Recalled ${relevantContext.length} relevant memory entries.`);
  }

  try {
    // ── STEP 1: Create Execution Plan ──────────────────────────────
    logs.push("[Orchestrator] Requesting execution plan from Planner Agent...");
    updateAgentStatus("planner", "thinking");
    updateAgentContext(params.projectId, "planner", { status: "planning" });

    let projectContext: string | undefined;
    try {
      const files = await readProjectFiles(params.projectId);
      const fileList = Object.keys(files).slice(0, 20).join(", ");
      projectContext = `Project has ${Object.keys(files).length} files. Key files: ${fileList}`;

      // Update file structure in shared context
      const fileSummaries: Record<string, string> = {};
      for (const [path, content] of Object.entries(files)) {
        fileSummaries[path] = content.substring(0, 100);
      }
      updateFileStructure(params.projectId, fileSummaries);
    } catch {
      logs.push("[Orchestrator] Could not read project files for context.");
    }

    // Enrich context with memory
    const contextSummary = buildContextSummary(params.projectId, "planner");
    const enrichedContext = projectContext
      ? `${projectContext}\n\nContext:\n${contextSummary}`
      : contextSummary;

    const plan = await createExecutionPlan({
      projectId: params.projectId,
      userId: params.userId,
      command: params.command,
      projectContext: enrichedContext,
    });

    logs.push(`[Orchestrator] Plan created: ${plan.id} with ${plan.totalSteps} steps`);
    updateAgentContext(params.projectId, "planner", { planId: plan.id, status: "done" });

    // Propose plan as a decision
    const decision = proposeDecision({
      projectId: params.projectId,
      title: `Execute: ${params.command.substring(0, 50)}`,
      description: `Plan ${plan.id} with ${plan.totalSteps} steps`,
      proposedBy: "planner",
      rationale: `Automated plan for: ${params.command}`,
    });
    autoApproveDecision(params.projectId, decision.id);

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

    // Check for resume from checkpoint
    const resumeInfo = resumeFromLatestCheckpoint(plan.id);
    if (resumeInfo.canResume && resumeInfo.checkpoint) {
      logs.push(`[Orchestrator] ${resumeInfo.message}`);
    }

    for (let stepIdx = 0; stepIdx < stepTasks.length; stepIdx++) {
      const task = stepTasks[stepIdx];

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
      updateAgentContext(params.projectId, task.assignedAgent!, {
        currentTaskId: task.id,
        status: "executing",
      }, task.id);

      try {
        // Check for legacy checkpoint (resume support)
        const legacyCheckpoint = getCheckpoint(task.id);
        if (legacyCheckpoint) {
          logs.push(`[Orchestrator] Resuming task from checkpoint: step ${legacyCheckpoint.stepIndex}/${legacyCheckpoint.totalSteps}`);
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

          // Phase 4B: Advanced checkpoint
          autoCheckpoint(task.id, params.projectId, params.userId, 1, 1, {
            completedStepIds: [task.id],
            pendingStepIds: [],
            partialOutputs: taskOutput,
          });

          // Legacy checkpoint
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

          // Phase 4B: Save result to memory
          RememberTaskResult({
            taskId: task.id,
            projectId: params.projectId,
            agentId: "executor",
            command: params.command,
            result: executionResult.message,
            success: executionResult.success,
          });

          // Phase 4B: Advanced checkpoint
          autoCheckpoint(task.id, params.projectId, params.userId, 1, 1, {
            completedStepIds: [task.id],
            pendingStepIds: [],
            partialOutputs: taskOutput,
          });

          // Legacy checkpoint
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
        updateAgentContext(params.projectId, task.assignedAgent!, { status: "idle" });

        // Notify about completion
        sendMessage({
          fromAgent: ORCHESTRATOR_TYPE,
          toAgent: "broadcast",
          type: "status_update",
          taskId: task.id,
          payload: { status: "completed", taskTitle: task.title },
        });

        // Phase 4B: Auto-checkpoint after each task
        autoCheckpoint(plan.id, params.projectId, params.userId, stepIdx + 1, stepTasks.length, {
          completedStepIds: stepTasks.slice(0, stepIdx + 1).map((t) => t.id),
          pendingStepIds: stepTasks.slice(stepIdx + 1).map((t) => t.id),
          partialOutputs: finalOutput,
        });

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logs.push(`[Orchestrator] Task failed: ${task.title} - ${errMsg}`);

        failTask(task.id, errMsg);
        markTaskFailed(task.assignedAgent!, task.id);
        tasksFailed++;

        // Phase 4B: Remember the error for future reference
        RememberErrorSolution({
          error: errMsg,
          solution: `Task "${task.title}" failed. Review input and retry.`,
          projectId: params.projectId,
          agentId: task.assignedAgent,
        });

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

    // Phase 4B: Leave workspace
    leaveWorkspace(params.projectId, "orchestrator");

    // Phase 4B: Add result to conversation history
    const resultSummary = `Completed ${tasksCompleted}/${tasksCreated} tasks. ${tasksFailed > 0 ? `${tasksFailed} failed.` : "All successful."}`;
    addConversationTurn(params.projectId, {
      role: "assistant",
      agentType: "orchestrator",
      content: resultSummary,
    });

    // Phase 4B: Add to execution history
    addHistoryEntry({
      taskId: plan.id,
      projectId: params.projectId,
      userId: params.userId,
      command: params.command,
      status: tasksFailed === 0 ? "completed" : "partial",
      summary: resultSummary,
      filesChanged: (finalOutput.filesChanged as number) ?? 0,
      startedAt: new Date(startTime),
      completedAt: new Date(),
    });

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

    // Phase 4B: Remember fatal error
    RememberErrorSolution({
      error: errMsg,
      solution: "Fatal orchestration error. Check system state.",
      projectId: params.projectId,
    });

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
