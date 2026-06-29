/**
 * Multi-Agent Router - Phase 4A
 * TRPC endpoints for the multi-agent orchestration system.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  orchestrateCommand,
  getOrchestratorStatus,
  getProjectExecutionStatus,
  getProjectTasks,
  getQueueStats,
  getSystemHealth,
  getCommunicationStats,
  cancelTask,
  initializeOrchestrator,
} from "../agents/index";

// Initialize orchestrator on module load
initializeOrchestrator();

export const multiAgentRouter = router({
  /**
   * Execute a command through the multi-agent pipeline
   */
  execute: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        command: z.string().min(1, "الأمر مطلوب"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await orchestrateCommand({
          projectId: input.projectId,
          userId: String(ctx.user.id),
          command: input.command,
        });

        return {
          success: result.success,
          planId: result.planId,
          tasksCreated: result.tasksCreated,
          tasksCompleted: result.tasksCompleted,
          tasksFailed: result.tasksFailed,
          output: result.output,
          errors: result.errors,
          logs: result.logs,
          duration: result.duration,
          message: result.success
            ? "تم تنفيذ الأمر بنجاح"
            : "فشل تنفيذ بعض المهام",
        };
      } catch (error) {
        console.error("[MultiAgent] Execute error:", error);
        throw new Error("فشل تنفيذ الأمر عبر نظام الوكلاء");
      }
    }),

  /**
   * Get the status of the orchestrator and all agents
   */
  getStatus: protectedProcedure.query(async () => {
    try {
      return getOrchestratorStatus();
    } catch (error) {
      console.error("[MultiAgent] Get status error:", error);
      throw new Error("فشل الحصول على حالة النظام");
    }
  }),

  /**
   * Get all tasks for a project
   */
  getProjectTasks: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { tasks, stats } = getProjectExecutionStatus(input.projectId);
        return {
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            assignedAgent: t.assignedAgent,
            priority: t.priority,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            startedAt: t.startedAt,
            completedAt: t.completedAt,
            error: t.error,
            retryCount: t.retryCount,
          })),
          stats,
        };
      } catch (error) {
        console.error("[MultiAgent] Get project tasks error:", error);
        throw new Error("فشل الحصول على مهام المشروع");
      }
    }),

  /**
   * Cancel a specific task
   */
  cancelTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        cancelTask(input.taskId, input.reason);
        return {
          success: true,
          message: "تم إلغاء المهمة بنجاح",
          taskId: input.taskId,
        };
      } catch (error) {
        console.error("[MultiAgent] Cancel task error:", error);
        throw new Error("فشل إلغاء المهمة");
      }
    }),

  /**
   * Get queue statistics
   */
  getQueueStats: protectedProcedure.query(async () => {
    try {
      return getQueueStats();
    } catch (error) {
      console.error("[MultiAgent] Get queue stats error:", error);
      throw new Error("فشل الحصول على إحصائيات القائمة");
    }
  }),

  /**
   * Get system health
   */
  getSystemHealth: protectedProcedure.query(async () => {
    try {
      return {
        ...getSystemHealth(),
        ...getCommunicationStats(),
      };
    } catch (error) {
      console.error("[MultiAgent] Get system health error:", error);
      throw new Error("فشل الحصول على صحة النظام");
    }
  }),
});
