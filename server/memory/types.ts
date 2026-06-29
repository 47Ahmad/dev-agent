/**
 * Phase 4B - Shared Intelligence & Memory System
 * Core type definitions for all memory and context components.
 */

// ============================================
// MEMORY LAYER TYPES
// ============================================

export type MemoryTier =
  | "working"      // Current task context (volatile, fast)
  | "short_term"   // Recent interactions (session-scoped)
  | "long_term"    // Persistent knowledge (project-scoped)
  | "semantic"     // Conceptual knowledge (cross-project)
  | "episodic";    // Past events and experiences

export type MemoryCategory =
  | "project_structure"
  | "code_pattern"
  | "user_preference"
  | "error_solution"
  | "decision"
  | "conversation"
  | "task_result"
  | "architectural_design"
  | "dependency"
  | "general";

export interface MemoryEntry {
  id: string;
  tier: MemoryTier;
  category: MemoryCategory;
  key: string;
  content: string;
  embedding?: number[];       // For semantic search
  tags: string[];
  projectId?: string;
  userId?: string;
  agentId?: string;
  importance: number;         // 0-1 scale
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  compressed: boolean;
  relatedIds: string[];       // IDs of related memory entries
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;             // Relevance score 0-1
  matchType: "exact" | "semantic" | "keyword";
}

export interface MemoryStats {
  totalEntries: number;
  byTier: Record<MemoryTier, number>;
  byCategory: Record<MemoryCategory, number>;
  totalSize: number;          // Approximate bytes
  oldestEntry?: Date;
  newestEntry?: Date;
}

// ============================================
// SHARED CONTEXT TYPES
// ============================================

export interface ProjectContext {
  projectId: string;
  userId: string;
  projectName?: string;
  fileStructure: Record<string, string>;  // path -> summary
  dependencies: string[];
  techStack: string[];
  lastModified: Date;
  activeAgents: string[];
  currentGoal?: string;
  conversationHistory: ConversationTurn[];
  metadata: Record<string, unknown>;
}

export interface ConversationTurn {
  id: string;
  role: "user" | "assistant" | "agent";
  agentType?: string;
  content: string;
  timestamp: Date;
  taskId?: string;
  compressed?: boolean;
}

export interface SharedContext {
  id: string;
  projectId: string;
  userId: string;
  version: number;
  projectContext: ProjectContext;
  agentContexts: Record<string, AgentContext>;   // agentType -> context
  sharedNotes: SharedNote[];
  lastSyncAt: Date;
  createdAt: Date;
}

export interface AgentContext {
  agentType: string;
  currentTaskId?: string;
  localMemory: Record<string, unknown>;
  lastActiveAt: Date;
}

// ============================================
// KNOWLEDGE TYPES
// ============================================

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: MemoryCategory;
  tags: string[];
  projectId?: string;
  agentId?: string;
  importance: number;
  confidence: number;         // 0-1 how confident we are in this knowledge
  source: string;             // Where this knowledge came from
  relatedIds: string[];
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  isDuplicate: boolean;
  duplicateOf?: string;
}

export interface KnowledgeSearchOptions {
  query: string;
  projectId?: string;
  category?: MemoryCategory;
  tags?: string[];
  limit?: number;
  minImportance?: number;
  tier?: MemoryTier;
}

// ============================================
// COLLABORATION TYPES
// ============================================

export interface SharedWorkspace {
  id: string;
  projectId: string;
  userId: string;
  activeAgents: string[];
  sharedDecisions: Decision[];
  sharedNotes: SharedNote[];
  conflictLog: Conflict[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  proposedBy: string;         // agentType
  agreedBy: string[];
  rejectedBy: string[];
  status: "pending" | "approved" | "rejected" | "superseded";
  rationale: string;
  taskId?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface SharedNote {
  id: string;
  agentType: string;
  content: string;
  category: "observation" | "warning" | "suggestion" | "decision" | "info";
  taskId?: string;
  projectId?: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy: string[];
}

export interface Conflict {
  id: string;
  type: "file_conflict" | "decision_conflict" | "resource_conflict";
  description: string;
  involvedAgents: string[];
  resolution?: string;
  resolvedBy?: string;
  status: "open" | "resolved" | "escalated";
  createdAt: Date;
  resolvedAt?: Date;
}

// ============================================
// CHECKPOINT TYPES (Advanced)
// ============================================

export interface AdvancedCheckpoint {
  id: string;
  taskId: string;
  planId?: string;
  projectId: string;
  userId: string;
  label: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  executionState: ExecutionState;
  memorySnapshot: MemorySnapshot;
  createdAt: Date;
  isAutomatic: boolean;
  canRollback: boolean;
}

export interface ExecutionState {
  completedStepIds: string[];
  pendingStepIds: string[];
  failedStepIds: string[];
  partialOutputs: Record<string, unknown>;
  agentStates: Record<string, unknown>;
  variables: Record<string, unknown>;
}

export interface MemorySnapshot {
  workingMemoryEntries: string[];  // IDs
  shortTermEntries: string[];
  contextVersion: number;
  timestamp: Date;
}

export interface RollbackResult {
  success: boolean;
  checkpointId: string;
  restoredSteps: string[];
  message: string;
}

export interface ExecutionHistoryEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  command: string;
  status: "completed" | "failed" | "rolled_back" | "partial";
  checkpointIds: string[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  summary: string;
  filesChanged: number;
}
