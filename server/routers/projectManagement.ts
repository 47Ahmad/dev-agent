import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";

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
        return {
          projectId: "proj_" + nanoid(),
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
        return {
          projectId: "proj_" + nanoid(),
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
