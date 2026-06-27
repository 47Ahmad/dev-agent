import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

const generateProjectInput = z.object({
  description: z.string().min(10, "الوصف يجب أن يكون على الأقل 10 أحرف"),
  language: z.enum(["ar", "en"]).default("ar"),
});

export const projectBuilderRouter = router({
  generateProject: protectedProcedure
    .input(generateProjectInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const systemPrompt = input.language === "ar" 
          ? "أنت مساعد متخصص في تصميم معمارية المشاريع البرمجية. قم بتحليل متطلبات المستخدم وإنشاء هيكل مشروع شامل يتضمن الهيكل والمجلدات والمكونات والصفحات والـ APIs وقاعدة البيانات والتقنيات المقترحة."
          : "You are an expert in software project architecture. Analyze the user's requirements and create a comprehensive project structure including folders, components, pages, APIs, database schema, and suggested technologies.";

        const messages = [
          {
            role: "system" as const,
            content: systemPrompt,
          },
          {
            role: "user" as const,
            content: input.description,
          },
        ];

        const result = await invokeLLM({
          messages,
          outputSchema: {
            name: "ProjectStructure",
            schema: {
              type: "object",
              properties: {
                projectName: { type: "string" },
                description: { type: "string" },
                structure: {
                  type: "object",
                  properties: {
                    folders: { type: "array", items: { type: "string" } },
                    components: { type: "array", items: { type: "string" } },
                    pages: { type: "array", items: { type: "string" } },
                    apis: { type: "array", items: { type: "string" } },
                  },
                },
                database: {
                  type: "object",
                  properties: {
                    tables: { type: "array", items: { type: "string" } },
                    relationships: { type: "array", items: { type: "string" } },
                  },
                },
                technologies: { type: "array", items: { type: "string" } },
              },
            },
          },
        });

        // Parse the response
        const responseContent = result.choices[0]?.message.content;
        const parsedResult = typeof responseContent === "string" 
          ? JSON.parse(responseContent)
          : responseContent;

        // TODO: Save generation to database
        // await db.recordGeneration({
        //   userId: ctx.user.id,
        //   description: input.description,
        //   result: parsedResult,
        //   language: input.language,
        // });

        return parsedResult;
      } catch (error) {
        console.error("Project generation error:", error);
        throw new Error("فشل توليد المشروع. يرجى المحاولة مرة أخرى.");
      }
    }),

  getGenerationHistory: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Fetch user's generation history from database
    // return await db.getGenerationHistory(ctx.user.id);
    return [];
  }),

  restoreGeneration: protectedProcedure
    .input(z.object({ generationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Restore a previous generation
      // const generation = await db.getGeneration(input.generationId);
      // if (generation?.userId !== ctx.user.id) {
      //   throw new Error("Unauthorized");
      // }
      // return generation.result;
      return null;
    }),
});
