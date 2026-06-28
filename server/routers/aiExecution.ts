/**
 * AI Execution Router - Phase 3B.3
 * Enhanced router with endpoints for:
 * - File-Aware AI command execution
 * - Project context management with relationship analysis
 * - Comprehensive auto-debugging
 * - Smart diff and minimal change detection
 * - File relationship analysis
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { executeAICommand, autoDebugProject, readProjectFiles } from '../services/aiExecutionEngine';
import { getProjectFilesList, getProjectContext } from '../db';
import {
  debugProject,
  generateDebugReport,
  validateFixesWithTests,
} from '../services/autoDebugger';
import {
  loadProjectMemory,
  saveMemory,
  analyzeProjectStructure,
  createProjectSummary,
  addChangeLog,
  getContextSummaryForAI,
  createOrUpdateProjectMemory,
  getFilesAffectedByChange,
} from '../services/projectContextMemory';
import {
  buildFileRelationshipGraph,
  summarizeFileGraph,
  findAffectedFiles,
  findUnusedImports,
} from '../services/fileRelationshipAnalyzer';
import {
  createEditPlan,
  summarizeEditPlan,
  generateSmartDiff,
  findMinimalChanges,
} from '../services/smartDiffSystem';

/**
 * AI Execution Router
 * Handles AI-powered project modifications, debugging, and context management.
 */
export const aiExecutionRouter = router({
  /**
   * Execute an AI command to modify the project with full file-awareness.
   * Phase 3B.3: Enhanced with relationship graph and minimal change strategy.
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
        const result = await executeAICommand(
          input.projectId,
          ctx.user.id.toString(),
          input.command
        );

        // Update project memory after successful execution
        if (result.success) {
          try {
            const filesChanged = result.filesChanged?.map(f => f.filePath) || [];
            const newFiles = result.newFiles?.map(f => f.filePath) || [];
            const deletedFiles = result.deletedFiles?.map(f => f.filePath) || [];
            const allAffected = [...filesChanged, ...newFiles, ...deletedFiles];

            await createOrUpdateProjectMemory(
              input.projectId,
              {},
              `تنفيذ أمر: ${input.command.substring(0, 100)}`
            );
          } catch (memError) {
            console.warn('[aiExecutionRouter] Failed to update memory:', memError);
          }
        }

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
   * Debug the project and detect errors with auto-fix capability.
   * Phase 3B.3: Enhanced with AI-powered fixes and validation.
   */
  debugProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'معرف المشروع مطلوب'),
        buildOutput: z.string().optional(),
        useAI: z.boolean().optional().default(false),
        validateFixes: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const files = await getProjectFilesList(input.projectId);
        const projectFiles: Record<string, string> = {};
        for (const file of files) {
          projectFiles[file.path] = file.content || '';
        }

        const debugResult = await debugProject(
          projectFiles,
          input.buildOutput,
          input.useAI
        );

        const report = generateDebugReport(debugResult);

        // Validate fixes if requested
        let validationResult = null;
        if (input.validateFixes && debugResult.fixedFiles) {
          validationResult = await validateFixesWithTests(projectFiles, debugResult.fixedFiles);
        }

        return {
          success: debugResult.success,
          report,
          debugResult,
          validation: validationResult,
          fixedCount: debugResult.fixedCount,
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
   * Auto-debug the project using AI.
   * Phase 3B.3: Full auto-debug with fix and validate cycle.
   */
  autoDebug: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'معرف المشروع مطلوب'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await autoDebugProject(input.projectId, ctx.user.id.toString());
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          message: `فشل التصحيح التلقائي: ${errorMessage.substring(0, 100)}`,
          errors: [errorMessage],
        };
      }
    }),

  /**
   * Analyze file relationships in the project.
   * Phase 3B.3: New endpoint for deep file relationship analysis.
   */
  analyzeFileRelationships: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'معرف المشروع مطلوب'),
      })
    )
    .query(async ({ input }) => {
      try {
        const files = await getProjectFilesList(input.projectId);
        const projectFiles: Record<string, string> = {};
        for (const file of files) {
          projectFiles[file.path] = file.content || '';
        }

        const graph = buildFileRelationshipGraph(projectFiles);
        const summary = summarizeFileGraph(graph);

        return {
          success: true,
          summary,
          stats: {
            totalFiles: graph.nodes.size,
            entryPoints: graph.entryPoints,
            criticalFiles: graph.criticalFiles,
            orphanFiles: graph.orphanFiles,
            circularDependencies: graph.circularDependencies,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          message: `فشل تحليل العلاقات: ${errorMessage.substring(0, 100)}`,
        };
      }
    }),

  /**
   * Find files affected by a change to a specific file.
   * Phase 3B.3: New endpoint for impact analysis.
   */
  findAffectedFiles: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'معرف المشروع مطلوب'),
        changedFilePath: z.string().min(1, 'مسار الملف مطلوب'),
      })
    )
    .query(async ({ input }) => {
      try {
        const files = await getProjectFilesList(input.projectId);
        const projectFiles: Record<string, string> = {};
        for (const file of files) {
          projectFiles[file.path] = file.content || '';
        }

        const graph = buildFileRelationshipGraph(projectFiles);
        const affected = findAffectedFiles(input.changedFilePath, graph);

        return {
          success: true,
          changedFile: input.changedFilePath,
          affectedFiles: affected,
          count: affected.length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          message: `فشل تحليل التأثير: ${errorMessage.substring(0, 100)}`,
        };
      }
    }),

  /**
   * Generate a smart diff between two file contents.
   * Phase 3B.3: New endpoint for diff generation.
   */
  generateDiff: protectedProcedure
    .input(
      z.object({
        oldContent: z.string(),
        newContent: z.string(),
        filePath: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const diff = generateSmartDiff(input.oldContent, input.newContent);
        const { blocks, minimized } = findMinimalChanges(input.oldContent, input.newContent);

        return {
          success: true,
          diff,
          blocks,
          minimized,
          blocksCount: blocks.length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          message: `فشل إنشاء الـ diff: ${errorMessage.substring(0, 100)}`,
        };
      }
    }),

  /**
   * Find unused imports in project files.
   * Phase 3B.3: New endpoint for code cleanup.
   */
  findUnusedImports: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, 'معرف المشروع مطلوب'),
      })
    )
    .query(async ({ input }) => {
      try {
        const files = await getProjectFilesList(input.projectId);
        const unusedByFile: Record<string, string[]> = {};

        for (const file of files) {
          if (!file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) continue;
          const content = file.content || '';
          const unused = findUnusedImports(content, file.path);
          if (unused.length > 0) {
            unusedByFile[file.path] = unused.map(u => `${u.symbols.join(', ')} from ${u.source}`);
          }
        }

        return {
          success: true,
          unusedByFile,
          totalFiles: Object.keys(unusedByFile).length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          message: `فشل البحث عن الاستيرادات غير المستخدمة: ${errorMessage.substring(0, 100)}`,
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
   * Phase 3B.3: Enhanced with file relationship data.
   */
  updateProjectMemory: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const files = await getProjectFilesList(input.projectId);
        const projectFiles: Record<string, string> = {};
        for (const file of files) {
          projectFiles[file.path] = file.content || '';
        }

        const memory = await createOrUpdateProjectMemory(
          input.projectId,
          projectFiles,
          input.description
        );

        return {
          success: true,
          message: 'تم تحديث سياق المشروع بنجاح',
          contextSummary: getContextSummaryForAI(memory),
          fileRelationships: memory.fileRelationships,
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
