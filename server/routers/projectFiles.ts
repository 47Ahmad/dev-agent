import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

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

        // TODO: Fetch project files from database
        // const files = await db
        //   .select()
        //   .from(projectFiles)
        //   .where(
        //     and(
        //       eq(projectFiles.projectId, input.projectId),
        //       eq(projectFiles.userId, ctx.user.id)
        //     )
        //   );

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
        // TODO: Fetch specific file from database
        // const file = await db
        //   .select()
        //   .from(projectFiles)
        //   .where(
        //     and(
        //       eq(projectFiles.projectId, input.projectId),
        //       eq(projectFiles.filePath, input.filePath),
        //       eq(projectFiles.userId, ctx.user.id)
        //     )
        //   )
        //   .limit(1);

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
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // TODO: Save file to database
        // await db
        //   .update(projectFiles)
        //   .set({
        //     content: input.content,
        //     language: input.language,
        //     updatedAt: new Date(),
        //   })
        //   .where(
        //     and(
        //       eq(projectFiles.projectId, input.projectId),
        //       eq(projectFiles.filePath, input.filePath),
        //       eq(projectFiles.userId, ctx.user.id)
        //     )
        //   );

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

        // TODO: Create file in database
        // const file = await db.insert(projectFiles).values({
        //   projectId: input.projectId,
        //   userId: ctx.user.id,
        //   filePath: input.filePath,
        //   content: input.content,
        //   type: input.type,
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // });

        return {
          success: true,
          message: "تم إنشاء الملف بنجاح",
          filePath: input.filePath,
          id: "file_" + Date.now(),
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

        // TODO: Delete file from database
        // await db
        //   .delete(projectFiles)
        //   .where(
        //     and(
        //       eq(projectFiles.projectId, input.projectId),
        //       eq(projectFiles.filePath, input.filePath),
        //       eq(projectFiles.userId, ctx.user.id)
        //     )
        //   );

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
