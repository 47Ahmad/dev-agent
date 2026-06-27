import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { generateWebsiteCode, refineWebsiteCode } from '../services/aiCodeGenerator';
import type { GeneratedCode } from '../services/aiCodeGenerator';

/**
 * Generation Router
 * Handles AI-powered website code generation and refinement.
 */
export const generationRouter = router({
  /**
   * Generate a new website from a natural language prompt.
   * Uses publicProcedure so the dashboard works even before full auth is wired.
   * Switch to protectedProcedure once auth is enforced end-to-end.
   */
  generateWebsite: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1, 'الوصف مطلوب'),
        projectId: z.string().optional().default('temp-project'),
        userId: z.string().optional().default('anonymous'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await generateWebsiteCode({
          prompt: input.prompt,
          projectId: input.projectId,
          userId: input.userId,
        });

        return {
          success: result.success,
          code: result.code,
          error: result.error,
          message: result.message,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          code: undefined,
          error: errorMessage,
          message: `حدث خطأ أثناء التوليد: ${errorMessage.substring(0, 100)}`,
        };
      }
    }),

  /**
   * Refine existing website code based on user feedback.
   */
  refineWebsite: publicProcedure
    .input(
      z.object({
        currentCode: z.object({
          html: z.string(),
          css: z.string(),
          js: z.string(),
          metadata: z.object({
            title: z.string(),
            description: z.string(),
            generatedAt: z.coerce.date(),
            model: z.string(),
          }),
        }),
        feedback: z.string().min(1, 'ملاحظات التحسين مطلوبة'),
        userId: z.string().optional().default('anonymous'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await refineWebsiteCode(
          input.currentCode as GeneratedCode,
          input.feedback,
          input.userId
        );

        return {
          success: result.success,
          code: result.code,
          error: result.error,
          message: result.message,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
        return {
          success: false,
          code: undefined,
          error: errorMessage,
          message: `حدث خطأ أثناء التحسين: ${errorMessage.substring(0, 100)}`,
        };
      }
    }),

  /**
   * Get generation history for a workspace (protected).
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        // Dynamic import to avoid circular deps
        const { getGenerationHistory } = await import('../db');
        const history = await getGenerationHistory(input.workspaceId, input.limit);
        return {
          success: true,
          history,
          message: 'تم جلب السجل بنجاح',
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
