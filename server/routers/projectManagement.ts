import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
// import { projects } from "../drizzle/schema"; // TODO: uncomment when schema is available

const createProjectInput = z.object({
  name: z.string().min(1, "اسم المشروع مطلوب"),
  description: z.string().optional(),
  template: z.string().optional(),
  language: z.enum(["ar", "en"]).default("ar"),
});

const updateProjectInput = z.object({
  projectId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

const deleteProjectInput = z.object({
  projectId: z.string(),
});

export const projectManagementRouter = router({
  createProject: protectedProcedure
    .input(createProjectInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // TODO: Create project in database
        // const project = await db.insert(projects).values({
        //   userId: ctx.user.id,
        //   name: input.name,
        //   description: input.description,
        //   template: input.template,
        //   status: 'draft',
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // });

        return {
          projectId: "proj_" + Date.now(),
          name: input.name,
          description: input.description,
          status: "draft",
          createdAt: new Date(),
          message: "تم إنشاء المشروع بنجاح",
        };
      } catch (error) {
        console.error("Create project error:", error);
        throw new Error("فشل إنشاء المشروع");
      }
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // TODO: Fetch projects from database
      // const userProjects = await db
      //   .select()
      //   .from(projects)
      //   .where(eq(projects.userId, ctx.user.id));

      return [
        {
          projectId: "proj_1",
          name: "متجر إلكتروني",
          description: "متجر إلكتروني متكامل",
          status: "active",
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
          files: 45,
          deployments: 3,
        },
        {
          projectId: "proj_2",
          name: "لوحة تحكم تحليلية",
          description: "لوحة تحكم متقدمة",
          status: "draft",
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 3600000),
          files: 28,
          deployments: 0,
        },
      ];
    } catch (error) {
      console.error("Get projects error:", error);
      throw new Error("فشل الحصول على المشاريع");
    }
  }),

  getProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Fetch project from database
        // const project = await db
        //   .select()
        //   .from(projects)
        //   .where(eq(projects.id, input.projectId))
        //   .limit(1);
        // if (!project || project.userId !== ctx.user.id) {
        //   throw new Error("Unauthorized");
        // }

        return {
          projectId: input.projectId,
          name: "متجر إلكتروني",
          description: "متجر إلكتروني متكامل",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          files: 45,
          deployments: 3,
        };
      } catch (error) {
        console.error("Get project error:", error);
        throw new Error("فشل الحصول على المشروع");
      }
    }),

  updateProject: protectedProcedure
    .input(updateProjectInput)
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Update project in database
        // const project = await db
        //   .select()
        //   .from(projects)
        //   .where(eq(projects.id, input.projectId))
        //   .limit(1);
        // if (!project || project.userId !== ctx.user.id) {
        //   throw new Error("Unauthorized");
        // }
        // await db.update(projects).set({
        //   name: input.name || project.name,
        //   description: input.description || project.description,
        //   updatedAt: new Date(),
        // });

        return {
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          message: "تم تحديث المشروع بنجاح",
        };
      } catch (error) {
        console.error("Update project error:", error);
        throw new Error("فشل تحديث المشروع");
      }
    }),

  deleteProject: protectedProcedure
    .input(deleteProjectInput)
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Delete project from database
        // const project = await db
        //   .select()
        //   .from(projects)
        //   .where(eq(projects.id, input.projectId))
        //   .limit(1);
        // if (!project || project.userId !== ctx.user.id) {
        //   throw new Error("Unauthorized");
        // }
        // await db.delete(projects).where(eq(projects.id, input.projectId));

        return {
          projectId: input.projectId,
          message: "تم حذف المشروع بنجاح",
        };
      } catch (error) {
        console.error("Delete project error:", error);
        throw new Error("فشل حذف المشروع");
      }
    }),

  duplicateProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Duplicate project in database
        // const project = await db
        //   .select()
        //   .from(projects)
        //   .where(eq(projects.id, input.projectId))
        //   .limit(1);
        // if (!project || project.userId !== ctx.user.id) {
        //   throw new Error("Unauthorized");
        // }
        // const newProject = await db.insert(projects).values({
        //   userId: ctx.user.id,
        //   name: `${project.name} (نسخة)`,
        //   description: project.description,
        //   template: project.template,
        //   status: 'draft',
        // });

        return {
          projectId: "proj_" + Date.now(),
          name: "متجر إلكتروني (نسخة)",
          message: "تم نسخ المشروع بنجاح",
        };
      } catch (error) {
        console.error("Duplicate project error:", error);
        throw new Error("فشل نسخ المشروع");
      }
    }),

  searchProjects: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Search projects in database
        // const results = await db
        //   .select()
        //   .from(projects)
        //   .where(
        //     and(
        //       eq(projects.userId, ctx.user.id),
        //       or(
        //         like(projects.name, `%${input.query}%`),
        //         like(projects.description, `%${input.query}%`)
        //       )
        //     )
        //   );

        return [
          {
            projectId: "proj_1",
            name: "متجر إلكتروني",
            description: "متجر إلكتروني متكامل",
            status: "active",
          },
        ];
      } catch (error) {
        console.error("Search projects error:", error);
        throw new Error("فشل البحث عن المشاريع");
      }
    }),
});
