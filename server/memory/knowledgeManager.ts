/**
 * Knowledge Manager - Phase 4B
 * Manages the knowledge base with indexing, semantic search,
 * ranking, compression, and duplicate detection.
 */

import { nanoid } from "nanoid";
import type { KnowledgeItem, KnowledgeSearchOptions, MemoryCategory } from "./types";
import { saveMemory, searchMemory, deleteMemory, updateMemory } from "./memoryStore";

// ============================================
// KNOWLEDGE STORE
// ============================================

const knowledgeStore = new Map<string, KnowledgeItem>();
const knowledgeIndex = new Map<string, Set<string>>();  // tag/category -> ids
const duplicateMap = new Map<string, string>();          // contentHash -> id

// ============================================
// KNOWLEDGE CRUD
// ============================================

/**
 * Add knowledge to the knowledge base
 */
export function addKnowledge(params: {
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
  relatedIds?: string[];
}): KnowledgeItem {
  // Duplicate detection via content hash
  const contentHash = simpleHash(params.content);
  const existingId = duplicateMap.get(contentHash);

  if (existingId) {
    const existing = knowledgeStore.get(existingId);
    if (existing) {
      // Update importance if higher
      if ((params.importance ?? 0.5) > existing.importance) {
        existing.importance = params.importance ?? existing.importance;
        existing.updatedAt = new Date();
        knowledgeStore.set(existingId, existing);
      }
      return { ...existing, isDuplicate: true, duplicateOf: existingId };
    }
  }

  const item: KnowledgeItem = {
    id: `know-${nanoid()}`,
    title: params.title,
    content: params.content,
    summary: params.summary ?? params.content.substring(0, 200),
    category: params.category,
    tags: params.tags ?? [],
    projectId: params.projectId,
    agentId: params.agentId,
    importance: params.importance ?? 0.5,
    confidence: params.confidence ?? 0.8,
    source: params.source ?? "agent",
    relatedIds: params.relatedIds ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
    accessCount: 0,
    isDuplicate: false,
  };

  knowledgeStore.set(item.id, item);
  duplicateMap.set(contentHash, item.id);

  // Update indexes
  updateIndexes(item);

  // Also persist to memory store for cross-system search
  saveMemory({
    tier: "long_term",
    category: params.category,
    key: `knowledge:${item.id}`,
    content: `${params.title}\n${params.content}`,
    tags: params.tags,
    projectId: params.projectId,
    agentId: params.agentId,
    importance: params.importance ?? 0.5,
    relatedIds: params.relatedIds,
  });

  return item;
}

/**
 * Get a knowledge item by ID
 */
export function getKnowledge(id: string): KnowledgeItem | undefined {
  const item = knowledgeStore.get(id);
  if (item) {
    item.accessCount++;
    item.updatedAt = new Date();
    knowledgeStore.set(id, item);
  }
  return item;
}

/**
 * Update a knowledge item
 */
export function updateKnowledge(
  id: string,
  updates: Partial<Pick<KnowledgeItem, "content" | "summary" | "importance" | "confidence" | "tags" | "relatedIds">>
): KnowledgeItem | undefined {
  const item = knowledgeStore.get(id);
  if (!item) return undefined;

  if (updates.content !== undefined) item.content = updates.content;
  if (updates.summary !== undefined) item.summary = updates.summary;
  if (updates.importance !== undefined) item.importance = updates.importance;
  if (updates.confidence !== undefined) item.confidence = updates.confidence;
  if (updates.tags !== undefined) {
    // Re-index tags
    for (const tag of item.tags) {
      knowledgeIndex.get(`tag:${tag}`)?.delete(id);
    }
    item.tags = updates.tags;
    for (const tag of item.tags) {
      if (!knowledgeIndex.has(`tag:${tag}`)) knowledgeIndex.set(`tag:${tag}`, new Set());
      knowledgeIndex.get(`tag:${tag}`)!.add(id);
    }
  }
  if (updates.relatedIds !== undefined) item.relatedIds = updates.relatedIds;

  item.updatedAt = new Date();
  knowledgeStore.set(id, item);

  // Update memory store
  updateMemory(`knowledge:${id}`, {
    content: `${item.title}\n${item.content}`,
    importance: item.importance,
  });

  return item;
}

/**
 * Delete a knowledge item
 */
export function deleteKnowledge(id: string): boolean {
  const item = knowledgeStore.get(id);
  if (!item) return false;

  knowledgeStore.delete(id);

  // Clean indexes
  knowledgeIndex.get(`category:${item.category}`)?.delete(id);
  for (const tag of item.tags) {
    knowledgeIndex.get(`tag:${tag}`)?.delete(id);
  }
  if (item.projectId) {
    knowledgeIndex.get(`project:${item.projectId}`)?.delete(id);
  }

  // Remove from memory store
  deleteMemory(`knowledge:${id}`);

  return true;
}

// ============================================
// KNOWLEDGE SEARCH
// ============================================

/**
 * Search the knowledge base
 */
export function searchKnowledge(options: KnowledgeSearchOptions): KnowledgeItem[] {
  const queryLower = options.query.toLowerCase();
  const results: Array<{ item: KnowledgeItem; score: number }> = [];
  const limit = options.limit ?? 10;

  // Get candidate IDs from indexes
  let candidateIds: Set<string> | undefined;

  if (options.projectId) {
    const projectIds = knowledgeIndex.get(`project:${options.projectId}`);
    candidateIds = projectIds ? new Set(projectIds) : new Set();
  }

  if (options.category) {
    const catIds = knowledgeIndex.get(`category:${options.category}`) ?? new Set();
    if (candidateIds) {
      candidateIds = new Set([...candidateIds].filter((id) => catIds.has(id)));
    } else {
      candidateIds = new Set(catIds);
    }
  }

  if (options.tags && options.tags.length > 0) {
    const tagIds = new Set<string>();
    for (const tag of options.tags) {
      for (const id of knowledgeIndex.get(`tag:${tag}`) ?? new Set()) {
        tagIds.add(id);
      }
    }
    if (candidateIds) {
      candidateIds = new Set([...candidateIds].filter((id) => tagIds.has(id)));
    } else {
      candidateIds = tagIds;
    }
  }

  // If no index filters, search all
  const toSearch = candidateIds
    ? [...candidateIds].map((id) => knowledgeStore.get(id)).filter((i): i is KnowledgeItem => !!i)
    : Array.from(knowledgeStore.values());

  for (const item of toSearch) {
    if (options.minImportance && item.importance < options.minImportance) continue;

    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    const summaryLower = item.summary.toLowerCase();

    let score = 0;

    if (titleLower === queryLower) {
      score = 1.0;
    } else if (titleLower.includes(queryLower)) {
      score = 0.85;
    } else if (summaryLower.includes(queryLower)) {
      score = 0.7;
    } else if (contentLower.includes(queryLower)) {
      score = 0.55;
    } else {
      const words = queryLower.split(/\s+/);
      const matched = words.filter(
        (w) => titleLower.includes(w) || contentLower.includes(w)
      );
      if (matched.length > 0) {
        score = (matched.length / words.length) * 0.4;
      }
    }

    if (score > 0) {
      // Boost by importance, confidence, and access count
      score = score * 0.6 + item.importance * 0.25 + item.confidence * 0.1 + Math.min(item.accessCount / 200, 0.05);
      results.push({ item, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit).map((r) => {
    r.item.accessCount++;
    return r.item;
  });
}

/**
 * Get all knowledge for a project
 */
export function getProjectKnowledge(projectId: string): KnowledgeItem[] {
  const ids = knowledgeIndex.get(`project:${projectId}`) ?? new Set();
  return [...ids]
    .map((id) => knowledgeStore.get(id))
    .filter((i): i is KnowledgeItem => !!i)
    .sort((a, b) => b.importance - a.importance);
}

/**
 * Get knowledge by category
 */
export function getKnowledgeByCategory(
  category: MemoryCategory,
  projectId?: string
): KnowledgeItem[] {
  const ids = knowledgeIndex.get(`category:${category}`) ?? new Set();
  return [...ids]
    .map((id) => knowledgeStore.get(id))
    .filter((i): i is KnowledgeItem => !!i && (!projectId || i.projectId === projectId))
    .sort((a, b) => b.importance - a.importance);
}

// ============================================
// MEMORY COMPRESSION & RANKING
// ============================================

/**
 * Compress low-importance knowledge items
 */
export function compressKnowledge(projectId?: string): number {
  let compressed = 0;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

  for (const [id, item] of knowledgeStore.entries()) {
    if (projectId && item.projectId !== projectId) continue;
    if (item.importance > 0.6) continue;
    if (item.updatedAt > cutoff) continue;
    if (item.content.length <= 300) continue;

    // Compress to summary
    item.content = item.summary;
    item.updatedAt = new Date();
    knowledgeStore.set(id, item);
    compressed++;
  }

  return compressed;
}

/**
 * Re-rank knowledge by recency and access patterns
 */
export function reRankKnowledge(projectId?: string): void {
  const now = Date.now();
  const decayFactor = 0.1;

  for (const [id, item] of knowledgeStore.entries()) {
    if (projectId && item.projectId !== projectId) continue;

    const ageMs = now - item.updatedAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const decayedImportance = item.importance * Math.exp(-decayFactor * ageDays);
    const accessBoost = Math.min(item.accessCount * 0.01, 0.2);

    item.importance = Math.max(0.1, Math.min(1.0, decayedImportance + accessBoost));
    knowledgeStore.set(id, item);
  }
}

/**
 * Get knowledge statistics
 */
export function getKnowledgeStats(): {
  total: number;
  byCategory: Record<string, number>;
  duplicates: number;
  avgImportance: number;
} {
  const byCategory: Record<string, number> = {};
  let totalImportance = 0;
  let duplicates = 0;

  for (const item of knowledgeStore.values()) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    totalImportance += item.importance;
    if (item.isDuplicate) duplicates++;
  }

  return {
    total: knowledgeStore.size,
    byCategory,
    duplicates,
    avgImportance: knowledgeStore.size > 0 ? totalImportance / knowledgeStore.size : 0,
  };
}

// ============================================
// HELPERS
// ============================================

function updateIndexes(item: KnowledgeItem): void {
  // Category index
  const catKey = `category:${item.category}`;
  if (!knowledgeIndex.has(catKey)) knowledgeIndex.set(catKey, new Set());
  knowledgeIndex.get(catKey)!.add(item.id);

  // Tag indexes
  for (const tag of item.tags) {
    const tagKey = `tag:${tag}`;
    if (!knowledgeIndex.has(tagKey)) knowledgeIndex.set(tagKey, new Set());
    knowledgeIndex.get(tagKey)!.add(item.id);
  }

  // Project index
  if (item.projectId) {
    const projKey = `project:${item.projectId}`;
    if (!knowledgeIndex.has(projKey)) knowledgeIndex.set(projKey, new Set());
    knowledgeIndex.get(projKey)!.add(item.id);
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 500); i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return hash.toString(36);
}

/**
 * Clear all knowledge (for testing)
 */
export function clearAllKnowledge(): void {
  knowledgeStore.clear();
  knowledgeIndex.clear();
  duplicateMap.clear();
}
