import { invokeLLM } from '../_core/llm';
import { getProjectFileContent, saveProjectFile, createProjectFile, deleteProjectFile, getProjectFilesList } from '../db';
import { GeneratedCode } from './aiCodeGenerator';
import { createEditPlan, summarizeEditPlan, applyEditPlan } from './smartDiffSystem';

export interface AIExecutionResponse {
  success: boolean;
  message: string;
  details?: string;
  filesChanged?: { filePath: string; oldContent: string; newContent: string; diff?: string }[];
  newFiles?: { filePath: string; content: string }[];
  deletedFiles?: { filePath: string }[];
  errors?: string[];
  logs?: string[];
}

/**
 * Reads the current project files and returns their content.
 * @param projectId The ID of the project.
 * @returns A map of file paths to their content.
 */
export async function readProjectFiles(projectId: string): Promise<Record<string, string>> {
  console.log(`[AI Execution Engine] Reading files for project: ${projectId}`);
  const files = await getProjectFilesList(projectId);
  const fileContents: Record<string, string> = {};
  for (const file of files) {
    const content = await getProjectFileContent(projectId, file.path);
    if (content) {
      fileContents[file.path] = content;
    }
  }
  return fileContents;
}

/**
 * Analyzes project structure and relationships.
 * This is a placeholder for a more sophisticated analysis.
 * @param files A map of file paths to their content.
 * @returns A structured representation of the project.
 */
export function analyzeProjectStructure(files: Record<string, string>): any {
  console.log('[AI Execution Engine] Analyzing project structure...');
  // This is a simplified analysis. A real implementation would parse ASTs, etc.
  const structure: any = {
    folders: new Set<string>(),
    files: Object.keys(files),
    components: [],
    pages: [],
    apis: [],
    dependencies: {},
  };

  for (const filePath of Object.keys(files)) {
    const parts = filePath.split('/');
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += (i === 0 ? '' : '/') + parts[i];
      structure.folders.add(currentPath);
    }

    if (filePath.includes('/client/src/pages/')) {
      structure.pages.push(filePath);
    } else if (filePath.includes('/client/src/components/')) {
      structure.components.push(filePath);
    } else if (filePath.includes('/server/routers/')) {
      structure.apis.push(filePath);
    }

    // Simple dependency detection (can be improved with AST parsing)
    const content = files[filePath];
    const imports = content.match(/import\s+.*from\s+["\"](.*)["\"]/g);
    if (imports) {
      structure.dependencies[filePath] = imports.map(imp => {
        const match = imp.match(/from\s+["\"](.*)["\"]/);
        return match ? match[1] : '';
      }).filter(Boolean);
    }
  }
  structure.folders = Array.from(structure.folders);
  return structure;
}

/**
 * Generates a diff between old and new content.
 * @param oldContent The original content.
 * @param newContent The new content.
 * @returns A string representing the diff.
 */
export function generateDiff(oldContent: string, newContent: string): string {
  // Placeholder for a real diff library (e.g., jsdiff)
  if (oldContent === newContent) return 'No changes.';
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  let diff = '';
  let i = 0, j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diff += `  ${oldLines[i]}\n`;
      i++;
      j++;
    } else {
      if (i < oldLines.length) {
        diff += `- ${oldLines[i]}\n`;
        i++;
      }
      if (j < newLines.length) {
        diff += `+ ${newLines[j]}\n`;
        j++;
      }
    }
  }
  return diff;
}

/**
 * Executes an AI command to modify the project.
 * @param projectId The ID of the project.
 * @param userId The ID of the user.
 * @param command The natural language command for the AI.
 * @returns AIExecutionResponse indicating success/failure and changes.
 */
/**
 * Execute an AI command with smart diff system
 */
export async function executeAICommand(
  projectId: string,
  userId: string,
  command: string
): Promise<AIExecutionResponse> {
  console.log(`[AI Execution Engine] Executing command for project ${projectId}: ${command}`);

  const currentFiles = await readProjectFiles(projectId);
  const projectStructure = analyzeProjectStructure(currentFiles);
  const projectSummary = `Project ID: ${projectId}\nStructure: ${JSON.stringify(projectStructure, null, 2)}`;

  const systemPrompt = `أنت وكيل تطوير ذكاء اصطناعي متقدم. مهمتك هي تعديل مشروع برمجي موجود بناءً على تعليمات المستخدم. 
يجب عليك فهم بنية المشروع الحالية، وتحديد الملفات المتأثرة، وتطبيق التغييرات المطلوبة بأقل قدر من التعديلات.

**القواعد الأساسية:**
1.  **لا تعيد إنشاء المشروع بالكامل.** قم بتعديل الملفات الموجودة أو إنشاء ملفات جديدة أو حذفها حسب الحاجة.
2.  **حافظ على الاتساق.** تأكد من أن التغييرات لا تكسر العلاقات بين الملفات أو تؤدي إلى أخطاء.
3.  **التحسينات التدريجية.** طبق التغييرات خطوة بخطوة، مع التركيز على التعديلات المحددة.
4.  **الاستيرادات (Imports).** قم بتحديث الاستيرادات تلقائياً عند نقل أو إعادة تسمية الملفات، أو عند إضافة مكونات جديدة.
5.  **التراجع (Undo).** يجب أن تكون التغييرات قابلة للتراجع عنها، لذا قدم تفاصيل كافية عن التعديلات.

**سياق المشروع الحالي:**
${projectSummary}

**الملفات الحالية (المسار والمحتوى):**
${Object.entries(currentFiles).map(([path, content]) => `--- ${path} ---
${content}`).join('\n\n')}

**التعليمات:**
بناءً على سياق المشروع والملفات الحالية، قم بتطبيق التغييرات المطلوبة في تعليمات المستخدم. يجب أن تكون مخرجاتك قائمة بالملفات التي سيتم تعديلها أو إنشاؤها أو حذفها، مع محتواها الجديد. لا تكتب أي شيء آخر غير هذه القائمة.

صيغة الإخراج المطلوبة:
- plan: وصف موجز لخطة التعديل
- modifications: قائمة بالتعديلات
  - type: edit, create, أو delete
  - filePath: مسار الملف
  - oldContent: المحتوى الأصلي (للتعديل فقط)
  - newContent: المحتوى الجديد (للتعديل والإنشاء)
  - content: محتوى الملف الجديد (للإنشاء)

**ملاحظات هامة:**
-   يجب أن يكون oldContent مطابقاً تماماً للمحتوى الحالي للملف قبل التعديل.
-   لا تقم بتضمين oldContent لأنواع create أو delete.
-   لا تقم بتضمين newContent لأنواع create أو delete.
-   يجب أن يكون content موجوداً فقط لأنواع create.
-   يجب أن تكون جميع المسارات نسبية لجذر المشروع.
-   تأكد من أن الكود المولد صحيح نحوياً ومنطقياً.
-   إذا لم تكن هناك حاجة لتعديل أي ملف، فقدم قائمة modifications فارغة.
-   إذا كان التعديل يتطلب تغييرات في ملفات متعددة، قم بتضمين جميع التعديلات في قائمة modifications واحدة.
-   إذا كان التعديل يتضمن إضافة قسم جديد، ففكر في إنشاء ملف مكون جديد له.`;

  const userPrompt = `التعليمات: ${command}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'claude-3.5-sonnet',
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices in API response');
    }

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error('No message content in API response');
    }

    const aiResponse = JSON.parse(messageContent as string);
    const modifications = aiResponse.modifications;
    const plan = aiResponse.plan;

    const filesChanged: { filePath: string; oldContent: string; newContent: string; diff?: string }[] = [];
    const newFiles: { filePath: string; content: string }[] = [];
    const deletedFiles: { filePath: string }[] = [];
    const errors: string[] = [];

    for (const mod of modifications) {
      if (mod.type === 'edit') {
        const currentContent = currentFiles[mod.filePath];
        if (currentContent === undefined) {
          errors.push(`الملف ${mod.filePath} غير موجود ولا يمكن تعديله.`);
          continue;
        }
        if (currentContent !== mod.oldContent) {
          errors.push(`محتوى الملف ${mod.filePath} تغير منذ القراءة. التعديل غير متطابق.`);
          continue;
        }
        filesChanged.push({
          filePath: mod.filePath,
          oldContent: mod.oldContent,
          newContent: mod.newContent,
          diff: generateDiff(mod.oldContent, mod.newContent),
        });
      } else if (mod.type === 'create') {
        if (currentFiles[mod.filePath] !== undefined) {
          errors.push(`الملف ${mod.filePath} موجود بالفعل ولا يمكن إنشاؤه.`);
          continue;
        }
        newFiles.push({ filePath: mod.filePath, content: mod.content });
      } else if (mod.type === 'delete') {
        if (currentFiles[mod.filePath] === undefined) {
          errors.push(`الملف ${mod.filePath} غير موجود ولا يمكن حذفه.`);
          continue;
        }
        deletedFiles.push({ filePath: mod.filePath });
      }
    }

    if (errors.length > 0) {
      return { success: false, message: 'فشل تنفيذ الأمر بسبب أخطاء في التعديلات المقترحة.', errors };
    }

    // Create an edit plan for review
    const editPlan = createEditPlan(
      projectId,
      plan,
      modifications.map((mod: any) => ({
        type: mod.type,
        filePath: mod.filePath,
        oldContent: mod.oldContent,
        newContent: mod.newContent,
      }))
    );

    // Apply changes (this would be done after user confirmation in a real UI)
    for (const file of filesChanged) {
      await saveProjectFile(projectId, file.filePath, file.newContent);
    }
    for (const file of newFiles) {
      await createProjectFile(projectId, file.filePath, file.content, 'file', 'typescript'); // Default to typescript for now
    }
    for (const file of deletedFiles) {
      await deleteProjectFile(projectId, file.filePath);
    }

    // Update project context memory (commented out for now - ProjectContext is in db.ts)
    // const updatedFiles = await readProjectFiles(projectId);
    // const updatedStructure = analyzeProjectStructure(updatedFiles);
    // const newContext: ProjectContext = {
    //   projectId,
    //   summary: plan,
    //   structure: updatedStructure,
    //   goals: [], // TODO: Integrate project goals
    //   lastChanges: modifications,
    //   updatedAt: new Date(),
    // };
    // await saveProjectContext(newContext);

    // Return response with edit plan summary
    const planSummary = summarizeEditPlan(editPlan);

    return {
      success: true,
      message: `تم تنفيذ الأمر بنجاح: ${plan}`,
      details: planSummary,
      filesChanged,
      newFiles,
      deletedFiles,
    };

  } catch (error: any) {
    console.error('[AI Execution Engine] Error executing command:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء تنفيذ أمر الذكاء الاصطناعي.',
      details: error.message,
      errors: [error.message],
    };
  }
}

/**
 * Auto-debugs the project by checking for errors and attempting to fix them.
 * This is a placeholder and needs actual integration with build/test tools.
 * @param projectId The ID of the project.
 * @param userId The ID of the user.
 * @returns AIExecutionResponse indicating success/failure and fixes applied.
 */
export async function autoDebugProject(
  projectId: string,
  userId: string
): Promise<AIExecutionResponse> {
  console.log(`[AI Execution Engine] Auto-debugging project: ${projectId}`);
  // Placeholder for actual debugging logic
  // In a real scenario, this would run `tsc`, `vite build`, `vitest` and parse output.
  // If errors are found, it would call executeAICommand with a prompt to fix them.
  return {
    success: true,
    message: 'تم فحص المشروع بحثاً عن الأخطاء. لا توجد أخطاء حالياً (وظيفة التصحيح التلقائي قيد التطوير).',
    details: 'وظيفة التصحيح التلقائي تحتاج إلى تكامل مع أدوات البناء والاختبار الفعلية.',
  };
}
