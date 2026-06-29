/**
 * Architect Agent - Phase 4A
 * Responsible for analyzing project structure, designing solutions,
 * and providing architectural guidance to executor agents.
 */

import { nanoid } from "nanoid";
import { invokeLLM } from "../_core/llm";
import { analyzeProjectStructure } from "../services/aiExecutionEngine";
import type { AgentType } from "./types";
import { updateAgentStatus } from "./agentStateManager";
import { sendMessage } from "./agentCommunication";
import { SaveMemory, RememberCodePattern } from "../memory/memoryAPI";
import { addKnowledge } from "../memory/knowledgeManager";

// ============================================
// ARCHITECT AGENT IDENTITY
// ============================================

const ARCHITECT_AGENT_TYPE: AgentType = "architect";

// ============================================
// ARCHITECTURAL DESIGN TYPES
// ============================================

export interface ArchitecturalDesign {
  id: string;
  taskId: string;
  projectId: string;
  command: string;
  analysis: ProjectAnalysis;
  solution: SolutionDesign;
  constraints: string[];
  createdAt: Date;
}

export interface ProjectAnalysis {
  fileCount: number;
  components: string[];
  pages: string[];
  apis: string[];
  services: string[];
  potentialImpactAreas: string[];
  riskLevel: "low" | "medium" | "high";
  riskReason?: string;
}

export interface SolutionDesign {
  approach: string;
  filesToCreate: Array<{ path: string; purpose: string; template?: string }>;
  filesToModify: Array<{ path: string; changes: string; priority: "high" | "medium" | "low" }>;
  filesToDelete: Array<{ path: string; reason: string }>;
  newDependencies: string[];
  estimatedComplexity: "simple" | "moderate" | "complex";
  implementationNotes: string;
}

// ============================================
// DESIGN STORAGE
// ============================================

const architecturalDesigns = new Map<string, ArchitecturalDesign>();

// ============================================
// ARCHITECT OPERATIONS
// ============================================

/**
 * Analyze a project and design a solution for the given command
 */
export async function designSolution(params: {
  taskId: string;
  projectId: string;
  command: string;
  projectFiles: Record<string, string>;
  additionalContext?: string;
}): Promise<ArchitecturalDesign> {
  updateAgentStatus(ARCHITECT_AGENT_TYPE, "thinking", params.taskId);

  const designId = `design-${nanoid()}`;

  try {
    // Analyze project structure
    const structure = analyzeProjectStructure(params.projectFiles);
    const projectAnalysis = buildProjectAnalysis(structure, params.command);

    // Call LLM for architectural design
    const systemPrompt = buildArchitectSystemPrompt();
    const userPrompt = buildArchitectUserPrompt(
      params.command,
      projectAnalysis,
      params.projectFiles,
      params.additionalContext
    );

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 6000,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content as string) as {
      approach: string;
      filesToCreate?: Array<{ path: string; purpose: string; template?: string }>;
      filesToModify?: Array<{ path: string; changes: string; priority?: "high" | "medium" | "low" }>;
      filesToDelete?: Array<{ path: string; reason: string }>;
      newDependencies?: string[];
      estimatedComplexity?: "simple" | "moderate" | "complex";
      implementationNotes?: string;
      constraints?: string[];
    };

    const design: ArchitecturalDesign = {
      id: designId,
      taskId: params.taskId,
      projectId: params.projectId,
      command: params.command,
      analysis: projectAnalysis,
      solution: {
        approach: parsed.approach ?? "تعديل مباشر للملفات المطلوبة",
        filesToCreate: parsed.filesToCreate ?? [],
        filesToModify: parsed.filesToModify?.map((f) => ({
          ...f,
          priority: f.priority ?? "medium",
        })) ?? [],
        filesToDelete: parsed.filesToDelete ?? [],
        newDependencies: parsed.newDependencies ?? [],
        estimatedComplexity: parsed.estimatedComplexity ?? "moderate",
        implementationNotes: parsed.implementationNotes ?? "",
      },
      constraints: parsed.constraints ?? [],
      createdAt: new Date(),
    };

    architecturalDesigns.set(designId, design);

    // Phase 4B: Save design to memory
    SaveMemory({
      tier: "short_term",
      category: "architectural_design",
      key: `design:${designId}`,
      content: `Design for: ${params.command}\nApproach: ${design.solution.approach}\nComplexity: ${design.solution.estimatedComplexity}`,
      projectId: params.projectId,
      agentId: "architect",
      importance: 0.8,
      tags: ["design", "architecture"],
    });

    // Phase 4B: Save architectural knowledge
    addKnowledge({
      title: `Architecture: ${params.command.substring(0, 60)}`,
      content: design.solution.approach,
      summary: `Complexity: ${design.solution.estimatedComplexity}. Files to modify: ${design.solution.filesToModify.length}. Files to create: ${design.solution.filesToCreate.length}.`,
      category: "architectural_design",
      projectId: params.projectId,
      agentId: "architect",
      importance: 0.8,
      source: "architect_agent",
      tags: ["architecture", design.solution.estimatedComplexity],
    });

    // Notify orchestrator with the design
    sendMessage({
      fromAgent: ARCHITECT_AGENT_TYPE,
      toAgent: "orchestrator",
      type: "task_result",
      taskId: params.taskId,
      payload: {
        designId,
        approach: design.solution.approach,
        complexity: design.solution.estimatedComplexity,
        filesToModify: design.solution.filesToModify.length,
        filesToCreate: design.solution.filesToCreate.length,
      },
    });

    updateAgentStatus(ARCHITECT_AGENT_TYPE, "idle");
    return design;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // Fallback design
    const fallback = createFallbackDesign(params, designId);
    architecturalDesigns.set(designId, fallback);

    sendMessage({
      fromAgent: ARCHITECT_AGENT_TYPE,
      toAgent: "orchestrator",
      type: "task_error",
      taskId: params.taskId,
      payload: { error: errMsg, fallbackDesignId: designId },
    });

    updateAgentStatus(ARCHITECT_AGENT_TYPE, "idle");
    return fallback;
  }
}

/**
 * Get a design by ID
 */
export function getArchitecturalDesign(designId: string): ArchitecturalDesign | undefined {
  return architecturalDesigns.get(designId);
}

/**
 * Get designs for a project
 */
export function getProjectDesigns(projectId: string): ArchitecturalDesign[] {
  return Array.from(architecturalDesigns.values()).filter(
    (d) => d.projectId === projectId
  );
}

// ============================================
// ANALYSIS HELPERS
// ============================================

function buildProjectAnalysis(
  structure: ReturnType<typeof analyzeProjectStructure>,
  command: string
): ProjectAnalysis {
  const commandLower = command.toLowerCase();

  // Determine potential impact areas
  const potentialImpactAreas: string[] = [];
  if (commandLower.includes("component") || commandLower.includes("مكون")) {
    potentialImpactAreas.push("components");
  }
  if (commandLower.includes("page") || commandLower.includes("صفحة")) {
    potentialImpactAreas.push("pages");
  }
  if (commandLower.includes("api") || commandLower.includes("router")) {
    potentialImpactAreas.push("apis");
  }
  if (commandLower.includes("style") || commandLower.includes("css") || commandLower.includes("تصميم")) {
    potentialImpactAreas.push("styles");
  }
  if (potentialImpactAreas.length === 0) {
    potentialImpactAreas.push("general");
  }

  // Assess risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  let riskReason: string | undefined;

  if (
    commandLower.includes("delete") ||
    commandLower.includes("remove") ||
    commandLower.includes("حذف")
  ) {
    riskLevel = "high";
    riskReason = "الأمر يتضمن حذف ملفات أو مكونات";
  } else if (
    commandLower.includes("refactor") ||
    commandLower.includes("restructure") ||
    commandLower.includes("إعادة هيكلة")
  ) {
    riskLevel = "medium";
    riskReason = "الأمر يتضمن إعادة هيكلة الكود";
  }

  return {
    fileCount: structure.fileCount,
    components: structure.components,
    pages: structure.pages,
    apis: structure.apis,
    services: structure.services,
    potentialImpactAreas,
    riskLevel,
    riskReason,
  };
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildArchitectSystemPrompt(): string {
  return `أنت وكيل معماري متخصص في تصميم حلول برمجية للمشاريع الموجودة.

## مهمتك:
تحليل المشروع الحالي وتصميم حل معماري مناسب للأمر المطلوب.

## مبادئك:
1. **الحد الأدنى من التغييرات** - عدّل فقط ما هو ضروري.
2. **الاتساق** - حافظ على نمط الكود الموجود.
3. **الوضوح** - كل تغيير يجب أن يكون مبرراً.
4. **السلامة** - تجنب التغييرات التي قد تكسر الكود الموجود.

## صيغة الإخراج (JSON):
{
  "approach": "وصف النهج العام للحل",
  "filesToCreate": [{"path": "/path/to/file", "purpose": "الغرض", "template": "محتوى اختياري"}],
  "filesToModify": [{"path": "/path/to/file", "changes": "وصف التغييرات", "priority": "high|medium|low"}],
  "filesToDelete": [{"path": "/path/to/file", "reason": "سبب الحذف"}],
  "newDependencies": [],
  "estimatedComplexity": "simple|moderate|complex",
  "implementationNotes": "ملاحظات للمنفذ",
  "constraints": ["قيود يجب مراعاتها"]
}`;
}

function buildArchitectUserPrompt(
  command: string,
  analysis: ProjectAnalysis,
  files: Record<string, string>,
  additionalContext?: string
): string {
  const fileList = Object.keys(files).slice(0, 30).join("\n- ");

  let prompt = `## الأمر المطلوب:\n${command}\n\n`;
  prompt += `## تحليل المشروع:\n`;
  prompt += `- عدد الملفات: ${analysis.fileCount}\n`;
  prompt += `- المكونات: ${analysis.components.length}\n`;
  prompt += `- الصفحات: ${analysis.pages.length}\n`;
  prompt += `- واجهات API: ${analysis.apis.length}\n`;
  prompt += `- مستوى الخطورة: ${analysis.riskLevel}\n\n`;
  prompt += `## الملفات الموجودة:\n- ${fileList}\n\n`;

  if (additionalContext) {
    prompt += `## سياق إضافي:\n${additionalContext}\n\n`;
  }

  prompt += `صمّم حلاً معمارياً مناسباً لهذا الأمر.`;
  return prompt;
}

// ============================================
// FALLBACK DESIGN
// ============================================

function createFallbackDesign(
  params: { taskId: string; projectId: string; command: string },
  designId: string
): ArchitecturalDesign {
  return {
    id: designId,
    taskId: params.taskId,
    projectId: params.projectId,
    command: params.command,
    analysis: {
      fileCount: 0,
      components: [],
      pages: [],
      apis: [],
      services: [],
      potentialImpactAreas: ["general"],
      riskLevel: "low",
    },
    solution: {
      approach: "تنفيذ مباشر للأمر باستخدام محرك الذكاء الاصطناعي",
      filesToCreate: [],
      filesToModify: [],
      filesToDelete: [],
      newDependencies: [],
      estimatedComplexity: "moderate",
      implementationNotes: "تم استخدام الخطة الاحتياطية بسبب خطأ في التحليل",
    },
    constraints: [],
    createdAt: new Date(),
  };
}
