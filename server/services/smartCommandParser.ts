import { invokeLLM } from '../_core/llm';

export interface ParsedCommand {
  type: 'edit' | 'create' | 'delete' | 'refactor' | 'debug' | 'optimize' | 'test' | 'unknown';
  action: string;
  target: string;
  description: string;
  files?: string[];
  parameters?: Record<string, any>;
  confidence: number;
}

export interface CommandSuggestion {
  command: string;
  description: string;
  expectedOutcome: string;
}

/**
 * Parse a natural language command into structured format
 */
export async function parseCommand(command: string, projectContext?: string): Promise<ParsedCommand> {
  try {
    const systemPrompt = `أنت محلل أوامر ذكي متخصص في فهم طلبات تطوير البرامج.
مهمتك هي تحويل الأوامر الطبيعية إلى أوامر منظمة يمكن تنفيذها.

يجب أن تحدد:
1. نوع الأمر (edit, create, delete, refactor, debug, optimize, test)
2. الإجراء المطلوب
3. الملفات المتأثرة
4. درجة الثقة (0-1)

أرجع الرد بصيغة JSON فقط.`;

    const userPrompt = `الأمر: "${command}"
${projectContext ? `سياق المشروع:\n${projectContext}` : ''}

يرجى تحليل الأمر وإرجاع JSON بالصيغة التالية:
{
  "type": "edit|create|delete|refactor|debug|optimize|test|unknown",
  "action": "الإجراء المطلوب",
  "target": "الملف أو المكون المستهدف",
  "description": "وصف مختصر للعملية",
  "files": ["الملفات المتأثرة"],
  "confidence": 0.95
}`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'claude-3.5-sonnet',
      max_tokens: 500,
    });

    if (response.choices && response.choices[0]?.message?.content) {
      const content = response.choices[0].message.content as string;
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          type: parsed.type || 'unknown',
          action: parsed.action || '',
          target: parsed.target || '',
          description: parsed.description || '',
          files: parsed.files || [],
          confidence: parsed.confidence || 0.5,
        };
      }
    }

    return {
      type: 'unknown',
      action: command,
      target: '',
      description: 'لم يتمكن من تحليل الأمر',
      confidence: 0,
    };
  } catch (error) {
    console.error('[SmartCommandParser] Error parsing command:', error);
    return {
      type: 'unknown',
      action: command,
      target: '',
      description: 'حدث خطأ في تحليل الأمر',
      confidence: 0,
    };
  }
}

/**
 * Generate command suggestions based on project context
 */
export async function generateCommandSuggestions(projectContext: string): Promise<CommandSuggestion[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `أنت مساعد ذكي متخصص في اقتراح تحسينات لمشاريع البرمجة.
اقترح 3-5 أوامر مفيدة يمكن تنفيذها على المشروع.`,
        },
        {
          role: 'user',
          content: `سياق المشروع:
${projectContext}

يرجى اقتراح أوامر مفيدة. أرجع الرد بصيغة JSON array:
[
  {
    "command": "الأمر المقترح",
    "description": "وصف الأمر",
    "expectedOutcome": "النتيجة المتوقعة"
  }
]`,
        },
      ],
      model: 'claude-3.5-sonnet',
      max_tokens: 1000,
    });

    if (response.choices && response.choices[0]?.message?.content) {
      const content = response.choices[0].message.content as string;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return [];
  } catch (error) {
    console.error('[SmartCommandParser] Error generating suggestions:', error);
    return [];
  }
}

/**
 * Validate if a command is safe to execute
 */
export function validateCommand(parsed: ParsedCommand): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check confidence level
  if (parsed.confidence < 0.5) {
    warnings.push('درجة الثقة منخفضة في فهم الأمر');
  }

  // Check for dangerous operations
  if (parsed.type === 'delete' && parsed.confidence < 0.8) {
    warnings.push('عملية حذف بدرجة ثقة منخفضة - يفضل المراجعة');
  }

  // Check if target is specified
  if (!parsed.target && parsed.type !== 'unknown') {
    warnings.push('لم يتم تحديد الملف أو المكون المستهدف بوضوح');
  }

  return {
    valid: warnings.length === 0 || parsed.confidence > 0.7,
    warnings,
  };
}

/**
 * Convert parsed command to execution plan
 */
export function commandToExecutionPlan(parsed: ParsedCommand): string {
  let plan = '';

  switch (parsed.type) {
    case 'edit':
      plan = `تعديل ${parsed.target}: ${parsed.description}`;
      break;
    case 'create':
      plan = `إنشاء ${parsed.target}: ${parsed.description}`;
      break;
    case 'delete':
      plan = `حذف ${parsed.target}: ${parsed.description}`;
      break;
    case 'refactor':
      plan = `إعادة هيكلة ${parsed.target}: ${parsed.description}`;
      break;
    case 'debug':
      plan = `تصحيح ${parsed.target}: ${parsed.description}`;
      break;
    case 'optimize':
      plan = `تحسين ${parsed.target}: ${parsed.description}`;
      break;
    case 'test':
      plan = `اختبار ${parsed.target}: ${parsed.description}`;
      break;
    default:
      plan = parsed.description;
  }

  if (parsed.files && parsed.files.length > 0) {
    plan += `\n\nالملفات المتأثرة: ${parsed.files.join(', ')}`;
  }

  return plan;
}

/**
 * Get command examples
 */
export function getCommandExamples(): Record<string, string[]> {
  return {
    edit: [
      'عدّل صفحة Home لإضافة قسم جديد',
      'حسّن تصميم الزر الأساسي',
      'أضف دعم اللغة العربية للنموذج',
    ],
    create: [
      'أنشئ مكون جديد للتعليقات',
      'أنشئ صفحة جديدة للإعدادات',
      'أنشئ خدمة API للمستخدمين',
    ],
    delete: [
      'احذف الملف غير المستخدم',
      'احذف المكون القديم',
    ],
    refactor: [
      'أعد هيكلة الكود لتحسين الأداء',
      'حسّن تنظيم المجلدات',
    ],
    debug: [
      'اصلح خطأ TypeScript في الملف',
      'صحح مشكلة الـ import',
    ],
    optimize: [
      'حسّن أداء الصفحة',
      'قلل حجم الحزمة',
    ],
  };
}
