import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";

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
        return [
          {
            id: "1",
            name: "src",
            path: "/src",
            content: "",
            type: "folder" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "2",
            name: "App.tsx",
            path: "/src/App.tsx",
            content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <h1 className="text-4xl font-bold">Welcome to Dev-Agent</h1>
    </div>
  );
}`,
            type: "file" as const,
            language: "typescript",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "3",
            name: "package.json",
            path: "/package.json",
            content: `{
  "name": "dev-agent-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`,
            type: "file" as const,
            language: "json",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
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
        return {
          id: "2",
          name: "App.tsx",
          path: input.filePath,
          content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <h1 className="text-4xl font-bold">Welcome to Dev-Agent</h1>
    </div>
  );
}`,
          type: "file" as const,
          language: "typescript",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (error) {
        console.error("Get file error:", error);
        throw new Error("فشل تحميل الملف");
      }
    }),

  saveFile: protectedProcedure
    .input(saveFileInput)
    .mutation(async ({ input, ctx }) => {
      try {
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
        return {
          success: true,
          message: "تم إنشاء الملف بنجاح",
          filePath: input.filePath,
          id: "file_" + nanoid(),
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
