import { detectAllErrors, generateErrorReport, automaticallyCorrectErrors } from './automaticErrorCorrection';

export interface ValidationStep {
  name: string;
  description: string;
  check: (projectFiles: Record<string, string>) => Promise<ValidationResult>;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
  errors?: string[];
}

export interface PipelineResult {
  projectName: string;
  overallStatus: 'passed' | 'failed' | 'corrected';
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  correctionAttempts: number;
  results: Map<string, ValidationResult>;
  executionTime: number;
}

/**
 * Validate frontend build
 */
export async function validateFrontendBuild(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    // Check for required frontend files
    const requiredFiles = ['package.json', 'vite.config.ts', 'tsconfig.json'];
    const missingFiles = requiredFiles.filter(f => !(f in projectFiles));

    if (missingFiles.length > 0) {
      return {
        passed: false,
        message: `Frontend build validation failed`,
        errors: missingFiles.map(f => `Missing required file: ${f}`),
      };
    }

    // Check package.json has required dependencies
    const packageJson = JSON.parse(projectFiles['package.json'] || '{}');
    const requiredDeps = ['react', 'react-dom', 'vite'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]);

    if (missingDeps.length > 0) {
      return {
        passed: false,
        message: `Frontend build validation failed`,
        errors: missingDeps.map(dep => `Missing dependency: ${dep}`),
      };
    }

    return {
      passed: true,
      message: 'Frontend build validation passed',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Frontend build validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate backend build
 */
export async function validateBackendBuild(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    // Check for required backend files
    const hasBackend = Object.keys(projectFiles).some(f => f.includes('server/') || f.includes('api/'));

    if (!hasBackend) {
      return {
        passed: true,
        message: 'No backend detected (frontend-only project)',
      };
    }

    const packageJson = JSON.parse(projectFiles['package.json'] || '{}');
    const hasExpressOrFastapi = packageJson.dependencies?.express || packageJson.dependencies?.fastapi;

    if (!hasExpressOrFastapi) {
      return {
        passed: false,
        message: 'Backend detected but no server framework found',
        errors: ['Missing Express or FastAPI'],
      };
    }

    return {
      passed: true,
      message: 'Backend build validation passed',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Backend build validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate API compilation
 */
export async function validateAPICompilation(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    const apiFiles = Object.entries(projectFiles)
      .filter(([path]) => path.includes('/api/') || path.includes('/routes/'))
      .map(([path, content]) => ({ path, content }));

    if (apiFiles.length === 0) {
      return {
        passed: true,
        message: 'No API files detected',
      };
    }

    const errors: string[] = [];

    for (const { path, content } of apiFiles) {
      // Check for syntax errors
      if (content.includes('async') && !content.includes('await') && content.includes('Promise')) {
        errors.push(`${path}: Async function without await`);
      }

      // Check for proper exports
      if (!content.includes('export') && !content.includes('module.exports')) {
        errors.push(`${path}: No exports found`);
      }
    }

    if (errors.length > 0) {
      return {
        passed: false,
        message: 'API compilation validation failed',
        errors,
      };
    }

    return {
      passed: true,
      message: 'API compilation validation passed',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'API compilation validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate database schema
 */
export async function validateDatabaseSchema(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    const schemaFiles = Object.entries(projectFiles)
      .filter(([path]) => path.includes('schema') || path.includes('migration'))
      .map(([path]) => path);

    if (schemaFiles.length === 0) {
      return {
        passed: true,
        message: 'No database schema detected',
      };
    }

    const schemaContent = projectFiles[schemaFiles[0]] || '';
    const errors: string[] = [];

    // Check for basic schema structure
    if (!schemaContent.includes('table') && !schemaContent.includes('Table')) {
      errors.push('Schema file missing table definitions');
    }

    if (errors.length > 0) {
      return {
        passed: false,
        message: 'Database schema validation failed',
        errors,
      };
    }

    return {
      passed: true,
      message: 'Database schema validation passed',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Database schema validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate no missing imports
 */
export async function validateNoMissingImports(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    const errors: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;

    for (const [filePath, content] of Object.entries(projectFiles)) {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;

      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // Check relative imports
        if (importPath.startsWith('.')) {
          // Verify the imported file exists
          const resolvedPath = importPath.endsWith('.ts') || importPath.endsWith('.tsx')
            ? importPath
            : `${importPath}.ts`;

          const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
          const fullPath = `${fileDir}/${resolvedPath}`;

          if (!Object.keys(projectFiles).some(f => f.endsWith(resolvedPath) || f === fullPath)) {
            errors.push(`${filePath}: Missing import ${importPath}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return {
        passed: false,
        message: 'Missing imports detected',
        errors: errors.slice(0, 5),
      };
    }

    return {
      passed: true,
      message: 'No missing imports detected',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Import validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate no missing dependencies
 */
export async function validateNoMissingDependencies(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    const packageJson = JSON.parse(projectFiles['package.json'] || '{}');
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const errors: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([@\w\-/]+)['"]/g;

    for (const [filePath, content] of Object.entries(projectFiles)) {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;

      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const packageName = match[1];
        if (packageName.startsWith('.')) continue;

        const baseName = packageName.startsWith('@')
          ? packageName.split('/').slice(0, 2).join('/')
          : packageName.split('/')[0];

        if (!(baseName in allDeps) && !isBuiltIn(baseName)) {
          errors.push(`${filePath}: Missing dependency ${baseName}`);
        }
      }
    }

    if (errors.length > 0) {
      return {
        passed: false,
        message: 'Missing dependencies detected',
        errors: errors.slice(0, 5),
      };
    }

    return {
      passed: true,
      message: 'All dependencies present',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Dependency validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate no TypeScript errors
 */
export async function validateNoTypeScriptErrors(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    const errorDetection = detectAllErrors(projectFiles, projectFiles['package.json'] || '{}');

    if (errorDetection.hasTypeScriptErrors || errorDetection.errors.length > 0) {
      return {
        passed: false,
        message: 'TypeScript errors detected',
        errors: errorDetection.errors.slice(0, 5).map(e => `${e.file}:${e.line} - ${e.message}`),
      };
    }

    return {
      passed: true,
      message: 'No TypeScript errors',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'TypeScript validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate no ESLint errors
 */
export async function validateNoESLintErrors(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    const eslintConfig = projectFiles['.eslintrc.json'] || projectFiles['.eslintrc.js'];

    if (!eslintConfig) {
      return {
        passed: true,
        message: 'No ESLint configuration found',
      };
    }

    // Basic ESLint checks
    const errors: string[] = [];

    for (const [filePath, content] of Object.entries(projectFiles)) {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;

      // Check for console.log in production code
      if (content.includes('console.log') && !filePath.includes('test') && !filePath.includes('spec')) {
        errors.push(`${filePath}: console.log found in production code`);
      }

      // Check for var usage
      if (content.match(/\bvar\s+\w+/)) {
        errors.push(`${filePath}: var keyword used (prefer const/let)`);
      }
    }

    if (errors.length > 0) {
      return {
        passed: false,
        message: 'ESLint violations detected',
        errors: errors.slice(0, 5),
      };
    }

    return {
      passed: true,
      message: 'No ESLint violations',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'ESLint validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate no runtime crashes
 */
export async function validateNoRuntimeCrashes(projectFiles: Record<string, string>): Promise<ValidationResult> {
  try {
    const errors: string[] = [];

    for (const [filePath, content] of Object.entries(projectFiles)) {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;

      // Check for potential runtime errors
      if (content.includes('null.') || content.includes('undefined.')) {
        errors.push(`${filePath}: Potential null/undefined access`);
      }

      // Check for missing error handling
      if (content.includes('async') && !content.includes('try') && !content.includes('catch')) {
        errors.push(`${filePath}: Async function without error handling`);
      }
    }

    if (errors.length > 0) {
      return {
        passed: false,
        message: 'Potential runtime errors detected',
        errors: errors.slice(0, 5),
      };
    }

    return {
      passed: true,
      message: 'No obvious runtime errors',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Runtime validation error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Check if module is built-in
 */
function isBuiltIn(moduleName: string): boolean {
  const builtins = ['fs', 'path', 'http', 'https', 'os', 'util', 'events', 'stream'];
  return builtins.includes(moduleName);
}

/**
 * Run the complete validation pipeline
 */
export async function runValidationPipeline(
  projectName: string,
  projectFiles: Record<string, string>
): Promise<PipelineResult> {
  const startTime = Date.now();
  const results = new Map<string, ValidationResult>();

  const validationSteps: ValidationStep[] = [
    {
      name: 'Frontend Build',
      description: 'Validate frontend build configuration',
      check: validateFrontendBuild,
    },
    {
      name: 'Backend Build',
      description: 'Validate backend build configuration',
      check: validateBackendBuild,
    },
    {
      name: 'API Compilation',
      description: 'Validate API files compile',
      check: validateAPICompilation,
    },
    {
      name: 'Database Schema',
      description: 'Validate database schema',
      check: validateDatabaseSchema,
    },
    {
      name: 'No Missing Imports',
      description: 'Validate no missing imports',
      check: validateNoMissingImports,
    },
    {
      name: 'No Missing Dependencies',
      description: 'Validate all dependencies are present',
      check: validateNoMissingDependencies,
    },
    {
      name: 'No TypeScript Errors',
      description: 'Validate no TypeScript errors',
      check: validateNoTypeScriptErrors,
    },
    {
      name: 'No ESLint Errors',
      description: 'Validate no ESLint violations',
      check: validateNoESLintErrors,
    },
    {
      name: 'No Runtime Crashes',
      description: 'Validate no obvious runtime errors',
      check: validateNoRuntimeCrashes,
    },
  ];

  let passedSteps = 0;
  let failedSteps = 0;
  let correctionAttempts = 0;

  for (const step of validationSteps) {
    try {
      const result = await step.check(projectFiles);
      results.set(step.name, result);

      if (result.passed) {
        passedSteps++;
      } else {
        failedSteps++;
      }
    } catch (error) {
      results.set(step.name, {
        passed: false,
        message: `${step.name} validation error`,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
      failedSteps++;
    }
  }

  const executionTime = Date.now() - startTime;
  let overallStatus: 'passed' | 'failed' | 'corrected' = failedSteps === 0 ? 'passed' : 'failed';

  return {
    projectName,
    overallStatus,
    totalSteps: validationSteps.length,
    passedSteps,
    failedSteps,
    correctionAttempts,
    results,
    executionTime,
  };
}

/**
 * Generate validation report
 */
export function generateValidationReport(result: PipelineResult): string {
  let report = `# تقرير التحقق من المشروع: ${result.projectName}\n\n`;
  report += `**الحالة:** ${result.overallStatus === 'passed' ? '✅ نجح' : result.overallStatus === 'corrected' ? '🔧 تم التصحيح' : '❌ فشل'}\n`;
  report += `**النتيجة:** ${result.passedSteps}/${result.totalSteps} خطوات نجحت\n`;
  report += `**وقت التنفيذ:** ${result.executionTime}ms\n\n`;

  report += '## تفاصيل الخطوات:\n\n';

  for (const [stepName, stepResult] of Array.from(result.results)) {
    const status = stepResult.passed ? '✅' : '❌';
    report += `### ${status} ${stepName}\n`;
    report += `${stepResult.message}\n`;
    if (stepResult.errors && stepResult.errors.length > 0) {
      report += '\nالأخطاء:\n';
      for (const error of stepResult.errors) {
        report += `- ${error}\n`;
      }
    }
    report += '\n';
  }

  return report;
}
