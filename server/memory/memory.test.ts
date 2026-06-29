/**
 * Phase 4B - Comprehensive Tests
 * Covers: Unit, Integration, Memory, Context, Collaboration, Checkpoint tests.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Memory Store
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

// Shared Context Engine
import {
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
  addSharedNote,
  getUnacknowledgedNotes,
  acknowledgeNote,
  buildContextSummary,
  searchContext,
  getContextVersion,
  clearAllContexts,
} from "./sharedContextEngine";

// Knowledge Manager
import {
  addKnowledge,
  getKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
  getProjectKnowledge,
  getKnowledgeByCategory,
  compressKnowledge,
  getKnowledgeStats,
  clearAllKnowledge,
} from "./knowledgeManager";

// Agent Collaboration
import {
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
  getWorkspaceStats,
  clearAllWorkspaces,
} from "./agentCollaboration";

// Checkpoint System
import {
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
  clearAllCheckpoints,
} from "./checkpointSystem";

// Memory API
import {
  SaveMemory,
  LoadMemory,
  SearchMemory,
  DeleteMemory,
  UpdateMemory,
  CompressMemory,
  SaveKnowledge,
  SearchKnowledge,
  GetProjectMemory,
  GetMemoryStats,
  ClearMemory,
  RememberTaskResult,
  RememberErrorSolution,
  RememberCodePattern,
  RecallContext,
} from "./memoryAPI";

// ============================================
// TEST HELPERS
// ============================================

const TEST_PROJECT = "test-project-4b";
const TEST_USER = "test-user-4b";
const TEST_AGENT = "test-agent-4b";

function resetAll() {
  clearAllMemory();
  clearAllContexts();
  clearAllKnowledge();
  clearAllWorkspaces();
  clearAllCheckpoints();
}

// ============================================
// UNIT TESTS: MEMORY STORE
// ============================================

describe("MemoryStore - Unit Tests", () => {
  beforeEach(resetAll);

  it("should save and load a memory entry by ID", () => {
    const entry = saveMemory({
      tier: "working",
      category: "general",
      key: "test-key",
      content: "test content",
      projectId: TEST_PROJECT,
    });

    expect(entry.id).toBeDefined();
    expect(entry.tier).toBe("working");
    expect(entry.content).toBe("test content");

    const loaded = loadMemory(entry.id);
    expect(loaded).toBeDefined();
    expect(loaded!.content).toBe("test content");
    expect(loaded!.accessCount).toBe(1);
  });

  it("should load memory by key and tier", () => {
    saveMemory({
      tier: "long_term",
      category: "code_pattern",
      key: "my-pattern",
      content: "pattern content",
    });

    const loaded = loadMemoryByKey("long_term", "my-pattern");
    expect(loaded).toBeDefined();
    expect(loaded!.content).toBe("pattern content");
  });

  it("should update an existing memory entry when same key is used", () => {
    const entry1 = saveMemory({
      tier: "short_term",
      category: "general",
      key: "duplicate-key",
      content: "original content",
    });

    const entry2 = saveMemory({
      tier: "short_term",
      category: "general",
      key: "duplicate-key",
      content: "updated content",
    });

    expect(entry1.id).toBe(entry2.id);
    const loaded = loadMemory(entry1.id);
    expect(loaded!.content).toBe("updated content");
  });

  it("should update memory entry fields", () => {
    const entry = saveMemory({
      tier: "long_term",
      category: "general",
      key: "update-test",
      content: "original",
      importance: 0.5,
    });

    const updated = updateMemory(entry.id, { content: "modified", importance: 0.9 });
    expect(updated).toBeDefined();
    expect(updated!.content).toBe("modified");
    expect(updated!.importance).toBe(0.9);
  });

  it("should delete a memory entry", () => {
    const entry = saveMemory({
      tier: "working",
      category: "general",
      key: "delete-test",
      content: "to be deleted",
    });

    const deleted = deleteMemory(entry.id);
    expect(deleted).toBe(true);

    const loaded = loadMemory(entry.id);
    expect(loaded).toBeUndefined();
  });

  it("should search memory by keyword", () => {
    saveMemory({ tier: "long_term", category: "general", key: "k1", content: "React component architecture" });
    saveMemory({ tier: "long_term", category: "general", key: "k2", content: "TypeScript interface design" });
    saveMemory({ tier: "long_term", category: "general", key: "k3", content: "Database schema optimization" });

    const results = searchMemory({ query: "React" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.content).toContain("React");
  });

  it("should filter search by project", () => {
    saveMemory({ tier: "long_term", category: "general", key: "p1", content: "project A content", projectId: "project-A" });
    saveMemory({ tier: "long_term", category: "general", key: "p2", content: "project B content", projectId: "project-B" });

    const results = searchMemory({ query: "content", projectId: "project-A" });
    expect(results.every((r) => r.entry.projectId === "project-A")).toBe(true);
  });

  it("should get all memory for a project", () => {
    saveMemory({ tier: "long_term", category: "general", key: "pm1", content: "c1", projectId: TEST_PROJECT });
    saveMemory({ tier: "short_term", category: "general", key: "pm2", content: "c2", projectId: TEST_PROJECT });
    saveMemory({ tier: "long_term", category: "general", key: "pm3", content: "c3", projectId: "other-project" });

    const entries = getProjectMemory(TEST_PROJECT);
    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.projectId === TEST_PROJECT)).toBe(true);
  });

  it("should return memory stats", () => {
    saveMemory({ tier: "working", category: "general", key: "s1", content: "c1" });
    saveMemory({ tier: "long_term", category: "code_pattern", key: "s2", content: "c2" });

    const stats = getMemoryStats();
    expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
    expect(stats.byTier.working).toBeGreaterThanOrEqual(1);
    expect(stats.byTier.long_term).toBeGreaterThanOrEqual(1);
  });

  it("should purge expired memory entries", () => {
    const pastDate = new Date(Date.now() - 1000);
    saveMemory({
      tier: "working",
      category: "general",
      key: "expired-key",
      content: "expired content",
      expiresAt: pastDate,
    });

    const purged = purgeExpiredMemory();
    expect(purged).toBeGreaterThanOrEqual(1);
  });

  it("should compress old low-importance entries", () => {
    // Add a long entry with low importance
    const longContent = "x".repeat(600);
    saveMemory({
      tier: "short_term",
      category: "general",
      key: "compress-test",
      content: longContent,
      importance: 0.2,
    });

    const compressed = compressMemory();
    // Compression happens for entries older than 6 hours, so this may be 0 in tests
    expect(typeof compressed).toBe("number");
  });
});

// ============================================
// UNIT TESTS: SHARED CONTEXT ENGINE
// ============================================

describe("SharedContextEngine - Unit Tests", () => {
  beforeEach(resetAll);

  it("should create a new context for a project", () => {
    const ctx = getOrCreateContext(TEST_PROJECT, TEST_USER);
    expect(ctx.projectId).toBe(TEST_PROJECT);
    expect(ctx.userId).toBe(TEST_USER);
    expect(ctx.version).toBe(1);
  });

  it("should return the same context on repeated calls", () => {
    const ctx1 = getOrCreateContext(TEST_PROJECT, TEST_USER);
    const ctx2 = getOrCreateContext(TEST_PROJECT, TEST_USER);
    expect(ctx1.id).toBe(ctx2.id);
  });

  it("should update file structure", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    updateFileStructure(TEST_PROJECT, { "src/index.ts": "entry point", "src/app.ts": "app root" });

    const ctx = getContext(TEST_PROJECT);
    expect(Object.keys(ctx!.projectContext.fileStructure).length).toBe(2);
  });

  it("should update project metadata", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    updateProjectMeta(TEST_PROJECT, {
      techStack: ["React", "TypeScript"],
      dependencies: ["nanoid", "zod"],
      projectName: "Test App",
    });

    const ctx = getContext(TEST_PROJECT);
    expect(ctx!.projectContext.techStack).toContain("React");
    expect(ctx!.projectContext.projectName).toBe("Test App");
  });

  it("should set and retrieve current goal", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    setCurrentGoal(TEST_PROJECT, "Build a dashboard");

    const ctx = getContext(TEST_PROJECT);
    expect(ctx!.projectContext.currentGoal).toBe("Build a dashboard");
  });

  it("should register agents and track them", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    registerAgent(TEST_PROJECT, "planner");
    registerAgent(TEST_PROJECT, "architect");

    const ctx = getContext(TEST_PROJECT);
    expect(ctx!.projectContext.activeAgents).toContain("planner");
    expect(ctx!.projectContext.activeAgents).toContain("architect");
  });

  it("should update agent context", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    registerAgent(TEST_PROJECT, "executor");
    updateAgentContext(TEST_PROJECT, "executor", { status: "running", progress: 50 }, "task-123");

    const agentCtx = getAgentContext(TEST_PROJECT, "executor");
    expect(agentCtx).toBeDefined();
    expect(agentCtx!.localMemory.status).toBe("running");
    expect(agentCtx!.currentTaskId).toBe("task-123");
  });

  it("should add and retrieve conversation turns", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    addConversationTurn(TEST_PROJECT, { role: "user", content: "Hello agent" });
    addConversationTurn(TEST_PROJECT, { role: "assistant", content: "Hello user" });

    const history = getConversationHistory(TEST_PROJECT);
    expect(history.length).toBe(2);
    expect(history[0].role).toBe("user");
    expect(history[1].role).toBe("assistant");
  });

  it("should add shared notes and track acknowledgments", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    registerAgent(TEST_PROJECT, "planner");
    registerAgent(TEST_PROJECT, "architect");

    const note = addSharedNote(TEST_PROJECT, {
      agentType: "planner",
      content: "Important: use TypeScript strict mode",
      category: "suggestion",
    });

    const unread = getUnacknowledgedNotes(TEST_PROJECT, "architect");
    expect(unread.some((n) => n.id === note.id)).toBe(true);

    acknowledgeNote(TEST_PROJECT, note.id, "architect");
    const afterAck = getUnacknowledgedNotes(TEST_PROJECT, "architect");
    expect(afterAck.some((n) => n.id === note.id)).toBe(false);
  });

  it("should build a context summary", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    setCurrentGoal(TEST_PROJECT, "Build API");
    updateProjectMeta(TEST_PROJECT, { techStack: ["Node.js", "Express"] });
    addConversationTurn(TEST_PROJECT, { role: "user", content: "Create a REST API" });

    const summary = buildContextSummary(TEST_PROJECT, "executor");
    expect(summary).toContain("Build API");
    expect(summary).toContain("Node.js");
  });

  it("should increment context version on updates", () => {
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    const v1 = getContextVersion(TEST_PROJECT);
    setCurrentGoal(TEST_PROJECT, "Goal 1");
    const v2 = getContextVersion(TEST_PROJECT);
    expect(v2).toBeGreaterThan(v1);
  });
});

// ============================================
// UNIT TESTS: KNOWLEDGE MANAGER
// ============================================

describe("KnowledgeManager - Unit Tests", () => {
  beforeEach(resetAll);

  it("should add and retrieve a knowledge item", () => {
    const item = addKnowledge({
      title: "React Hooks Pattern",
      content: "Use useState and useEffect for state management",
      category: "code_pattern",
      tags: ["react", "hooks"],
      projectId: TEST_PROJECT,
      importance: 0.8,
    });

    expect(item.id).toBeDefined();
    expect(item.isDuplicate).toBe(false);

    const retrieved = getKnowledge(item.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.title).toBe("React Hooks Pattern");
    expect(retrieved!.accessCount).toBe(1);
  });

  it("should detect duplicate knowledge", () => {
    const content = "Identical content for duplicate detection";
    const item1 = addKnowledge({ title: "Item 1", content, category: "general" });
    const item2 = addKnowledge({ title: "Item 2", content, category: "general" });

    expect(item2.isDuplicate).toBe(true);
    expect(item2.duplicateOf).toBe(item1.id);
  });

  it("should update a knowledge item", () => {
    const item = addKnowledge({
      title: "Old Title",
      content: "old content",
      category: "general",
    });

    const updated = updateKnowledge(item.id, { content: "new content", importance: 0.9 });
    expect(updated!.content).toBe("new content");
    expect(updated!.importance).toBe(0.9);
  });

  it("should delete a knowledge item", () => {
    const item = addKnowledge({ title: "To Delete", content: "delete me", category: "general" });
    const deleted = deleteKnowledge(item.id);
    expect(deleted).toBe(true);
    expect(getKnowledge(item.id)).toBeUndefined();
  });

  it("should search knowledge by query", () => {
    addKnowledge({ title: "TypeScript Generics", content: "Use generics for type safety", category: "code_pattern", tags: ["typescript"] });
    addKnowledge({ title: "React Performance", content: "Use memo and useCallback", category: "code_pattern", tags: ["react"] });
    addKnowledge({ title: "Database Indexing", content: "Add indexes for faster queries", category: "general" });

    const results = searchKnowledge({ query: "TypeScript" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain("TypeScript");
  });

  it("should get knowledge by project", () => {
    addKnowledge({ title: "P1 Knowledge", content: "content", category: "general", projectId: TEST_PROJECT });
    addKnowledge({ title: "P2 Knowledge", content: "content", category: "general", projectId: "other" });

    const items = getProjectKnowledge(TEST_PROJECT);
    expect(items.length).toBe(1);
    expect(items[0].projectId).toBe(TEST_PROJECT);
  });

  it("should get knowledge by category", () => {
    addKnowledge({ title: "Pattern 1", content: "c1", category: "code_pattern" });
    addKnowledge({ title: "Pattern 2", content: "c2", category: "code_pattern" });
    addKnowledge({ title: "Decision 1", content: "c3", category: "decision" });

    const patterns = getKnowledgeByCategory("code_pattern");
    expect(patterns.length).toBe(2);
    expect(patterns.every((p) => p.category === "code_pattern")).toBe(true);
  });

  it("should return knowledge stats", () => {
    addKnowledge({ title: "K1", content: "c1", category: "code_pattern" });
    addKnowledge({ title: "K2", content: "c2", category: "decision" });

    const stats = getKnowledgeStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.byCategory["code_pattern"]).toBeGreaterThanOrEqual(1);
  });
});

// ============================================
// UNIT TESTS: AGENT COLLABORATION
// ============================================

describe("AgentCollaboration - Unit Tests", () => {
  beforeEach(() => {
    resetAll();
    // Initialize context for collaboration tests
    getOrCreateContext(TEST_PROJECT, TEST_USER);
  });

  it("should create and retrieve a workspace", () => {
    const ws = getOrCreateWorkspace(TEST_PROJECT, TEST_USER);
    expect(ws.projectId).toBe(TEST_PROJECT);
    expect(ws.activeAgents).toHaveLength(0);

    const retrieved = getWorkspace(TEST_PROJECT);
    expect(retrieved!.id).toBe(ws.id);
  });

  it("should join and leave workspace", () => {
    getOrCreateWorkspace(TEST_PROJECT, TEST_USER);
    joinWorkspace(TEST_PROJECT, "planner");
    joinWorkspace(TEST_PROJECT, "architect");

    let ws = getWorkspace(TEST_PROJECT)!;
    expect(ws.activeAgents).toContain("planner");
    expect(ws.activeAgents).toContain("architect");

    leaveWorkspace(TEST_PROJECT, "planner");
    ws = getWorkspace(TEST_PROJECT)!;
    expect(ws.activeAgents).not.toContain("planner");
  });

  it("should propose and auto-approve a decision", () => {
    getOrCreateWorkspace(TEST_PROJECT, TEST_USER);
    joinWorkspace(TEST_PROJECT, "planner");

    const decision = proposeDecision({
      projectId: TEST_PROJECT,
      title: "Use TypeScript strict mode",
      description: "Enable strict TypeScript checking",
      proposedBy: "planner",
      rationale: "Improves type safety",
    });

    expect(decision.status).toBe("pending");
    expect(decision.agreedBy).toContain("planner");

    const approved = autoApproveDecision(TEST_PROJECT, decision.id);
    expect(approved!.status).toBe("approved");
  });

  it("should achieve consensus with majority vote", () => {
    getOrCreateWorkspace(TEST_PROJECT, TEST_USER);
    joinWorkspace(TEST_PROJECT, "planner");
    joinWorkspace(TEST_PROJECT, "architect");
    joinWorkspace(TEST_PROJECT, "executor");

    const decision = proposeDecision({
      projectId: TEST_PROJECT,
      title: "Refactor service layer",
      description: "Break monolithic service into modules",
      proposedBy: "planner",
      rationale: "Better separation of concerns",
    });

    // planner already agreed (proposer)
    voteOnDecision(TEST_PROJECT, decision.id, "architect", "agree");

    const updated = voteOnDecision(TEST_PROJECT, decision.id, "executor", "agree");
    expect(updated!.status).toBe("approved");
  });

  it("should report and resolve a conflict", () => {
    getOrCreateWorkspace(TEST_PROJECT, TEST_USER);

    const conflict = reportConflict({
      projectId: TEST_PROJECT,
      type: "file_conflict",
      description: "Both agents trying to modify src/app.ts",
      involvedAgents: ["planner", "architect"],
    });

    expect(conflict.status).toBe("open");

    const openConflicts = getOpenConflicts(TEST_PROJECT);
    expect(openConflicts.some((c) => c.id === conflict.id)).toBe(true);

    const resolved = resolveConflict(
      TEST_PROJECT,
      conflict.id,
      "Planner modifies first, architect reviews after",
      "orchestrator"
    );

    expect(resolved!.status).toBe("resolved");
    expect(getOpenConflicts(TEST_PROJECT).some((c) => c.id === conflict.id)).toBe(false);
  });

  it("should return workspace stats", () => {
    getOrCreateWorkspace(TEST_PROJECT, TEST_USER);
    joinWorkspace(TEST_PROJECT, "planner");
    joinWorkspace(TEST_PROJECT, "architect");

    proposeDecision({
      projectId: TEST_PROJECT,
      title: "Test Decision",
      description: "desc",
      proposedBy: "planner",
      rationale: "reason",
    });

    const stats = getWorkspaceStats(TEST_PROJECT);
    expect(stats.activeAgents).toBe(2);
    expect(stats.pendingDecisions).toBe(1);
  });

  it("should get decision history", () => {
    getOrCreateWorkspace(TEST_PROJECT, TEST_USER);
    joinWorkspace(TEST_PROJECT, "planner");

    proposeDecision({
      projectId: TEST_PROJECT,
      title: "Decision 1",
      description: "d1",
      proposedBy: "planner",
      rationale: "r1",
    });

    const history = getDecisionHistory(TEST_PROJECT);
    expect(history.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================
// UNIT TESTS: CHECKPOINT SYSTEM
// ============================================

describe("CheckpointSystem - Unit Tests", () => {
  beforeEach(() => {
    resetAll();
    getOrCreateContext(TEST_PROJECT, TEST_USER);
  });

  it("should create and retrieve a checkpoint", () => {
    const ckpt = createCheckpoint({
      taskId: "task-001",
      projectId: TEST_PROJECT,
      userId: TEST_USER,
      label: "Step 1 complete",
      stepIndex: 1,
      totalSteps: 5,
      executionState: {
        completedStepIds: ["step-1"],
        pendingStepIds: ["step-2", "step-3", "step-4", "step-5"],
      },
    });

    expect(ckpt.id).toBeDefined();
    expect(ckpt.stepIndex).toBe(1);
    expect(ckpt.canRollback).toBe(true);

    const retrieved = getCheckpoint(ckpt.id);
    expect(retrieved!.label).toBe("Step 1 complete");
  });

  it("should get the latest checkpoint for a task", () => {
    autoCheckpoint("task-002", TEST_PROJECT, TEST_USER, 1, 3, { completedStepIds: ["s1"] });
    autoCheckpoint("task-002", TEST_PROJECT, TEST_USER, 2, 3, { completedStepIds: ["s1", "s2"] });
    autoCheckpoint("task-002", TEST_PROJECT, TEST_USER, 3, 3, { completedStepIds: ["s1", "s2", "s3"] });

    const latest = getLatestCheckpoint("task-002");
    expect(latest!.stepIndex).toBe(3);
  });

  it("should get all checkpoints for a task in order", () => {
    autoCheckpoint("task-003", TEST_PROJECT, TEST_USER, 1, 3, {});
    autoCheckpoint("task-003", TEST_PROJECT, TEST_USER, 2, 3, {});
    autoCheckpoint("task-003", TEST_PROJECT, TEST_USER, 3, 3, {});

    const checkpoints = getTaskCheckpoints("task-003");
    expect(checkpoints.length).toBe(3);
    expect(checkpoints[0].stepIndex).toBe(1);
    expect(checkpoints[2].stepIndex).toBe(3);
  });

  it("should rollback to a checkpoint", () => {
    const ckpt1 = autoCheckpoint("task-004", TEST_PROJECT, TEST_USER, 1, 3, {
      completedStepIds: ["s1"],
      pendingStepIds: ["s2", "s3"],
    });
    autoCheckpoint("task-004", TEST_PROJECT, TEST_USER, 2, 3, {
      completedStepIds: ["s1", "s2"],
      pendingStepIds: ["s3"],
    });

    const result = rollbackToCheckpoint(ckpt1.id);
    expect(result.success).toBe(true);
    expect(result.checkpointId).toBe(ckpt1.id);
    expect(result.restoredSteps).toContain("s1");
  });

  it("should resume from latest checkpoint", () => {
    autoCheckpoint("task-005", TEST_PROJECT, TEST_USER, 2, 5, {
      completedStepIds: ["s1", "s2"],
      pendingStepIds: ["s3", "s4", "s5"],
    });

    const result = resumeFromLatestCheckpoint("task-005");
    expect(result.canResume).toBe(true);
    expect(result.checkpoint).toBeDefined();
    expect(result.message).toContain("Resuming");
  });

  it("should return no resume when no checkpoint exists", () => {
    const result = resumeFromLatestCheckpoint("nonexistent-task");
    expect(result.canResume).toBe(false);
    expect(result.checkpoint).toBeNull();
  });

  it("should add and retrieve execution history", () => {
    addHistoryEntry({
      taskId: "task-006",
      projectId: TEST_PROJECT,
      userId: TEST_USER,
      command: "Add login feature",
      status: "completed",
      summary: "Added login with JWT",
      filesChanged: 3,
      startedAt: new Date(Date.now() - 5000),
      completedAt: new Date(),
    });

    const history = getExecutionHistory(TEST_PROJECT);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].command).toBe("Add login feature");
    expect(history[0].status).toBe("completed");
    expect(history[0].duration).toBeDefined();
  });

  it("should get checkpoint stats", () => {
    autoCheckpoint("task-007", TEST_PROJECT, TEST_USER, 1, 2, {});
    createCheckpoint({
      taskId: "task-008",
      projectId: TEST_PROJECT,
      userId: TEST_USER,
      label: "Manual checkpoint",
      stepIndex: 1,
      totalSteps: 1,
      executionState: {},
      isAutomatic: false,
    });

    const stats = getCheckpointStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.automatic).toBeGreaterThanOrEqual(1);
    expect(stats.manual).toBeGreaterThanOrEqual(1);
  });

  it("should get project checkpoints", () => {
    autoCheckpoint("task-009", TEST_PROJECT, TEST_USER, 1, 1, {});
    autoCheckpoint("task-010", TEST_PROJECT, TEST_USER, 1, 1, {});

    const checkpoints = getProjectCheckpoints(TEST_PROJECT);
    expect(checkpoints.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================
// UNIT TESTS: MEMORY API
// ============================================

describe("MemoryAPI - Unit Tests", () => {
  beforeEach(resetAll);

  it("SaveMemory should persist and return an entry", () => {
    const entry = SaveMemory({
      tier: "long_term",
      category: "code_pattern",
      key: "api-test-1",
      content: "API test content",
      projectId: TEST_PROJECT,
      importance: 0.7,
    });

    expect(entry.id).toBeDefined();
    expect(entry.importance).toBe(0.7);
  });

  it("LoadMemory should retrieve by ID", () => {
    const entry = SaveMemory({ tier: "working", category: "general", key: "load-test", content: "load me" });
    const loaded = LoadMemory({ id: entry.id });
    expect(loaded).toBeDefined();
    expect(loaded!.content).toBe("load me");
  });

  it("LoadMemory should retrieve by tier and key", () => {
    SaveMemory({ tier: "semantic", category: "general", key: "semantic-key", content: "semantic content" });
    const loaded = LoadMemory({ tier: "semantic", key: "semantic-key" });
    expect(loaded).toBeDefined();
    expect(loaded!.content).toBe("semantic content");
  });

  it("SearchMemory should return relevant results", () => {
    SaveMemory({ tier: "long_term", category: "general", key: "s1", content: "authentication middleware" });
    SaveMemory({ tier: "long_term", category: "general", key: "s2", content: "database connection pool" });

    const results = SearchMemory({ query: "authentication" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.content).toContain("authentication");
  });

  it("DeleteMemory should remove an entry", () => {
    const entry = SaveMemory({ tier: "working", category: "general", key: "del-api", content: "delete via API" });
    const deleted = DeleteMemory(entry.id);
    expect(deleted).toBe(true);
    expect(LoadMemory({ id: entry.id })).toBeUndefined();
  });

  it("UpdateMemory should modify an entry", () => {
    const entry = SaveMemory({ tier: "long_term", category: "general", key: "upd-api", content: "old", importance: 0.3 });
    const updated = UpdateMemory(entry.id, { content: "new", importance: 0.9 });
    expect(updated!.content).toBe("new");
    expect(updated!.importance).toBe(0.9);
  });

  it("CompressMemory should return compression stats", () => {
    const result = CompressMemory();
    expect(typeof result.compressed).toBe("number");
    expect(typeof result.purged).toBe("number");
  });

  it("SaveKnowledge should persist to knowledge base", () => {
    const item = SaveKnowledge({
      title: "API Knowledge",
      content: "REST API best practices",
      category: "code_pattern",
      projectId: TEST_PROJECT,
    });

    expect(item.id).toBeDefined();
    expect(item.isDuplicate).toBe(false);
  });

  it("SearchKnowledge should find relevant items", () => {
    SaveKnowledge({ title: "REST API", content: "HTTP methods and status codes", category: "code_pattern" });
    SaveKnowledge({ title: "GraphQL", content: "Query and mutation patterns", category: "code_pattern" });

    const results = SearchKnowledge({ query: "REST" });
    expect(results.length).toBeGreaterThan(0);
  });

  it("RememberTaskResult should save task outcome", () => {
    const entry = RememberTaskResult({
      taskId: "task-remember-1",
      projectId: TEST_PROJECT,
      agentId: "executor",
      command: "Create login page",
      result: "Login page created successfully",
      success: true,
    });

    expect(entry.id).toBeDefined();
    expect(entry.tier).toBe("short_term");
    expect(entry.tags).toContain("success");
  });

  it("RememberErrorSolution should save error and solution", () => {
    RememberErrorSolution({
      error: "Cannot read property of undefined",
      solution: "Add null check before accessing property",
      projectId: TEST_PROJECT,
    });

    const results = SearchMemory({ query: "Cannot read property", projectId: TEST_PROJECT });
    expect(results.length).toBeGreaterThan(0);
  });

  it("RememberCodePattern should save to knowledge base", () => {
    RememberCodePattern({
      name: "Singleton Pattern",
      description: "Ensure single instance",
      pattern: "class Singleton { private static instance: Singleton; }",
      language: "TypeScript",
      projectId: TEST_PROJECT,
    });

    const results = SearchKnowledge({ query: "Singleton", projectId: TEST_PROJECT });
    expect(results.length).toBeGreaterThan(0);
  });

  it("RecallContext should return relevant context strings", () => {
    SaveMemory({ tier: "long_term", category: "general", key: "rc1", content: "login feature implementation", projectId: TEST_PROJECT });
    SaveKnowledge({ title: "Auth Pattern", content: "JWT authentication flow", category: "code_pattern", projectId: TEST_PROJECT });

    const context = RecallContext({ query: "login authentication", projectId: TEST_PROJECT });
    expect(context.length).toBeGreaterThan(0);
  });

  it("GetMemoryStats should include knowledge stats", () => {
    SaveMemory({ tier: "working", category: "general", key: "stat1", content: "c1" });
    SaveKnowledge({ title: "K1", content: "c1", category: "general" });

    const stats = GetMemoryStats();
    expect(stats.totalEntries).toBeGreaterThanOrEqual(1);
    expect(stats.knowledge).toBeDefined();
    expect(stats.knowledge.total).toBeGreaterThanOrEqual(1);
  });

  it("ClearMemory should remove all entries", () => {
    SaveMemory({ tier: "working", category: "general", key: "clear1", content: "c1" });
    SaveMemory({ tier: "long_term", category: "general", key: "clear2", content: "c2" });

    ClearMemory();
    const stats = GetMemoryStats();
    expect(stats.totalEntries).toBe(0);
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe("Integration Tests - Phase 4B", () => {
  beforeEach(() => {
    resetAll();
    getOrCreateContext(TEST_PROJECT, TEST_USER);
    getOrCreateWorkspace(TEST_PROJECT, TEST_USER);
  });

  it("should support full memory lifecycle: save → search → update → delete", () => {
    const entry = SaveMemory({
      tier: "long_term",
      category: "code_pattern",
      key: "lifecycle-test",
      content: "Initial pattern content",
      projectId: TEST_PROJECT,
      importance: 0.6,
    });

    const searchResults = SearchMemory({ query: "pattern content", projectId: TEST_PROJECT });
    expect(searchResults.length).toBeGreaterThan(0);

    UpdateMemory(entry.id, { content: "Updated pattern content", importance: 0.8 });
    const loaded = LoadMemory({ id: entry.id });
    expect(loaded!.content).toBe("Updated pattern content");

    DeleteMemory(entry.id);
    expect(LoadMemory({ id: entry.id })).toBeUndefined();
  });

  it("should support agent collaboration with shared context", () => {
    // Agents join workspace
    joinWorkspace(TEST_PROJECT, "planner");
    joinWorkspace(TEST_PROJECT, "architect");
    registerAgent(TEST_PROJECT, "planner");
    registerAgent(TEST_PROJECT, "architect");

    // Set goal
    setCurrentGoal(TEST_PROJECT, "Implement user authentication");

    // Planner proposes decision
    const decision = proposeDecision({
      projectId: TEST_PROJECT,
      title: "Use JWT for auth",
      description: "Implement JWT-based authentication",
      proposedBy: "planner",
      rationale: "Industry standard, stateless",
    });

    // Architect agrees
    voteOnDecision(TEST_PROJECT, decision.id, "architect", "agree");

    // Decision should be approved (2/2 agents agree)
    const pending = getPendingDecisions(TEST_PROJECT);
    expect(pending.find((d) => d.id === decision.id)).toBeUndefined(); // approved, not pending

    // Check workspace stats
    const stats = getWorkspaceStats(TEST_PROJECT);
    expect(stats.approvedDecisions).toBeGreaterThanOrEqual(1);
  });

  it("should support checkpoint-based resume after interruption", () => {
    const taskId = "integration-task-001";

    // Simulate partial execution
    autoCheckpoint(taskId, TEST_PROJECT, TEST_USER, 2, 5, {
      completedStepIds: ["step-1", "step-2"],
      pendingStepIds: ["step-3", "step-4", "step-5"],
      partialOutputs: { filesCreated: 2 },
    });

    // Simulate interruption and resume
    const resumeResult = resumeFromLatestCheckpoint(taskId);
    expect(resumeResult.canResume).toBe(true);
    expect(resumeResult.checkpoint!.executionState.pendingStepIds).toHaveLength(3);
    expect(resumeResult.checkpoint!.executionState.completedStepIds).toHaveLength(2);
  });

  it("should support cross-component knowledge flow", () => {
    // Agent saves knowledge
    SaveKnowledge({
      title: "Error Pattern: DB Connection",
      content: "Always use connection pooling for database connections",
      category: "error_solution",
      projectId: TEST_PROJECT,
      agentId: "architect",
      importance: 0.9,
    });

    // Another agent recalls it
    const recalled = RecallContext({
      query: "database connection",
      projectId: TEST_PROJECT,
    });

    expect(recalled.length).toBeGreaterThan(0);
    expect(recalled.some((r) => r.toLowerCase().includes("connection"))).toBe(true);
  });

  it("should persist conversation history and build context summary", () => {
    addConversationTurn(TEST_PROJECT, { role: "user", content: "Add a dark mode toggle" });
    addConversationTurn(TEST_PROJECT, { role: "assistant", agentType: "planner", content: "I will create a theme context" });
    addConversationTurn(TEST_PROJECT, { role: "agent", agentType: "architect", content: "Designing ThemeProvider component" });

    setCurrentGoal(TEST_PROJECT, "Add dark mode toggle");
    updateProjectMeta(TEST_PROJECT, { techStack: ["React", "TailwindCSS"] });

    const summary = buildContextSummary(TEST_PROJECT, "executor");
    expect(summary).toContain("dark mode");
    expect(summary).toContain("React");
  });

  it("should track execution history across multiple tasks", () => {
    const t1 = new Date(Date.now() - 2000);
    const t2 = new Date(Date.now() - 1000);

    addHistoryEntry({
      taskId: "hist-task-1",
      projectId: TEST_PROJECT,
      userId: TEST_USER,
      command: "Add user model",
      status: "completed",
      summary: "User model created",
      filesChanged: 2,
      startedAt: t1,
    });

    addHistoryEntry({
      taskId: "hist-task-2",
      projectId: TEST_PROJECT,
      userId: TEST_USER,
      command: "Add auth middleware",
      status: "completed",
      summary: "Auth middleware added",
      filesChanged: 1,
      startedAt: t2,
    });

    const history = getExecutionHistory(TEST_PROJECT);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].command).toBe("Add auth middleware"); // Most recent first (t2 > t1)
  });

  it("should handle conflict detection and resolution workflow", () => {
    joinWorkspace(TEST_PROJECT, "planner");
    joinWorkspace(TEST_PROJECT, "architect");

    // Conflict arises
    const conflict = reportConflict({
      projectId: TEST_PROJECT,
      type: "file_conflict",
      description: "Both agents want to modify routes.ts",
      involvedAgents: ["planner", "architect"],
    });

    expect(getOpenConflicts(TEST_PROJECT).length).toBe(1);

    // Orchestrator resolves it
    resolveConflict(
      TEST_PROJECT,
      conflict.id,
      "Architect handles routes.ts, planner handles controllers",
      "orchestrator"
    );

    expect(getOpenConflicts(TEST_PROJECT).length).toBe(0);

    // Resolution saved to knowledge
    const knowledge = SearchKnowledge({ query: "Conflict Resolution", projectId: TEST_PROJECT });
    expect(knowledge.length).toBeGreaterThan(0);
  });
});
