# Memory Architecture

This document details the architectural design of the Phase 4B Shared Intelligence & Memory System.

## High-Level Architecture

The Memory System is built on a layered architecture designed for speed, persistence, and intelligent retrieval.

```
+-----------------------------------------------------------------+
|                         Memory API                              |
|  (Unified Interface for Agents: Save, Load, Search, Remember)   |
+-----------------------------------------------------------------+
|                               |                                 |
|    Shared Context Engine      |      Agent Collaboration        |
|  (Real-time Sync, State)      |  (Consensus, Workspace, Notes)  |
|                               |                                 |
+-------------------------------+---------------------------------+
|                               |                                 |
|      Knowledge Manager        |       Checkpoint System         |
|  (Indexing, Search, Ranking)  |  (State Snapshots, Rollback)    |
|                               |                                 |
+-------------------------------+---------------------------------+
|                                                                 |
|                         Memory Store                            |
|             (Tiered Storage, TTL, Eviction Logic)               |
|                                                                 |
+-----------------------------------------------------------------+
```

## 1. Tiered Storage Strategy

The core `MemoryStore` implements a 5-tier strategy to optimize retrieval speed and memory usage:

| Tier | Purpose | TTL | Max Entries | Eviction Policy |
|------|---------|-----|-------------|-----------------|
| **Working** | Current task execution context | 30 mins | 100 | LRU / Lowest Importance |
| **Short-Term** | Session-scoped interactions | 24 hours | 500 | LRU / Lowest Importance |
| **Long-Term** | Persistent project knowledge | None | 10,000 | Compression of old entries |
| **Semantic** | Cross-project conceptual knowledge | None | 5,000 | Compression of old entries |
| **Episodic** | Historical events and logs | 7 days | 2,000 | Time-based expiry |

## 2. Data Structures

### Memory Entry
The atomic unit of storage across all tiers.
- `id`: Unique identifier.
- `tier`: Storage tier assignment.
- `category`: Semantic categorization (e.g., `code_pattern`, `error_solution`).
- `key`: Unique key for upserts.
- `content`: Payload.
- `importance`: Float (0.0 - 1.0) determining retention priority.
- `accessCount`: Tracks frequency of use for ranking.

### Knowledge Item
A specialized structure for the `KnowledgeManager`.
- Contains `title`, `summary`, and `confidence` scores.
- Automatically indexed by `category` and `tags`.
- Protected by duplicate detection (content hashing).

## 3. Search and Retrieval

The search engine employs a hybrid scoring mechanism:

1. **Exact Match**: Highest score (1.0) if the query exactly matches the entry key.
2. **Substring Match**: High score (0.8) if the key contains the query.
3. **Content Match**: Medium score (0.6) if the payload contains the query.
4. **Keyword Match**: Partial score based on the percentage of matching words.

**Final Score Calculation**:
`Final Score = (Base Score * 0.7) + (Importance * 0.2) + (Access Frequency Boost)`

## 4. Context Synchronization

The `SharedContextEngine` maintains a singleton instance of the `SharedContext` per project.
- **Version Bumping**: Every mutation (e.g., adding a file, updating a goal) increments the context version.
- **Agent Contexts**: Each agent maintains a localized sub-context within the shared state to track its current focus without polluting the global state.
- **Conversation Compression**: To prevent LLM context window overflow, conversations exceeding 50 turns are automatically compressed. The oldest turns are summarized and moved to Long-Term memory, leaving only the most recent context active.

## 5. Collaboration Mechanics

The `AgentCollaboration` module provides a structured workspace:
- **Proposals**: Agents propose architectural or execution decisions.
- **Voting**: Active agents vote (`agree` or `reject`).
- **Consensus**: Majority rule automatically approves decisions, which are then persisted to the Knowledge Base.
- **Conflict Management**: Resource locks or contradictory decisions trigger conflicts, escalating to the Orchestrator for resolution.

## 6. Advanced Checkpointing

Checkpoints capture a holistic snapshot of the system:
- `executionState`: Completed, pending, and failed steps.
- `memorySnapshot`: Pointers to active working memory entries.
- `contextVersion`: The specific state of the shared context at the time of the checkpoint.

Checkpoints are indexed by both Task ID and Project ID, allowing granular rollbacks or full project state restoration.
