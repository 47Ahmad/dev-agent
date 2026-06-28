/**
 * Project Context Manager - Phase 3B.3
 * Enhanced manager that understands relationships between all files.
 * Features:
 * - Deep file relationship analysis
 * - Technology stack detection
 * - Change history tracking
 * - AI-optimized context generation
 * - Persistent memory across sessions
 */

import { getProjectContext, saveProjectContext } from '../db';
import { nanoid } from 'nanoid';
import {
  buildFileRelationshipGraph,
  summarizeFileGraph,
  FileRelationshipGraph,
} from './fileRelationshipAnalyzer';

export interface ProjectMemory {
  projectId: string;
  summary: string;
  structure: ProjectStructure;
  goals: ProjectGoal[];
  lastChanges: ChangeLog[];
  dependencies: string[];
  technologies: string[];
  keyFiles: string[];
  fileRelationships?: FileRelationshipSummary;
  updatedAt: Date;
}

export interface ProjectStructure {
  folders: string[];
  files: string[];
  components: string[];
  pages: string[];
  apis: string[];
  services: string[];
  utils: string[];
  dependencies: Record<string, string[]>;
}

export interface FileRelationshipSummary {
  totalFiles: number;
  entryPoints: string[];
  criticalFiles: string[];
  orphanFiles: string[];
  circularDependencies: string[][];
  mostImportedFiles: Array<{ path: string; importCount: number }>;
}

export interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface ChangeLog {
  id: string;
  timestamp: Date;
  description: string;
  filesAffected: string[];
  type: 'feature' | 'bugfix' | 'refactor' | 'optimization';
  phase?: string;
}

export interface TechnologyStack {
  frontend: string[];
  backend: string[];
  database: string[];
  testing: string[];
  tooling: string[];
}

/**
 * Load project memory from database
 */
export async function loadProjectMemory(projectId: string): Promise<ProjectMemory | null> {
  const context = await getProjectContext(projectId);
  if (!context) return null;

  return {
    projectId: context.projectId,
    summary: context.summary,
    structure: context.structure as ProjectStructure,
    goals: context.goals as ProjectGoal[],
    lastChanges: context.lastChanges as ChangeLog[],
    dependencies: [],
    technologies: [],
    keyFiles: [],
    updatedAt: context.updatedAt,
  };
}

/**
 * Save project memory to database
 */
export async function saveMemory(memory: ProjectMemory): Promise<void> {
  await saveProjectContext({
    projectId: memory.projectId,
    summary: memory.summary,
    structure: memory.structure,
    goals: memory.goals,
    lastChanges: memory.lastChanges,
    updatedAt: memory.updatedAt,
  });
}

/**
 * Analyze project structure with enhanced relationship understanding
 */
export function analyzeProjectStructure(files: Record<string, string>): ProjectStructure {
  const folders = new Set<string>();
  const components: string[] = [];
  const pages: string[] = [];
  const apis: string[] = [];
  const services: string[] = [];
  const utils: string[] = [];
  const dependencies: Record<string, string[]> = {};

  for (const filePath of Object.keys(files)) {
    // Extract folders
    const parts = filePath.split('/');
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += (i === 0 ? '' : '/') + parts[i];
      folders.add(currentPath);
    }

    // Categorize files
    if (filePath.includes('/client/src/pages/') || filePath.includes('/pages/')) {
      pages.push(filePath);
    } else if (filePath.includes('/client/src/components/') || filePath.includes('/components/')) {
      components.push(filePath);
    } else if (filePath.includes('/server/routers/') || filePath.includes('/routers/')) {
      apis.push(filePath);
    } else if (filePath.includes('/server/services/') || filePath.includes('/services/')) {
      services.push(filePath);
    } else if (filePath.includes('/utils/') || filePath.includes('/lib/') || filePath.includes('/helpers/')) {
      utils.push(filePath);
    }

    // Extract dependencies
    const content = files[filePath];
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
    dependencies[filePath] = importMatches
      .map((imp: string) => {
        const m = imp.match(/from\s+['"]([^'"]+)['"]/);
        return m ? m[1] : '';
      })
      .filter(Boolean);
  }

  return {
    folders: Array.from(folders),
    files: Object.keys(files),
    components,
    pages,
    apis,
    services,
    utils,
    dependencies,
  };
}

/**
 * Build file relationship summary from graph
 */
export function buildFileRelationshipSummary(
  graph: FileRelationshipGraph
): FileRelationshipSummary {
  const mostImportedFiles = Array.from(graph.nodes.values())
    .filter(node => node.importedBy.length > 0)
    .sort((a, b) => b.importedBy.length - a.importedBy.length)
    .slice(0, 10)
    .map(node => ({ path: node.path, importCount: node.importedBy.length }));

  return {
    totalFiles: graph.nodes.size,
    entryPoints: graph.entryPoints,
    criticalFiles: graph.criticalFiles,
    orphanFiles: graph.orphanFiles,
    circularDependencies: graph.circularDependencies,
    mostImportedFiles,
  };
}

/**
 * Detect technology stack from project files
 */
export function detectTechnologies(files: Record<string, string>): string[] {
  const technologies = new Set<string>();

  // Check package.json
  if (files['package.json']) {
    try {
      const pkg = JSON.parse(files['package.json']);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Frontend frameworks
      if (deps.react) technologies.add('React');
      if (deps.vue) technologies.add('Vue');
      if (deps.svelte) technologies.add('Svelte');
      if (deps['next']) technologies.add('Next.js');
      if (deps['nuxt']) technologies.add('Nuxt.js');

      // Backend frameworks
      if (deps.express) technologies.add('Express.js');
      if (deps.fastify) technologies.add('Fastify');
      if (deps.hono) technologies.add('Hono');

      // State management
      if (deps.zustand) technologies.add('Zustand');
      if (deps.redux || deps['@reduxjs/toolkit']) technologies.add('Redux');
      if (deps['@tanstack/react-query']) technologies.add('React Query');

      // Database
      if (deps['drizzle-orm']) technologies.add('Drizzle ORM');
      if (deps.prisma || deps['@prisma/client']) technologies.add('Prisma');
      if (deps.mongoose) technologies.add('Mongoose');
      if (deps.mysql2) technologies.add('MySQL');
      if (deps.pg) technologies.add('PostgreSQL');

      // API
      if (deps['@trpc/server']) technologies.add('tRPC');
      if (deps['@apollo/server'] || deps['apollo-server']) technologies.add('GraphQL');

      // Styling
      if (deps.tailwindcss) technologies.add('TailwindCSS');
      if (deps['styled-components']) technologies.add('Styled Components');
      if (deps['@mui/material']) technologies.add('Material UI');

      // Testing
      if (deps.vitest) technologies.add('Vitest');
      if (deps.jest) technologies.add('Jest');
      if (deps.playwright) technologies.add('Playwright');
      if (deps.cypress) technologies.add('Cypress');

      // Build tools
      if (deps.vite) technologies.add('Vite');
      if (deps.webpack) technologies.add('Webpack');
      if (deps.esbuild) technologies.add('esbuild');

      // Auth
      if (deps.jose) technologies.add('JWT (jose)');
      if (deps.passport) technologies.add('Passport.js');

      // Cloud
      if (deps['@aws-sdk/client-s3']) technologies.add('AWS S3');

    } catch (error) {
      console.error('[ProjectContextMemory] Error parsing package.json:', error);
    }
  }

  // Check for TypeScript
  if (Object.keys(files).some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
    technologies.add('TypeScript');
  }

  // Check for specific patterns in code
  for (const content of Object.values(files)) {
    if (content.includes('import React') || content.includes("from 'react'")) technologies.add('React');
    if (content.includes("from 'vue'")) technologies.add('Vue');
    if (content.includes("from 'svelte'")) technologies.add('Svelte');
    if (content.includes("from '@trpc/")) technologies.add('tRPC');
    if (content.includes('@tanstack/react-query')) technologies.add('React Query');
    if (content.includes('drizzle-orm')) technologies.add('Drizzle ORM');
    if (content.includes('framer-motion')) technologies.add('Framer Motion');
    if (content.includes('wouter')) technologies.add('Wouter Router');
    if (content.includes('react-router')) technologies.add('React Router');
  }

  return Array.from(technologies);
}

/**
 * Identify key files in the project
 */
export function identifyKeyFiles(files: Record<string, string>): string[] {
  const keyFiles = new Set<string>();

  const importantPatterns = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'README.md',
    '.env.example',
    'vitest.config.ts',
  ];

  for (const pattern of importantPatterns) {
    if (pattern in files) {
      keyFiles.add(pattern);
    }
  }

  for (const filePath of Object.keys(files)) {
    const fileName = filePath.split('/').pop() || '';
    if (['index.ts', 'index.tsx', 'main.ts', 'main.tsx', 'App.tsx', 'App.ts'].includes(fileName)) {
      keyFiles.add(filePath);
    }
    if (filePath.includes('server/_core/index.ts')) {
      keyFiles.add(filePath);
    }
    if (filePath.includes('server/routers.ts') || filePath.includes('server/db.ts')) {
      keyFiles.add(filePath);
    }
  }

  return Array.from(keyFiles);
}

/**
 * Create a comprehensive project summary
 */
export function createProjectSummary(files: Record<string, string>): string {
  const structure = analyzeProjectStructure(files);
  const technologies = detectTechnologies(files);
  const keyFiles = identifyKeyFiles(files);

  // Build file relationship graph for deeper analysis
  const graph = buildFileRelationshipGraph(files);
  const graphSummary = summarizeFileGraph(graph);

  let summary = '# ملخص المشروع\n\n';
  summary += `**عدد الملفات:** ${structure.files.length}\n`;
  summary += `**عدد المجلدات:** ${structure.folders.length}\n`;
  summary += `**عدد المكونات:** ${structure.components.length}\n`;
  summary += `**عدد الصفحات:** ${structure.pages.length}\n`;
  summary += `**عدد واجهات API:** ${structure.apis.length}\n`;
  summary += `**عدد الخدمات:** ${structure.services.length}\n\n`;

  if (technologies.length > 0) {
    summary += `**التقنيات المستخدمة:** ${technologies.join(', ')}\n\n`;
  }

  if (keyFiles.length > 0) {
    summary += `**الملفات الرئيسية:** ${keyFiles.join(', ')}\n\n`;
  }

  summary += graphSummary;

  return summary;
}

/**
 * Add a change log entry
 */
export function addChangeLog(
  memory: ProjectMemory,
  description: string,
  filesAffected: string[],
  type: 'feature' | 'bugfix' | 'refactor' | 'optimization' = 'feature',
  phase?: string
): ProjectMemory {
  const changeLog: ChangeLog = {
    id: `change-${nanoid()}`,
    timestamp: new Date(),
    description,
    filesAffected,
    type,
    phase,
  };

  // Keep only the last 50 changes
  const newChanges = [changeLog, ...memory.lastChanges].slice(0, 50);

  return {
    ...memory,
    lastChanges: newChanges,
    updatedAt: new Date(),
  };
}

/**
 * Add a project goal
 */
export function addProjectGoal(
  memory: ProjectMemory,
  title: string,
  description: string
): ProjectMemory {
  const goal: ProjectGoal = {
    id: `goal-${nanoid()}`,
    title,
    description,
    status: 'pending',
    createdAt: new Date(),
  };

  return {
    ...memory,
    goals: [...memory.goals, goal],
    updatedAt: new Date(),
  };
}

/**
 * Update goal status
 */
export function updateGoalStatus(
  memory: ProjectMemory,
  goalId: string,
  status: 'pending' | 'in-progress' | 'completed'
): ProjectMemory {
  return {
    ...memory,
    goals: memory.goals.map(g => (
      g.id === goalId
        ? { ...g, status, completedAt: status === 'completed' ? new Date() : undefined }
        : g
    )),
    updatedAt: new Date(),
  };
}

/**
 * Get project context summary for AI - enhanced with relationship data
 */
export function getContextSummaryForAI(memory: ProjectMemory): string {
  let summary = `## سياق المشروع\n\n`;
  summary += `**الملخص:** ${memory.summary}\n\n`;

  if (memory.technologies.length > 0) {
    summary += `### التقنيات: ${memory.technologies.join(', ')}\n\n`;
  }

  if (memory.fileRelationships) {
    const rel = memory.fileRelationships;
    summary += `### بنية الملفات:\n`;
    summary += `- إجمالي الملفات: ${rel.totalFiles}\n`;
    summary += `- نقاط الدخول: ${rel.entryPoints.length}\n`;
    summary += `- الملفات الحرجة: ${rel.criticalFiles.length}\n`;

    if (rel.mostImportedFiles.length > 0) {
      summary += `\n### الملفات الأكثر استخداماً:\n`;
      for (const file of rel.mostImportedFiles.slice(0, 5)) {
        summary += `- \`${file.path}\` (${file.importCount} استيراد)\n`;
      }
      summary += '\n';
    }

    if (rel.circularDependencies.length > 0) {
      summary += `\n### ⚠️ تبعيات دائرية (${rel.circularDependencies.length}):\n`;
      for (const cycle of rel.circularDependencies.slice(0, 2)) {
        summary += `- ${cycle.join(' → ')}\n`;
      }
      summary += '\n';
    }
  }

  if (memory.goals.length > 0) {
    summary += `### الأهداف:\n`;
    for (const goal of memory.goals) {
      const statusEmoji = goal.status === 'completed' ? '✅' : goal.status === 'in-progress' ? '🔄' : '⏳';
      summary += `- ${statusEmoji} ${goal.title} (${goal.description})\n`;
    }
    summary += '\n';
  }

  if (memory.lastChanges.length > 0) {
    summary += `### آخر التغييرات:\n`;
    for (const change of memory.lastChanges.slice(0, 5)) {
      const phase = change.phase ? ` [${change.phase}]` : '';
      summary += `- [${change.type}]${phase} ${change.description}\n`;
      if (change.filesAffected.length > 0) {
        summary += `  الملفات: ${change.filesAffected.slice(0, 3).join(', ')}\n`;
      }
    }
    summary += '\n';
  }

  if (memory.keyFiles.length > 0) {
    summary += `### الملفات الرئيسية:\n`;
    for (const file of memory.keyFiles.slice(0, 10)) {
      summary += `- \`${file}\`\n`;
    }
    summary += '\n';
  }

  return summary;
}

/**
 * Create or update project memory from current files
 */
export async function createOrUpdateProjectMemory(
  projectId: string,
  files: Record<string, string>,
  description?: string
): Promise<ProjectMemory> {
  // Load existing memory or create new
  const existing = await loadProjectMemory(projectId);

  const structure = analyzeProjectStructure(files);
  const technologies = detectTechnologies(files);
  const keyFiles = identifyKeyFiles(files);
  const summary = createProjectSummary(files);

  // Build file relationship graph
  const graph = buildFileRelationshipGraph(files);
  const fileRelationships = buildFileRelationshipSummary(graph);

  const memory: ProjectMemory = {
    projectId,
    summary,
    structure,
    goals: existing?.goals || [],
    lastChanges: existing?.lastChanges || [],
    dependencies: technologies,
    technologies,
    keyFiles,
    fileRelationships,
    updatedAt: new Date(),
  };

  if (description) {
    const updatedMemory = addChangeLog(memory, description, [], 'feature');
    await saveMemory(updatedMemory);
    return updatedMemory;
  }

  await saveMemory(memory);
  return memory;
}

/**
 * Get files that are most likely affected by a specific change
 */
export function getFilesAffectedByChange(
  changedFile: string,
  memory: ProjectMemory
): string[] {
  const affected: string[] = [];

  // Find files that import the changed file
  for (const [filePath, imports] of Object.entries(memory.structure.dependencies)) {
    if (imports.some(imp => imp.includes(changedFile.replace(/\.(ts|tsx|js|jsx)$/, '')))) {
      affected.push(filePath);
    }
  }

  return affected;
}
