import { getProjectContext, saveProjectContext } from '../db';
import { nanoid } from 'nanoid';

export interface ProjectMemory {
  projectId: string;
  summary: string;
  structure: ProjectStructure;
  goals: ProjectGoal[];
  lastChanges: ChangeLog[];
  dependencies: string[];
  technologies: string[];
  keyFiles: string[];
  updatedAt: Date;
}

export interface ProjectStructure {
  folders: string[];
  files: string[];
  components: string[];
  pages: string[];
  apis: string[];
  dependencies: Record<string, string[]>;
}

export interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
}

export interface ChangeLog {
  id: string;
  timestamp: Date;
  description: string;
  filesAffected: string[];
  type: 'feature' | 'bugfix' | 'refactor' | 'optimization';
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
    updatedAt: new Date(),
  });
}

/**
 * Analyze project structure from files
 */
export function analyzeProjectStructure(files: Record<string, string>): ProjectStructure {
  const structure: any = {
    folders: new Set<string>(),
    files: [],
    components: [],
    pages: [],
    apis: [],
    dependencies: {},
  };

  for (const filePath of Object.keys(files)) {
    // Extract folder structure
    const parts = filePath.split('/');
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += (i === 0 ? '' : '/') + parts[i];
      (structure.folders as Set<string>).add(currentPath);
    }

    structure.files.push(filePath);

    // Categorize files
    if (filePath.includes('/components/') && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
      structure.components.push(filePath);
    } else if (filePath.includes('/pages/') && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
      structure.pages.push(filePath);
    } else if (filePath.includes('/api/') || filePath.includes('/routers/')) {
      structure.apis.push(filePath);
    }

    // Extract dependencies from imports
    const content = files[filePath];
    const importRegex = /import\s+.*?\s+from\s+['"]([@\w\-/]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      if (!structure.dependencies[filePath]) {
        structure.dependencies[filePath] = [];
      }
      if (!structure.dependencies[filePath].includes(dep)) {
        structure.dependencies[filePath].push(dep);
      }
    }
  }

  return {
    ...structure,
    folders: Array.from(structure.folders as Set<string>),
  } as ProjectStructure;
}

/**
 * Detect technologies used in the project
 */
export function detectTechnologies(files: Record<string, string>): string[] {
  const technologies = new Set<string>();

  // Check package.json for dependencies
  const packageJson = files['package.json'];
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.react) technologies.add('React');
      if (deps.vue) technologies.add('Vue');
      if (deps.svelte) technologies.add('Svelte');
      if (deps.typescript) technologies.add('TypeScript');
      if (deps.tailwindcss) technologies.add('TailwindCSS');
      if (deps.express) technologies.add('Express');
      if (deps.fastapi) technologies.add('FastAPI');
      if (deps.drizzle) technologies.add('Drizzle ORM');
      if (deps.prisma) technologies.add('Prisma');
    } catch (error) {
      console.error('[ProjectContextMemory] Error parsing package.json:', error);
    }
  }

  // Check for TypeScript
  if (Object.keys(files).some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
    technologies.add('TypeScript');
  }

  // Check for specific patterns in code
  for (const [filePath, content] of Object.entries(files)) {
    if (content.includes('import React')) technologies.add('React');
    if (content.includes('import Vue')) technologies.add('Vue');
    if (content.includes('import Svelte')) technologies.add('Svelte');
    if (content.includes('import { trpc')) technologies.add('tRPC');
    if (content.includes('@tanstack/react-query')) technologies.add('React Query');
    if (content.includes('drizzle-orm')) technologies.add('Drizzle ORM');
  }

  return Array.from(technologies);
}

/**
 * Identify key files in the project
 */
export function identifyKeyFiles(files: Record<string, string>): string[] {
  const keyFiles = new Set<string>();

  // Always important files
  const importantPatterns = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'README.md',
    '.env.example',
  ];

  for (const pattern of importantPatterns) {
    if (pattern in files) {
      keyFiles.add(pattern);
    }
  }

  // Entry points
  for (const filePath of Object.keys(files)) {
    if (filePath === 'index.ts' || filePath === 'index.tsx' || filePath === 'main.ts' || filePath === 'main.tsx') {
      keyFiles.add(filePath);
    }
    if (filePath.endsWith('App.tsx') || filePath.endsWith('App.ts')) {
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

  let summary = '# ملخص المشروع\n\n';
  summary += `**عدد الملفات:** ${structure.files.length}\n`;
  summary += `**عدد المجلدات:** ${structure.folders.length}\n`;
  summary += `**عدد المكونات:** ${structure.components.length}\n`;
  summary += `**عدد الصفحات:** ${structure.pages.length}\n`;
  summary += `**عدد واجهات API:** ${structure.apis.length}\n\n`;

  if (technologies.length > 0) {
    summary += `**التقنيات المستخدمة:** ${technologies.join(', ')}\n\n`;
  }

  if (keyFiles.length > 0) {
    summary += `**الملفات الرئيسية:** ${keyFiles.join(', ')}\n\n`;
  }

  return summary;
}

/**
 * Add a change log entry
 */
export function addChangeLog(
  memory: ProjectMemory,
  description: string,
  filesAffected: string[],
  type: 'feature' | 'bugfix' | 'refactor' | 'optimization' = 'feature'
): ProjectMemory {
  const changeLog: ChangeLog = {
    id: `change-${nanoid()}`,
    timestamp: new Date(),
    description,
    filesAffected,
    type,
  };

  // Keep only the last 20 changes
  const newChanges = [changeLog, ...memory.lastChanges].slice(0, 20);

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
    goals: memory.goals.map(g => (g.id === goalId ? { ...g, status } : g)),
    updatedAt: new Date(),
  };
}

/**
 * Get project context summary for AI
 */
export function getContextSummaryForAI(memory: ProjectMemory): string {
  let summary = `## سياق المشروع\n\n`;
  summary += `**الملخص:** ${memory.summary}\n\n`;

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
      summary += `- [${change.type}] ${change.description}\n`;
    }
    summary += '\n';
  }

  if (memory.technologies.length > 0) {
    summary += `### التقنيات: ${memory.technologies.join(', ')}\n\n`;
  }

  return summary;
}
