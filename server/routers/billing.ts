import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getWorkspace } from '../db';

/**
 * Billing and Plans Router
 * Prepared for future Stripe integration
 */
export const billingRouter = router({
  /**
   * Get current plan and usage
   */
  getPlanInfo: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      try {
        const workspace = await getWorkspace(input.workspaceId);
        if (!workspace) {
          return {
            success: false,
            error: 'المساحة غير موجودة',
          };
        }

        const planLimits = {
          free: {
            projects: 3,
            generationsPerMonth: 10,
            credits: 10,
          },
          pro: {
            projects: 50,
            generationsPerMonth: 500,
            credits: 100,
          },
          team: {
            projects: 'unlimited',
            generationsPerMonth: 'unlimited',
            credits: 1000,
          },
        };

        const limits = planLimits[workspace.plan];

        return {
          success: true,
          plan: workspace.plan,
          credits: workspace.generationCredits,
          limits,
          message: 'تم جلب معلومات الخطة',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'خطأ غير متوقع',
        };
      }
    }),

  /**
   * Upgrade plan (placeholder for Stripe integration)
   */
  upgradePlan: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        newPlan: z.enum(['pro', 'team']),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Integrate with Stripe
      return {
        success: false,
        error: 'الترقية غير متاحة حالياً',
        message: 'يرجى المحاولة لاحقاً',
      };
    }),

  /**
   * Get billing history
   */
  getBillingHistory: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async () => {
      // TODO: Fetch from billing database
      return {
        success: true,
        history: [],
        message: 'لا توجد فواتير حالياً',
      };
    }),

  /**
   * Add credits (admin only)
   */
  addCredits: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        amount: z.number().positive(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Verify admin role and update credits
      if (ctx.user.role !== 'admin') {
        return {
          success: false,
          error: 'ليس لديك صلاحيات كافية',
        };
      }

      return {
        success: true,
        message: 'تم إضافة الأرصدة بنجاح',
      };
    }),
});

export type BillingRouter = typeof billingRouter;
