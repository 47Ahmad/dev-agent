import { invokeLLM } from '../_core/llm';

export interface ErrorDetectionResult {
  hasSyntaxErrors: boolean;
  hasTypeScriptErrors: boolean;
  hasBuildErrors: boolean;
  hasImportErrors: boolean;
  hasDependencyErrors: boolean;
  errors: CodeError[];
  warnings: CodeError[];
}

export interface CodeError {
  id: string;
  type: 'syntax' | 'typescript' | 'build' | 'import' | 'dependency' | 'runtime';
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
}

export interface CorrectionResult {
  success: boolean;
  correctedCode: Record<string, string>;
  appliedFixes: string[];
  remainingErrors: CodeError[];
  attempts: number;
  maxAttemptsReached: boolean;
}

/**
 * Detect syntax errors in code
 */
export function detectSyntaxErrors(fileContent: string, filePath: string): CodeError[] {
  const errors: CodeError[] = [];

  // Check for common syntax errors
  const checks = [
    {
      pattern: /\{(?!\s*$)(?!.*\})/gm,
      message: 'Unclosed brace detected',
      type: 'syntax' as const,
    },
    {
      pattern: /\[(?!\s*$)(?!.*\])/gm,
      message: 'Unclosed bracket detected',
      type: 'syntax' as const,
    },
    {
      pattern: /\((?!\s*$)(?!.*\))/gm,
      message: 'Unclosed parenthesis detected',
      type: 'syntax' as const,
    },
    {
      pattern: /;\s*;/g,
      message: 'Double semicolon detected',
      type: 'syntax' as const,
    },
  ];

  for (const check of checks) {
    let match;
    while ((match = check.pattern.exec(fileContent)) !== null) {
      const lineNumber = fileContent.substring(0, match.index).split('\n').length;
      errors.push({
        id: `syntax-${Date.now()}-${Math.random()}`,
        type: check.type,
        severity: 'error',
        file: filePath,
        line: lineNumber,
        message: check.message,
      });
    }
  }

  return errors;
}

/**
 * Detect TypeScript errors
 */
export function detectTypeScriptErrors(fileContent: string, filePath: string): CodeError[] {
  const errors: CodeError[] = [];

  // Check for common TypeScript issues
  if (fileContent.includes(': any')) {
    errors.push({
      id: `ts-any-${Date.now()}`,
      type: 'typescript',
      severity: 'warning',
      file: filePath,
      message: 'Use of "any" type detected - prefer explicit types',
      suggestion: 'Replace "any" with a specific type',
    });
  }

  // Check for missing type annotations
  const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{/g;
  let match;
  while ((match = functionRegex.exec(fileContent)) !== null) {
    if (!fileContent.substring(match.index, match.index + 200).includes(':')) {
      const lineNumber = fileContent.substring(0, match.index).split('\n').length;
      errors.push({
        id: `ts-noreturn-${Date.now()}-${Math.random()}`,
        type: 'typescript',
        severity: 'warning',
        file: filePath,
        line: lineNumber,
        message: 'Function missing return type annotation',
        suggestion: 'Add explicit return type annotation',
      });
    }
  }

  return errors;
}

/**
 * Detect import errors
 */
export function detectImportErrors(fileContent: string, filePath: string): CodeError[] {
  const errors: CodeError[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  let match;

  while ((match = importRegex.exec(fileContent)) !== null) {
    const importPath = match[1];
    const lineNumber = fileContent.substring(0, match.index).split('\n').length;

    // Check for relative imports that might be broken
    if (importPath.startsWith('.') && !importPath.includes('/')) {
      errors.push({
        id: `import-${Date.now()}-${Math.random()}`,
        type: 'import',
        severity: 'warning',
        file: filePath,
        line: lineNumber,
        message: `Potentially broken relative import: ${importPath}`,
        suggestion: 'Verify the import path is correct',
      });
    }

    // Check for missing file extensions in relative imports
    if (importPath.startsWith('.') && !importPath.match(/\.(ts|tsx|js|jsx|json)$/)) {
      errors.push({
        id: `import-ext-${Date.now()}-${Math.random()}`,
        type: 'import',
        severity: 'warning',
        file: filePath,
        line: lineNumber,
        message: `Import missing file extension: ${importPath}`,
        suggestion: 'Add .ts, .tsx, or .js extension to the import path',
      });
    }
  }

  return errors;
}

/**
 * Detect missing dependencies
 */
export function detectMissingDependencies(fileContent: string, packageJson: string): CodeError[] {
  const errors: CodeError[] = [];

  try {
    const pkg = JSON.parse(packageJson);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const importRegex = /import\s+.*?\s+from\s+['"]([@\w\-/]+)['"]/g;
    let match;
    const importedPackages = new Set<string>();

    while ((match = importRegex.exec(fileContent)) !== null) {
      const packageName = match[1];
      // Extract base package name (handle scoped packages)
      const baseName = packageName.startsWith('@')
        ? packageName.split('/').slice(0, 2).join('/')
        : packageName.split('/')[0];

      if (!baseName.startsWith('.') && !isBuiltInModule(baseName)) {
        importedPackages.add(baseName);
      }
    }

    for (const pkg of Array.from(importedPackages)) {
      if (!(pkg in allDeps)) {
        const lineNumber = fileContent.indexOf(`from '${pkg}'`) > -1
          ? fileContent.substring(0, fileContent.indexOf(`from '${pkg}'`)).split('\n').length
          : 1;

        errors.push({
          id: `dep-${Date.now()}-${Math.random()}`,
          type: 'dependency',
          severity: 'error',
          file: 'package.json',
          line: lineNumber,
          message: `Missing dependency: ${pkg}`,
          suggestion: `Add "${pkg}" to package.json dependencies`,
        });
      }
    }
  } catch (error) {
    console.error('[AutomaticErrorCorrection] Error parsing package.json:', error);
  }

  return errors;
}

/**
 * Check if a module is built-in
 */
function isBuiltInModule(moduleName: string): boolean {
  const builtins = [
    'fs', 'path', 'http', 'https', 'os', 'util', 'events', 'stream',
    'buffer', 'crypto', 'zlib', 'querystring', 'url', 'domain',
    'net', 'dgram', 'dns', 'assert', 'console', 'process',
  ];
  return builtins.includes(moduleName);
}

/**
 * Detect all errors in project files
 */
export function detectAllErrors(
  projectFiles: Record<string, string>,
  packageJson: string
): ErrorDetectionResult {
  const allErrors: CodeError[] = [];
  const allWarnings: CodeError[] = [];

  for (const [filePath, content] of Object.entries(projectFiles)) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      // Syntax errors
      const syntaxErrors = detectSyntaxErrors(content, filePath);
      allErrors.push(...syntaxErrors.filter(e => e.severity === 'error'));
      allWarnings.push(...syntaxErrors.filter(e => e.severity === 'warning'));

      // TypeScript errors
      const tsErrors = detectTypeScriptErrors(content, filePath);
      allErrors.push(...tsErrors.filter(e => e.severity === 'error'));
      allWarnings.push(...tsErrors.filter(e => e.severity === 'warning'));

      // Import errors
      const importErrors = detectImportErrors(content, filePath);
      allErrors.push(...importErrors.filter(e => e.severity === 'error'));
      allWarnings.push(...importErrors.filter(e => e.severity === 'warning'));

      // Dependency errors
      if (filePath.includes('src/') || filePath.includes('client/')) {
        const depErrors = detectMissingDependencies(content, packageJson);
        allErrors.push(...depErrors.filter(e => e.severity === 'error'));
        allWarnings.push(...depErrors.filter(e => e.severity === 'warning'));
      }
    }
  }

  return {
    hasSyntaxErrors: allErrors.some(e => e.type === 'syntax'),
    hasTypeScriptErrors: allErrors.some(e => e.type === 'typescript'),
    hasBuildErrors: allErrors.some(e => e.type === 'build'),
    hasImportErrors: allErrors.some(e => e.type === 'import'),
    hasDependencyErrors: allErrors.some(e => e.type === 'dependency'),
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Automatically correct detected errors using AI
 */
export async function automaticallyCorrectErrors(
  projectFiles: Record<string, string>,
  errorDetection: ErrorDetectionResult,
  maxAttempts: number = 3
): Promise<CorrectionResult> {
  let correctedFiles = { ...projectFiles };
  const appliedFixes: string[] = [];
  let attempts = 0;
  let remainingErrors = errorDetection.errors;

  while (attempts < maxAttempts && remainingErrors.length > 0) {
    attempts++;
    console.log(`[AutomaticErrorCorrection] Correction attempt ${attempts}/${maxAttempts}`);

    try {
      const errorSummary = remainingErrors
        .slice(0, 5)
        .map(e => `${e.file}:${e.line} - ${e.message}`)
        .join('\n');

      const systemPrompt = `أنت متخصص في إصلاح أخطاء البرمجة. مهمتك هي إصلاح الأخطاء التالية في الكود:

${errorSummary}

قدم الملفات المصححة بصيغة JSON مع المسار الكامل للملف والمحتوى المصحح.`;

      const userPrompt = `الملفات الحالية:
${Object.entries(correctedFiles)
  .slice(0, 3)
  .map(([path, content]) => `\n${path}:\n${content.substring(0, 500)}...`)
  .join('\n')}

يرجى إصلاح الأخطاء المذكورة أعلاه.`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'claude-3.5-sonnet',
        max_tokens: 3000,
      });

      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content as string;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const corrections = JSON.parse(jsonMatch[0]);
          if (corrections.files) {
            for (const [filePath, newContent] of Object.entries(corrections.files)) {
              correctedFiles[filePath as string] = newContent as string;
              appliedFixes.push(`Fixed: ${filePath}`);
            }
          }
        }
      }

      // Re-detect errors after corrections
      const updatedDetection = detectAllErrors(correctedFiles, correctedFiles['package.json'] || '{}');
      remainingErrors = updatedDetection.errors;
    } catch (error) {
      console.error('[AutomaticErrorCorrection] Error during correction:', error);
      break;
    }
  }

  return {
    success: remainingErrors.length === 0,
    correctedCode: correctedFiles,
    appliedFixes,
    remainingErrors,
    attempts,
    maxAttemptsReached: attempts >= maxAttempts,
  };
}

/**
 * Generate error report
 */
export function generateErrorReport(detection: ErrorDetectionResult): string {
  let report = '## تقرير الأخطاء\n\n';

  if (detection.errors.length === 0 && detection.warnings.length === 0) {
    report += '✅ لا توجد أخطاء أو تحذيرات\n';
    return report;
  }

  if (detection.errors.length > 0) {
    report += `### ❌ الأخطاء (${detection.errors.length}):\n`;
    for (const error of detection.errors.slice(0, 10)) {
      report += `- **${error.file}** (سطر ${error.line}): ${error.message}\n`;
      if (error.suggestion) {
        report += `  💡 ${error.suggestion}\n`;
      }
    }
    if (detection.errors.length > 10) {
      report += `- ... و ${detection.errors.length - 10} أخطاء أخرى\n`;
    }
    report += '\n';
  }

  if (detection.warnings.length > 0) {
    report += `### ⚠️ التحذيرات (${detection.warnings.length}):\n`;
    for (const warning of detection.warnings.slice(0, 5)) {
      report += `- ${warning.message}\n`;
    }
    if (detection.warnings.length > 5) {
      report += `- ... و ${detection.warnings.length - 5} تحذيرات أخرى\n`;
    }
  }

  return report;
}
