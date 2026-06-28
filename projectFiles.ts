import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb, getProjectFilesList, getProjectFileContent, saveProjectFile, createProjectFile, deleteProjectFile } from "../db";

const getProjectFilesInput = z.object({
  projectId: z.string(),
});

const saveFileInput = z.object({
  projectId: z.string(),
  filePath: z.string(),
  content: z.string(),
  language: z.string().optional(),
});

const deleteFileInput = z.object({
  projectId: z.string(),
  filePath: z.string(),
});

const createFileInput = z.object({
  projectId: z.string(),
  filePath: z.string(),
  content: z.string().default(""),
  type: z.enum(["file", "folder"]).default("file"),
});

export const projectFilesRouter = router({
  getProjectFiles: protectedProcedure
    .input(getProjectFilesInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

                const files = await getProjectFilesList(input.projectId);
        return files;
      } catch (error) {
        console.error("Get project files error:", error);
        throw new Error("فشل تحميل ملفات المشروع");
      }
    }),

  getFile: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        filePath: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
                const fileContent = await getProjectFileContent(input.projectId, input.filePath);
        if (!fileContent) {
          throw new Error("الملف غير موجود");
        }
        return { content: fileContent, filePath: input.filePath }; // Simplified return for now
      } catch (error) {
        console.error("Get file error:", error);
        throw new Error("فشل تحميل الملف");
      }
    }),

  saveFile: protectedProcedure
    .input(saveFileInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

                await saveProjectFile(input.projectId, input.filePath, input.content);
        return {
          success: true,
          message: "تم حفظ الملف بنجاح",
          filePath: input.filePath,
          updatedAt: new Date(),
        };
      } catch (error) {
        console.error("Save file error:", error);
        throw new Error("فشل حفظ الملف");
      }
    }),

  createFile: protectedProcedure
    .input(createFileInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

                const fileId = await createProjectFile(input.projectId, input.filePath, input.content, input.type, input.filePath.split(".").pop());
        return {
          success: true,
          message: "تم إنشاء الملف بنجاح",
          filePath: input.filePath,
          id: fileId,
        };
      } catch (error) {
        console.error("Create file error:", error);
        throw new Error("فشل إنشاء الملف");
      }
    }),

  deleteFile: protectedProcedure
    .input(deleteFileInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

                await deleteProjectFile(input.projectId, input.filePath);
        return {
          success: true,
          message: "تم حذف الملف بنجاح",
          filePath: input.filePath,
        };
      } catch (error) {
        console.error("Delete file error:", error);
        throw new Error("فشل حذف الملف");
      }
    }),
});
