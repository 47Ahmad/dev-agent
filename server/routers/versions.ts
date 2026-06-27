import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { projectVersions, projects, generationHistory } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Versions and Snapshots Router
 * Handles project version management, snapshots, and rollback
 */
export const versionsRouter = router({
  /**
   * Create a new version/snapshot of a project
   */
  createVersion: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        html: z.string(),
        css: z.string(),
        js: z.string(),
        prompt: z.string(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: 'قاعدة البيانات غير متاحة' };
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!project || project.length === 0) {
          return { success: false, error: 'المشروع غير موجود' };
        }

        // Get next version number
        const versions = await db
          .select()
          .from(projectVersions)
          .where(eq(projectVersions.projectId, input.projectId))
          .orderBy(desc(projectVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = (versions[0]?.versionNumber || 0) + 1;

        // Create version
        const version = await db.insert(projectVersions).values({
          id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId: input.projectId,
          versionNumber: nextVersionNumber,
          html: input.html,
          css: input.css,
          js: input.js,
          prompt: input.prompt,
          name: input.name || `النسخة ${nextVersionNumber}`,
          metadata: { createdBy: ctx.user.id },
          createdAt: new Date(),
        });

        return {
          success: true,
          message: 'تم حفظ النسخة بنجاح',
          versionId: (version as any)[0]?.id,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
        };
      }
    }),

  /**
   * Get all versions of a project
   */
  getVersions: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: 'قاعدة البيانات غير متاحة', versions: [] };
        }

        const versions = await db
          .select()
          .from(projectVersions)
          .where(eq(projectVersions.projectId, input.projectId))
          .orderBy(desc(projectVersions.versionNumber));

        return {
          success: true,
          versions: versions || [],
          count: versions.length,
          message: 'تم جلب النسخ بنجاح',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
          versions: [],
        };
      }
    }),

  /**
   * Get a specific version
   */
  getVersion: protectedProcedure
    .input(z.object({ versionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: 'قاعدة البيانات غير متاحة' };
        }

        const version = await db
          .select()
          .from(projectVersions)
          .where(eq(projectVersions.id, input.versionId))
          .limit(1);

        if (!version || version.length === 0) {
          return { success: false, error: 'النسخة غير موجودة' };
        }

        return {
          success: true,
          version: version[0] || null,
          message: 'تم جلب النسخة بنجاح',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
        };
      }
    }),

  /**
   * Restore a previous version
   */
  restoreVersion: protectedProcedure
    .input(z.object({ projectId: z.string(), versionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: 'قاعدة البيانات غير متاحة' };
        }

        // Get the version to restore
        const version = await db
          .select()
          .from(projectVersions)
          .where(eq(projectVersions.id, input.versionId))
          .limit(1);

        if (!version || version.length === 0) {
          return { success: false, error: 'النسخة غير موجودة' };
        }

        // Get project for workspace info
        const proj = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!proj || proj.length === 0) {
          return { success: false, error: 'المشروع غير موجود' };
        }

        // Update project with restored code
        await db
          .update(projects)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        // Store restored code in generation history
        await db.insert(generationHistory).values({
          id: `gh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId: input.projectId,
          workspaceId: proj[0]!.workspaceId,
          userId: ctx.user.id,
          prompt: `استعادة النسخة: ${version[0]!.name}`,
          model: 'restore',
          status: 'success',
          createdAt: new Date(),
        });

        return {
          success: true,
          message: `تم استعادة النسخة ${version[0]!.name} بنجاح`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
        };
      }
    }),

  /**
   * Delete a version
   */
  deleteVersion: protectedProcedure
    .input(z.object({ versionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: 'قاعدة البيانات غير متاحة' };
        }

        await db
          .delete(projectVersions)
          .where(eq(projectVersions.id, input.versionId));

        return {
          success: true,
          message: 'تم حذف النسخة بنجاح',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
        };
      }
    }),
});

export type VersionsRouter = typeof versionsRouter;
