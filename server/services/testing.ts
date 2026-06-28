import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { runStressTest, generateStressTestReport } from '../services/stressTestingSystem';
import { runValidationPipeline, generateValidationReport } from '../services/validationPipeline';
import { detectAllErrors, automaticallyCorrectErrors, generateErrorReport } from '../services/automaticErrorCorrection';

/**
 * Testing Router
 * Handles validation, error correction, and stress testing
 */
export const testingRouter = router({
  /**
   * Run stress test on all project templates
   */
  runStressTest: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('[testingRouter] Starting stress test...');
        const report = await runStressTest(ctx.user.id.toString());
        const markdown = generateStressTestReport(report);

        return {
          success: true,
          message: 'اختبار الجهد اكتمل بنجاح',
          report,
          markdown,
        };
      } catch (error) {
        console.error('[testingRouter] Error running stress test:', error);
        return {
          success: false,
          message: 'فشل اختبار الجهد',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Validate a project
   */
  validateProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        projectFiles: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await runValidationPipeline(input.projectName, input.projectFiles);
        const markdown = generateValidationReport(result);

        return {
          success: true,
          message: 'التحقق من المشروع اكتمل',
          result,
          markdown,
        };
      } catch (error) {
        console.error('[testingRouter] Error validating project:', error);
        return {
          success: false,
          message: 'فشل التحقق من المشروع',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Detect errors in project files
   */
  detectErrors: protectedProcedure
    .input(
      z.object({
        projectFiles: z.record(z.string(), z.string()),
        packageJson: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const errorDetection = detectAllErrors(input.projectFiles, input.packageJson || '{}');
        const report = generateErrorReport(errorDetection);

        return {
          success: true,
          message: 'كشف الأخطاء اكتمل',
          errorDetection,
          report,
        };
      } catch (error) {
        console.error('[testingRouter] Error detecting errors:', error);
        return {
          success: false,
          message: 'فشل كشف الأخطاء',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Automatically correct errors
   */
  correctErrors: protectedProcedure
    .input(
      z.object({
        projectFiles: z.record(z.string(), z.string()),
        packageJson: z.string().optional(),
        maxAttempts: z.number().optional().default(3),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const errorDetection = detectAllErrors(input.projectFiles, input.packageJson || '{}');

        if (errorDetection.errors.length === 0) {
          return {
            success: true,
            message: 'لا توجد أخطاء للتصحيح',
            correctionResult: {
              success: true,
              correctedCode: input.projectFiles,
              appliedFixes: [],
              remainingErrors: [],
              attempts: 0,
              maxAttemptsReached: false,
            },
          };
        }

        const correctionResult = await automaticallyCorrectErrors(
          input.projectFiles,
          errorDetection,
          input.maxAttempts
        );

        return {
          success: correctionResult.success,
          message: correctionResult.success
            ? 'تم تصحيح جميع الأخطاء'
            : `تم تصحيح ${correctionResult.appliedFixes.length} أخطاء، ${correctionResult.remainingErrors.length} أخطاء متبقية`,
          correctionResult,
        };
      } catch (error) {
        console.error('[testingRouter] Error correcting errors:', error);
        return {
          success: false,
          message: 'فشل تصحيح الأخطاء',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
});
