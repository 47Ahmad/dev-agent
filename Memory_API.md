# Memory API Documentation

The Memory API provides a unified, type-safe interface for all agents to interact with the Phase 4B Shared Intelligence & Memory System.

## Core Memory Operations

### `SaveMemory(params)`
Persists a generic memory entry to a specific storage tier.

**Parameters:**
- `tier`: `"working" | "short_term" | "long_term" | "semantic" | "episodic"`
- `category`: Semantic grouping (e.g., `"error_solution"`, `"decision"`).
- `key`: Unique identifier for upserts.
- `content`: The string payload.
- `importance`: (Optional) Float 0-1. Defaults to 0.5.
- `ttlMs`: (Optional) Time-to-live in milliseconds.

**Returns:** `MemoryEntry`

---

### `LoadMemory(params)`
Retrieves a memory entry.

**Parameters:**
- `id`: (Optional) The specific entry ID.
- `tier` & `key`: (Optional) Lookup by tier and key combination.

**Returns:** `MemoryEntry | undefined`

---

### `SearchMemory(params)`
Searches across memory tiers using keyword matching and relevance scoring.

**Parameters:**
- `query`: The search string.
- `tier`: (Optional) Restrict search to a specific tier.
- `projectId`: (Optional) Filter by project.
- `limit`: (Optional) Max results (default: 20).
- `minImportance`: (Optional) Filter out low-importance entries.

**Returns:** `MemorySearchResult[]` (Sorted by relevance score)

---

### `UpdateMemory(id, updates)`
Modifies an existing memory entry.

**Parameters:**
- `id`: The entry ID.
- `updates`: Object containing `content`, `importance`, `tags`, or `expiresAt`.

**Returns:** `MemoryEntry | undefined`

---

### `DeleteMemory(id)`
Removes an entry from the system and cleans up indexes.

**Returns:** `boolean` (true if deleted)

---

### `CompressMemory(projectId?)`
Triggers the memory compression algorithm, summarizing old, low-importance entries to save space, and purging expired TTL entries.

**Returns:** `{ compressed: number, purged: number }`

---

## Knowledge Base API

### `SaveKnowledge(params)`
Saves structured, high-value information with duplicate detection.

**Parameters:**
- `title`: Short descriptive title.
- `content`: Full content.
- `summary`: (Optional) Short summary for compressed views.
- `category`: Knowledge category.
- `confidence`: (Optional) Float 0-1 indicating certainty.

**Returns:** `KnowledgeItem`

### `SearchKnowledge(params)`
Searches the knowledge base with intelligent ranking.

---

## Agent Helper Functions

These high-level functions wrap the core API for common agent workflows.

### `RememberTaskResult(params)`
Saves the outcome of an executed task to Short-Term memory. Useful for preventing retry loops on failed commands.

### `RememberErrorSolution(params)`
Saves an encountered error and its successful resolution to Long-Term memory and the Knowledge Base.

### `RememberCodePattern(params)`
Saves a reusable code snippet or architectural pattern to the Knowledge Base.

### `RecallContext(params)`
Aggregates relevant information from both the general Memory Store and the Knowledge Base based on a search query.

**Returns:** `string[]` (Array of relevant context strings ready for LLM prompt injection).
