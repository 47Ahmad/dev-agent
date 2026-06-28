import { invokeLLM } from '../_core/llm';

export interface BuildError {
  id: string;
  type: 'typescript' | 'import' | 'syntax' | 'runtime' | 'warning' | 'unknown';
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
}

export interface DebugResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildError[];
  suggestions: string[];
  autoFixApplied: boolean;
  fixedFiles?: Record<string, string>;
}

/**
 * Parse TypeScript compilation errors
 */
export function parseTypeScriptErrors(output: string): BuildError[] {
  const errors: BuildError[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Match TypeScript error format: file.ts(line,col): error TS####: message
    const match = line.match(/(.+?)\((\d+),(\d+)\):\s*(error|warning)\s*(TS\d+):\s*(.+)/);
    if (match) {
      errors.push({
        id: `ts-${Date.now()}-${Math.random()}`,
        type: 'typescript',
        severity: match[4] as 'error' | 'warning',
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        message: match[6],
      });
    }
  }

  return errors;
}

/**
 * Parse import errors
 */
export function parseImportErrors(output: string): BuildError[] {
  const errors: BuildError[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Match import error patterns
    if (line.includes('Cannot find module') || line.includes('Module not found')) {
      const fileMatch = line.match(/from\s+['"](.*?)['"]/);
      const moduleMatch = line.match(/Cannot find module\s+['"](.*?)['"]/) || line.match(/Module not found:\s+(.+)/);

      if (fileMatch || moduleMatch) {
        errors.push({
          id: `import-${Date.now()}-${Math.random()}`,
          type: 'import',
          severity: 'error',
          file: fileMatch ? fileMatch[1] : 'unknown',
          message: `الوحدة غير موجودة: ${moduleMatch ? moduleMatch[1] : 'unknown'}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Detect missing dependencies from code
 */
export function detectMissingDependencies(fileContent: string): string[] {
  const missingDeps: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([@\w\-/]+)['"]/g;
  const requireRegex = /require\s*\(\s*['"]([@\w\-/]+)['"]\s*\)/g;

  let match;
  const imports = new Set<string>();

  while ((match = importRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  while ((match = requireRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  // Filter out relative imports and built-ins
  for (const imp of Array.from(imports)) {
    if (!imp.startsWith('.') && !imp.startsWith('/') && !isBuiltInModule(imp)) {
      missingDeps.push(imp);
    }
  }

  return missingDeps;
}

/**
 * Check if a module is a built-in Node.js module
 */
function isBuiltInModule(moduleName: string): boolean {
  const builtins = [
    'fs', 'path', 'http', 'https', 'os', 'util', 'events', 'stream',
    'buffer', 'crypto', 'zlib', 'querystring', 'url', 'domain',
    'net', 'dgram', 'dns', 'assert', 'console', 'process',
    'vm', 'repl', 'cluster', 'child_process', 'tls', 'punycode',
  ];
  return builtins.includes(moduleName);
}

/**
 * Auto-fix common TypeScript errors
 */
export async function autoFixTypeScriptErrors(
  fileContent: string,
  errors: BuildError[]
): Promise<{ fixed: boolean; content: string; suggestions: string[] }> {
  const suggestions: string[] = [];
  let fixedContent = fileContent;

  // Try to fix common errors with AI assistance
  if (errors.length > 0) {
    const errorSummary = errors
      .map(e => `${e.file}:${e.line} - ${e.message}`)
      .join('\n');

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `أنت مساعد متخصص في إصلاح أخطاء TypeScript والكود البرمجي.
مهمتك هي تحليل الأخطاء المعطاة واقتراح إصلاحات ذكية.
يجب أن تكون الإصلاحات آمنة وتحافظ على وظيفة الكود الأصلي.`,
          },
          {
            role: 'user',
            content: `الملف الحالي:
\`\`\`typescript
${fileContent}
\`\`\`

الأخطاء:
${errorSummary}

يرجى اقتراح إصلاحات للأخطاء أعلاه. قدم الكود المصحح فقط بدون شرح.`,
          },
        ],
        model: 'claude-3.5-sonnet',
        max_tokens: 2000,
      });

      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content as string;
        // Extract code from markdown if present
        const codeMatch = content.match(/```(?:typescript|ts)?\n([\s\S]*?)\n```/);
        if (codeMatch) {
          fixedContent = codeMatch[1];
          suggestions.push('تم تطبيق إصلاحات تلقائية بناءً على تحليل الأخطاء');
        }
      }
    } catch (error) {
      console.error('[AutoDebugger] Error during auto-fix:', error);
    }
  }

  return {
    fixed: fixedContent !== fileContent,
    content: fixedContent,
    suggestions,
  };
}

/**
 * Analyze code for potential issues
 */
export function analyzeCodeQuality(fileContent: string): BuildError[] {
  const issues: BuildError[] = [];

  // Check for unused variables
  const unusedVarRegex = /const\s+(\w+)\s*=/g;
  let match;
  while ((match = unusedVarRegex.exec(fileContent)) !== null) {
    const varName = match[1];
    const varRegex = new RegExp(`\\b${varName}\\b`, 'g');
    const occurrences = (fileContent.match(varRegex) || []).length;
    if (occurrences === 1) {
      issues.push({
        id: `unused-${Date.now()}-${Math.random()}`,
        type: 'warning',
        severity: 'warning',
        file: 'unknown',
        message: `المتغير "${varName}" لم يتم استخدامه`,
        suggestion: `قم بحذف المتغير "${varName}" أو استخدمه`,
      });
    }
  }

  // Check for console.log statements in production code
  if (fileContent.includes('console.log')) {
    issues.push({
      id: `console-${Date.now()}`,
      type: 'warning',
      severity: 'warning',
      file: 'unknown',
      message: 'تم العثور على console.log في الكود',
      suggestion: 'يفضل إزالة console.log من الكود الإنتاجي',
    });
  }

  // Check for any statements
  if (fileContent.includes(': any')) {
    issues.push({
      id: `any-${Date.now()}`,
      type: 'warning',
      severity: 'warning',
      file: 'unknown',
      message: 'تم استخدام النوع "any" في TypeScript',
      suggestion: 'يفضل تحديد النوع بدقة بدلاً من استخدام "any"',
    });
  }

  return issues;
}

/**
 * Perform comprehensive code debugging
 */
export async function debugProject(
  projectFiles: Record<string, string>,
  buildOutput?: string
): Promise<DebugResult> {
  const errors: BuildError[] = [];
  const warnings: BuildError[] = [];
  const suggestions: string[] = [];
  const fixedFiles: Record<string, string> = {};
  let autoFixApplied = false;

  // Parse build errors if provided
  if (buildOutput) {
    const tsErrors = parseTypeScriptErrors(buildOutput);
    const importErrors = parseImportErrors(buildOutput);
    errors.push(...tsErrors, ...importErrors);
  }

  // Analyze each file for issues
  for (const [filePath, content] of Object.entries(projectFiles)) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      const codeIssues = analyzeCodeQuality(content);
      warnings.push(...codeIssues);

      // Try to auto-fix TypeScript errors
      if (errors.length > 0 && filePath.includes(errors[0]?.file || '')) {
        const fixResult = await autoFixTypeScriptErrors(content, errors);
        if (fixResult.fixed) {
          fixedFiles[filePath] = fixResult.content;
          suggestions.push(...fixResult.suggestions);
          autoFixApplied = true;
        }
      }

      // Detect missing dependencies
      const missingDeps = detectMissingDependencies(content);
      if (missingDeps.length > 0) {
        suggestions.push(`الملف ${filePath} يحتاج إلى الوحدات: ${missingDeps.join(', ')}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    suggestions,
    autoFixApplied,
    fixedFiles: Object.keys(fixedFiles).length > 0 ? fixedFiles : undefined,
  };
}

/**
 * Generate debug report
 */
export function generateDebugReport(result: DebugResult): string {
  let report = '## تقرير التصحيح\n\n';

  if (result.success) {
    report += '✅ **لا توجد أخطاء حرجة**\n\n';
  } else {
    report += `❌ **تم العثور على ${result.errors.length} أخطاء حرجة**\n\n`;
  }

  if (result.errors.length > 0) {
    report += '### الأخطاء:\n';
    for (const error of result.errors) {
      report += `- **${error.file}** (سطر ${error.line}): ${error.message}\n`;
      if (error.suggestion) {
        report += `  💡 ${error.suggestion}\n`;
      }
    }
    report += '\n';
  }

  if (result.warnings.length > 0) {
    report += `### التحذيرات (${result.warnings.length}):\n`;
    for (const warning of result.warnings.slice(0, 5)) {
      report += `- ${warning.message}\n`;
    }
    if (result.warnings.length > 5) {
      report += `- ... و ${result.warnings.length - 5} تحذيرات أخرى\n`;
    }
    report += '\n';
  }

  if (result.suggestions.length > 0) {
    report += '### الاقتراحات:\n';
    for (const suggestion of result.suggestions) {
      report += `- ${suggestion}\n`;
    }
    report += '\n';
  }

  if (result.autoFixApplied) {
    report += '✨ **تم تطبيق إصلاحات تلقائية**\n';
  }

  return report;
}
