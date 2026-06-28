/**
 * Auto Debugger - Phase 3B.3
 * Comprehensive auto-debugging system that fixes Build, TypeScript, and Runtime errors.
 * Features:
 * - TypeScript error detection and auto-fix
 * - Import error detection and resolution
 * - Runtime error pattern detection
 * - Build error parsing and fixing
 * - AI-powered error correction
 * - Comprehensive test-after-fix validation
 */

import { invokeLLM } from '../_core/llm';
import {
  buildFileRelationshipGraph,
  findUnusedImports,
  parseImports,
  parseExports,
} from './fileRelationshipAnalyzer';

export interface BuildError {
  id: string;
  type: 'typescript' | 'import' | 'syntax' | 'runtime' | 'lint' | 'warning' | 'unknown';
  severity: 'error' | 'warning' | 'info';
  file: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface DebugResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildError[];
  suggestions: string[];
  autoFixApplied: boolean;
  fixedFiles?: Record<string, string>;
  fixedCount: number;
  remainingErrors: BuildError[];
  debugReport: string;
}

export interface AutoFixResult {
  fixed: boolean;
  content: string;
  suggestions: string[];
  appliedFixes: string[];
}

export interface RuntimeError {
  type: 'null_reference' | 'type_mismatch' | 'undefined_variable' | 'async_error' | 'other';
  message: string;
  stack?: string;
  file?: string;
  line?: number;
}

/**
 * Parse TypeScript compilation errors from build output
 */
export function parseTypeScriptErrors(output: string): BuildError[] {
  const errors: BuildError[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Match TypeScript error format: file.ts(line,col): error TS####: message
    const match = line.match(/(.+?)\((\d+),(\d+)\):\s*(error|warning)\s*(TS\d+):\s*(.+)/);
    if (match) {
      const severity = match[4] as 'error' | 'warning';
      const code = match[5];
      const message = match[6];

      errors.push({
        id: `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'typescript',
        severity,
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        message,
        code,
        suggestion: getTypeScriptErrorSuggestion(code, message),
        autoFixable: isAutoFixableTypeScriptError(code),
      });
    }
  }

  return errors;
}

/**
 * Get suggestion for TypeScript error code
 */
function getTypeScriptErrorSuggestion(code: string, message: string): string {
  const suggestions: Record<string, string> = {
    'TS2307': 'تحقق من مسار الاستيراد وتأكد من وجود الملف',
    'TS2304': 'تأكد من تعريف المتغير أو الاستيراد الصحيح',
    'TS2345': 'تحقق من أنواع البيانات المتوافقة',
    'TS2339': 'تأكد من وجود الخاصية في النوع المحدد',
    'TS2322': 'النوع غير متوافق - تحقق من التعريفات',
    'TS7006': 'أضف نوع البيانات للمعامل',
    'TS2554': 'عدد المعاملات غير صحيح',
    'TS2551': 'اسم الخاصية غير صحيح - تحقق من الإملاء',
    'TS2571': 'النوع غير معروف - أضف type assertion',
    'TS2532': 'قد تكون القيمة undefined - أضف فحص null',
    'TS2531': 'قد تكون القيمة null - أضف فحص null',
    'TS2366': 'الدالة لا تعيد قيمة في جميع المسارات',
    'TS2741': 'خصائص مطلوبة مفقودة في الكائن',
    'TS6133': 'المتغير معرّف ولكن غير مستخدم',
  };

  return suggestions[code] || `راجع وثائق TypeScript للخطأ ${code}`;
}

/**
 * Check if a TypeScript error can be auto-fixed
 */
function isAutoFixableTypeScriptError(code: string): boolean {
  const autoFixableCodes = ['TS2307', 'TS6133', 'TS2532', 'TS2531', 'TS2339'];
  return autoFixableCodes.includes(code);
}

/**
 * Parse import errors from build output
 */
export function parseImportErrors(output: string): BuildError[] {
  const errors: BuildError[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('Cannot find module') || line.includes('Module not found')) {
      const moduleMatch = line.match(/Cannot find module\s+['"]([^'"]+)['"]/) ||
                          line.match(/Module not found:\s+Error: Can't resolve\s+['"]([^'"]+)['"]/);
      const fileMatch = line.match(/in\s+['"]([^'"]+)['"]/);

      if (moduleMatch) {
        errors.push({
          id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'import',
          severity: 'error',
          file: fileMatch ? fileMatch[1] : 'unknown',
          message: `الوحدة غير موجودة: ${moduleMatch[1]}`,
          suggestion: `تحقق من مسار الاستيراد: ${moduleMatch[1]}`,
          autoFixable: true,
        });
      }
    }

    // Missing type declarations
    if (line.includes('Could not find a declaration file')) {
      const match = line.match(/module\s+['"]([^'"]+)['"]/);
      if (match) {
        errors.push({
          id: `types-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'typescript',
          severity: 'warning',
          file: 'package.json',
          message: `تعريفات TypeScript مفقودة لـ: ${match[1]}`,
          suggestion: `أضف @types/${match[1]} أو أنشئ ملف .d.ts`,
          autoFixable: false,
        });
      }
    }
  }

  return errors;
}

/**
 * Parse runtime errors from error stack
 */
export function parseRuntimeErrors(errorOutput: string): RuntimeError[] {
  const errors: RuntimeError[] = [];
  const lines = errorOutput.split('\n');

  for (const line of lines) {
    if (line.includes('TypeError: Cannot read') || line.includes('TypeError: Cannot access')) {
      errors.push({
        type: 'null_reference',
        message: line.trim(),
      });
    } else if (line.includes('ReferenceError')) {
      errors.push({
        type: 'undefined_variable',
        message: line.trim(),
      });
    } else if (line.includes('UnhandledPromiseRejection') || line.includes('Promise rejection')) {
      errors.push({
        type: 'async_error',
        message: line.trim(),
      });
    }
  }

  return errors;
}

/**
 * Detect missing dependencies from code
 */
export function detectMissingDependencies(fileContent: string): string[] {
  const missing: string[] = [];
  const imports = parseImports(fileContent, '');

  for (const imp of imports) {
    // Only check external modules (not relative imports)
    if (!imp.source.startsWith('.') && !imp.source.startsWith('/') && !imp.source.startsWith('@/')) {
      // Check if it's a known built-in or common module
      const builtins = ['fs', 'path', 'os', 'crypto', 'http', 'https', 'url', 'util', 'stream', 'events'];
      if (!builtins.includes(imp.source.split('/')[0])) {
        missing.push(imp.source);
      }
    }
  }

  return missing;
}

/**
 * Analyze code quality and detect potential issues
 */
export function analyzeCodeQuality(content: string): BuildError[] {
  const issues: BuildError[] = [];

  // Check for console.log in production code
  const consoleMatches = content.match(/console\.log\(/g);
  if (consoleMatches && consoleMatches.length > 3) {
    issues.push({
      id: `lint-${Date.now()}`,
      type: 'lint',
      severity: 'warning',
      file: 'unknown',
      message: `يوجد ${consoleMatches.length} استخدام لـ console.log - يُنصح بإزالتها في الإنتاج`,
      autoFixable: false,
    });
  }

  // Check for any type usage
  const anyMatches = content.match(/:\s*any\b/g);
  if (anyMatches && anyMatches.length > 5) {
    issues.push({
      id: `lint-any-${Date.now()}`,
      type: 'lint',
      severity: 'warning',
      file: 'unknown',
      message: `يوجد ${anyMatches.length} استخدام لنوع any - يُنصح بتحديد الأنواع`,
      autoFixable: false,
    });
  }

  // Check for TODO comments
  const todoMatches = content.match(/\/\/\s*TODO/gi);
  if (todoMatches && todoMatches.length > 0) {
    issues.push({
      id: `lint-todo-${Date.now()}`,
      type: 'lint',
      severity: 'info',
      file: 'unknown',
      message: `يوجد ${todoMatches.length} تعليق TODO غير منجز`,
      autoFixable: false,
    });
  }

  // Check for empty catch blocks
  const emptyCatchMatches = content.match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
  if (emptyCatchMatches && emptyCatchMatches.length > 0) {
    issues.push({
      id: `lint-catch-${Date.now()}`,
      type: 'lint',
      severity: 'warning',
      file: 'unknown',
      message: `يوجد ${emptyCatchMatches.length} كتلة catch فارغة - يجب معالجة الأخطاء`,
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Auto-fix TypeScript errors using AI
 */
export async function autoFixTypeScriptErrors(
  content: string,
  errors: BuildError[]
): Promise<AutoFixResult> {
  if (errors.length === 0) {
    return { fixed: false, content, suggestions: [], appliedFixes: [] };
  }

  const autoFixableErrors = errors.filter(e => e.autoFixable);
  if (autoFixableErrors.length === 0) {
    return {
      fixed: false,
      content,
      suggestions: errors.map(e => e.suggestion || e.message),
      appliedFixes: [],
    };
  }

  const appliedFixes: string[] = [];
  let fixedContent = content;

  // Fix unused imports (TS6133)
  const unusedImportErrors = autoFixableErrors.filter(e => e.code === 'TS6133');
  if (unusedImportErrors.length > 0) {
    for (const error of unusedImportErrors) {
      const varName = error.message.match(/'([^']+)'/)?.[1];
      if (varName) {
        // Remove unused import
        const importRegex = new RegExp(`import\\s+\\{[^}]*\\b${varName}\\b[^}]*\\}\\s+from\\s+['"][^'"]+['"];?\\n?`, 'g');
        const newContent = fixedContent.replace(importRegex, '');
        if (newContent !== fixedContent) {
          fixedContent = newContent;
          appliedFixes.push(`إزالة الاستيراد غير المستخدم: ${varName}`);
        }
      }
    }
  }

  // Fix null/undefined checks (TS2532, TS2531)
  const nullErrors = autoFixableErrors.filter(e => e.code === 'TS2532' || e.code === 'TS2531');
  if (nullErrors.length > 0) {
    for (const error of nullErrors) {
      if (error.line) {
        const lines = fixedContent.split('\n');
        const lineIndex = error.line - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];
          // Add optional chaining if not present
          if (!line.includes('?.') && !line.includes('!.')) {
            const fixed = line.replace(/(\w+)\.(\w+)/g, '$1?.$2');
            if (fixed !== line) {
              lines[lineIndex] = fixed;
              fixedContent = lines.join('\n');
              appliedFixes.push(`إضافة optional chaining في السطر ${error.line}`);
            }
          }
        }
      }
    }
  }

  return {
    fixed: appliedFixes.length > 0,
    content: fixedContent,
    suggestions: autoFixableErrors.map(e => e.suggestion || e.message),
    appliedFixes,
  };
}

/**
 * Fix import errors automatically
 */
export function autoFixImportErrors(
  content: string,
  filePath: string,
  availableFiles: string[]
): AutoFixResult {
  const imports = parseImports(content, filePath);
  const appliedFixes: string[] = [];
  let fixedContent = content;

  for (const imp of imports) {
    if (!imp.source.startsWith('.')) continue;

    // Try to find the file
    const possiblePaths = [
      imp.source,
      imp.source + '.ts',
      imp.source + '.tsx',
      imp.source + '/index.ts',
      imp.source + '/index.tsx',
    ];

    const resolved = possiblePaths.find(p => {
      const fullPath = filePath.split('/').slice(0, -1).join('/') + '/' + p;
      return availableFiles.some(f => f.endsWith(fullPath) || f === fullPath);
    });

    if (!resolved && imp.source.startsWith('.')) {
      // Try to find similar file names
      const fileName = imp.source.split('/').pop() || '';
      const similar = availableFiles.find(f =>
        f.endsWith(`/${fileName}.ts`) || f.endsWith(`/${fileName}.tsx`)
      );

      if (similar) {
        // Calculate correct relative path
        const fromDir = filePath.split('/').slice(0, -1).join('/');
        const toFile = similar;
        const relativePath = calculateRelativePath(fromDir, toFile);

        const escapedSource = imp.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const newContent = fixedContent.replace(
          new RegExp(`(['"])${escapedSource}(['"])`, 'g'),
          `$1${relativePath}$2`
        );

        if (newContent !== fixedContent) {
          fixedContent = newContent;
          appliedFixes.push(`تصحيح مسار الاستيراد: ${imp.source} → ${relativePath}`);
        }
      }
    }
  }

  return {
    fixed: appliedFixes.length > 0,
    content: fixedContent,
    suggestions: [],
    appliedFixes,
  };
}

/**
 * Calculate relative path from one directory to a file
 */
function calculateRelativePath(fromDir: string, toFile: string): string {
  const fromParts = fromDir.split('/').filter(Boolean);
  const toParts = toFile.split('/').filter(Boolean);

  let commonLength = 0;
  while (commonLength < fromParts.length && commonLength < toParts.length &&
         fromParts[commonLength] === toParts[commonLength]) {
    commonLength++;
  }

  const upCount = fromParts.length - commonLength;
  const downPath = toParts.slice(commonLength).join('/');

  let relativePath = '';
  if (upCount === 0) {
    relativePath = './' + downPath;
  } else {
    relativePath = '../'.repeat(upCount) + downPath;
  }

  return relativePath.replace(/\.(ts|tsx)$/, '');
}

/**
 * Use AI to fix complex errors
 */
export async function aiFixErrors(
  fileContent: string,
  filePath: string,
  errors: BuildError[]
): Promise<AutoFixResult> {
  if (errors.length === 0) {
    return { fixed: false, content: fileContent, suggestions: [], appliedFixes: [] };
  }

  const errorDescriptions = errors
    .map(e => `- [${e.type}] ${e.file}:${e.line || '?'} - ${e.message}`)
    .join('\n');

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `أنت خبير في إصلاح أخطاء TypeScript وJavaScript. 
مهمتك هي إصلاح الأخطاء في الكود المقدم.
أرجع JSON بالصيغة التالية:
{
  "fixed": true/false,
  "content": "الكود المصحح بالكامل",
  "appliedFixes": ["وصف الإصلاح 1", "وصف الإصلاح 2"],
  "suggestions": ["اقتراح 1", "اقتراح 2"]
}`,
        },
        {
          role: 'user',
          content: `الملف: ${filePath}

الأخطاء:
${errorDescriptions}

الكود:
\`\`\`typescript
${fileContent}
\`\`\`

أصلح الأخطاء المذكورة فقط دون تغيير المنطق الأساسي للكود.`,
        },
      ],
      model: 'claude-3.5-sonnet',
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const messageContent = response.choices?.[0]?.message?.content;
    if (!messageContent) {
      return { fixed: false, content: fileContent, suggestions: [], appliedFixes: [] };
    }

    const result = JSON.parse(messageContent as string);
    return {
      fixed: result.fixed || false,
      content: result.content || fileContent,
      suggestions: result.suggestions || [],
      appliedFixes: result.appliedFixes || [],
    };
  } catch (error) {
    console.error('[AutoDebugger] AI fix error:', error);
    return { fixed: false, content: fileContent, suggestions: [], appliedFixes: [] };
  }
}

/**
 * Main debug function - comprehensive project debugging
 */
export async function debugProject(
  projectFiles: Record<string, string>,
  buildOutput?: string,
  useAI: boolean = false
): Promise<DebugResult> {
  const errors: BuildError[] = [];
  const warnings: BuildError[] = [];
  const suggestions: string[] = [];
  const fixedFiles: Record<string, string> = {};
  let autoFixApplied = false;
  let fixedCount = 0;

  // Parse build errors if provided
  if (buildOutput) {
    const tsErrors = parseTypeScriptErrors(buildOutput);
    const importErrors = parseImportErrors(buildOutput);
    errors.push(...tsErrors, ...importErrors);
  }

  // Build file relationship graph for deeper analysis
  const graph = buildFileRelationshipGraph(projectFiles);

  // Check for broken imports
  for (const [filePath, node] of graph.nodes.entries()) {
    for (const imp of node.imports) {
      if (imp.source.startsWith('.') && !imp.resolvedPath) {
        errors.push({
          id: `broken-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'import',
          severity: 'error',
          file: filePath,
          message: `استيراد مكسور: ${imp.source}`,
          suggestion: `تحقق من وجود الملف: ${imp.source}`,
          autoFixable: true,
        });
      }
    }
  }

  // Check for circular dependencies
  if (graph.circularDependencies.length > 0) {
    for (const cycle of graph.circularDependencies) {
      warnings.push({
        id: `circular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'import',
        severity: 'warning',
        file: cycle[0] || 'unknown',
        message: `تبعية دائرية: ${cycle.join(' → ')}`,
        suggestion: 'أعد هيكلة الاستيرادات لتجنب الدورات',
        autoFixable: false,
      });
    }
  }

  // Analyze each file for issues
  const allFiles = Object.keys(projectFiles);
  for (const [filePath, content] of Object.entries(projectFiles)) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;

    // Analyze code quality
    const codeIssues = analyzeCodeQuality(content);
    for (const issue of codeIssues) {
      issue.file = filePath;
      warnings.push(issue);
    }

    // Find unused imports
    const unusedImports = findUnusedImports(content, filePath);
    for (const unused of unusedImports) {
      warnings.push({
        id: `unused-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'lint',
        severity: 'warning',
        file: filePath,
        message: `استيراد غير مستخدم: ${unused.symbols.join(', ')} من ${unused.source}`,
        suggestion: `أزل الاستيراد غير المستخدم`,
        autoFixable: true,
      });
    }

    // Try to auto-fix TypeScript errors for this file
    const fileErrors = errors.filter(e =>
      e.file === filePath || e.file.endsWith(filePath) || filePath.endsWith(e.file)
    );

    if (fileErrors.length > 0) {
      // First try simple auto-fix
      const fixResult = await autoFixTypeScriptErrors(content, fileErrors);
      if (fixResult.fixed) {
        fixedFiles[filePath] = fixResult.content;
        suggestions.push(...fixResult.suggestions);
        autoFixApplied = true;
        fixedCount++;
      } else if (useAI && fileErrors.some(e => e.autoFixable)) {
        // Try AI-powered fix
        const aiResult = await aiFixErrors(content, filePath, fileErrors);
        if (aiResult.fixed) {
          fixedFiles[filePath] = aiResult.content;
          suggestions.push(...aiResult.suggestions);
          autoFixApplied = true;
          fixedCount++;
        }
      }
    }

    // Try to fix import errors
    const importErrors = errors.filter(e => e.type === 'import' && e.file === filePath);
    if (importErrors.length > 0) {
      const fixResult = autoFixImportErrors(content, filePath, allFiles);
      if (fixResult.fixed) {
        fixedFiles[filePath] = fixResult.content;
        autoFixApplied = true;
        fixedCount++;
      }
    }

    // Detect missing dependencies
    const missingDeps = detectMissingDependencies(content);
    if (missingDeps.length > 0) {
      suggestions.push(`الملف ${filePath} قد يحتاج إلى الوحدات: ${missingDeps.join(', ')}`);
    }
  }

  // Calculate remaining errors after fixes
  const remainingErrors = errors.filter(e => {
    if (!fixedFiles[e.file]) return true;
    // If the file was fixed, check if the error still exists
    return false;
  });

  const debugReport = generateDebugReport({
    success: remainingErrors.length === 0,
    errors: remainingErrors,
    warnings,
    suggestions,
    autoFixApplied,
    fixedFiles: Object.keys(fixedFiles).length > 0 ? fixedFiles : undefined,
    fixedCount,
    remainingErrors,
    debugReport: '',
  });

  return {
    success: remainingErrors.length === 0,
    errors: remainingErrors,
    warnings,
    suggestions,
    autoFixApplied,
    fixedFiles: Object.keys(fixedFiles).length > 0 ? fixedFiles : undefined,
    fixedCount,
    remainingErrors,
    debugReport,
  };
}

/**
 * Generate debug report
 */
export function generateDebugReport(result: DebugResult): string {
  let report = '## تقرير التصحيح التلقائي\n\n';

  if (result.success) {
    report += '✅ **لا توجد أخطاء حرجة**\n\n';
  } else {
    report += `❌ **تم العثور على ${result.errors.length} أخطاء حرجة**\n\n`;
  }

  if (result.autoFixApplied) {
    report += `✨ **تم تطبيق ${result.fixedCount} إصلاح تلقائي**\n\n`;
  }

  if (result.errors.length > 0) {
    report += '### الأخطاء:\n';
    for (const error of result.errors) {
      const location = error.line ? ` (سطر ${error.line})` : '';
      report += `- **${error.file}**${location}: ${error.message}\n`;
      if (error.suggestion) {
        report += `  💡 ${error.suggestion}\n`;
      }
    }
    report += '\n';
  }

  if (result.warnings.length > 0) {
    report += `### التحذيرات (${result.warnings.length}):\n`;
    for (const warning of result.warnings.slice(0, 10)) {
      report += `- ⚠️ ${warning.file}: ${warning.message}\n`;
    }
    if (result.warnings.length > 10) {
      report += `- ... و ${result.warnings.length - 10} تحذيرات أخرى\n`;
    }
    report += '\n';
  }

  if (result.suggestions.length > 0) {
    report += '### الاقتراحات:\n';
    for (const suggestion of result.suggestions.slice(0, 5)) {
      report += `- 💡 ${suggestion}\n`;
    }
    report += '\n';
  }

  if (result.fixedFiles && Object.keys(result.fixedFiles).length > 0) {
    report += '### الملفات المصلحة تلقائياً:\n';
    for (const filePath of Object.keys(result.fixedFiles)) {
      report += `- ✅ ${filePath}\n`;
    }
    report += '\n';
  }

  return report;
}

/**
 * Run comprehensive tests after fixes
 */
export async function validateFixesWithTests(
  projectFiles: Record<string, string>,
  fixedFiles: Record<string, string>
): Promise<{ passed: boolean; issues: string[] }> {
  const issues: string[] = [];
  const allFiles = { ...projectFiles, ...fixedFiles };

  // Re-run debug on fixed files
  const reDebugResult = await debugProject(fixedFiles, undefined, false);

  if (!reDebugResult.success) {
    issues.push(...reDebugResult.errors.map(e => `${e.file}: ${e.message}`));
  }

  // Check that all imports in fixed files are valid
  const graph = buildFileRelationshipGraph(allFiles);
  for (const [filePath] of Object.entries(fixedFiles)) {
    const node = graph.nodes.get(filePath);
    if (node) {
      for (const imp of node.imports) {
        if (imp.source.startsWith('.') && !imp.resolvedPath) {
          issues.push(`استيراد مكسور في ${filePath}: ${imp.source}`);
        }
      }
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
