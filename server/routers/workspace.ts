import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  createProject,
  getWorkspaceProjects,
  getProject,
  updateProjectStatus,
  saveProjectVersion,
  getProjectVersions,
  getProjectVersion,
  getGenerationHistory,
} from '../db';
import { nanoid } from 'nanoid';

/**
 * Workspace and Project Router
 */
export const workspaceRouter = router({
  /**
   * Create a new workspace
   */
  createWorkspace: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'اسم المساحة مطلوب'),
        plan: z.enum(['free', 'pro', 'team']).default('free'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const workspaceId = await createWorkspace(ctx.user.id, input.name, input.plan);
        return {
          success: true,
          workspaceId,
          message: 'تم إنشاء المساحة بنجاح',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل إنشاء المساحة',
        };
      }
    }),

  /**
   * Get user's workspaces
   */
  getWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    try {
      const workspaces = await getUserWorkspaces(ctx.user.id);
      return {
        success: true,
        workspaces,
        message: 'تم جلب المساحات',
      };
    } catch (error) {
      return {
        success: false,
        workspaces: [],
        error: error instanceof Error ? error.message : 'خطأ غير متوقع',
        message: 'فشل جلب المساحات',
      };
    }
  }),

  /**
   * Get workspace details
   */
  getWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      try {
        const workspace = await getWorkspace(input.workspaceId);
        if (!workspace) {
          return {
            success: false,
            error: 'المساحة غير موجودة',
            message: 'لم يتم العثور على المساحة',
          };
        }
        return {
          success: true,
          workspace,
          message: 'تم جلب تفاصيل المساحة',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل جلب تفاصيل المساحة',
        };
      }
    }),

  /**
   * Create a new project
   */
  createProject: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(1, 'اسم المشروع مطلوب'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const projectId = await createProject(input.workspaceId, input.name, input.description);
        return {
          success: true,
          projectId,
          message: 'تم إنشاء المشروع بنجاح',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل إنشاء المشروع',
        };
      }
    }),

  /**
   * Get workspace projects
   */
  getProjects: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      try {
        const projects = await getWorkspaceProjects(input.workspaceId);
        return {
          success: true,
          projects,
          message: 'تم جلب المشاريع',
        };
      } catch (error) {
        return {
          success: false,
          projects: [],
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل جلب المشاريع',
        };
      }
    }),

  /**
   * Get project details
   */
  getProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const project = await getProject(input.projectId);
        if (!project) {
          return {
            success: false,
            error: 'المشروع غير موجود',
            message: 'لم يتم العثور على المشروع',
          };
        }
        return {
          success: true,
          project,
          message: 'تم جلب تفاصيل المشروع',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل جلب تفاصيل المشروع',
        };
      }
    }),

  /**
   * Update project status
   */
  updateProjectStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        status: z.enum(['draft', 'published', 'archived']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateProjectStatus(input.projectId, input.status);
        return {
          success: true,
          message: 'تم تحديث حالة المشروع',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل تحديث حالة المشروع',
        };
      }
    }),

  /**
   * Save project version
   */
  saveVersion: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        prompt: z.string(),
        html: z.string(),
        css: z.string(),
        js: z.string(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const versionId = await saveProjectVersion(
          input.projectId,
          input.prompt,
          input.html,
          input.css,
          input.js,
          input.metadata
        );
        return {
          success: true,
          versionId,
          message: 'تم حفظ الإصدار بنجاح',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل حفظ الإصدار',
        };
      }
    }),

  /**
   * Get project versions
   */
  getVersions: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const versions = await getProjectVersions(input.projectId);
        return {
          success: true,
          versions,
          message: 'تم جلب الإصدارات',
        };
      } catch (error) {
        return {
          success: false,
          versions: [],
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل جلب الإصدارات',
        };
      }
    }),

  /**
   * Get generation history
   */
  getHistory: protectedProcedure
    .input(z.object({ workspaceId: z.string(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      try {
        const history = await getGenerationHistory(input.workspaceId, input.limit);
        return {
          success: true,
          history,
          message: 'تم جلب السجل',
        };
      } catch (error) {
        return {
          success: false,
          history: [],
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          message: 'فشل جلب السجل',
        };
      }
    }),
});

export type WorkspaceRouter = typeof workspaceRouter;
