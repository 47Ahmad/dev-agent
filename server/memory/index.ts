/**
 * Phase 4B - Shared Intelligence & Memory System
 * Central export file for all memory components.
 */

// Types
export * from "./types";

// Memory Store (Core)
export {
  saveMemory,
  loadMemory,
  loadMemoryByKey,
  updateMemory,
  deleteMemory,
  searchMemory,
  getProjectMemory,
  getAgentMemory,
  compressMemory,
  purgeExpiredMemory,
  getMemoryStats,
  clearAllMemory,
} from "./memoryStore";

// Shared Context Engine
export {
  getOrCreateContext,
  getContext,
  updateFileStructure,
  updateProjectMeta,
  setCurrentGoal,
  registerAgent,
  updateAgentContext,
  getAgentContext,
  addConversationTurn,
  getConversationHistory,
  compressConversationHistory,
  addSharedNote,
  getUnacknowledgedNotes,
  acknowledgeNote,
  buildContextSummary,
  searchContext,
  getContextVersion,
  exportContextSnapshot,
  clearContext,
  clearAllContexts,
} from "./sharedContextEngine";

// Knowledge Manager
export {
  addKnowledge,
  getKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
  getProjectKnowledge,
  getKnowledgeByCategory,
  compressKnowledge,
  reRankKnowledge,
  getKnowledgeStats,
  clearAllKnowledge,
} from "./knowledgeManager";

// Agent Collaboration
export {
  getOrCreateWorkspace,
  getWorkspace,
  joinWorkspace,
  leaveWorkspace,
  proposeDecision,
  voteOnDecision,
  getPendingDecisions,
  getDecisionHistory,
  autoApproveDecision,
  reportConflict,
  resolveConflict,
  getOpenConflicts,
  addWorkspaceNote,
  getWorkspaceStats,
  clearAllWorkspaces,
} from "./agentCollaboration";

// Advanced Checkpoint System
export {
  createCheckpoint,
  autoCheckpoint,
  getCheckpoint,
  getLatestCheckpoint,
  getTaskCheckpoints,
  getProjectCheckpoints,
  rollbackToCheckpoint,
  resumeFromLatestCheckpoint,
  addHistoryEntry,
  getExecutionHistory,
  getCheckpointStats,
  cleanupOldCheckpoints,
  clearAllCheckpoints,
} from "./checkpointSystem";

// Memory API (Unified Interface)
export {
  SaveMemory,
  LoadMemory,
  SearchMemory,
  DeleteMemory,
  UpdateMemory,
  CompressMemory,
  SaveKnowledge,
  SearchKnowledge,
  GetProjectMemory,
  GetAgentMemory,
  GetMemoryStats,
  ClearMemory,
  RememberTaskResult,
  RememberErrorSolution,
  RememberCodePattern,
  RecallContext,
} from "./memoryAPI";
