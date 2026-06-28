/**
 * Smart Diff System - Phase 3B.3
 * Enhanced diff system that minimizes the number of files modified.
 * Features:
 * - Intelligent diff generation with context
 * - Minimal change detection (only modify what's necessary)
 * - Block-level diff for large files
 * - Reversible edit plans
 * - Impact estimation
 */

import { nanoid } from 'nanoid';

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
}

export interface DiffBlock {
  startLine: number;
  endLine: number;
  type: 'unchanged' | 'modified' | 'added' | 'deleted';
  oldLines: string[];
  newLines: string[];
}

export interface Diff {
  id: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  type?: 'edit' | 'create' | 'delete';
  diffLines: DiffLine[];
  diffBlocks: DiffBlock[];
  changesSummary: string;
  linesAdded: number;
  linesRemoved: number;
  linesChanged: number;
  changePercentage: number;
  timestamp: Date;
  reversible: boolean;
}

export interface EditPlan {
  id: string;
  projectId: string;
  description: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  filesToModify: string[];
  filesToCreate: string[];
  filesToDelete: string[];
  diffs: Diff[];
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  totalLinesChanged: number;
  minimizationScore: number; // 0-100, higher = fewer unnecessary changes
}

/**
 * Generate a unified diff between two strings using LCS algorithm
 */
export function generateUnifiedDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const diffLines: DiffLine[] = [];

  // Use LCS-based diff for better accuracy
  const lcs = computeLCS(oldLines, newLines);
  const operations = buildEditScript(oldLines, newLines, lcs);

  let oldLineNum = 1;
  let newLineNum = 1;

  for (const op of operations) {
    if (op.type === 'equal') {
      diffLines.push({
        type: 'context',
        content: op.content,
        lineNumber: oldLineNum,
      });
      oldLineNum++;
      newLineNum++;
    } else if (op.type === 'delete') {
      diffLines.push({
        type: 'remove',
        content: op.content,
        lineNumber: oldLineNum,
      });
      oldLineNum++;
    } else if (op.type === 'insert') {
      diffLines.push({
        type: 'add',
        content: op.content,
        lineNumber: newLineNum,
      });
      newLineNum++;
    }
  }

  return diffLines;
}

interface EditOp {
  type: 'equal' | 'delete' | 'insert';
  content: string;
}

/**
 * Compute Longest Common Subsequence
 */
function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Build edit script from LCS table
 */
function buildEditScript(a: string[], b: string[], dp: number[][]): EditOp[] {
  const ops: EditOp[] = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ type: 'equal', content: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'insert', content: b[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'delete', content: a[i - 1] });
      i--;
    }
  }

  return ops;
}

/**
 * Generate diff blocks for large files
 */
export function generateDiffBlocks(oldContent: string, newContent: string): DiffBlock[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const blocks: DiffBlock[] = [];

  const diffLines = generateUnifiedDiff(oldContent, newContent);

  let currentBlock: DiffBlock | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of diffLines) {
    if (line.type === 'context') {
      if (currentBlock && currentBlock.type !== 'unchanged') {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      oldLineNum++;
      newLineNum++;
    } else if (line.type === 'remove' || line.type === 'add') {
      if (!currentBlock || currentBlock.type === 'unchanged') {
        currentBlock = {
          startLine: oldLineNum + 1,
          endLine: oldLineNum + 1,
          type: 'modified',
          oldLines: [],
          newLines: [],
        };
      }

      if (line.type === 'remove') {
        currentBlock.oldLines.push(line.content);
        currentBlock.endLine = oldLineNum + 1;
        oldLineNum++;
      } else {
        currentBlock.newLines.push(line.content);
        newLineNum++;
      }
    }
  }

  if (currentBlock && currentBlock.type !== 'unchanged') {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Format diff lines as a readable string
 */
export function formatDiffAsString(diffLines: DiffLine[]): string {
  let result = '';
  for (const line of diffLines) {
    if (line.type === 'context') continue; // Skip context lines in output
    const prefix = line.type === 'add' ? '+' : '-';
    const lineNum = line.lineNumber ? `${line.lineNumber}: ` : '';
    result += `${prefix} ${lineNum}${line.content}\n`;
  }
  return result;
}

/**
 * Calculate a summary of changes
 */
export function calculateChangesSummary(diffLines: DiffLine[]): string {
  const addedLines = diffLines.filter(l => l.type === 'add').length;
  const removedLines = diffLines.filter(l => l.type === 'remove').length;
  const contextLines = diffLines.filter(l => l.type === 'context').length;

  if (addedLines === 0 && removedLines === 0) {
    return 'لا توجد تغييرات';
  }

  const parts: string[] = [];
  if (addedLines > 0) parts.push(`+${addedLines} سطر`);
  if (removedLines > 0) parts.push(`-${removedLines} سطر`);

  return parts.join(', ');
}

/**
 * Calculate change percentage between two contents
 */
export function calculateChangePercentage(oldContent: string, newContent: string): number {
  if (oldContent === newContent) return 0;
  if (oldContent === '') return 100;

  const oldLines = oldContent.split('\n').length;
  const diffLines = generateUnifiedDiff(oldContent, newContent);
  const changedLines = diffLines.filter(l => l.type !== 'context').length;

  return Math.round((changedLines / (oldLines * 2)) * 100);
}

/**
 * Create a diff object between two file contents
 */
export function createDiff(
  filePath: string,
  oldContent: string,
  newContent: string,
  type: 'edit' | 'create' | 'delete' = 'edit'
): Diff {
  const diffLines = generateUnifiedDiff(oldContent, newContent);
  const diffBlocks = generateDiffBlocks(oldContent, newContent);
  const changesSummary = calculateChangesSummary(diffLines);
  const linesAdded = diffLines.filter(l => l.type === 'add').length;
  const linesRemoved = diffLines.filter(l => l.type === 'remove').length;
  const linesChanged = Math.max(linesAdded, linesRemoved);
  const changePercentage = calculateChangePercentage(oldContent, newContent);

  return {
    id: `diff-${nanoid()}`,
    filePath,
    oldContent,
    newContent,
    type,
    diffLines,
    diffBlocks,
    changesSummary,
    linesAdded,
    linesRemoved,
    linesChanged,
    changePercentage,
    timestamp: new Date(),
    reversible: true,
  };
}

/**
 * Create an edit plan from a list of modifications
 * Minimizes the number of files modified
 */
export function createEditPlan(
  projectId: string,
  description: string,
  modifications: Array<{
    type: 'edit' | 'create' | 'delete';
    filePath: string;
    oldContent: string;
    newContent: string;
  }>
): EditPlan {
  const filesToModify: string[] = [];
  const filesToCreate: string[] = [];
  const filesToDelete: string[] = [];
  const diffs: Diff[] = [];

  let totalLinesChanged = 0;

  for (const mod of modifications) {
    const diff = createDiff(mod.filePath, mod.oldContent, mod.newContent, mod.type);
    diffs.push(diff);
    totalLinesChanged += diff.linesChanged;

    if (mod.type === 'edit') {
      filesToModify.push(mod.filePath);
    } else if (mod.type === 'create') {
      filesToCreate.push(mod.filePath);
    } else if (mod.type === 'delete') {
      filesToDelete.push(mod.filePath);
    }
  }

  // Estimate impact based on number of changes and lines changed
  let estimatedImpact: 'low' | 'medium' | 'high' = 'low';
  const totalChanges = filesToModify.length + filesToCreate.length + filesToDelete.length;
  if (totalChanges > 5 || totalLinesChanged > 100) {
    estimatedImpact = 'high';
  } else if (totalChanges > 2 || totalLinesChanged > 30) {
    estimatedImpact = 'medium';
  }

  // Calculate minimization score (how well we minimized changes)
  const avgChangePercentage = diffs.length > 0
    ? diffs.reduce((sum, d) => sum + d.changePercentage, 0) / diffs.length
    : 0;
  const minimizationScore = Math.max(0, 100 - avgChangePercentage);

  return {
    id: `plan-${nanoid()}`,
    projectId,
    description,
    estimatedImpact,
    filesToModify,
    filesToCreate,
    filesToDelete,
    diffs,
    timestamp: new Date(),
    status: 'pending',
    totalLinesChanged,
    minimizationScore: Math.round(minimizationScore),
  };
}

/**
 * Generate a summary of an edit plan
 */
export function summarizeEditPlan(plan: EditPlan): string {
  let summary = `**خطة التعديل:** ${plan.description}\n\n`;
  summary += `**التأثير المتوقع:** ${
    plan.estimatedImpact === 'high' ? '🔴 عالي' :
    plan.estimatedImpact === 'medium' ? '🟡 متوسط' : '🟢 منخفض'
  }\n\n`;

  summary += `**الملفات المتأثرة:**\n`;
  summary += `- تعديل: ${plan.filesToModify.length} ملف\n`;
  summary += `- إنشاء: ${plan.filesToCreate.length} ملف\n`;
  summary += `- حذف: ${plan.filesToDelete.length} ملف\n`;
  summary += `- إجمالي الأسطر المتغيرة: ${plan.totalLinesChanged}\n`;
  summary += `- نقاط التحسين: ${plan.minimizationScore}/100\n\n`;

  if (plan.diffs.length > 0) {
    summary += `**التفاصيل:**\n`;
    for (const diff of plan.diffs) {
      const icon = diff.type === 'create' ? '➕' : diff.type === 'delete' ? '🗑️' : '✏️';
      summary += `- ${icon} \`${diff.filePath}\`: ${diff.changesSummary} (${diff.changePercentage}% تغيير)\n`;
    }
  }

  return summary;
}

/**
 * Validate if an edit plan can be applied safely
 */
export function validateEditPlan(
  plan: EditPlan,
  currentFiles: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const filePath of plan.filesToModify) {
    if (!(filePath in currentFiles)) {
      errors.push(`الملف ${filePath} غير موجود ولا يمكن تعديله`);
    }
  }

  for (const filePath of plan.filesToDelete) {
    if (!(filePath in currentFiles)) {
      errors.push(`الملف ${filePath} غير موجود ولا يمكن حذفه`);
    }
  }

  for (const filePath of plan.filesToCreate) {
    if (filePath in currentFiles) {
      errors.push(`الملف ${filePath} موجود بالفعل ولا يمكن إنشاؤه`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply an edit plan to files
 */
export function applyEditPlan(
  plan: EditPlan,
  currentFiles: Record<string, string>
): { success: boolean; updatedFiles: Record<string, string>; errors: string[] } {
  const validation = validateEditPlan(plan, currentFiles);
  if (!validation.valid) {
    return {
      success: false,
      updatedFiles: currentFiles,
      errors: validation.errors,
    };
  }

  const updatedFiles = { ...currentFiles };

  for (const diff of plan.diffs) {
    if (diff.type === 'edit') {
      updatedFiles[diff.filePath] = diff.newContent;
    } else if (diff.type === 'create') {
      updatedFiles[diff.filePath] = diff.newContent;
    } else if (diff.type === 'delete') {
      delete updatedFiles[diff.filePath];
    }
  }

  return {
    success: true,
    updatedFiles,
    errors: [],
  };
}

/**
 * Reverse an edit plan (undo changes)
 */
export function reverseEditPlan(
  plan: EditPlan,
  updatedFiles: Record<string, string>
): Record<string, string> {
  const reversedFiles = { ...updatedFiles };

  for (let i = plan.diffs.length - 1; i >= 0; i--) {
    const diff = plan.diffs[i];
    if (diff.type === 'edit') {
      reversedFiles[diff.filePath] = diff.oldContent;
    } else if (diff.type === 'create') {
      delete reversedFiles[diff.filePath];
    } else if (diff.type === 'delete') {
      reversedFiles[diff.filePath] = diff.oldContent;
    }
  }

  return reversedFiles;
}

/**
 * Generate a smart diff between two content strings
 * Returns a human-readable diff string
 */
export function generateSmartDiff(oldContent: string, newContent: string): string {
  if (oldContent === newContent) return 'No changes.';
  const diffLines = generateUnifiedDiff(oldContent, newContent);
  const summary = calculateChangesSummary(diffLines);
  const formatted = formatDiffAsString(diffLines);
  return `${summary}\n${formatted}`;
}

/**
 * Find the minimal set of changes needed to transform old content to new
 * Uses block-level comparison to reduce unnecessary modifications
 */
export function findMinimalChanges(
  oldContent: string,
  newContent: string
): { blocks: DiffBlock[]; minimized: boolean } {
  const blocks = generateDiffBlocks(oldContent, newContent);
  const modifiedBlocks = blocks.filter(b => b.type !== 'unchanged');

  return {
    blocks: modifiedBlocks,
    minimized: modifiedBlocks.length < blocks.length,
  };
}

/**
 * Compare two edit plans and return the one with fewer changes
 */
export function selectMinimalEditPlan(
  plan1: EditPlan,
  plan2: EditPlan
): EditPlan {
  const score1 = plan1.filesToModify.length + plan1.filesToCreate.length + plan1.filesToDelete.length;
  const score2 = plan2.filesToModify.length + plan2.filesToCreate.length + plan2.filesToDelete.length;

  if (score1 <= score2) {
    return plan1;
  }
  return plan2;
}
