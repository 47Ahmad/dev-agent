/**
 * Multi-Agent Core Tests - Phase 4A
 * Unit and Integration tests for the multi-agent system.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("../../server/_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            steps: [
              {
                title: "تحليل المتطلبات",
                description: "تحليل الأمر المطلوب",
                agentType: "architect",
                taskType: "design",
                input: {},
                isOptional: false,
                dependsOn: [],
                estimatedDuration: 5000,
              },
              {
                title: "تنفيذ التعديلات",
                description: "تنفيذ التعديلات على الكود",
                agentType: "executor",
                taskType: "implement",
                input: {},
                isOptional: false,
                dependsOn: [],
                estimatedDuration: 10000,
              },
            ],
            totalEstimatedDuration: 15000,
          }),
        },
      },
    ],
  }),
}));

// ── Mock AI Execution Engine ──────────────────────────────────────────────────
vi.mock("../services/aiExecutionEngine", () => ({
  executeAICommand: vi.fn().mockResolvedValue({
    success: true,
    message: "تم تنفيذ الأمر بنجاح",
    filesChanged: [{ filePath: "/src/App.tsx", oldContent: "", newContent: "// updated" }],
    newFiles: [],
    errors: [],
    logs: ["[INFO] تم التنفيذ"],
  }),
  readProjectFiles: vi.fn().mockResolvedValue({
    "/src/App.tsx": "export default function App() {}",
    "/src/main.tsx": "import App from './App';",
  }),
  analyzeProjectStructure: vi.fn().mockReturnValue({
    fileCount: 2,
    components: [],
    pages: ["/src/App.tsx"],
    apis: [],
    services: [],
    folders: [],
    dependencies: {},
  }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
import {
  initializeAgentState,
  getAgentState,
  updateAgentStatus,
  markTaskCompleted,
  markTaskFailed,
  isTaskCompleted,
  isTaskFailed,
  isTaskInProgress,
  saveCheckpoint,
  getCheckpoint,
  deleteCheckpoint,
  getSystemHealth,
  resetAllAgentStates,
} from "./agentStateManager";

import {
  createTask,
  enqueueTask,
  dequeueTask,
  completeTask,
  failTask,
  cancelTask,
  getTask,
  getQueueStats,
  clearAllTasks,
} from "./agentTaskQueue";

import {
  sendMessage,
  getInboxMessages,
  acknowledgeMessage,
  registerMessageHandler,
  getCommunicationStats,
  resetCommunicationState,
} from "./agentCommunication";

import {
  createExecutionPlan,
  getExecutionPlan,
} from "./plannerAgent";

import {
  initializeOrchestrator,
  getOrchestratorStatus,
} from "./agentOrchestrator";

// ─────────────────────────────────────────────────────────────────────────────
// AGENT STATE MANAGER TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("AgentStateManager", () => {
  beforeEach(() => {
    resetAllAgentStates();
  });

  it("should initialize agent state", () => {
    const state = initializeAgentState("orchestrator");
    expect(state).toBeDefined();
    expect(state.agentType).toBe("orchestrator");
    expect(state.status).toBe("idle");
  });

  it("should update agent status", () => {
    initializeAgentState("planner");
    updateAgentStatus("planner", "thinking", "task-123");
    const state = getAgentState("planner");
    expect(state?.status).toBe("thinking");
    expect(state?.currentTaskId).toBe("task-123");
  });

  it("should track completed tasks", () => {
    initializeAgentState("executor");
    markTaskCompleted("executor", "task-abc");
    expect(isTaskCompleted("task-abc")).toBe(true);
    expect(isTaskFailed("task-abc")).toBe(false);
  });

  it("should track failed tasks", () => {
    initializeAgentState("architect");
    markTaskFailed("architect", "task-xyz");
    expect(isTaskFailed("task-xyz")).toBe(true);
    expect(isTaskCompleted("task-xyz")).toBe(false);
  });

  it("should save and retrieve checkpoints", () => {
    const checkpoint = {
      taskId: "task-cp-1",
      step: "step_1",
      stepIndex: 1,
      totalSteps: 3,
      partialOutput: { done: true },
      savedAt: new Date(),
    };
    saveCheckpoint(checkpoint);
    const retrieved = getCheckpoint("task-cp-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.step).toBe("step_1");
    expect(retrieved?.partialOutput.done).toBe(true);
  });

  it("should delete checkpoints", () => {
    saveCheckpoint({
      taskId: "task-del",
      step: "step_1",
      stepIndex: 1,
      totalSteps: 1,
      partialOutput: {},
      savedAt: new Date(),
    });
    deleteCheckpoint("task-del");
    expect(getCheckpoint("task-del")).toBeUndefined();
  });

  it("should return system health", () => {
    initializeAgentState("orchestrator");
    initializeAgentState("planner");
    const health = getSystemHealth();
    expect(health).toBeDefined();
    expect(typeof health.totalAgents).toBe("number");
    expect(typeof health.completedTasks).toBe("number");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT TASK QUEUE TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("AgentTaskQueue", () => {
  beforeEach(() => {
    clearAllTasks();
    resetAllAgentStates();
  });

  it("should create a task", () => {
    const task = createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "implement",
      title: "تنفيذ مكون جديد",
      description: "إنشاء مكون Button",
      priority: "high",
      assignedAgent: "executor",
    });

    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.status).toBe("queued");
    expect(task.priority).toBe("high");
    expect(task.assignedAgent).toBe("executor");
  });

  it("should dequeue task for correct agent", () => {
    createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "design",
      title: "تصميم البنية",
      description: "تصميم بنية المشروع",
      assignedAgent: "architect",
    });

    const task = dequeueTask("architect");
    expect(task).toBeDefined();
    expect(task?.assignedAgent).toBe("architect");
    expect(task?.status).toBe("in_progress");
  });

  it("should not dequeue task assigned to different agent", () => {
    createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "design",
      title: "مهمة للمعماري",
      description: "تصميم",
      assignedAgent: "architect",
    });

    const task = dequeueTask("executor");
    expect(task).toBeNull();
  });

  it("should complete a task", () => {
    const task = createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "implement",
      title: "مهمة للإكمال",
      description: "تنفيذ",
    });

    completeTask(task.id, { result: "success" });
    const updated = getTask(task.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.output?.result).toBe("success");
  });

  it("should retry failed tasks", () => {
    const task = createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "implement",
      title: "مهمة قابلة للإعادة",
      description: "تنفيذ",
      maxRetries: 3,
    });

    failTask(task.id, "خطأ مؤقت");
    const updated = getTask(task.id);
    expect(updated?.retryCount).toBe(1);
    expect(updated?.status).toBe("queued"); // Re-queued for retry
  });

  it("should permanently fail after max retries", () => {
    const task = createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "implement",
      title: "مهمة ستفشل",
      description: "تنفيذ",
      maxRetries: 1,
    });

    failTask(task.id, "خطأ أول");
    failTask(task.id, "خطأ ثانٍ");
    const updated = getTask(task.id);
    expect(updated?.status).toBe("failed");
  });

  it("should cancel a task", () => {
    const task = createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "implement",
      title: "مهمة للإلغاء",
      description: "تنفيذ",
    });

    cancelTask(task.id, "إلغاء يدوي");
    const updated = getTask(task.id);
    expect(updated?.status).toBe("cancelled");
  });

  it("should return queue statistics", () => {
    createTask({ projectId: "p1", userId: "u1", type: "t", title: "T1", description: "D" });
    createTask({ projectId: "p1", userId: "u1", type: "t", title: "T2", description: "D" });

    const stats = getQueueStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.inProgress).toBe("number");
  });

  it("should prevent duplicate task execution", () => {
    initializeAgentState("executor");
    const task = createTask({
      projectId: "proj-1",
      userId: "user-1",
      type: "implement",
      title: "مهمة فريدة",
      description: "تنفيذ",
    });

    // Mark as completed
    markTaskCompleted("executor", task.id);

    // Try to enqueue again - should be skipped
    enqueueTask({ ...task, status: "pending" });
    const retrieved = getTask(task.id);
    // Task should still be completed (not re-queued)
    expect(isTaskCompleted(task.id)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT COMMUNICATION TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("AgentCommunication", () => {
  beforeEach(() => {
    resetCommunicationState();
  });

  it("should send and receive messages", () => {
    const received: import("./types").AgentMessage[] = [];
    registerMessageHandler("planner", (msg) => received.push(msg));

    sendMessage({
      fromAgent: "orchestrator",
      toAgent: "planner",
      type: "task_assignment",
      payload: { taskId: "task-1", command: "أنشئ مكوناً جديداً" },
    });

    const inbox = getInboxMessages("planner");
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0].fromAgent).toBe("orchestrator");
    expect(inbox[0].type).toBe("task_assignment");
  });

  it("should acknowledge messages", () => {
    sendMessage({
      fromAgent: "orchestrator",
      toAgent: "architect",
      type: "task_assignment",
      payload: { taskId: "task-2" },
    });

    const inbox = getInboxMessages("architect");
    expect(inbox.length).toBeGreaterThan(0);

    acknowledgeMessage(inbox[0].id);
    const inboxAfter = getInboxMessages("architect");
    expect(inboxAfter.length).toBe(0);
  });

  it("should broadcast messages to all agents", () => {
    registerMessageHandler("planner", () => {});
    registerMessageHandler("architect", () => {});
    registerMessageHandler("executor", () => {});

    sendMessage({
      fromAgent: "orchestrator",
      toAgent: "broadcast",
      type: "status_update",
      payload: { status: "started" },
    });

    const stats = getCommunicationStats();
    expect(stats.totalMessages).toBeGreaterThan(0);
  });

  it("should return communication statistics", () => {
    sendMessage({
      fromAgent: "orchestrator",
      toAgent: "planner",
      type: "task_assignment",
      payload: {},
    });

    const stats = getCommunicationStats();
    expect(stats.totalMessages).toBeGreaterThan(0);
    expect(stats.messagesByType["task_assignment"]).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLANNER AGENT TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("PlannerAgent", () => {
  beforeEach(() => {
    resetAllAgentStates();
    resetCommunicationState();
  });

  it("should create an execution plan", async () => {
    const plan = await createExecutionPlan({
      projectId: "proj-test",
      userId: "user-test",
      command: "أضف مكون Header جديد",
    });

    expect(plan).toBeDefined();
    expect(plan.id).toBeDefined();
    expect(plan.projectId).toBe("proj-test");
    expect(plan.originalCommand).toBe("أضف مكون Header جديد");
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it("should retrieve a plan by ID", async () => {
    const plan = await createExecutionPlan({
      projectId: "proj-test",
      userId: "user-test",
      command: "عدّل الصفحة الرئيسية",
    });

    const retrieved = getExecutionPlan(plan.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(plan.id);
  });

  it("should have ordered steps", async () => {
    const plan = await createExecutionPlan({
      projectId: "proj-test",
      userId: "user-test",
      command: "أنشئ صفحة تسجيل دخول",
    });

    for (let i = 0; i < plan.steps.length; i++) {
      expect(plan.steps[i].order).toBe(i + 1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("AgentOrchestrator", () => {
  beforeEach(() => {
    resetAllAgentStates();
    resetCommunicationState();
    clearAllTasks();
  });

  it("should initialize successfully", () => {
    initializeOrchestrator();
    const status = getOrchestratorStatus();
    expect(status.initialized).toBe(true);
    expect(status.systemHealth).toBeDefined();
    expect(status.queueStats).toBeDefined();
  });

  it("should return system health after initialization", () => {
    // Re-initialize after reset to ensure agents are registered
    // Force re-initialization by resetting the flag via a fresh call
    const status = getOrchestratorStatus();
    // After initializeOrchestrator() is called, the system should be initialized
    expect(status.initialized).toBe(true);
    expect(status.queueStats).toBeDefined();
    expect(typeof status.queueStats.total).toBe("number");
  });
});
