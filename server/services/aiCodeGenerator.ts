import { invokeLLM } from '../_core/llm';

export interface GenerationRequest {
  prompt: string;
  projectId: string;
  userId: string;
}

export interface GeneratedCode {
  html: string;
  css: string;
  js: string;
  metadata: {
    title: string;
    description: string;
    generatedAt: Date;
    model: string;
  };
}

export interface GenerationResponse {
  success: boolean;
  code?: GeneratedCode;
  error?: string;
  message: string;
}

/**
 * Parse generated code from LLM response with multiple fallback strategies
 */
function parseGeneratedCode(responseText: string): { html: string; css: string; js: string } {
  console.log('[Parse] Starting parse, response length:', responseText.length);
  
  let html = '';
  let css = '';
  let js = '';

  // Strategy 1: Try tag-based extraction
  const htmlTagMatch = responseText.match(/<html>([\s\S]*?)<\/html>/i);
  if (htmlTagMatch) {
    html = htmlTagMatch[1].trim();
    console.log('[Parse] HTML extracted from tags:', html.length, 'chars');
  }

  const cssTagMatch = responseText.match(/<css>([\s\S]*?)<\/css>/i);
  if (cssTagMatch) {
    css = cssTagMatch[1].trim();
    console.log('[Parse] CSS extracted from tags:', css.length, 'chars');
  }

  const jsTagMatch = responseText.match(/<javascript>([\s\S]*?)<\/javascript>/i);
  if (jsTagMatch) {
    js = jsTagMatch[1].trim();
    console.log('[Parse] JS extracted from tags:', js.length, 'chars');
  }

  // Strategy 2: Try markdown code blocks
  if (!html) {
    const htmlMarkdownMatch = responseText.match(/```html\n([\s\S]*?)\n```/i);
    if (htmlMarkdownMatch) {
      html = htmlMarkdownMatch[1].trim();
      console.log('[Parse] HTML extracted from markdown:', html.length, 'chars');
    }
  }

  if (!css) {
    const cssMarkdownMatch = responseText.match(/```css\n([\s\S]*?)\n```/i);
    if (cssMarkdownMatch) {
      css = cssMarkdownMatch[1].trim();
      console.log('[Parse] CSS extracted from markdown:', css.length, 'chars');
    }
  }

  if (!js) {
    const jsMarkdownMatch = responseText.match(/```(?:javascript|js)\n([\s\S]*?)\n```/i);
    if (jsMarkdownMatch) {
      js = jsMarkdownMatch[1].trim();
      console.log('[Parse] JS extracted from markdown:', js.length, 'chars');
    }
  }

  // Strategy 3: Try raw HTML extraction
  if (!html && (responseText.includes('<!DOCTYPE') || responseText.includes('<html'))) {
    const rawHtmlMatch = responseText.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
    if (rawHtmlMatch) {
      html = rawHtmlMatch[1].trim();
      console.log('[Parse] HTML extracted from raw:', html.length, 'chars');
    }
  }

  // Strategy 4: If HTML still not found, try to find the first <html> tag
  if (!html && responseText.includes('<html')) {
    const startIdx = responseText.indexOf('<html');
    const endIdx = responseText.indexOf('</html>', startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
      html = responseText.substring(startIdx, endIdx + 7).trim();
      console.log('[Parse] HTML extracted from substring:', html.length, 'chars');
    }
  }

  // Provide fallback JS if not found
  if (!js) {
    js = 'document.addEventListener("DOMContentLoaded", function() { console.log("Website loaded successfully"); });';
    console.log('[Parse] Using fallback JS');
  }

  console.log('[Parse] Final result - HTML:', html.length > 0, 'CSS:', css.length > 0, 'JS:', js.length > 0);
  
  return { html, css, js };
}

/**
 * Extract metadata from HTML
 */
function extractMetadata(html: string) {
  try {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch?.[1] || 'موقع جديد';
    
    const descriptionMatch = html.match(/<meta\s+name=['"]description['"]\s+content=['"]([^'"]*)['"]/i);
    const description = descriptionMatch?.[1] || '';

    return {
      title,
      description,
      generatedAt: new Date(),
      model: 'claude-3.5-sonnet',
    };
  } catch (error) {
    console.error('[Metadata] Extraction error:', error);
    return {
      title: 'موقع جديد',
      description: '',
      generatedAt: new Date(),
      model: 'claude-3.5-sonnet',
    };
  }
}

/**
 * Generate website code from Arabic natural language prompt using Claude AI
 */
export async function generateWebsiteCode(
  request: GenerationRequest
): Promise<GenerationResponse> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[AI Code Generator] Attempt ${attempt + 1}/${maxRetries}`);
      console.log('[AI Code Generator] Prompt:', request.prompt.substring(0, 100));

      if (!request.prompt || request.prompt.trim().length < 5) {
        return {
          success: false,
          message: 'الوصف قصير جداً. يرجى إدخال وصف أكثر تفصيلاً (على الأقل 5 أحرف)',
          error: 'Prompt too short',
        };
      }

      const systemPrompt = `أنت مساعد متخصص في تطوير المواقع. مهمتك هي تحويل وصف الموقع من المستخدم إلى كود HTML و CSS و JavaScript احترافي.

المتطلبات:
1. الكود يجب أن يكون نظيفاً وجاهزاً للاستخدام
2. استخدم أفضل الممارسات في البرمجة
3. تأكد من أن الموقع responsive ويعمل على جميع الأجهزة
4. استخدم تصميماً حديثاً واحترافياً
5. أضف تأثيرات CSS سلسة وجميلة
6. اجعل الموقع متوافقاً مع معايير الويب

عند الانتهاء، قدم الكود في الصيغة التالية بالضبط:
<html>
[كود HTML هنا - يجب أن يكون كاملاً مع DOCTYPE و head و body]
</html>

<css>
[كود CSS هنا - جميع الأنماط]
</css>

<javascript>
[كود JavaScript هنا - جميع الوظائف]
</javascript>`;

      const userPrompt = `قم بإنشاء موقع ويب بناءً على الوصف التالي:

${request.prompt}

تأكد من أن الموقع:
- احترافي وحديث
- يحتوي على تصميم جميل
- متجاوب (Responsive)
- يعمل بسلاسة
- يحتوي على تأثيرات CSS جميلة

تذكر: يجب أن تكون الاستجابة بالصيغة المحددة أعلاه مع الوسوم <html>, <css>, <javascript>`;

      console.log('[AI Code Generator] Calling LLM API...');
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'claude-3.5-sonnet',
        max_tokens: 4000,
      });

      console.log('[AI Code Generator] API Response received');
      console.log('[AI Code Generator] Response model:', response.model);
      console.log('[AI Code Generator] Response choices:', response.choices?.length);

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No choices in API response');
      }

      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error('No message in API response');
      }

      let responseText = '';
      if (typeof message.content === 'string') {
        responseText = message.content;
      } else if (Array.isArray(message.content)) {
        responseText = message.content
          .filter(item => typeof item === 'string' || (item && 'text' in item))
          .map(item => (typeof item === 'string' ? item : (item as any).text))
          .join('\n');
      }

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response content');
      }

      console.log('[AI Code Generator] Response text length:', responseText.length);
      console.log('[AI Code Generator] Response preview:', responseText.substring(0, 300));

      const parsed = parseGeneratedCode(responseText);

      if (!parsed.html || parsed.html.trim().length === 0) {
        console.error('[AI Code Generator] HTML extraction failed');
        throw new Error('Failed to extract HTML from response');
      }

      const metadata = extractMetadata(parsed.html);

      const result: GeneratedCode = {
        html: parsed.html,
        css: parsed.css,
        js: parsed.js,
        metadata,
      };

      console.log('[AI Code Generator] Generation successful');
      console.log('[AI Code Generator] Generated HTML length:', parsed.html.length);
      console.log('[AI Code Generator] Generated CSS length:', parsed.css.length);
      console.log('[AI Code Generator] Generated JS length:', parsed.js.length);

      return {
        success: true,
        code: result,
        message: 'تم توليد الموقع بنجاح! ✨',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[AI Code Generator] Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        const delayMs = 1000 * Math.pow(2, attempt);
        console.log(`[AI Code Generator] Retrying after ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('[AI Code Generator] All retries exhausted');
  const errorMessage = lastError?.message || 'Unknown error';

  return {
    success: false,
    error: errorMessage,
    message: `حدث خطأ ❌ فشل في توليد الكود. يرجى محاولة وصف أكثر تفصيلاً. (${errorMessage.substring(0, 80)})`,
  };
}

/**
 * Refine existing website code based on user feedback
 */
export async function refineWebsiteCode(
  currentCode: GeneratedCode,
  feedback: string,
  userId: string
): Promise<GenerationResponse> {
  try {
    console.log('[AI Code Refiner] Starting refinement');

    const systemPrompt = `أنت مساعد متخصص في تطوير وتحسين المواقع. مهمتك هي تحسين كود الموقع بناءً على ملاحظات المستخدم.

قم بتحسين الكود بناءً على الملاحظات المعطاة مع الحفاظ على البنية الأساسية.

عند الانتهاء، قدم الكود المحسّن في الصيغة التالية بالضبط:
<html>
[كود HTML محسّن]
</html>

<css>
[كود CSS محسّن]
</css>

<javascript>
[كود JavaScript محسّن]
</javascript>`;

    const userPrompt = `الكود الحالي:

HTML:
${currentCode.html}

CSS:
${currentCode.css}

JavaScript:
${currentCode.js}

ملاحظات التحسين:
${feedback}

يرجى تحسين الكود بناءً على الملاحظات أعلاه.`;

    console.log('[AI Code Refiner] Calling LLM API...');
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'claude-3.5-sonnet',
      max_tokens: 4000,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices in API response');
    }

    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('No message in API response');
    }

    let responseText = '';
    if (typeof message.content === 'string') {
      responseText = message.content;
    } else if (Array.isArray(message.content)) {
      responseText = message.content
        .filter(item => typeof item === 'string' || (item && 'text' in item))
        .map(item => (typeof item === 'string' ? item : (item as any).text))
        .join('\n');
    }

    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response content');
    }

    const parsed = parseGeneratedCode(responseText);

    if (!parsed.html || parsed.html.trim().length === 0) {
      throw new Error('Failed to extract HTML from response');
    }

    const metadata = extractMetadata(parsed.html);

    const result: GeneratedCode = {
      html: parsed.html,
      css: parsed.css,
      js: parsed.js,
      metadata,
    };

    console.log('[AI Code Refiner] Refinement successful');

    return {
      success: true,
      code: result,
      message: 'تم تحسين الموقع بنجاح! ✨',
    };
  } catch (error) {
    console.error('[AI Code Refiner] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
      message: `حدث خطأ في تحسين الموقع. يرجى المحاولة مرة أخرى. (${errorMessage.substring(0, 80)})`,
    };
  }
}
