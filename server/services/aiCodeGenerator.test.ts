import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateWebsiteCode, refineWebsiteCode } from './aiCodeGenerator';
import * as llmModule from '../_core/llm';

// Mock the LLM module
vi.mock('../_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

describe('AI Code Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateWebsiteCode', () => {
    it('should return success response with generated code', async () => {
      const mockResponse = {
        id: 'test-id',
        created: Date.now(),
        model: 'claude-3.5-sonnet',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: `
<html>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>محفظتي الشخصية</title>
</head>
<body>
  <h1>مرحباً بك في محفظتي</h1>
  <p>هذا موقع يعرض أعمالي وإنجازاتي</p>
</body>
</html>
</html>

<css>
body {
  font-family: 'Cairo', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: 0;
  padding: 20px;
  min-height: 100vh;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
  font-size: 1.1rem;
  opacity: 0.9;
}
</css>

<javascript>
document.addEventListener('DOMContentLoaded', function() {
  console.log('محفظتي الشخصية جاهزة');
  document.body.style.animation = 'fadeIn 0.5s ease-in';
});
</javascript>
              `,
            },
            finish_reason: 'stop',
          },
        ],
      };

      vi.mocked(llmModule.invokeLLM).mockResolvedValueOnce(mockResponse);

      const result = await generateWebsiteCode({
        prompt: 'موقع بسيط لعرض المحفظة الشخصية',
        projectId: 'test-project',
        userId: 'test-user',
      });

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.code?.html).toContain('محفظتي');
      expect(result.code?.css).toContain('body');
      expect(result.code?.js).toContain('DOMContentLoaded');
      expect(result.message).toContain('نجاح');
    }, { timeout: 10000 });

    it('should handle invalid prompts gracefully', async () => {
      const result = await generateWebsiteCode({
        prompt: 'x', // Too short
        projectId: 'test-project',
        userId: 'test-user',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('قصير');
    });

    it('should handle API errors with retries', async () => {
      vi.mocked(llmModule.invokeLLM).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await generateWebsiteCode({
        prompt: 'موقع تجريبي',
        projectId: 'test-project',
        userId: 'test-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, { timeout: 10000 });
  });

  describe('refineWebsiteCode', () => {
    it('should refine existing code based on feedback', async () => {
      const mockResponse = {
        id: 'test-id',
        created: Date.now(),
        model: 'claude-3.5-sonnet',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: `
<html>
<!DOCTYPE html>
<html>
<head><title>محسّن</title></head>
<body><h1>محسّن</h1></body>
</html>
</html>

<css>
body { color: #ff6b6b; }
</css>

<javascript>
console.log('refined');
</javascript>
              `,
            },
            finish_reason: 'stop',
          },
        ],
      };

      vi.mocked(llmModule.invokeLLM).mockResolvedValueOnce(mockResponse);

      const mockCode = {
        html: '<h1>Test</h1>',
        css: 'body { margin: 0; }',
        js: 'console.log("test");',
        metadata: {
          title: 'Test Page',
          description: 'A test page',
          generatedAt: new Date(),
          model: 'claude-3.5-sonnet',
        },
      };

      const result = await refineWebsiteCode(
        mockCode,
        'أضف ألوان أكثر جمالاً',
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.message).toBeDefined();
    }, { timeout: 10000 });

    it('should handle refinement errors', async () => {
      vi.mocked(llmModule.invokeLLM).mockRejectedValueOnce(
        new Error('API Error')
      );

      const mockCode = {
        html: '<h1>Test</h1>',
        css: 'body { margin: 0; }',
        js: 'console.log("test");',
        metadata: {
          title: 'Test Page',
          description: 'A test page',
          generatedAt: new Date(),
          model: 'claude-3.5-sonnet',
        },
      };

      const result = await refineWebsiteCode(
        mockCode,
        'تحسين ما',
        'test-user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
