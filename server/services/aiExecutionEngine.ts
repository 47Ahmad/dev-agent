/**
 * AI Execution Engine - Phase 3B.3
 * Enhanced engine capable of modifying existing projects instead of recreating them.
 * Features:
 * - File-Aware Editing with automatic import updates
 * - Smart context-aware modifications
 * - Minimal file change strategy
 * - Full project structure understanding
 */

import { invokeLLM } from '../_core/llm';
import { getProjectFileContent, saveProjectFile, createProjectFile, deleteProjectFile, getProjectFilesList } from '../db';
import {
  buildFileRelationshipGraph,
  findAffectedFiles,
  updateImportsForFileMove,
  findUnusedImports,
  summarizeFileGraph,
  FileRelationshipGraph,
} from './fileRelationshipAnalyzer';
import { createEditPlan, summarizeEditPlan, generateSmartDiff } from './smartDiffSystem';

export interface AIExecutionResponse {
  success: boolean;
  message: string;
  details?: string;
  filesChanged?: FileChange[];
  newFiles?: NewFile[];
  deletedFiles?: DeletedFile[];
  importUpdates?: ImportUpdate[];
  errors?: string[];
  logs?: string[];
  affectedFiles?: string[];
  executionPlan?: string;
}

export interface FileChange {
  filePath: string;
  oldContent: string;
  newContent: string;
  diff?: string;
  reason?: string;
}

export interface NewFile {
  filePath: string;
  content: string;
  reason?: string;
}

export interface DeletedFile {
  filePath: string;
  reason?: string;
}

export interface ImportUpdate {
  filePath: string;
  oldImport: string;
  newImport: string;
}

/**
 * Read all project files and return their content
 */
export async function readProjectFiles(projectId: string): Promise<Record<string, string>> {
  console.log(`[AI Execution Engine] Reading files for project: ${projectId}`);
  const files = await getProjectFilesList(projectId);
  const fileContents: Record<string, string> = {};
  for (const file of files) {
    const content = await getProjectFileContent(projectId, file.path);
    if (content !== null && content !== undefined) {
      fileContents[file.path] = content;
    }
  }
  return fileContents;
}

/**
 * Analyze project structure with deep understanding of relationships
 */
export function analyzeProjectStructure(files: Record<string, string>): any {
  const structure: any = {
    folders: new Set<string>(),
    files: Object.keys(files),
    components: [] as string[],
    pages: [] as string[],
    apis: [] as string[],
    services: [] as string[],
    utils: [] as string[],
    dependencies: {} as Record<string, string[]>,
    fileCount: Object.keys(files).length,
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
    } else if (filePath.includes('/server/services/')) {
      structure.services.push(filePath);
    } else if (filePath.includes('/lib/') || filePath.includes('/utils/')) {
      structure.utils.push(filePath);
    }

    const content = files[filePath];
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
    structure.dependencies[filePath] = importMatches
      .map((imp: string) => {
        const m = imp.match(/from\s+['"]([^'"]+)['"]/);
        return m ? m[1] : '';
      })
      .filter(Boolean);
  }

  structure.folders = Array.from(structure.folders);
  return structure;
}

/**
 * Generates a diff between old and new content (legacy support)
 */
export function generateDiff(oldContent: string, newContent: string): string {
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
 * Build a comprehensive project context for AI
 */
function buildProjectContext(
  projectId: string,
  files: Record<string, string>,
  graph: FileRelationshipGraph
): string {
  const structure = analyzeProjectStructure(files);
  const graphSummary = summarizeFileGraph(graph);

  let context = `## سياق المشروع (ID: ${projectId})\n\n`;
  context += `**إجمالي الملفات:** ${structure.fileCount}\n`;
  context += `**المكونات:** ${structure.components.length}\n`;
  context += `**الصفحات:** ${structure.pages.length}\n`;
  context += `**واجهات API:** ${structure.apis.length}\n`;
  context += `**الخدمات:** ${structure.services.length}\n\n`;
  context += graphSummary;

  context += '\n### الملفات الرئيسية:\n';
  const keyFiles = [
    ...structure.pages.slice(0, 5),
    ...structure.components.slice(0, 5),
    ...structure.apis.slice(0, 5),
  ];
  for (const file of keyFiles) {
    context += `- \`${file}\`\n`;
  }

  return context;
}

/**
 * Build the AI system prompt for file-aware editing
 */
function buildSystemPrompt(context: string, filesContent: string): string {
  return `أنت وكيل تطوير ذكاء اصطناعي متقدم متخصص في تعديل المشاريع البرمجية الموجودة.

## مبادئك الأساسية:
1. **لا تعيد إنشاء المشروع بالكامل** - قم بتعديل الملفات الموجودة فقط
2. **الحد الأدنى من التعديلات** - عدّل فقط الملفات الضرورية لتحقيق الهدف
3. **الوعي بالعلاقات** - تأكد من تحديث جميع الاستيرادات عند نقل أو إعادة تسمية الملفات
4. **الاتساق** - حافظ على نمط الكود الموجود وأسلوبه
5. **التراجع** - يجب أن تكون جميع التغييرات قابلة للتراجع

## قواعد File-Aware Editing:
- عند إنشاء ملف جديد: تأكد من إضافة استيراداته في الملفات التي تحتاجه
- عند حذف ملف: تأكد من إزالة استيراداته من جميع الملفات الأخرى
- عند نقل ملف: قم بتحديث جميع المسارات النسبية في الاستيرادات
- عند إعادة تسمية دالة/مكون: قم بتحديث جميع الاستخدامات في المشروع

## سياق المشروع:
${context}

## الملفات الحالية:
${filesContent}

## صيغة الإخراج المطلوبة (JSON فقط):
{
  "plan": "وصف موجز لخطة التعديل",
  "reasoning": "سبب اختيار هذه الملفات تحديداً",
  "modifications": [
    {
      "type": "edit|create|delete",
      "filePath": "مسار الملف",
      "oldContent": "المحتوى الأصلي (للتعديل فقط - يجب أن يكون مطابقاً تماماً)",
      "newContent": "المحتوى الجديد (للتعديل والإنشاء)",
      "reason": "سبب هذا التعديل"
    }
  ],
  "importUpdates": [
    {
      "filePath": "الملف الذي يحتاج تحديث استيراداته",
      "oldImport": "الاستيراد القديم",
      "newImport": "الاستيراد الجديد"
    }
  ],
  "affectedFiles": ["قائمة الملفات المتأثرة غير المباشرة"]
}

## ملاحظات مهمة:
- oldContent يجب أن يكون مطابقاً تماماً للمحتوى الحالي
- لا تضف oldContent لأنواع create أو delete
- جميع المسارات يجب أن تكون نسبية لجذر المشروع
- الكود يجب أن يكون صحيحاً نحوياً ومنطقياً
- إذا لم تكن هناك حاجة لتعديل، أرجع modifications فارغة`;
}

/**
 * Apply import updates to files
 */
async function applyImportUpdates(
  importUpdates: ImportUpdate[],
  files: Record<string, string>,
  projectId: string
): Promise<void> {
  for (const update of importUpdates) {
    const content = files[update.filePath];
    if (!content) continue;

    const escapedOld = update.oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOld, 'g');
    const newContent = content.replace(regex, update.newImport);

    if (newContent !== content) {
      await saveProjectFile(projectId, update.filePath, newContent);
      files[update.filePath] = newContent;
    }
  }
}

/**
 * Select the most relevant files for the given command
 */
function selectRelevantFiles(
  files: Record<string, string>,
  command: string,
  graph: FileRelationshipGraph
): Record<string, string> {
  const commandLower = command.toLowerCase();
  const relevant: Record<string, string> = {};

  const fileKeywords = Object.keys(files).filter(path => {
    const fileName = path.split('/').pop()?.toLowerCase() || '';
    const pathLower = path.toLowerCase();

    if (commandLower.includes(fileName.replace(/\.(ts|tsx|js|jsx)$/, ''))) return true;
    if (path === 'package.json' || path === 'tsconfig.json' || path === 'vite.config.ts') return true;

    const node = graph.nodes.get(path);
    if (node?.isEntryPoint) return true;

    if (commandLower.includes('component') && pathLower.includes('component')) return true;
    if (commandLower.includes('page') && pathLower.includes('page')) return true;
    if (commandLower.includes('router') && pathLower.includes('router')) return true;
    if (commandLower.includes('service') && pathLower.includes('service')) return true;
    if (commandLower.includes('api') && (pathLower.includes('router') || pathLower.includes('api'))) return true;

    return false;
  });

  const criticalFiles = graph.criticalFiles.slice(0, 5);
  const allRelevant = [...new Set([...fileKeywords, ...criticalFiles])];

  for (const path of allRelevant) {
    if (files[path]) {
      relevant[path] = files[path];
    }
  }

  if (Object.keys(relevant).length < 5) {
    for (const [path, content] of Object.entries(files)) {
      if (Object.keys(relevant).length >= 15) break;
      if (!relevant[path]) {
        relevant[path] = content;
      }
    }
  }

  return relevant;
}

/**
 * Find broken imports in the project
 */
function findBrokenImports(
  files: Record<string, string>,
  graph: FileRelationshipGraph
): Array<{ file: string; import: string }> {
  const broken: Array<{ file: string; import: string }> = [];

  for (const [filePath, node] of graph.nodes.entries()) {
    for (const imp of node.imports) {
      if (!imp.source.startsWith('.') && !imp.source.startsWith('/')) continue;
      if (!imp.resolvedPath && imp.source.startsWith('.')) {
        broken.push({ file: filePath, import: imp.source });
      }
    }
  }

  return broken;
}

/**
 * Execute an AI command with full file-awareness
 */
export async function executeAICommand(
  projectId: string,
  userId: string,
  command: string
): Promise<AIExecutionResponse> {
  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] بدء تنفيذ الأمر: ${command}`);

  try {
    // Step 1: Read all project files
    logs.push('قراءة ملفات المشروع...');
    const currentFiles = await readProjectFiles(projectId);
    logs.push(`تم قراءة ${Object.keys(currentFiles).length} ملف`);

    // Step 2: Build file relationship graph
    logs.push('تحليل علاقات الملفات...');
    const fileGraph = buildFileRelationshipGraph(currentFiles);
    logs.push(`تم بناء مخطط العلاقات: ${fileGraph.nodes.size} عقدة`);

    // Step 3: Build project context
    const projectContext = buildProjectContext(projectId, currentFiles, fileGraph);

    // Step 4: Prepare files content for AI (limit to relevant files)
    const relevantFiles = selectRelevantFiles(currentFiles, command, fileGraph);
    const filesContent = Object.entries(relevantFiles)
      .map(([path, content]) => `### ${path}\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``)
      .join('\n\n');

    // Step 5: Build system prompt
    const systemPrompt = buildSystemPrompt(projectContext, filesContent);

    // Step 6: Call AI
    logs.push('استدعاء نموذج الذكاء الاصطناعي...');
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `التعليمات: ${command}` },
      ],
      model: 'claude-3.5-sonnet',
      response_format: { type: 'json_object' },
      max_tokens: 8000,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('لا توجد استجابة من نموذج الذكاء الاصطناعي');
    }

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error('محتوى الاستجابة فارغ');
    }

    // Step 7: Parse AI response
    logs.push('تحليل استجابة الذكاء الاصطناعي...');
    const aiResponse = JSON.parse(messageContent as string);
    const { modifications = [], importUpdates = [], plan = '', affectedFiles = [] } = aiResponse;

    // Step 8: Validate and apply modifications
    const filesChanged: FileChange[] = [];
    const newFiles: NewFile[] = [];
    const deletedFiles: DeletedFile[] = [];
    const errors: string[] = [];

    for (const mod of modifications) {
      if (mod.type === 'edit') {
        const currentContent = currentFiles[mod.filePath];
        if (currentContent === undefined) {
          errors.push(`الملف ${mod.filePath} غير موجود`);
          continue;
        }

        // Use smart diff to generate minimal changes
        const diff = generateSmartDiff(currentContent, mod.newContent || '');

        filesChanged.push({
          filePath: mod.filePath,
          oldContent: currentContent,
          newContent: mod.newContent || '',
          diff,
          reason: mod.reason,
        });

        await saveProjectFile(projectId, mod.filePath, mod.newContent || '');
        currentFiles[mod.filePath] = mod.newContent || '';
        logs.push(`تم تعديل: ${mod.filePath}`);

      } else if (mod.type === 'create') {
        const content = mod.newContent || mod.content || '';
        newFiles.push({
          filePath: mod.filePath,
          content,
          reason: mod.reason,
        });

        const name = mod.filePath.split('/').pop() || mod.filePath;
        const ext = mod.filePath.split('.').pop() || 'ts';
        await createProjectFile(projectId, name, mod.filePath, 'file', content, ext);
        currentFiles[mod.filePath] = content;
        logs.push(`تم إنشاء: ${mod.filePath}`);

      } else if (mod.type === 'delete') {
        deletedFiles.push({
          filePath: mod.filePath,
          reason: mod.reason,
        });

        await deleteProjectFile(projectId, mod.filePath);
        delete currentFiles[mod.filePath];
        logs.push(`تم حذف: ${mod.filePath}`);
      }
    }

    // Step 9: Apply import updates
    if (importUpdates.length > 0) {
      logs.push(`تحديث ${importUpdates.length} استيراد...`);
      await applyImportUpdates(importUpdates as ImportUpdate[], currentFiles, projectId);
    }

    // Step 10: Auto-detect broken imports after changes
    if (deletedFiles.length > 0 || filesChanged.length > 0) {
      logs.push('فحص الاستيرادات المكسورة...');
      const updatedGraph = buildFileRelationshipGraph(currentFiles);
      const brokenImports = findBrokenImports(currentFiles, updatedGraph);
      if (brokenImports.length > 0) {
        logs.push(`⚠️ تم اكتشاف ${brokenImports.length} استيراد مكسور`);
        for (const broken of brokenImports) {
          errors.push(`استيراد مكسور في ${broken.file}: ${broken.import}`);
        }
      }
    }

    if (errors.length > 0 && filesChanged.length === 0 && newFiles.length === 0) {
      return {
        success: false,
        message: 'فشل تنفيذ الأمر',
        errors,
        logs,
      };
    }

    // Create edit plan for documentation
    const allMods = [
      ...filesChanged.map(f => ({ type: 'edit' as const, filePath: f.filePath, oldContent: f.oldContent, newContent: f.newContent })),
      ...newFiles.map(f => ({ type: 'create' as const, filePath: f.filePath, oldContent: '', newContent: f.content })),
      ...deletedFiles.map(f => ({ type: 'delete' as const, filePath: f.filePath, oldContent: currentFiles[f.filePath] || '', newContent: '' })),
    ];

    const editPlan = createEditPlan(projectId, plan, allMods);
    const planSummary = summarizeEditPlan(editPlan);

    logs.push(`✅ تم تنفيذ الأمر بنجاح: ${filesChanged.length} تعديل، ${newFiles.length} ملف جديد، ${deletedFiles.length} حذف`);

    return {
      success: true,
      message: `تم تنفيذ الأمر بنجاح: ${plan}`,
      details: planSummary,
      filesChanged,
      newFiles,
      deletedFiles,
      importUpdates: importUpdates as ImportUpdate[],
      affectedFiles,
      executionPlan: plan,
      logs,
    };

  } catch (error: any) {
    console.error('[AI Execution Engine] Error:', error);
    logs.push(`❌ خطأ: ${error.message}`);
    return {
      success: false,
      message: 'حدث خطأ أثناء تنفيذ الأمر',
      details: error.message,
      errors: [error.message],
      logs,
    };
  }
}

/**
 * Auto-debug the project by detecting and fixing errors
 */
export async function autoDebugProject(
  projectId: string,
  userId: string
): Promise<AIExecutionResponse> {
  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] بدء التصحيح التلقائي للمشروع: ${projectId}`);

  try {
    const currentFiles = await readProjectFiles(projectId);
    logs.push(`تم قراءة ${Object.keys(currentFiles).length} ملف`);

    const fileGraph = buildFileRelationshipGraph(currentFiles);

    const brokenImports = findBrokenImports(currentFiles, fileGraph);
    if (brokenImports.length > 0) {
      logs.push(`تم اكتشاف ${brokenImports.length} استيراد مكسور`);
    }

    const unusedImportsByFile: Record<string, any[]> = {};
    for (const [filePath, content] of Object.entries(currentFiles)) {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        const unused = findUnusedImports(content, filePath);
        if (unused.length > 0) {
          unusedImportsByFile[filePath] = unused;
        }
      }
    }

    if (fileGraph.circularDependencies.length > 0) {
      logs.push(`⚠️ تم اكتشاف ${fileGraph.circularDependencies.length} تبعية دائرية`);
    }

    const issues: string[] = [
      ...brokenImports.map(b => `استيراد مكسور في ${b.file}: ${b.import}`),
      ...fileGraph.circularDependencies.map(c => `تبعية دائرية: ${c.join(' → ')}`),
    ];

    if (issues.length === 0) {
      return {
        success: true,
        message: 'المشروع سليم - لا توجد أخطاء',
        details: `تم فحص ${Object.keys(currentFiles).length} ملف بنجاح`,
        logs,
      };
    }

    const fixCommand = `أصلح الأخطاء التالية في المشروع:\n${issues.join('\n')}`;
    return executeAICommand(projectId, userId, fixCommand);

  } catch (error: any) {
    logs.push(`❌ خطأ في التصحيح: ${error.message}`);
    return {
      success: false,
      message: 'فشل التصحيح التلقائي',
      details: error.message,
      errors: [error.message],
      logs,
    };
  }
}
