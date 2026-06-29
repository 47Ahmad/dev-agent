/**
 * Memory API - Phase 4B
 * Unified public interface for all memory operations.
 * Provides SaveMemory, LoadMemory, SearchMemory, DeleteMemory,
 * UpdateMemory, and CompressMemory functions.
 */

import type { MemoryTier, MemoryCategory, MemoryEntry, MemorySearchResult, MemoryStats } from "./types";
import {
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
import { addKnowledge, searchKnowledge, getKnowledgeStats } from "./knowledgeManager";

// ============================================
// CORE MEMORY API
// ============================================

/**
 * SaveMemory - Persist a memory entry to the specified tier
 */
export function SaveMemory(params: {
  tier: MemoryTier;
  category: MemoryCategory;
  key: string;
  content: string;
  tags?: string[];
  projectId?: string;
  userId?: string;
  agentId?: string;
  importance?: number;
  ttlMs?: number;
}): MemoryEntry {
  const expiresAt = params.ttlMs ? new Date(Date.now() + params.ttlMs) : undefined;

  return saveMemory({
    tier: params.tier,
    category: params.category,
    key: params.key,
    content: params.content,
    tags: params.tags,
    projectId: params.projectId,
    userId: params.userId,
    agentId: params.agentId,
    importance: params.importance,
    expiresAt,
  });
}

/**
 * LoadMemory - Retrieve a memory entry by ID or key
 */
export function LoadMemory(params: {
  id?: string;
  tier?: MemoryTier;
  key?: string;
}): MemoryEntry | undefined {
  if (params.id) {
    return loadMemory(params.id);
  }
  if (params.tier && params.key) {
    return loadMemoryByKey(params.tier, params.key);
  }
  return undefined;
}

/**
 * SearchMemory - Find relevant memory entries
 */
export function SearchMemory(params: {
  query: string;
  tier?: MemoryTier;
  projectId?: string;
  category?: MemoryCategory;
  tags?: string[];
  limit?: number;
  minImportance?: number;
}): MemorySearchResult[] {
  return searchMemory(params);
}

/**
 * DeleteMemory - Remove a memory entry by ID
 */
export function DeleteMemory(id: string): boolean {
  return deleteMemory(id);
}

/**
 * UpdateMemory - Modify an existing memory entry
 */
export function UpdateMemory(
  id: string,
  updates: Partial<Pick<MemoryEntry, "content" | "importance" | "tags" | "relatedIds" | "expiresAt">>
): MemoryEntry | undefined {
  return updateMemory(id, updates);
}

/**
 * CompressMemory - Compress old/low-importance entries to save space
 */
export function CompressMemory(projectId?: string): {
  compressed: number;
  purged: number;
} {
  const compressed = compressMemory(projectId);
  const purged = purgeExpiredMemory();
  return { compressed, purged };
}

// ============================================
// EXTENDED MEMORY API
// ============================================

/**
 * SaveKnowledge - Persist structured knowledge to the knowledge base
 */
export function SaveKnowledge(params: {
  title: string;
  content: string;
  summary?: string;
  category: MemoryCategory;
  tags?: string[];
  projectId?: string;
  agentId?: string;
  importance?: number;
  confidence?: number;
  source?: string;
}) {
  return addKnowledge(params);
}

/**
 * SearchKnowledge - Search the knowledge base
 */
export function SearchKnowledge(params: {
  query: string;
  projectId?: string;
  category?: MemoryCategory;
  tags?: string[];
  limit?: number;
  minImportance?: number;
}) {
  return searchKnowledge(params);
}

/**
 * GetProjectMemory - Get all memory for a project
 */
export function GetProjectMemory(projectId: string, tier?: MemoryTier): MemoryEntry[] {
  return getProjectMemory(projectId, tier);
}

/**
 * GetAgentMemory - Get all memory for a specific agent
 */
export function GetAgentMemory(agentId: string, tier?: MemoryTier): MemoryEntry[] {
  return getAgentMemory(agentId, tier);
}

/**
 * GetMemoryStats - Get statistics about the memory system
 */
export function GetMemoryStats(): MemoryStats & { knowledge: ReturnType<typeof getKnowledgeStats> } {
  return {
    ...getMemoryStats(),
    knowledge: getKnowledgeStats(),
  };
}

/**
 * ClearMemory - Clear all memory (use with caution, mainly for testing)
 */
export function ClearMemory(): void {
  clearAllMemory();
}

// ============================================
// AGENT-SPECIFIC HELPERS
// ============================================

/**
 * Remember a task result for future reference
 */
export function RememberTaskResult(params: {
  taskId: string;
  projectId: string;
  agentId: string;
  command: string;
  result: string;
  success: boolean;
}): MemoryEntry {
  return SaveMemory({
    tier: "short_term",
    category: "task_result",
    key: `task_result:${params.taskId}`,
    content: `Command: ${params.command}\nResult: ${params.result}\nSuccess: ${params.success}`,
    tags: ["task_result", params.success ? "success" : "failure"],
    projectId: params.projectId,
    agentId: params.agentId,
    importance: params.success ? 0.6 : 0.8,
  });
}

/**
 * Remember an error and its solution
 */
export function RememberErrorSolution(params: {
  error: string;
  solution: string;
  projectId?: string;
  agentId?: string;
}): void {
  const errorHash = simpleHash(params.error);

  SaveMemory({
    tier: "long_term",
    category: "error_solution",
    key: `error:${errorHash}`,
    content: `Error: ${params.error}\nSolution: ${params.solution}`,
    tags: ["error", "solution"],
    projectId: params.projectId,
    agentId: params.agentId,
    importance: 0.85,
  });

  SaveKnowledge({
    title: `Error Solution: ${params.error.substring(0, 50)}`,
    content: `Error: ${params.error}\nSolution: ${params.solution}`,
    category: "error_solution",
    projectId: params.projectId,
    agentId: params.agentId,
    importance: 0.85,
    confidence: 0.9,
    source: "error_recovery",
    tags: ["error_solution"],
  });
}

/**
 * Remember a code pattern for reuse
 */
export function RememberCodePattern(params: {
  name: string;
  description: string;
  pattern: string;
  language: string;
  projectId?: string;
  agentId?: string;
}): void {
  SaveKnowledge({
    title: params.name,
    content: params.pattern,
    summary: params.description,
    category: "code_pattern",
    tags: ["code_pattern", params.language],
    projectId: params.projectId,
    agentId: params.agentId,
    importance: 0.7,
    confidence: 0.95,
    source: "agent_observation",
  });
}

/**
 * Recall relevant context for a given query
 */
export function RecallContext(params: {
  query: string;
  projectId?: string;
  limit?: number;
}): string[] {
  const limit = params.limit ?? 10;

  const memResults = SearchMemory({
    query: params.query,
    projectId: params.projectId,
    limit: Math.ceil(limit / 2),
    minImportance: 0.3,
  });

  const knowResults = SearchKnowledge({
    query: params.query,
    projectId: params.projectId,
    limit: Math.ceil(limit / 2),
  });

  const combined = [
    ...memResults.map((r) => r.entry.content),
    ...knowResults.map((k) => `[${k.category}] ${k.title}: ${k.summary}`),
  ];

  return combined.slice(0, limit);
}

// ============================================
// HELPERS
// ============================================

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 200); i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
