import { generateWebsiteCode } from './aiCodeGenerator';
import { runValidationPipeline, generateValidationReport } from './validationPipeline';
import { detectAllErrors, automaticallyCorrectErrors, generateErrorReport } from './automaticErrorCorrection';

export interface ProjectTemplate {
  name: string;
  type: string;
  prompt: string;
  expectedFeatures: string[];
}

export interface TestResult {
  projectName: string;
  projectType: string;
  generationTime: number;
  validationTime: number;
  correctionAttempts: number;
  finalStatus: 'passed' | 'failed' | 'corrected';
  validationResults: any;
  errors: string[];
  warnings: string[];
}

export interface StressTestReport {
  totalProjects: number;
  passedProjects: number;
  failedProjects: number;
  correctedProjects: number;
  averageGenerationTime: number;
  averageValidationTime: number;
  totalCorrectionAttempts: number;
  results: TestResult[];
  successRate: number;
}

/**
 * Project templates for stress testing
 */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    name: 'SaaS Dashboard',
    type: 'saas-dashboard',
    prompt: `أنشئ لوحة تحكم SaaS احترافية تتضمن:
- شريط تنقل جانبي مع قائمة المستخدم
- لوحة رئيسية بإحصائيات ورسوم بيانية
- جداول بيانات قابلة للفرز والتصفية
- نماذج إدارة المستخدمين
- إعدادات الحساب
- نظام إشعارات
استخدم React 19, TypeScript, Tailwind CSS, وشاركل جميلة.`,
    expectedFeatures: ['dashboard', 'charts', 'users', 'settings', 'notifications'],
  },
  {
    name: 'CRM System',
    type: 'crm',
    prompt: `أنشئ نظام إدارة علاقات العملاء (CRM) متكامل يتضمن:
- قائمة العملاء مع تفاصيل شاملة
- إدارة الفرص والعروض
- تتبع المبيعات والعقود
- نظام المهام والتذكيرات
- تقارير وتحليلات
- تقويم الأنشطة
استخدم React 19, TypeScript, Tailwind CSS.`,
    expectedFeatures: ['customers', 'opportunities', 'sales', 'tasks', 'reports'],
  },
  {
    name: 'Blog Platform',
    type: 'blog',
    prompt: `أنشئ منصة مدونة حديثة تتضمن:
- صفحة رئيسية بآخر المقالات
- صفحة مقالة واحدة مع التعليقات
- نظام البحث والفئات
- ملف تعريفي للكاتب
- نموذج الاشتراك بالنشرة البريدية
- شريط جانبي بالمقالات الشهيرة
استخدم React 19, TypeScript, Tailwind CSS, وتصميم حديث.`,
    expectedFeatures: ['articles', 'comments', 'search', 'categories', 'author'],
  },
  {
    name: 'E-commerce Store',
    type: 'ecommerce',
    prompt: `أنشئ متجر إلكتروني احترافي يتضمن:
- صفحة المنتجات مع الفلاتر والبحث
- صفحة تفاصيل المنتج
- سلة التسوق
- صفحة الدفع
- نظام المراجعات والتقييمات
- صفحة الطلبات
- نظام الفئات والعلامات
استخدم React 19, TypeScript, Tailwind CSS.`,
    expectedFeatures: ['products', 'cart', 'checkout', 'reviews', 'orders'],
  },
  {
    name: 'Landing Page',
    type: 'landing-page',
    prompt: `أنشئ صفحة هبوط (Landing Page) احترافية وجذابة تتضمن:
- رأس مثير مع CTA واضح
- قسم الميزات الرئيسية
- قسم الأسعار
- شهادات العملاء
- قسم الأسئلة الشائعة
- نموذج الاشتراك
- تذييل مع روابط
استخدم React 19, TypeScript, Tailwind CSS, وتصميم عصري.`,
    expectedFeatures: ['hero', 'features', 'pricing', 'testimonials', 'faq'],
  },
  {
    name: 'Portfolio Website',
    type: 'portfolio',
    prompt: `أنشئ موقع محفظة (Portfolio) احترافي للمطورين يتضمن:
- صفحة رئيسية مع ملخص شخصي
- قسم المشاريع مع صور وتفاصيل
- قسم المهارات والخبرة
- صفحة المدونة
- نموذج التواصل
- روابط وسائل التواصل
- تأثيرات انتقالية سلسة
استخدم React 19, TypeScript, Tailwind CSS.`,
    expectedFeatures: ['projects', 'skills', 'blog', 'contact', 'social'],
  },
  {
    name: 'AI Chatbot',
    type: 'ai-chatbot',
    prompt: `أنشئ واجهة chatbot ذكية تتضمن:
- نافذة محادثة مع رسائل محسّنة
- نموذج إدخال الرسائل
- عرض حالة الكتابة
- نظام الموضوعات (Dark/Light)
- سجل المحادثات
- اقتراحات الأسئلة
- نموذج التقييم
استخدم React 19, TypeScript, Tailwind CSS.`,
    expectedFeatures: ['chat', 'messages', 'suggestions', 'history', 'rating'],
  },
  {
    name: 'Admin Panel',
    type: 'admin-panel',
    prompt: `أنشئ لوحة إدارة شاملة تتضمن:
- لوحة رئيسية بالإحصائيات
- إدارة المستخدمين والأدوار
- إدارة المحتوى والصفحات
- إدارة الإعدادات
- سجل الأنشطة والتدقيق
- نظام الإخطارات
- تقارير مفصلة
استخدم React 19, TypeScript, Tailwind CSS.`,
    expectedFeatures: ['users', 'content', 'settings', 'audit', 'reports'],
  },
];

/**
 * Generate a project from template
 */
export async function generateProjectFromTemplate(
  template: ProjectTemplate,
  userId: string,
  projectId: string
): Promise<{ success: boolean; files: Record<string, string>; generationTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    const result = await generateWebsiteCode({
      prompt: template.prompt,
      projectId,
      userId,
    });

    if (!result.success || !result.code) {
      return {
        success: false,
        files: {},
        generationTime: Date.now() - startTime,
        error: result.message,
      };
    }

    // Create basic project structure
    const files: Record<string, string> = {
      'package.json': JSON.stringify({
        name: template.name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          vite: '^7.0.0',
          typescript: '^5.0.0',
          'tailwindcss': '^3.0.0',
        },
      }, null, 2),
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      'src/App.tsx': `import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <h1 className="text-4xl font-bold text-white">Welcome</h1>
    </div>
  )
}`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${template.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    };

    return {
      success: true,
      files,
      generationTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      files: {},
      generationTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test a single project
 */
export async function testSingleProject(
  template: ProjectTemplate,
  userId: string,
  projectId: string
): Promise<TestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  let correctionAttempts = 0;
  let finalStatus: 'passed' | 'failed' | 'corrected' = 'failed';
  let projectFiles: Record<string, string> = {};

  try {
    // Step 1: Generate project
    console.log(`[StressTest] Generating ${template.name}...`);
    const genResult = await generateProjectFromTemplate(template, userId, projectId);

    if (!genResult.success) {
      errors.push(`Generation failed: ${genResult.error}`);
      return {
        projectName: template.name,
        projectType: template.type,
        generationTime: genResult.generationTime,
        validationTime: 0,
        correctionAttempts,
        finalStatus,
        validationResults: {},
        errors,
        warnings,
      };
    }

    projectFiles = genResult.files;

    // Step 2: Detect errors
    console.log(`[StressTest] Detecting errors in ${template.name}...`);
    const errorDetection = detectAllErrors(projectFiles, projectFiles['package.json'] || '{}');

    if (errorDetection.errors.length > 0) {
      console.log(`[StressTest] Found ${errorDetection.errors.length} errors, attempting correction...`);

      // Step 3: Attempt automatic correction
      const correctionResult = await automaticallyCorrectErrors(projectFiles, errorDetection, 3);
      correctionAttempts = correctionResult.attempts;
      projectFiles = correctionResult.correctedCode;

      if (correctionResult.success) {
        finalStatus = 'corrected';
        correctionResult.appliedFixes.forEach(fix => warnings.push(fix));
      } else {
        correctionResult.remainingErrors.forEach(err => errors.push(`${err.file}: ${err.message}`));
      }
    }

    // Step 4: Run validation pipeline
    console.log(`[StressTest] Running validation pipeline for ${template.name}...`);
    const validationStart = Date.now();
    const validationResult = await runValidationPipeline(template.name, projectFiles);
    const validationTime = Date.now() - validationStart;

    if (validationResult.failedSteps === 0) {
      finalStatus = finalStatus === 'corrected' ? 'corrected' : 'passed';
    } else {
      finalStatus = 'failed';
      for (const [stepName, result] of Array.from(validationResult.results)) {
        if (!result.passed && result.errors) {
          result.errors.forEach((err: string) => errors.push(`${stepName}: ${err}`));
        }
      }
    }

    return {
      projectName: template.name,
      projectType: template.type,
      generationTime: genResult.generationTime,
      validationTime,
      correctionAttempts,
      finalStatus,
      validationResults: Object.fromEntries(validationResult.results),
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      projectName: template.name,
      projectType: template.type,
      generationTime: 0,
      validationTime: 0,
      correctionAttempts,
      finalStatus,
      validationResults: {},
      errors,
      warnings,
    };
  }
}

/**
 * Run stress test on all templates
 */
export async function runStressTest(userId: string): Promise<StressTestReport> {
  const results: TestResult[] = [];
  let passedProjects = 0;
  let failedProjects = 0;
  let correctedProjects = 0;
  let totalGenerationTime = 0;
  let totalValidationTime = 0;
  let totalCorrectionAttempts = 0;

  console.log(`[StressTest] Starting stress test with ${PROJECT_TEMPLATES.length} projects...`);

  for (let i = 0; i < PROJECT_TEMPLATES.length; i++) {
    const template = PROJECT_TEMPLATES[i];
    const projectId = `stress-test-${i}-${Date.now()}`;

    console.log(`[StressTest] Testing ${i + 1}/${PROJECT_TEMPLATES.length}: ${template.name}`);

    const result = await testSingleProject(template, userId, projectId);
    results.push(result);

    totalGenerationTime += result.generationTime;
    totalValidationTime += result.validationTime;
    totalCorrectionAttempts += result.correctionAttempts;

    if (result.finalStatus === 'passed') {
      passedProjects++;
    } else if (result.finalStatus === 'corrected') {
      correctedProjects++;
    } else {
      failedProjects++;
    }

    console.log(`[StressTest] Result: ${result.finalStatus.toUpperCase()}`);
  }

  const totalProjects = results.length;
  const successRate = ((passedProjects + correctedProjects) / totalProjects) * 100;

  return {
    totalProjects,
    passedProjects,
    failedProjects,
    correctedProjects,
    averageGenerationTime: totalGenerationTime / totalProjects,
    averageValidationTime: totalValidationTime / totalProjects,
    totalCorrectionAttempts,
    results,
    successRate,
  };
}

/**
 * Generate stress test report
 */
export function generateStressTestReport(report: StressTestReport): string {
  let markdown = `# تقرير اختبار الجهد (Stress Test Report)\n\n`;

  markdown += `## الملخص التنفيذي\n`;
  markdown += `- **إجمالي المشاريع:** ${report.totalProjects}\n`;
  markdown += `- **المشاريع الناجحة:** ${report.passedProjects} ✅\n`;
  markdown += `- **المشاريع المصححة:** ${report.correctedProjects} 🔧\n`;
  markdown += `- **المشاريع الفاشلة:** ${report.failedProjects} ❌\n`;
  markdown += `- **معدل النجاح:** ${report.successRate.toFixed(2)}%\n\n`;

  markdown += `## الإحصائيات\n`;
  markdown += `- **متوسط وقت الإنشاء:** ${report.averageGenerationTime.toFixed(2)}ms\n`;
  markdown += `- **متوسط وقت التحقق:** ${report.averageValidationTime.toFixed(2)}ms\n`;
  markdown += `- **إجمالي محاولات التصحيح:** ${report.totalCorrectionAttempts}\n\n`;

  markdown += `## تفاصيل المشاريع\n\n`;

  for (const result of report.results) {
    const status = result.finalStatus === 'passed' ? '✅' : result.finalStatus === 'corrected' ? '🔧' : '❌';
    markdown += `### ${status} ${result.projectName} (${result.projectType})\n`;
    markdown += `- **الحالة:** ${result.finalStatus}\n`;
    markdown += `- **وقت الإنشاء:** ${result.generationTime}ms\n`;
    markdown += `- **وقت التحقق:** ${result.validationTime}ms\n`;
    markdown += `- **محاولات التصحيح:** ${result.correctionAttempts}\n`;

    if (result.errors.length > 0) {
      markdown += `- **الأخطاء:** ${result.errors.slice(0, 2).join(', ')}\n`;
    }

    markdown += '\n';
  }

  return markdown;
}
