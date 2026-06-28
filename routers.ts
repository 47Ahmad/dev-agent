import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generationRouter } from "./routers/generation";
import { workspaceRouter } from "./routers/workspace";
import { billingRouter } from "./routers/billing";
import { versionsRouter } from "./routers/versions";
import { deploymentRouter } from "./routers/deployment";
import { projectBuilderRouter } from "./routers/projectBuilder";
import { buildPipelineRouter } from "./routers/buildPipeline";
import { projectManagementRouter } from "./routers/projectManagement";
import { projectFilesRouter } from "./routers/projectFiles";
import { aiExecutionRouter } from "./routers/aiExecution";
import { testingRouter } from "./routers/testing";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  generation: generationRouter,
  workspace: workspaceRouter,
  billing: billingRouter,
  versions: versionsRouter,
  deployment: deploymentRouter,
  projectBuilder: projectBuilderRouter,
  buildPipeline: buildPipelineRouter,
  projectManagement: projectManagementRouter,
  projectFiles: projectFilesRouter,
  aiExecution: aiExecutionRouter,
  testing: testingRouter,
});

export type AppRouter = typeof appRouter;
