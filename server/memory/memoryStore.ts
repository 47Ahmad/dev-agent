/**
 * Memory Store - Phase 4B
 * Core storage engine for all memory tiers.
 * Implements Working, Short-Term, Long-Term, Semantic, and Episodic memory.
 */

import { nanoid } from "nanoid";
import type {
  MemoryEntry,
  MemoryTier,
  MemoryCategory,
  MemoryStats,
  MemorySearchResult,
} from "./types";

// ============================================
// STORAGE BACKEND
// ============================================

// Tiered storage maps
const workingMemory = new Map<string, MemoryEntry>();
const shortTermMemory = new Map<string, MemoryEntry>();
const longTermMemory = new Map<string, MemoryEntry>();
const semanticMemory = new Map<string, MemoryEntry>();
const episodicMemory = new Map<string, MemoryEntry>();

// Index maps for fast lookup
const indexByProject = new Map<string, Set<string>>();   // projectId -> entryIds
const indexByAgent = new Map<string, Set<string>>();     // agentId -> entryIds
const indexByTag = new Map<string, Set<string>>();       // tag -> entryIds
const indexByKey = new Map<string, string>();            // tier:key -> entryId

// TTL configuration per tier (ms)
const TIER_TTL: Record<MemoryTier, number | null> = {
  working: 30 * 60 * 1000,       // 30 minutes
  short_term: 24 * 60 * 60 * 1000, // 24 hours
  long_term: null,                // Permanent
  semantic: null,                 // Permanent
  episodic: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Max entries per tier
const TIER_MAX_ENTRIES: Record<MemoryTier, number> = {
  working: 100,
  short_term: 500,
  long_term: 10000,
  semantic: 5000,
  episodic: 2000,
};

// ============================================
// TIER RESOLUTION
// ============================================

function getTierStore(tier: MemoryTier): Map<string, MemoryEntry> {
  switch (tier) {
    case "working":    return workingMemory;
    case "short_term": return shortTermMemory;
    case "long_term":  return longTermMemory;
    case "semantic":   return semanticMemory;
    case "episodic":   return episodicMemory;
  }
}

// ============================================
// CORE MEMORY OPERATIONS
// ============================================

/**
 * Save a memory entry to the appropriate tier
 */
export function saveMemory(params: {
  tier: MemoryTier;
  category: MemoryCategory;
  key: string;
  content: string;
  tags?: string[];
  projectId?: string;
  userId?: string;
  agentId?: string;
  importance?: number;
  expiresAt?: Date;
  relatedIds?: string[];
}): MemoryEntry {
  const store = getTierStore(params.tier);
  const indexKey = `${params.tier}:${params.key}`;

  // Check if entry with same key exists (update instead of duplicate)
  const existingId = indexByKey.get(indexKey);
  if (existingId) {
    const existing = store.get(existingId);
    if (existing) {
      existing.content = params.content;
      existing.updatedAt = new Date();
      existing.importance = params.importance ?? existing.importance;
      existing.tags = params.tags ?? existing.tags;
      if (params.relatedIds) {
        existing.relatedIds = [...new Set([...existing.relatedIds, ...params.relatedIds])];
      }
      store.set(existingId, existing);
      return existing;
    }
  }

  // Enforce tier size limits (evict oldest low-importance entries)
  enforceTierLimit(params.tier);

  const ttl = TIER_TTL[params.tier];
  const entry: MemoryEntry = {
    id: `mem-${nanoid()}`,
    tier: params.tier,
    category: params.category,
    key: params.key,
    content: params.content,
    tags: params.tags ?? [],
    projectId: params.projectId,
    userId: params.userId,
    agentId: params.agentId,
    importance: params.importance ?? 0.5,
    accessCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: params.expiresAt ?? (ttl ? new Date(Date.now() + ttl) : undefined),
    compressed: false,
    relatedIds: params.relatedIds ?? [],
  };

  store.set(entry.id, entry);
  indexByKey.set(indexKey, entry.id);

  // Update indexes
  if (params.projectId) {
    if (!indexByProject.has(params.projectId)) indexByProject.set(params.projectId, new Set());
    indexByProject.get(params.projectId)!.add(entry.id);
  }
  if (params.agentId) {
    if (!indexByAgent.has(params.agentId)) indexByAgent.set(params.agentId, new Set());
    indexByAgent.get(params.agentId)!.add(entry.id);
  }
  for (const tag of entry.tags) {
    if (!indexByTag.has(tag)) indexByTag.set(tag, new Set());
    indexByTag.get(tag)!.add(entry.id);
  }

  return entry;
}

/**
 * Load a memory entry by ID
 */
export function loadMemory(id: string): MemoryEntry | undefined {
  for (const tier of ["working", "short_term", "long_term", "semantic", "episodic"] as MemoryTier[]) {
    const store = getTierStore(tier);
    const entry = store.get(id);
    if (entry) {
      // Check expiry
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        store.delete(id);
        return undefined;
      }
      entry.accessCount++;
      entry.updatedAt = new Date();
      store.set(id, entry);
      return entry;
    }
  }
  return undefined;
}

/**
 * Load memory by key and tier
 */
export function loadMemoryByKey(tier: MemoryTier, key: string): MemoryEntry | undefined {
  const indexKey = `${tier}:${key}`;
  const id = indexByKey.get(indexKey);
  if (!id) return undefined;
  return loadMemory(id);
}

/**
 * Update an existing memory entry
 */
export function updateMemory(
  id: string,
  updates: Partial<Pick<MemoryEntry, "content" | "importance" | "tags" | "relatedIds" | "expiresAt">>
): MemoryEntry | undefined {
  for (const tier of ["working", "short_term", "long_term", "semantic", "episodic"] as MemoryTier[]) {
    const store = getTierStore(tier);
    const entry = store.get(id);
    if (entry) {
      if (updates.content !== undefined) entry.content = updates.content;
      if (updates.importance !== undefined) entry.importance = updates.importance;
      if (updates.tags !== undefined) entry.tags = updates.tags;
      if (updates.relatedIds !== undefined) entry.relatedIds = updates.relatedIds;
      if (updates.expiresAt !== undefined) entry.expiresAt = updates.expiresAt;
      entry.updatedAt = new Date();
      store.set(id, entry);
      return entry;
    }
  }
  return undefined;
}

/**
 * Delete a memory entry by ID
 */
export function deleteMemory(id: string): boolean {
  for (const tier of ["working", "short_term", "long_term", "semantic", "episodic"] as MemoryTier[]) {
    const store = getTierStore(tier);
    const entry = store.get(id);
    if (entry) {
      store.delete(id);
      // Clean indexes
      indexByKey.delete(`${tier}:${entry.key}`);
      indexByProject.get(entry.projectId ?? "")?.delete(id);
      indexByAgent.get(entry.agentId ?? "")?.delete(id);
      for (const tag of entry.tags) {
        indexByTag.get(tag)?.delete(id);
      }
      return true;
    }
  }
  return false;
}

// ============================================
// SEARCH
// ============================================

/**
 * Search memory entries by keyword matching
 */
export function searchMemory(params: {
  query: string;
  tier?: MemoryTier;
  projectId?: string;
  category?: MemoryCategory;
  tags?: string[];
  limit?: number;
  minImportance?: number;
}): MemorySearchResult[] {
  const results: MemorySearchResult[] = [];
  const queryLower = params.query.toLowerCase();
  const limit = params.limit ?? 20;
  const minImportance = params.minImportance ?? 0;

  const tiers: MemoryTier[] = params.tier
    ? [params.tier]
    : ["working", "short_term", "long_term", "semantic", "episodic"];

  for (const tier of tiers) {
    const store = getTierStore(tier);
    for (const entry of store.values()) {
      // Skip expired
      if (entry.expiresAt && entry.expiresAt < new Date()) continue;
      // Filter by project
      if (params.projectId && entry.projectId !== params.projectId) continue;
      // Filter by category
      if (params.category && entry.category !== params.category) continue;
      // Filter by importance
      if (entry.importance < minImportance) continue;
      // Filter by tags
      if (params.tags && params.tags.length > 0) {
        const hasTag = params.tags.some((t) => entry.tags.includes(t));
        if (!hasTag) continue;
      }

      // Calculate relevance score
      let score = 0;
      const contentLower = entry.content.toLowerCase();
      const keyLower = entry.key.toLowerCase();

      if (keyLower === queryLower) {
        score = 1.0;
      } else if (keyLower.includes(queryLower) || queryLower.includes(keyLower)) {
        score = 0.8;
      } else if (contentLower.includes(queryLower)) {
        score = 0.6;
      } else {
        // Keyword matching
        const queryWords = queryLower.split(/\s+/);
        const matchedWords = queryWords.filter(
          (w) => contentLower.includes(w) || keyLower.includes(w)
        );
        if (matchedWords.length > 0) {
          score = (matchedWords.length / queryWords.length) * 0.4;
        }
      }

      // Boost by importance and access count
      if (score > 0) {
        score = score * 0.7 + entry.importance * 0.2 + Math.min(entry.accessCount / 100, 0.1);
        results.push({
          entry,
          score,
          matchType: score >= 0.8 ? "exact" : "keyword",
        });
      }
    }
  }

  // Sort by score descending, then by recency
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.05) return b.score - a.score;
    return b.entry.updatedAt.getTime() - a.entry.updatedAt.getTime();
  });

  return results.slice(0, limit);
}

/**
 * Get all memory entries for a project
 */
export function getProjectMemory(projectId: string, tier?: MemoryTier): MemoryEntry[] {
  const ids = indexByProject.get(projectId) ?? new Set();
  const entries: MemoryEntry[] = [];

  for (const id of ids) {
    const entry = loadMemory(id);
    if (entry && (!tier || entry.tier === tier)) {
      entries.push(entry);
    }
  }

  return entries.sort((a, b) => b.importance - a.importance);
}

/**
 * Get all memory entries for an agent
 */
export function getAgentMemory(agentId: string, tier?: MemoryTier): MemoryEntry[] {
  const ids = indexByAgent.get(agentId) ?? new Set();
  const entries: MemoryEntry[] = [];

  for (const id of ids) {
    const entry = loadMemory(id);
    if (entry && (!tier || entry.tier === tier)) {
      entries.push(entry);
    }
  }

  return entries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

// ============================================
// COMPRESSION
// ============================================

/**
 * Compress old low-importance entries to save space
 */
export function compressMemory(projectId?: string): number {
  let compressed = 0;
  const tiers: MemoryTier[] = ["short_term", "episodic"];

  for (const tier of tiers) {
    const store = getTierStore(tier);
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours

    for (const [id, entry] of store.entries()) {
      if (projectId && entry.projectId !== projectId) continue;
      if (entry.compressed) continue;
      if (entry.updatedAt > cutoff) continue;
      if (entry.importance > 0.7) continue;

      // Compress: truncate content to summary
      if (entry.content.length > 500) {
        entry.content = entry.content.substring(0, 497) + "...";
        entry.compressed = true;
        entry.updatedAt = new Date();
        store.set(id, entry);
        compressed++;
      }
    }
  }

  return compressed;
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get memory statistics
 */
export function getMemoryStats(): MemoryStats {
  const allStores: [MemoryTier, Map<string, MemoryEntry>][] = [
    ["working", workingMemory],
    ["short_term", shortTermMemory],
    ["long_term", longTermMemory],
    ["semantic", semanticMemory],
    ["episodic", episodicMemory],
  ];

  const byTier = {} as Record<MemoryTier, number>;
  const byCategory = {} as Record<MemoryCategory, number>;
  let totalEntries = 0;
  let totalSize = 0;
  let oldestEntry: Date | undefined;
  let newestEntry: Date | undefined;

  for (const [tier, store] of allStores) {
    byTier[tier] = store.size;
    totalEntries += store.size;

    for (const entry of store.values()) {
      byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
      totalSize += entry.content.length * 2; // Approximate bytes (UTF-16)

      if (!oldestEntry || entry.createdAt < oldestEntry) oldestEntry = entry.createdAt;
      if (!newestEntry || entry.createdAt > newestEntry) newestEntry = entry.createdAt;
    }
  }

  return { totalEntries, byTier, byCategory, totalSize, oldestEntry, newestEntry };
}

// ============================================
// CLEANUP & MAINTENANCE
// ============================================

/**
 * Evict expired entries and enforce tier limits
 */
function enforceTierLimit(tier: MemoryTier): void {
  const store = getTierStore(tier);
  const maxEntries = TIER_MAX_ENTRIES[tier];

  if (store.size < maxEntries) return;

  // Collect entries sorted by importance (ascending) and age (oldest first)
  const entries = Array.from(store.values()).sort((a, b) => {
    const importanceDiff = a.importance - b.importance;
    if (Math.abs(importanceDiff) > 0.1) return importanceDiff;
    return a.updatedAt.getTime() - b.updatedAt.getTime();
  });

  // Remove bottom 10%
  const toRemove = Math.ceil(maxEntries * 0.1);
  for (let i = 0; i < toRemove && i < entries.length; i++) {
    deleteMemory(entries[i].id);
  }
}

/**
 * Purge all expired entries across all tiers
 */
export function purgeExpiredMemory(): number {
  let purged = 0;
  const now = new Date();

  for (const tier of ["working", "short_term", "long_term", "semantic", "episodic"] as MemoryTier[]) {
    const store = getTierStore(tier);
    for (const [id, entry] of store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        store.delete(id);
        indexByKey.delete(`${tier}:${entry.key}`);
        purged++;
      }
    }
  }

  return purged;
}

/**
 * Clear all memory (for testing)
 */
export function clearAllMemory(): void {
  workingMemory.clear();
  shortTermMemory.clear();
  longTermMemory.clear();
  semanticMemory.clear();
  episodicMemory.clear();
  indexByProject.clear();
  indexByAgent.clear();
  indexByTag.clear();
  indexByKey.clear();
}
