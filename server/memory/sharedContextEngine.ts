/**
 * Shared Context Engine - Phase 4B
 * Provides a unified, synchronized context shared across all agents.
 * Handles project context, conversation history, and real-time sync.
 */

import { nanoid } from "nanoid";
import type {
  SharedContext,
  ProjectContext,
  AgentContext,
  ConversationTurn,
  SharedNote,
} from "./types";
import { saveMemory, loadMemoryByKey, searchMemory } from "./memoryStore";

// ============================================
// CONTEXT STORE
// ============================================

const contextStore = new Map<string, SharedContext>();  // projectId -> context
const contextVersions = new Map<string, number>();      // projectId -> version

// Max conversation history before compression
const MAX_CONVERSATION_TURNS = 50;
const COMPRESS_AFTER_TURNS = 40;

// ============================================
// CONTEXT INITIALIZATION
// ============================================

/**
 * Initialize or retrieve shared context for a project
 */
export function getOrCreateContext(projectId: string, userId: string): SharedContext {
  const existing = contextStore.get(projectId);
  if (existing) return existing;

  const context: SharedContext = {
    id: `ctx-${nanoid()}`,
    projectId,
    userId,
    version: 1,
    projectContext: {
      projectId,
      userId,
      fileStructure: {},
      dependencies: [],
      techStack: [],
      lastModified: new Date(),
      activeAgents: [],
      conversationHistory: [],
      metadata: {},
    },
    agentContexts: {},
    sharedNotes: [],
    lastSyncAt: new Date(),
    createdAt: new Date(),
  };

  contextStore.set(projectId, context);
  contextVersions.set(projectId, 1);

  // Persist to long-term memory
  saveMemory({
    tier: "long_term",
    category: "project_structure",
    key: `context:${projectId}`,
    content: JSON.stringify({ projectId, userId, createdAt: context.createdAt }),
    projectId,
    userId,
    importance: 0.9,
  });

  return context;
}

/**
 * Get context for a project (returns undefined if not initialized)
 */
export function getContext(projectId: string): SharedContext | undefined {
  return contextStore.get(projectId);
}

// ============================================
// CONTEXT UPDATES
// ============================================

/**
 * Update the project file structure in context
 */
export function updateFileStructure(
  projectId: string,
  fileStructure: Record<string, string>
): void {
  const ctx = contextStore.get(projectId);
  if (!ctx) return;

  ctx.projectContext.fileStructure = fileStructure;
  ctx.projectContext.lastModified = new Date();
  bumpVersion(projectId, ctx);

  // Save to memory
  saveMemory({
    tier: "long_term",
    category: "project_structure",
    key: `file_structure:${projectId}`,
    content: JSON.stringify(Object.keys(fileStructure)),
    projectId,
    importance: 0.85,
  });
}

/**
 * Update tech stack and dependencies in context
 */
export function updateProjectMeta(
  projectId: string,
  meta: { techStack?: string[]; dependencies?: string[]; projectName?: string }
): void {
  const ctx = contextStore.get(projectId);
  if (!ctx) return;

  if (meta.techStack) ctx.projectContext.techStack = meta.techStack;
  if (meta.dependencies) ctx.projectContext.dependencies = meta.dependencies;
  if (meta.projectName) ctx.projectContext.projectName = meta.projectName;
  bumpVersion(projectId, ctx);
}

/**
 * Set the current goal for the project
 */
export function setCurrentGoal(projectId: string, goal: string): void {
  const ctx = contextStore.get(projectId);
  if (!ctx) return;

  ctx.projectContext.currentGoal = goal;
  bumpVersion(projectId, ctx);

  saveMemory({
    tier: "working",
    category: "task_result",
    key: `current_goal:${projectId}`,
    content: goal,
    projectId,
    importance: 1.0,
  });
}

// ============================================
// AGENT CONTEXT MANAGEMENT
// ============================================

/**
 * Register an agent as active in a project context
 */
export function registerAgent(projectId: string, agentType: string): void {
  const ctx = contextStore.get(projectId);
  if (!ctx) return;

  if (!ctx.projectContext.activeAgents.includes(agentType)) {
    ctx.projectContext.activeAgents.push(agentType);
  }

  if (!ctx.agentContexts[agentType]) {
    ctx.agentContexts[agentType] = {
      agentType,
      localMemory: {},
      lastActiveAt: new Date(),
    };
  } else {
    ctx.agentContexts[agentType].lastActiveAt = new Date();
  }

  bumpVersion(projectId, ctx);
}

/**
 * Update agent's local context
 */
export function updateAgentContext(
  projectId: string,
  agentType: string,
  updates: Record<string, unknown>,
  currentTaskId?: string
): void {
  const ctx = contextStore.get(projectId);
  if (!ctx) return;

  if (!ctx.agentContexts[agentType]) {
    ctx.agentContexts[agentType] = {
      agentType,
      localMemory: {},
      lastActiveAt: new Date(),
    };
  }

  const agentCtx = ctx.agentContexts[agentType];
  agentCtx.localMemory = { ...agentCtx.localMemory, ...updates };
  agentCtx.lastActiveAt = new Date();
  if (currentTaskId) agentCtx.currentTaskId = currentTaskId;

  bumpVersion(projectId, ctx);
}

/**
 * Get agent's local context
 */
export function getAgentContext(projectId: string, agentType: string): AgentContext | undefined {
  return contextStore.get(projectId)?.agentContexts[agentType];
}

// ============================================
// CONVERSATION HISTORY
// ============================================

/**
 * Add a turn to the conversation history
 */
export function addConversationTurn(
  projectId: string,
  turn: Omit<ConversationTurn, "id" | "timestamp">
): ConversationTurn {
  const ctx = contextStore.get(projectId);
  if (!ctx) throw new Error(`Context not found for project: ${projectId}`);

  const newTurn: ConversationTurn = {
    id: `turn-${nanoid()}`,
    ...turn,
    timestamp: new Date(),
  };

  ctx.projectContext.conversationHistory.push(newTurn);

  // Auto-compress if too long
  if (ctx.projectContext.conversationHistory.length > COMPRESS_AFTER_TURNS) {
    compressConversationHistory(projectId);
  }

  bumpVersion(projectId, ctx);

  // Persist important turns to short-term memory
  if (turn.role === "user" || turn.role === "assistant") {
    saveMemory({
      tier: "short_term",
      category: "conversation",
      key: `conv_turn:${newTurn.id}`,
      content: `[${turn.role}] ${turn.content}`,
      projectId,
      importance: 0.6,
    });
  }

  return newTurn;
}

/**
 * Get conversation history for a project
 */
export function getConversationHistory(
  projectId: string,
  limit = 20
): ConversationTurn[] {
  const ctx = contextStore.get(projectId);
  if (!ctx) return [];

  const history = ctx.projectContext.conversationHistory;
  return history.slice(-limit);
}

/**
 * Compress old conversation turns to save memory
 */
export function compressConversationHistory(projectId: string): number {
  const ctx = contextStore.get(projectId);
  if (!ctx) return 0;

  const history = ctx.projectContext.conversationHistory;
  if (history.length <= MAX_CONVERSATION_TURNS) return 0;

  // Keep the last MAX_CONVERSATION_TURNS turns, compress the rest
  const toCompress = history.slice(0, history.length - MAX_CONVERSATION_TURNS);
  const toKeep = history.slice(history.length - MAX_CONVERSATION_TURNS);

  // Save compressed summary to long-term memory
  const summary = toCompress
    .map((t) => `[${t.role}]: ${t.content.substring(0, 100)}`)
    .join("\n");

  saveMemory({
    tier: "long_term",
    category: "conversation",
    key: `conv_summary:${projectId}:${Date.now()}`,
    content: summary,
    projectId,
    importance: 0.5,
    tags: ["conversation_summary", "compressed"],
  });

  ctx.projectContext.conversationHistory = toKeep;
  bumpVersion(projectId, ctx);

  return toCompress.length;
}

// ============================================
// SHARED NOTES
// ============================================

/**
 * Add a shared note visible to all agents
 */
export function addSharedNote(
  projectId: string,
  note: Omit<SharedNote, "id" | "createdAt" | "acknowledged" | "acknowledgedBy">
): SharedNote {
  const ctx = contextStore.get(projectId);
  if (!ctx) throw new Error(`Context not found for project: ${projectId}`);

  const newNote: SharedNote = {
    id: `note-${nanoid()}`,
    ...note,
    projectId,
    createdAt: new Date(),
    acknowledged: false,
    acknowledgedBy: [],
  };

  ctx.sharedNotes.push(newNote);
  bumpVersion(projectId, ctx);

  return newNote;
}

/**
 * Get unacknowledged notes for an agent
 */
export function getUnacknowledgedNotes(
  projectId: string,
  agentType: string
): SharedNote[] {
  const ctx = contextStore.get(projectId);
  if (!ctx) return [];

  return ctx.sharedNotes.filter(
    (n) => !n.acknowledgedBy.includes(agentType) && n.agentType !== agentType
  );
}

/**
 * Acknowledge a note
 */
export function acknowledgeNote(
  projectId: string,
  noteId: string,
  agentType: string
): void {
  const ctx = contextStore.get(projectId);
  if (!ctx) return;

  const note = ctx.sharedNotes.find((n) => n.id === noteId);
  if (note && !note.acknowledgedBy.includes(agentType)) {
    note.acknowledgedBy.push(agentType);
    if (note.acknowledgedBy.length >= (ctx.projectContext.activeAgents.length - 1)) {
      note.acknowledged = true;
    }
  }
}

// ============================================
// CONTEXT RETRIEVAL FOR AGENTS
// ============================================

/**
 * Build a context summary string for LLM prompts
 */
export function buildContextSummary(projectId: string, agentType: string): string {
  const ctx = contextStore.get(projectId);
  if (!ctx) return "No context available.";

  const pc = ctx.projectContext;
  const lines: string[] = [];

  if (pc.projectName) lines.push(`Project: ${pc.projectName}`);
  if (pc.currentGoal) lines.push(`Current Goal: ${pc.currentGoal}`);
  if (pc.techStack.length > 0) lines.push(`Tech Stack: ${pc.techStack.join(", ")}`);

  const fileCount = Object.keys(pc.fileStructure).length;
  if (fileCount > 0) lines.push(`Files: ${fileCount} files in project`);

  // Recent conversation
  const recentTurns = pc.conversationHistory.slice(-5);
  if (recentTurns.length > 0) {
    lines.push("\nRecent Conversation:");
    for (const turn of recentTurns) {
      lines.push(`  [${turn.role}]: ${turn.content.substring(0, 150)}`);
    }
  }

  // Unacknowledged notes
  const notes = getUnacknowledgedNotes(projectId, agentType);
  if (notes.length > 0) {
    lines.push("\nShared Notes:");
    for (const note of notes.slice(0, 3)) {
      lines.push(`  [${note.category}] ${note.content.substring(0, 100)}`);
    }
  }

  return lines.join("\n");
}

/**
 * Search context using memory store
 */
export function searchContext(projectId: string, query: string): string[] {
  const results = searchMemory({ query, projectId, limit: 10 });
  return results.map((r) => r.entry.content);
}

// ============================================
// SYNC & VERSION
// ============================================

/**
 * Get current context version
 */
export function getContextVersion(projectId: string): number {
  return contextVersions.get(projectId) ?? 0;
}

function bumpVersion(projectId: string, ctx: SharedContext): void {
  const v = (contextVersions.get(projectId) ?? 0) + 1;
  contextVersions.set(projectId, v);
  ctx.version = v;
  ctx.lastSyncAt = new Date();
}

/**
 * Export context snapshot for checkpoint
 */
export function exportContextSnapshot(projectId: string): {
  version: number;
  timestamp: Date;
  goalSnapshot?: string;
  conversationLength: number;
} {
  const ctx = contextStore.get(projectId);
  return {
    version: contextVersions.get(projectId) ?? 0,
    timestamp: new Date(),
    goalSnapshot: ctx?.projectContext.currentGoal,
    conversationLength: ctx?.projectContext.conversationHistory.length ?? 0,
  };
}

/**
 * Clear context for a project (for testing)
 */
export function clearContext(projectId: string): void {
  contextStore.delete(projectId);
  contextVersions.delete(projectId);
}

/**
 * Clear all contexts (for testing)
 */
export function clearAllContexts(): void {
  contextStore.clear();
  contextVersions.clear();
}
