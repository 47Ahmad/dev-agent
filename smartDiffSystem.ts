import { nanoid } from 'nanoid';

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
}

export interface Diff {
  id: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  type?: 'edit' | 'create' | 'delete';
  diffLines: DiffLine[];
  changesSummary: string;
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
}

/**
 * Generate a unified diff between two strings
 * @param oldContent The original content
 * @param newContent The new content
 * @returns Array of diff lines
 */
export function generateUnifiedDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const diffLines: DiffLine[] = [];

  // Simple line-by-line diff (can be improved with more sophisticated algorithms)
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      diffLines.push({
        type: 'context',
        content: oldLine || '',
        lineNumber: i + 1,
      });
    } else {
      if (oldLine !== undefined) {
        diffLines.push({
          type: 'remove',
          content: oldLine,
          lineNumber: i + 1,
        });
      }
      if (newLine !== undefined) {
        diffLines.push({
          type: 'add',
          content: newLine,
          lineNumber: i + 1,
        });
      }
    }
  }

  return diffLines;
}

/**
 * Format diff lines as a readable string
 * @param diffLines Array of diff lines
 * @returns Formatted diff string
 */
export function formatDiffAsString(diffLines: DiffLine[]): string {
  let result = '';
  for (const line of diffLines) {
    const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
    const lineNum = line.lineNumber ? `${line.lineNumber}:` : '';
    result += `${prefix} ${lineNum} ${line.content}\n`;
  }
  return result;
}

/**
 * Calculate a summary of changes
 * @param diffLines Array of diff lines
 * @returns Summary string
 */
export function calculateChangesSummary(diffLines: DiffLine[]): string {
  const addedLines = diffLines.filter(l => l.type === 'add').length;
  const removedLines = diffLines.filter(l => l.type === 'remove').length;
  const contextLines = diffLines.filter(l => l.type === 'context').length;

  return `تم إضافة ${addedLines} سطر، حذف ${removedLines} سطر، و ${contextLines} سطر دون تغيير`;
}

/**
 * Create a diff object from two file contents
 * @param filePath The file path
 * @param oldContent The original content
 * @param newContent The new content
 * @returns Diff object
 */
export function createDiff(filePath: string, oldContent: string, newContent: string): Diff {
  const diffLines = generateUnifiedDiff(oldContent, newContent);
  const changesSummary = calculateChangesSummary(diffLines);

  return {
    id: `diff-${nanoid()}`,
    filePath,
    oldContent,
    newContent,
    diffLines,
    changesSummary,
    timestamp: new Date(),
    reversible: true, // All diffs are reversible by default
  };
}

/**
 * Create an edit plan from multiple modifications
 * @param projectId The project ID
 * @param description Description of the edit plan
 * @param modifications Array of modifications
 * @returns EditPlan object
 */
export function createEditPlan(
  projectId: string,
  description: string,
  modifications: Array<{
    type: 'edit' | 'create' | 'delete';
    filePath: string;
    oldContent?: string;
    newContent?: string;
  }>
): EditPlan {
  const diffs: Diff[] = [];
  const filesToModify: string[] = [];
  const filesToCreate: string[] = [];
  const filesToDelete: string[] = [];

  for (const mod of modifications) {
    if (mod.type === 'edit' && mod.oldContent && mod.newContent) {
      diffs.push(createDiff(mod.filePath, mod.oldContent, mod.newContent));
      filesToModify.push(mod.filePath);
    } else if (mod.type === 'create' && mod.newContent) {
      diffs.push(createDiff(mod.filePath, '', mod.newContent));
      filesToCreate.push(mod.filePath);
    } else if (mod.type === 'delete' && mod.oldContent) {
      diffs.push(createDiff(mod.filePath, mod.oldContent, ''));
      filesToDelete.push(mod.filePath);
    }
  }

  // Estimate impact based on number of changes
  let estimatedImpact: 'low' | 'medium' | 'high' = 'low';
  const totalChanges = filesToModify.length + filesToCreate.length + filesToDelete.length;
  if (totalChanges > 5) {
    estimatedImpact = 'high';
  } else if (totalChanges > 2) {
    estimatedImpact = 'medium';
  }

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
  };
}

/**
 * Generate a summary of an edit plan
 * @param plan The edit plan
 * @returns Summary string
 */
export function summarizeEditPlan(plan: EditPlan): string {
  let summary = `**خطة التعديل:** ${plan.description}\n\n`;
  summary += `**التأثير المتوقع:** ${plan.estimatedImpact === 'high' ? '🔴 عالي' : plan.estimatedImpact === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}\n\n`;
  summary += `**الملفات المتأثرة:**\n`;
  summary += `- تعديل: ${plan.filesToModify.length} ملف\n`;
  summary += `- إنشاء: ${plan.filesToCreate.length} ملف\n`;
  summary += `- حذف: ${plan.filesToDelete.length} ملف\n\n`;
  summary += `**التفاصيل:**\n`;
  for (const diff of plan.diffs) {
    summary += `- ${diff.filePath}: ${diff.changesSummary}\n`;
  }
  return summary;
}

/**
 * Validate if an edit plan can be applied safely
 * @param plan The edit plan
 * @param currentFiles Map of current file paths to content
 * @returns Object with validation result and any errors
 */
export function validateEditPlan(
  plan: EditPlan,
  currentFiles: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if files to modify exist
  for (const filePath of plan.filesToModify) {
    if (!(filePath in currentFiles)) {
      errors.push(`الملف ${filePath} غير موجود ولا يمكن تعديله`);
    }
  }

  // Check if files to delete exist
  for (const filePath of plan.filesToDelete) {
    if (!(filePath in currentFiles)) {
      errors.push(`الملف ${filePath} غير موجود ولا يمكن حذفه`);
    }
  }

  // Check if files to create don't already exist
  for (const filePath of plan.filesToCreate) {
    if (filePath in currentFiles) {
      errors.push(`الملف ${filePath} موجود بالفعل ولا يمكن إنشاؤه`);
    }
  }

  // Verify that diff content matches current files
  for (const diff of plan.diffs) {
    if (diff.type === 'edit' || diff.type === 'delete') {
      const currentContent = currentFiles[diff.filePath];
      if (currentContent !== diff.oldContent) {
        errors.push(`محتوى الملف ${diff.filePath} تغير منذ إنشاء الخطة`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply an edit plan to files
 * @param plan The edit plan
 * @param currentFiles Map of current file paths to content
 * @returns Updated files map and any errors
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

  // Apply modifications
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
 * @param plan The edit plan to reverse
 * @param updatedFiles The files after the plan was applied
 * @returns Original files map
 */
export function reverseEditPlan(
  plan: EditPlan,
  updatedFiles: Record<string, string>
): Record<string, string> {
  const reversedFiles = { ...updatedFiles };

  // Reverse modifications in reverse order
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
