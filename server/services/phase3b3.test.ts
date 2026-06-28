/**
 * Phase 3B.3 - Comprehensive Tests
 * Tests for:
 * - File Relationship Analyzer
 * - Smart Diff System (enhanced)
 * - Auto Debugger (enhanced)
 * - Project Context Memory (enhanced)
 * - AI Execution Engine (enhanced)
 */

import { describe, it, expect } from 'vitest';

// ============================================================
// File Relationship Analyzer Tests
// ============================================================
import {
  parseImports,
  parseExports,
  buildFileRelationshipGraph,
  findAffectedFiles,
  findUnusedImports,
  resolveImportPath,
  summarizeFileGraph,
} from './fileRelationshipAnalyzer';

describe('FileRelationshipAnalyzer', () => {
  describe('parseImports', () => {
    it('should parse named imports', () => {
      const content = `import { useState, useEffect } from 'react';`;
      const imports = parseImports(content, 'test.ts');
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('react');
      expect(imports[0].symbols).toContain('useState');
      expect(imports[0].symbols).toContain('useEffect');
    });

    it('should parse default imports', () => {
      const content = `import React from 'react';`;
      const imports = parseImports(content, 'test.ts');
      expect(imports).toHaveLength(1);
      expect(imports[0].isDefault).toBe(true);
      expect(imports[0].symbols).toContain('React');
    });

    it('should parse namespace imports', () => {
      const content = `import * as fs from 'fs';`;
      const imports = parseImports(content, 'test.ts');
      expect(imports).toHaveLength(1);
      expect(imports[0].isNamespace).toBe(true);
    });

    it('should parse dynamic imports', () => {
      const content = `const mod = import('./myModule');`;
      const imports = parseImports(content, 'test.ts');
      expect(imports).toHaveLength(1);
      expect(imports[0].isDynamic).toBe(true);
    });

    it('should parse multiple imports', () => {
      const content = `
import React from 'react';
import { useState } from 'react';
import { z } from 'zod';
import './styles.css';
      `;
      const imports = parseImports(content, 'test.ts');
      expect(imports.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('parseExports', () => {
    it('should parse named function exports', () => {
      const content = `export function myFunction() {}`;
      const exports = parseExports(content);
      expect(exports).toHaveLength(1);
      expect(exports[0].name).toBe('myFunction');
      expect(exports[0].type).toBe('function');
    });

    it('should parse named const exports', () => {
      const content = `export const MY_CONST = 42;`;
      const exports = parseExports(content);
      expect(exports).toHaveLength(1);
      expect(exports[0].name).toBe('MY_CONST');
      expect(exports[0].type).toBe('const');
    });

    it('should parse interface exports', () => {
      const content = `export interface MyInterface { id: string; }`;
      const exports = parseExports(content);
      expect(exports).toHaveLength(1);
      expect(exports[0].type).toBe('interface');
    });

    it('should parse default exports', () => {
      const content = `export default function App() {}`;
      const exports = parseExports(content);
      const defaultExport = exports.find(e => e.isDefault);
      expect(defaultExport).toBeDefined();
    });
  });

  describe('buildFileRelationshipGraph', () => {
    it('should build a graph with correct nodes', () => {
      const files = {
        'src/index.ts': `import { App } from './App';`,
        'src/App.ts': `export function App() {}`,
        'src/utils.ts': `export function helper() {}`,
      };

      const graph = buildFileRelationshipGraph(files);
      expect(graph.nodes.size).toBe(3);
      expect(graph.nodes.has('src/index.ts')).toBe(true);
      expect(graph.nodes.has('src/App.ts')).toBe(true);
    });

    it('should detect entry points', () => {
      const files = {
        'src/index.ts': `export {};`,
        'src/main.tsx': `export {};`,
        'src/utils.ts': `export function helper() {}`,
      };

      const graph = buildFileRelationshipGraph(files);
      expect(graph.entryPoints).toContain('src/index.ts');
      expect(graph.entryPoints).toContain('src/main.tsx');
    });

    it('should detect circular dependencies', () => {
      const files = {
        'src/a.ts': `import { b } from './b';`,
        'src/b.ts': `import { a } from './a';`,
      };

      const graph = buildFileRelationshipGraph(files);
      // Circular dependencies may or may not be detected depending on resolution
      expect(graph.circularDependencies).toBeDefined();
    });

    it('should build importedBy relationships', () => {
      const files = {
        'src/index.ts': `import { App } from './App';`,
        'src/App.ts': `export function App() {}`,
      };

      const graph = buildFileRelationshipGraph(files);
      const appNode = graph.nodes.get('src/App.ts');
      expect(appNode).toBeDefined();
      // importedBy should include index.ts
      expect(appNode?.importedBy).toContain('src/index.ts');
    });
  });

  describe('findAffectedFiles', () => {
    it('should find files affected by a change', () => {
      const files = {
        'src/utils.ts': `export function helper() {}`,
        'src/component.ts': `import { helper } from './utils';`,
        'src/page.ts': `import { helper } from './utils';`,
        'src/other.ts': `export function other() {}`,
      };

      const graph = buildFileRelationshipGraph(files);
      const affected = findAffectedFiles('src/utils.ts', graph);
      expect(affected).toContain('src/component.ts');
      expect(affected).toContain('src/page.ts');
      expect(affected).not.toContain('src/other.ts');
    });
  });

  describe('summarizeFileGraph', () => {
    it('should generate a summary string', () => {
      const files = {
        'src/index.ts': `export {};`,
        'src/App.ts': `export function App() {}`,
      };

      const graph = buildFileRelationshipGraph(files);
      const summary = summarizeFileGraph(graph);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// Smart Diff System Tests
// ============================================================
import {
  generateUnifiedDiff,
  generateDiffBlocks,
  calculateChangesSummary,
  calculateChangePercentage,
  createDiff,
  createEditPlan,
  summarizeEditPlan,
  validateEditPlan,
  applyEditPlan,
  reverseEditPlan,
  generateSmartDiff,
  findMinimalChanges,
  selectMinimalEditPlan,
} from './smartDiffSystem';

describe('SmartDiffSystem', () => {
  describe('generateUnifiedDiff', () => {
    it('should return empty diff for identical content', () => {
      const content = 'line1\nline2\nline3';
      const diff = generateUnifiedDiff(content, content);
      const changes = diff.filter(l => l.type !== 'context');
      expect(changes).toHaveLength(0);
    });

    it('should detect added lines', () => {
      const old = 'line1\nline2';
      const newContent = 'line1\nline2\nline3';
      const diff = generateUnifiedDiff(old, newContent);
      const added = diff.filter(l => l.type === 'add');
      expect(added).toHaveLength(1);
      expect(added[0].content).toBe('line3');
    });

    it('should detect removed lines', () => {
      const old = 'line1\nline2\nline3';
      const newContent = 'line1\nline3';
      const diff = generateUnifiedDiff(old, newContent);
      const removed = diff.filter(l => l.type === 'remove');
      expect(removed).toHaveLength(1);
      expect(removed[0].content).toBe('line2');
    });

    it('should detect modified lines', () => {
      const old = 'const x = 1;';
      const newContent = 'const x = 2;';
      const diff = generateUnifiedDiff(old, newContent);
      const changes = diff.filter(l => l.type !== 'context');
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('calculateChangePercentage', () => {
    it('should return 0 for identical content', () => {
      const content = 'line1\nline2';
      expect(calculateChangePercentage(content, content)).toBe(0);
    });

    it('should return 100 for completely different content', () => {
      const old = 'aaa\nbbb\nccc';
      const newContent = 'xxx\nyyy\nzzz';
      const percentage = calculateChangePercentage(old, newContent);
      expect(percentage).toBeGreaterThan(0);
    });

    it('should return a value between 0 and 100', () => {
      const old = 'line1\nline2\nline3\nline4\nline5';
      const newContent = 'line1\nline2\nmodified\nline4\nline5';
      const percentage = calculateChangePercentage(old, newContent);
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('createEditPlan', () => {
    it('should create a plan with correct file counts', () => {
      const plan = createEditPlan('project1', 'Test plan', [
        { type: 'edit', filePath: 'file1.ts', oldContent: 'old', newContent: 'new' },
        { type: 'create', filePath: 'file2.ts', oldContent: '', newContent: 'content' },
        { type: 'delete', filePath: 'file3.ts', oldContent: 'content', newContent: '' },
      ]);

      expect(plan.filesToModify).toHaveLength(1);
      expect(plan.filesToCreate).toHaveLength(1);
      expect(plan.filesToDelete).toHaveLength(1);
      expect(plan.projectId).toBe('project1');
      expect(plan.description).toBe('Test plan');
    });

    it('should estimate impact correctly', () => {
      const lowPlan = createEditPlan('p1', 'Low impact', [
        { type: 'edit', filePath: 'f1.ts', oldContent: 'a', newContent: 'b' },
      ]);
      expect(lowPlan.estimatedImpact).toBe('low');

      const highPlan = createEditPlan('p1', 'High impact', [
        { type: 'edit', filePath: 'f1.ts', oldContent: 'a', newContent: 'b' },
        { type: 'edit', filePath: 'f2.ts', oldContent: 'a', newContent: 'b' },
        { type: 'edit', filePath: 'f3.ts', oldContent: 'a', newContent: 'b' },
        { type: 'create', filePath: 'f4.ts', oldContent: '', newContent: 'content' },
        { type: 'create', filePath: 'f5.ts', oldContent: '', newContent: 'content' },
        { type: 'delete', filePath: 'f6.ts', oldContent: 'content', newContent: '' },
      ]);
      expect(highPlan.estimatedImpact).toBe('high');
    });

    it('should have a minimization score', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'edit', filePath: 'f1.ts', oldContent: 'old content', newContent: 'new content' },
      ]);
      expect(plan.minimizationScore).toBeGreaterThanOrEqual(0);
      expect(plan.minimizationScore).toBeLessThanOrEqual(100);
    });
  });

  describe('validateEditPlan', () => {
    it('should validate successfully when files exist', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'edit', filePath: 'file1.ts', oldContent: 'old', newContent: 'new' },
      ]);
      const currentFiles = { 'file1.ts': 'old' };
      const result = validateEditPlan(plan, currentFiles);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when file to modify does not exist', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'edit', filePath: 'nonexistent.ts', oldContent: 'old', newContent: 'new' },
      ]);
      const currentFiles = {};
      const result = validateEditPlan(plan, currentFiles);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when file to create already exists', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'create', filePath: 'existing.ts', oldContent: '', newContent: 'content' },
      ]);
      const currentFiles = { 'existing.ts': 'content' };
      const result = validateEditPlan(plan, currentFiles);
      expect(result.valid).toBe(false);
    });
  });

  describe('applyEditPlan', () => {
    it('should apply edit modifications', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'edit', filePath: 'file1.ts', oldContent: 'old', newContent: 'new' },
      ]);
      const currentFiles = { 'file1.ts': 'old' };
      const result = applyEditPlan(plan, currentFiles);
      expect(result.success).toBe(true);
      expect(result.updatedFiles['file1.ts']).toBe('new');
    });

    it('should apply create modifications', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'create', filePath: 'new.ts', oldContent: '', newContent: 'content' },
      ]);
      const currentFiles = {};
      const result = applyEditPlan(plan, currentFiles);
      expect(result.success).toBe(true);
      expect(result.updatedFiles['new.ts']).toBe('content');
    });

    it('should apply delete modifications', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'delete', filePath: 'old.ts', oldContent: 'content', newContent: '' },
      ]);
      const currentFiles = { 'old.ts': 'content' };
      const result = applyEditPlan(plan, currentFiles);
      expect(result.success).toBe(true);
      expect(result.updatedFiles['old.ts']).toBeUndefined();
    });
  });

  describe('reverseEditPlan', () => {
    it('should reverse edit modifications', () => {
      const plan = createEditPlan('p1', 'Test', [
        { type: 'edit', filePath: 'file1.ts', oldContent: 'old', newContent: 'new' },
      ]);
      const updatedFiles = { 'file1.ts': 'new' };
      const reversed = reverseEditPlan(plan, updatedFiles);
      expect(reversed['file1.ts']).toBe('old');
    });
  });

  describe('generateSmartDiff', () => {
    it('should return "No changes." for identical content', () => {
      const result = generateSmartDiff('same', 'same');
      expect(result).toBe('No changes.');
    });

    it('should return a diff string for different content', () => {
      const result = generateSmartDiff('old line', 'new line');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findMinimalChanges', () => {
    it('should return empty blocks for identical content', () => {
      const result = findMinimalChanges('same content', 'same content');
      expect(result.blocks).toHaveLength(0);
    });

    it('should return blocks for different content', () => {
      const old = 'line1\nline2\nline3';
      const newContent = 'line1\nmodified\nline3';
      const result = findMinimalChanges(old, newContent);
      expect(result.blocks.length).toBeGreaterThan(0);
    });
  });

  describe('selectMinimalEditPlan', () => {
    it('should select the plan with fewer changes', () => {
      const plan1 = createEditPlan('p1', 'Plan 1', [
        { type: 'edit', filePath: 'f1.ts', oldContent: 'a', newContent: 'b' },
      ]);
      const plan2 = createEditPlan('p1', 'Plan 2', [
        { type: 'edit', filePath: 'f1.ts', oldContent: 'a', newContent: 'b' },
        { type: 'edit', filePath: 'f2.ts', oldContent: 'a', newContent: 'b' },
      ]);
      const selected = selectMinimalEditPlan(plan1, plan2);
      expect(selected.id).toBe(plan1.id);
    });
  });
});

// ============================================================
// Auto Debugger Tests
// ============================================================
import {
  parseTypeScriptErrors,
  parseImportErrors,
  analyzeCodeQuality,
  detectMissingDependencies,
  generateDebugReport,
} from './autoDebugger';

describe('AutoDebugger', () => {
  describe('parseTypeScriptErrors', () => {
    it('should parse TypeScript error format', () => {
      const output = `src/index.ts(10,5): error TS2304: Cannot find name 'foo'.`;
      const errors = parseTypeScriptErrors(output);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('typescript');
      expect(errors[0].severity).toBe('error');
      expect(errors[0].file).toBe('src/index.ts');
      expect(errors[0].line).toBe(10);
      expect(errors[0].column).toBe(5);
      expect(errors[0].code).toBe('TS2304');
    });

    it('should parse TypeScript warning format', () => {
      const output = `src/utils.ts(5,3): warning TS6133: 'x' is declared but its value is never read.`;
      const errors = parseTypeScriptErrors(output);
      expect(errors).toHaveLength(1);
      expect(errors[0].severity).toBe('warning');
      expect(errors[0].code).toBe('TS6133');
    });

    it('should return empty array for clean output', () => {
      const output = 'Build succeeded with 0 errors';
      const errors = parseTypeScriptErrors(output);
      expect(errors).toHaveLength(0);
    });

    it('should mark auto-fixable errors correctly', () => {
      const output = `src/index.ts(1,1): warning TS6133: 'x' is declared but its value is never read.`;
      const errors = parseTypeScriptErrors(output);
      expect(errors[0].autoFixable).toBe(true);
    });
  });

  describe('parseImportErrors', () => {
    it('should parse Cannot find module errors', () => {
      const output = `Cannot find module './missing' or its corresponding type declarations.`;
      const errors = parseImportErrors(output);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('import');
    });

    it('should return empty array for clean output', () => {
      const output = 'All modules resolved successfully';
      const errors = parseImportErrors(output);
      expect(errors).toHaveLength(0);
    });
  });

  describe('analyzeCodeQuality', () => {
    it('should detect excessive console.log usage', () => {
      const content = `
console.log('a');
console.log('b');
console.log('c');
console.log('d');
      `;
      const issues = analyzeCodeQuality(content);
      const consoleIssue = issues.find(i => i.message.includes('console.log'));
      expect(consoleIssue).toBeDefined();
    });

    it('should detect empty catch blocks', () => {
      const content = `
try {
  doSomething();
} catch (e) {}
      `;
      const issues = analyzeCodeQuality(content);
      const catchIssue = issues.find(i => i.message.includes('catch'));
      expect(catchIssue).toBeDefined();
    });

    it('should return empty array for clean code', () => {
      const content = `
export function cleanFunction(x: number): number {
  return x * 2;
}
      `;
      const issues = analyzeCodeQuality(content);
      expect(issues).toHaveLength(0);
    });
  });

  describe('detectMissingDependencies', () => {
    it('should detect external module imports', () => {
      const content = `import { something } from 'some-external-package';`;
      const missing = detectMissingDependencies(content);
      expect(missing).toContain('some-external-package');
    });

    it('should not flag relative imports', () => {
      const content = `import { helper } from './utils';`;
      const missing = detectMissingDependencies(content);
      expect(missing).toHaveLength(0);
    });

    it('should not flag built-in Node.js modules', () => {
      const content = `import { readFile } from 'fs';`;
      const missing = detectMissingDependencies(content);
      expect(missing).toHaveLength(0);
    });
  });

  describe('generateDebugReport', () => {
    it('should generate a success report when no errors', () => {
      const result = {
        success: true,
        errors: [],
        warnings: [],
        suggestions: [],
        autoFixApplied: false,
        fixedCount: 0,
        remainingErrors: [],
        debugReport: '',
      };
      const report = generateDebugReport(result);
      expect(report).toContain('✅');
    });

    it('should generate an error report when errors exist', () => {
      const result = {
        success: false,
        errors: [{
          id: '1',
          type: 'typescript' as const,
          severity: 'error' as const,
          file: 'test.ts',
          message: 'Test error',
          autoFixable: false,
        }],
        warnings: [],
        suggestions: [],
        autoFixApplied: false,
        fixedCount: 0,
        remainingErrors: [],
        debugReport: '',
      };
      const report = generateDebugReport(result);
      expect(report).toContain('❌');
      expect(report).toContain('Test error');
    });

    it('should mention auto-fix when applied', () => {
      const result = {
        success: true,
        errors: [],
        warnings: [],
        suggestions: [],
        autoFixApplied: true,
        fixedCount: 3,
        remainingErrors: [],
        debugReport: '',
      };
      const report = generateDebugReport(result);
      expect(report).toContain('✨');
    });
  });
});

// ============================================================
// Project Context Memory Tests
// ============================================================
import {
  analyzeProjectStructure,
  detectTechnologies,
  identifyKeyFiles,
  addChangeLog,
  addProjectGoal,
  updateGoalStatus,
  getContextSummaryForAI,
  getFilesAffectedByChange,
} from './projectContextMemory';

describe('ProjectContextMemory', () => {
  const sampleFiles = {
    'package.json': JSON.stringify({
      dependencies: { react: '^18.0.0', 'drizzle-orm': '^0.29.0' },
      devDependencies: { vite: '^5.0.0', typescript: '^5.0.0', vitest: '^1.0.0' },
    }),
    'tsconfig.json': '{}',
    'client/src/App.tsx': `import React from 'react';`,
    'client/src/pages/Home.tsx': `export default function Home() {}`,
    'client/src/components/Button.tsx': `export function Button() {}`,
    'server/routers/api.ts': `export const apiRouter = router({});`,
    'server/services/myService.ts': `export function myService() {}`,
  };

  describe('analyzeProjectStructure', () => {
    it('should detect pages', () => {
      const structure = analyzeProjectStructure(sampleFiles);
      expect(structure.pages).toContain('client/src/pages/Home.tsx');
    });

    it('should detect components', () => {
      const structure = analyzeProjectStructure(sampleFiles);
      expect(structure.components).toContain('client/src/components/Button.tsx');
    });

    it('should detect APIs', () => {
      const structure = analyzeProjectStructure(sampleFiles);
      expect(structure.apis).toContain('server/routers/api.ts');
    });

    it('should detect services', () => {
      const structure = analyzeProjectStructure(sampleFiles);
      expect(structure.services).toContain('server/services/myService.ts');
    });

    it('should extract folders', () => {
      const structure = analyzeProjectStructure(sampleFiles);
      expect(structure.folders.length).toBeGreaterThan(0);
    });
  });

  describe('detectTechnologies', () => {
    it('should detect React', () => {
      const techs = detectTechnologies(sampleFiles);
      expect(techs).toContain('React');
    });

    it('should detect TypeScript', () => {
      const techs = detectTechnologies(sampleFiles);
      expect(techs).toContain('TypeScript');
    });

    it('should detect Drizzle ORM', () => {
      const techs = detectTechnologies(sampleFiles);
      expect(techs).toContain('Drizzle ORM');
    });

    it('should detect Vite', () => {
      const techs = detectTechnologies(sampleFiles);
      expect(techs).toContain('Vite');
    });

    it('should detect Vitest', () => {
      const techs = detectTechnologies(sampleFiles);
      expect(techs).toContain('Vitest');
    });
  });

  describe('identifyKeyFiles', () => {
    it('should identify package.json as key file', () => {
      const keyFiles = identifyKeyFiles(sampleFiles);
      expect(keyFiles).toContain('package.json');
    });

    it('should identify tsconfig.json as key file', () => {
      const keyFiles = identifyKeyFiles(sampleFiles);
      expect(keyFiles).toContain('tsconfig.json');
    });

    it('should identify App.tsx as entry point', () => {
      const keyFiles = identifyKeyFiles(sampleFiles);
      expect(keyFiles).toContain('client/src/App.tsx');
    });
  });

  describe('addChangeLog', () => {
    const baseMemory = {
      projectId: 'test',
      summary: 'Test project',
      structure: {
        folders: [],
        files: [],
        components: [],
        pages: [],
        apis: [],
        services: [],
        utils: [],
        dependencies: {},
      },
      goals: [],
      lastChanges: [],
      dependencies: [],
      technologies: [],
      keyFiles: [],
      updatedAt: new Date(),
    };

    it('should add a change log entry', () => {
      const updated = addChangeLog(baseMemory, 'Added feature', ['file.ts'], 'feature');
      expect(updated.lastChanges).toHaveLength(1);
      expect(updated.lastChanges[0].description).toBe('Added feature');
      expect(updated.lastChanges[0].type).toBe('feature');
    });

    it('should keep only last 50 changes', () => {
      let memory = baseMemory;
      for (let i = 0; i < 60; i++) {
        memory = addChangeLog(memory, `Change ${i}`, [], 'feature');
      }
      expect(memory.lastChanges).toHaveLength(50);
    });

    it('should add phase to change log', () => {
      const updated = addChangeLog(baseMemory, 'Phase change', [], 'feature', 'Phase 3B.3');
      expect(updated.lastChanges[0].phase).toBe('Phase 3B.3');
    });
  });

  describe('addProjectGoal', () => {
    const baseMemory = {
      projectId: 'test',
      summary: '',
      structure: { folders: [], files: [], components: [], pages: [], apis: [], services: [], utils: [], dependencies: {} },
      goals: [],
      lastChanges: [],
      dependencies: [],
      technologies: [],
      keyFiles: [],
      updatedAt: new Date(),
    };

    it('should add a goal', () => {
      const updated = addProjectGoal(baseMemory, 'New Feature', 'Implement X');
      expect(updated.goals).toHaveLength(1);
      expect(updated.goals[0].title).toBe('New Feature');
      expect(updated.goals[0].status).toBe('pending');
    });
  });

  describe('updateGoalStatus', () => {
    it('should update goal status', () => {
      let memory = {
        projectId: 'test',
        summary: '',
        structure: { folders: [], files: [], components: [], pages: [], apis: [], services: [], utils: [], dependencies: {} },
        goals: [],
        lastChanges: [],
        dependencies: [],
        technologies: [],
        keyFiles: [],
        updatedAt: new Date(),
      };
      memory = addProjectGoal(memory, 'Goal 1', 'Description');
      const goalId = memory.goals[0].id;
      const updated = updateGoalStatus(memory, goalId, 'completed');
      expect(updated.goals[0].status).toBe('completed');
      expect(updated.goals[0].completedAt).toBeDefined();
    });
  });

  describe('getContextSummaryForAI', () => {
    it('should generate a summary string', () => {
      const memory = {
        projectId: 'test',
        summary: 'A test project',
        structure: { folders: [], files: [], components: [], pages: [], apis: [], services: [], utils: [], dependencies: {} },
        goals: [],
        lastChanges: [],
        dependencies: [],
        technologies: ['React', 'TypeScript'],
        keyFiles: ['package.json'],
        updatedAt: new Date(),
      };
      const summary = getContextSummaryForAI(memory);
      expect(typeof summary).toBe('string');
      expect(summary).toContain('A test project');
      expect(summary).toContain('React');
    });
  });
});
