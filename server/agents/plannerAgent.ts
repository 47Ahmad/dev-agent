/**
 * Planner Agent - Phase 4A
 * Responsible for breaking down high-level user commands into
 * structured, ordered execution steps.
 */

import { nanoid } from "nanoid";
import { invokeLLM } from "../_core/llm";
import type { ExecutionPlan, ExecutionStep, AgentType } from "./types";
import { updateAgentStatus, markTaskCompleted, markTaskFailed } from "./agentStateManager";
import { sendMessage } from "./agentCommunication";
import { SaveMemory, RecallContext } from "../memory/memoryAPI";
import { addKnowledge } from "../memory/knowledgeManager";

// ============================================
// PLANNER AGENT IDENTITY
// ============================================

const PLANNER_AGENT_TYPE: AgentType = "planner";

// ============================================
// PLAN STORAGE
// ============================================

const executionPlans = new Map<string, ExecutionPlan>();

// ============================================
// PLANNING LOGIC
// ============================================

/**
 * Create an execution plan from a high-level command
 */
export async function createExecutionPlan(params: {
  projectId: string;
  userId: string;
  command: string;
  projectContext?: string;
}): Promise<ExecutionPlan> {
  updateAgentStatus(PLANNER_AGENT_TYPE, "thinking");

  const planId = `plan-${nanoid()}`;
  const logs: string[] = [];

  try {
    logs.push(`[Planner] Analyzing command: "${params.command}"`);

    const systemPrompt = buildPlannerSystemPrompt();
    const userPrompt = buildPlannerUserPrompt(params.command, params.projectContext);

    logs.push("[Planner] Calling LLM for plan generation...");

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content as string) as {
      steps: Array<{
        title: string;
        description: string;
        agentType: string;
        taskType: string;
        input?: Record<string, unknown>;
        isOptional?: boolean;
        dependsOn?: string[];
        estimatedDuration?: number;
      }>;
      totalEstimatedDuration?: number;
    };

    const steps: ExecutionStep[] = parsed.steps.map((s, index) => ({
      id: `step-${nanoid(6)}`,
      order: index + 1,
      title: s.title,
      description: s.description,
      agentType: (s.agentType as AgentType) ?? "executor",
      taskType: s.taskType ?? "generic",
      input: s.input ?? {},
      estimatedDuration: s.estimatedDuration,
      isOptional: s.isOptional ?? false,
      dependsOn: s.dependsOn ?? [],
    }));

    const plan: ExecutionPlan = {
      id: planId,
      projectId: params.projectId,
      userId: params.userId,
      originalCommand: params.command,
      steps,
      totalSteps: steps.length,
      estimatedDuration: parsed.totalEstimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    executionPlans.set(planId, plan);
    logs.push(`[Planner] Plan created with ${steps.length} steps`);

    // Phase 4B: Save plan to memory
    SaveMemory({
      tier: "short_term",
      category: "task_result",
      key: `plan:${planId}`,
      content: `Plan for: ${params.command}\nSteps: ${steps.map((s) => s.title).join(", ")}`,
      projectId: params.projectId,
      agentId: "planner",
      importance: 0.75,
      tags: ["plan", "execution_plan"],
    });

    // Phase 4B: Save as knowledge for future reuse
    addKnowledge({
      title: `Plan: ${params.command.substring(0, 60)}`,
      content: steps.map((s) => `${s.order}. [${s.agentType}] ${s.title}: ${s.description}`).join("\n"),
      category: "task_result",
      projectId: params.projectId,
      agentId: "planner",
      importance: 0.7,
      source: "planner_agent",
      tags: ["plan", "execution_plan"],
    });

    // Notify orchestrator
    sendMessage({
      fromAgent: PLANNER_AGENT_TYPE,
      toAgent: "orchestrator",
      type: "task_result",
      payload: { planId, stepsCount: steps.length, logs },
    });

    updateAgentStatus(PLANNER_AGENT_TYPE, "idle");
    return plan;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logs.push(`[Planner] Error: ${errMsg}`);

    // Fallback: create a simple default plan
    const fallbackPlan = createFallbackPlan(params, planId);
    executionPlans.set(planId, fallbackPlan);

    sendMessage({
      fromAgent: PLANNER_AGENT_TYPE,
      toAgent: "orchestrator",
      type: "task_error",
      payload: { error: errMsg, fallbackPlanId: planId, logs },
    });

    updateAgentStatus(PLANNER_AGENT_TYPE, "idle");
    return fallbackPlan;
  }
}

/**
 * Get an execution plan by ID
 */
export function getExecutionPlan(planId: string): ExecutionPlan | undefined {
  return executionPlans.get(planId);
}

/**
 * Get all plans for a project
 */
export function getProjectPlans(projectId: string): ExecutionPlan[] {
  return Array.from(executionPlans.values()).filter(
    (p) => p.projectId === projectId
  );
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildPlannerSystemPrompt(): string {
  return `أنت وكيل تخطيط ذكي متخصص في تحليل الأوامر البرمجية وتقسيمها إلى خطوات تنفيذية منظمة.

## مهمتك:
تحليل الأمر المعطى وإنشاء خطة تنفيذ مفصلة بتنسيق JSON.

## قواعد التخطيط:
1. قسّم الأمر إلى خطوات صغيرة وواضحة قابلة للتنفيذ.
2. حدد نوع الوكيل المناسب لكل خطوة (architect أو executor).
3. حدد التبعيات بين الخطوات بدقة.
4. لا تضف خطوات غير ضرورية.
5. كل خطوة يجب أن تكون محددة وقابلة للتحقق.

## أنواع الوكلاء المتاحة:
- architect: لتصميم البنية والهيكل المعماري للكود.
- executor: لتنفيذ تعديلات الكود الفعلية.

## صيغة الإخراج (JSON):
{
  "steps": [
    {
      "title": "عنوان الخطوة",
      "description": "وصف تفصيلي",
      "agentType": "architect|executor",
      "taskType": "design|implement|modify|create|delete|refactor",
      "input": {},
      "isOptional": false,
      "dependsOn": [],
      "estimatedDuration": 5000
    }
  ],
  "totalEstimatedDuration": 30000
}`;
}

function buildPlannerUserPrompt(command: string, context?: string): string {
  let prompt = `## الأمر المطلوب تنفيذه:\n${command}\n`;
  if (context) {
    prompt += `\n## سياق المشروع:\n${context}\n`;
  }
  prompt += `\nأنشئ خطة تنفيذ مفصلة لهذا الأمر.`;
  return prompt;
}

// ============================================
// FALLBACK PLAN
// ============================================

function createFallbackPlan(
  params: { projectId: string; userId: string; command: string },
  planId: string
): ExecutionPlan {
  const steps: ExecutionStep[] = [
    {
      id: `step-${nanoid(6)}`,
      order: 1,
      title: "تحليل المتطلبات",
      description: `تحليل الأمر: ${params.command}`,
      agentType: "architect",
      taskType: "design",
      input: { command: params.command },
      isOptional: false,
      dependsOn: [],
    },
    {
      id: `step-${nanoid(6)}`,
      order: 2,
      title: "تنفيذ التعديلات",
      description: "تنفيذ التعديلات المطلوبة على الكود",
      agentType: "executor",
      taskType: "implement",
      input: { command: params.command },
      isOptional: false,
      dependsOn: [],
    },
  ];

  return {
    id: planId,
    projectId: params.projectId,
    userId: params.userId,
    originalCommand: params.command,
    steps,
    totalSteps: steps.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
