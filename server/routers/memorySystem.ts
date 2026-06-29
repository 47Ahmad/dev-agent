/**
 * Memory System Router - Phase 4B
 * tRPC router exposing the Shared Intelligence & Memory System APIs.
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
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
  RecallContext,
  RememberErrorSolution,
} from "../memory/memoryAPI";
import {
  getOrCreateContext,
  buildContextSummary,
  getConversationHistory,
  addConversationTurn,
  setCurrentGoal,
  getContextVersion,
} from "../memory/sharedContextEngine";
import {
  getOrCreateWorkspace,
  proposeDecision,
  voteOnDecision,
  getPendingDecisions,
  getDecisionHistory,
  getWorkspaceStats,
  reportConflict,
  resolveConflict,
  getOpenConflicts,
} from "../memory/agentCollaboration";
import {
  getProjectCheckpoints,
  rollbackToCheckpoint,
  resumeFromLatestCheckpoint,
  getExecutionHistory,
  getCheckpointStats,
} from "../memory/checkpointSystem";

// ============================================
// MEMORY ROUTER
// ============================================

export const memorySystemRouter = router({
  // ── Core Memory API ──────────────────────────────────────────────

  saveMemory: publicProcedure
    .input(
      z.object({
        tier: z.enum(["working", "short_term", "long_term", "semantic", "episodic"]),
        category: z.enum([
          "project_structure", "code_pattern", "user_preference", "error_solution",
          "decision", "conversation", "task_result", "architectural_design",
          "dependency", "general",
        ]),
        key: z.string(),
        content: z.string(),
        tags: z.array(z.string()).optional(),
        projectId: z.string().optional(),
        userId: z.string().optional(),
        agentId: z.string().optional(),
        importance: z.number().min(0).max(1).optional(),
        ttlMs: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const entry = SaveMemory(input);
      return { success: true, id: entry.id };
    }),

  loadMemory: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        tier: z.enum(["working", "short_term", "long_term", "semantic", "episodic"]).optional(),
        key: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const entry = LoadMemory(input);
      return { entry: entry ?? null };
    }),

  searchMemory: publicProcedure
    .input(
      z.object({
        query: z.string(),
        tier: z.enum(["working", "short_term", "long_term", "semantic", "episodic"]).optional(),
        projectId: z.string().optional(),
        category: z.enum([
          "project_structure", "code_pattern", "user_preference", "error_solution",
          "decision", "conversation", "task_result", "architectural_design",
          "dependency", "general",
        ]).optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).optional(),
        minImportance: z.number().min(0).max(1).optional(),
      })
    )
    .query(({ input }) => {
      const results = SearchMemory(input);
      return { results, count: results.length };
    }),

  deleteMemory: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const deleted = DeleteMemory(input.id);
      return { success: deleted };
    }),

  updateMemory: publicProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        importance: z.number().min(0).max(1).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...updates } = input;
      const updated = UpdateMemory(id, updates);
      return { success: !!updated, entry: updated ?? null };
    }),

  compressMemory: publicProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .mutation(({ input }) => {
      const result = CompressMemory(input.projectId);
      return result;
    }),

  getMemoryStats: publicProcedure.query(() => {
    return GetMemoryStats();
  }),

  // ── Knowledge API ────────────────────────────────────────────────

  saveKnowledge: publicProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        summary: z.string().optional(),
        category: z.enum([
          "project_structure", "code_pattern", "user_preference", "error_solution",
          "decision", "conversation", "task_result", "architectural_design",
          "dependency", "general",
        ]),
        tags: z.array(z.string()).optional(),
        projectId: z.string().optional(),
        agentId: z.string().optional(),
        importance: z.number().min(0).max(1).optional(),
        confidence: z.number().min(0).max(1).optional(),
        source: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const item = SaveKnowledge(input);
      return { success: true, id: item.id, isDuplicate: item.isDuplicate };
    }),

  searchKnowledge: publicProcedure
    .input(
      z.object({
        query: z.string(),
        projectId: z.string().optional(),
        category: z.enum([
          "project_structure", "code_pattern", "user_preference", "error_solution",
          "decision", "conversation", "task_result", "architectural_design",
          "dependency", "general",
        ]).optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(50).optional(),
        minImportance: z.number().min(0).max(1).optional(),
      })
    )
    .query(({ input }) => {
      const items = SearchKnowledge(input);
      return { items, count: items.length };
    }),

  recallContext: publicProcedure
    .input(
      z.object({
        query: z.string(),
        projectId: z.string().optional(),
        limit: z.number().min(1).max(20).optional(),
      })
    )
    .query(({ input }) => {
      const context = RecallContext(input);
      return { context, count: context.length };
    }),

  // ── Shared Context API ───────────────────────────────────────────

  getContext: publicProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .query(({ input }) => {
      const ctx = getOrCreateContext(input.projectId, input.userId);
      return {
        id: ctx.id,
        version: ctx.version,
        lastSyncAt: ctx.lastSyncAt,
        activeAgents: ctx.projectContext.activeAgents,
        currentGoal: ctx.projectContext.currentGoal,
        techStack: ctx.projectContext.techStack,
        fileCount: Object.keys(ctx.projectContext.fileStructure).length,
        conversationLength: ctx.projectContext.conversationHistory.length,
      };
    }),

  getContextSummary: publicProcedure
    .input(z.object({ projectId: z.string(), userId: z.string(), agentType: z.string() }))
    .query(({ input }) => {
      getOrCreateContext(input.projectId, input.userId);
      const summary = buildContextSummary(input.projectId, input.agentType);
      return { summary, version: getContextVersion(input.projectId) };
    }),

  getConversationHistory: publicProcedure
    .input(z.object({ projectId: z.string(), limit: z.number().optional() }))
    .query(({ input }) => {
      const history = getConversationHistory(input.projectId, input.limit);
      return { history, count: history.length };
    }),

  addConversationTurn: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        role: z.enum(["user", "assistant", "agent"]),
        content: z.string(),
        agentType: z.string().optional(),
        taskId: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { projectId, ...turn } = input;
      const newTurn = addConversationTurn(projectId, turn);
      return { success: true, turnId: newTurn.id };
    }),

  setCurrentGoal: publicProcedure
    .input(z.object({ projectId: z.string(), goal: z.string() }))
    .mutation(({ input }) => {
      setCurrentGoal(input.projectId, input.goal);
      return { success: true };
    }),

  // ── Collaboration API ────────────────────────────────────────────

  getWorkspaceStats: publicProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .query(({ input }) => {
      getOrCreateWorkspace(input.projectId, input.userId);
      return getWorkspaceStats(input.projectId);
    }),

  proposeDecision: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string(),
        proposedBy: z.string(),
        rationale: z.string(),
        taskId: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const decision = proposeDecision(input);
      return { success: true, decisionId: decision.id, status: decision.status };
    }),

  voteOnDecision: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        decisionId: z.string(),
        agentType: z.string(),
        vote: z.enum(["agree", "reject"]),
        reason: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const decision = voteOnDecision(
        input.projectId,
        input.decisionId,
        input.agentType,
        input.vote,
        input.reason
      );
      return { success: !!decision, status: decision?.status ?? "not_found" };
    }),

  getPendingDecisions: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ input }) => {
      const decisions = getPendingDecisions(input.projectId);
      return { decisions, count: decisions.length };
    }),

  getDecisionHistory: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ input }) => {
      const history = getDecisionHistory(input.projectId);
      return { history, count: history.length };
    }),

  reportConflict: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        type: z.enum(["file_conflict", "decision_conflict", "resource_conflict"]),
        description: z.string(),
        involvedAgents: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      const conflict = reportConflict(input);
      return { success: true, conflictId: conflict.id };
    }),

  resolveConflict: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        conflictId: z.string(),
        resolution: z.string(),
        resolvedBy: z.string(),
      })
    )
    .mutation(({ input }) => {
      const conflict = resolveConflict(
        input.projectId,
        input.conflictId,
        input.resolution,
        input.resolvedBy
      );
      return { success: !!conflict, status: conflict?.status ?? "not_found" };
    }),

  getOpenConflicts: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ input }) => {
      const conflicts = getOpenConflicts(input.projectId);
      return { conflicts, count: conflicts.length };
    }),

  // ── Checkpoint API ───────────────────────────────────────────────

  getProjectCheckpoints: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ input }) => {
      const checkpoints = getProjectCheckpoints(input.projectId);
      return {
        checkpoints: checkpoints.map((c) => ({
          id: c.id,
          taskId: c.taskId,
          label: c.label,
          stepIndex: c.stepIndex,
          totalSteps: c.totalSteps,
          isAutomatic: c.isAutomatic,
          canRollback: c.canRollback,
          createdAt: c.createdAt,
        })),
        count: checkpoints.length,
      };
    }),

  rollbackToCheckpoint: publicProcedure
    .input(z.object({ checkpointId: z.string() }))
    .mutation(({ input }) => {
      const result = rollbackToCheckpoint(input.checkpointId);
      return result;
    }),

  resumeFromCheckpoint: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(({ input }) => {
      const result = resumeFromLatestCheckpoint(input.taskId);
      return {
        canResume: result.canResume,
        message: result.message,
        checkpointId: result.checkpoint?.id ?? null,
        stepIndex: result.checkpoint?.stepIndex ?? null,
        totalSteps: result.checkpoint?.totalSteps ?? null,
      };
    }),

  getExecutionHistory: publicProcedure
    .input(z.object({ projectId: z.string(), limit: z.number().optional() }))
    .query(({ input }) => {
      const history = getExecutionHistory(input.projectId, input.limit);
      return { history, count: history.length };
    }),

  getCheckpointStats: publicProcedure.query(() => {
    return getCheckpointStats();
  }),
});
