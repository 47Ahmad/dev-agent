import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { executeAICommand } from '../services/aiExecutionEngine';
import { getProjectFilesList, getProjectContext, saveProjectContext } from '../db';
import { debugProject, generateDebugReport } from '../services/autoDebugger';
import { loadProjectMemory, saveMemory, analyzeProjectStructure, createProjectSummary, addChangeLog, getContextSummaryForAI } from '../services/projectContextMemory';

/**
 * AI Execution Router
 * Handles AI-powered project modifications, debugging, and context management.
 */
export const aiExecutionRouter = router({
  /**
   * Execute an AI command to modify the project.
   */
  executeCommand: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'معرف المشروع مطلوب'),
        command: z.string().min(1, 'الأمر مطلوب'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await executeAICommand(input.projectId, ctx.user.id.toString(), input.command);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          message: `فشل تنفيذ الأمر: ${errorMessage.substring(0, 100)}`,
          errors: [errorMessage],
        };
      }
    }),

  /**
   * Debug the project and detect errors.
   */
  debugProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'معرف المشروع مطلوب'),
        buildOutput: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const files = await getProjectFilesList(input.projectId);
        const projectFiles: Record<string, string> = {};
        for (const file of files) {
          projectFiles[file.path] = file.content || '';
        }

        const debugResult = await debugProject(projectFiles, input.buildOutput);
        const report = generateDebugReport(debugResult);

        return {
          success: debugResult.success,
          report,
          debugResult,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          message: `فشل التصحيح: ${errorMessage.substring(0, 100)}`,
          errors: [errorMessage],
        };
      }
    }),

  /**
   * Get project context and memory.
   */
  getProjectContext: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const context = await getProjectContext(input.projectId);
        if (!context) {
          return {
            success: false,
            message: 'سياق المشروع غير متاح',
          };
        }
        return {
          success: true,
          context,
        };
      } catch (error) {
        console.error('[aiExecutionRouter] Error getting project context:', error);
        return {
          success: false,
          message: 'فشل في الحصول على سياق المشروع',
        };
      }
    }),

  /**
   * Update project memory and context.
   */
  updateProjectMemory: protectedProcedure
    .input(z.object({ projectId: z.string(), description: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const files = await getProjectFilesList(input.projectId);
        const projectFiles: Record<string, string> = {};
        for (const file of files) {
          projectFiles[file.path] = file.content || '';
        }

        const structure = analyzeProjectStructure(projectFiles);
        const summary = createProjectSummary(projectFiles);

        const memory = await loadProjectMemory(input.projectId);
        const updatedMemory = memory || {
          projectId: input.projectId,
          summary,
          structure,
          goals: [],
          lastChanges: [],
          dependencies: [],
          technologies: [],
          keyFiles: [],
          updatedAt: new Date(),
        };

        const newMemory = addChangeLog(updatedMemory, input.description, [], 'feature');
        await saveMemory(newMemory);

        return {
          success: true,
          message: 'تم تحديث سياق المشروع بنجاح',
          contextSummary: getContextSummaryForAI(newMemory),
        };
      } catch (error) {
        console.error('[aiExecutionRouter] Error updating project memory:', error);
        return {
          success: false,
          message: 'فشل في تحديث سياق المشروع',
        };
      }
    }),
});
