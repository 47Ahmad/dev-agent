/**
 * Multi-Agent Core - Phase 4A
 * Central export file for the multi-agent system.
 */

// Types
export * from "./types";

// Orchestrator (main entry point)
export {
  initializeOrchestrator,
  orchestrateCommand,
  getOrchestratorStatus,
  getProjectExecutionStatus,
} from "./agentOrchestrator";

// Planner Agent
export {
  createExecutionPlan,
  getExecutionPlan,
  getProjectPlans,
} from "./plannerAgent";

// Architect Agent
export {
  designSolution,
  getArchitecturalDesign,
  getProjectDesigns,
} from "./architectAgent";
export type { ArchitecturalDesign, ProjectAnalysis, SolutionDesign } from "./architectAgent";

// Task Queue
export {
  createTask,
  enqueueTask,
  dequeueTask,
  getTask,
  getProjectTasks,
  getPendingTasks,
  getQueueStats,
  completeTask,
  failTask,
  cancelTask,
  updateTaskCheckpoint,
  getDependentTasks,
  cleanupOldTasks,
  clearAllTasks,
} from "./agentTaskQueue";

// Communication System
export {
  sendMessage,
  getInboxMessages,
  acknowledgeMessage,
  acknowledgeAllMessages,
  registerMessageHandler,
  getTaskMessages,
  getMessagesBetween,
  getCommunicationStats,
  cleanupOldMessages,
  resetCommunicationState,
} from "./agentCommunication";

// State Manager
export {
  initializeAgentState,
  getAgentState,
  getAllAgentStates,
  updateAgentStatus,
  markTaskCompleted,
  markTaskFailed,
  isTaskCompleted,
  isTaskFailed,
  isTaskInProgress,
  saveCheckpoint,
  getCheckpoint,
  deleteCheckpoint,
  getPendingCheckpoints,
  getSystemHealth,
  resetAllAgentStates,
} from "./agentStateManager";
