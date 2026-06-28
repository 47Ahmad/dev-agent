/**
 * File Relationship Analyzer - Phase 3B.3
 * Analyzes and understands relationships between all files in a project.
 * Builds a dependency graph, detects circular dependencies, and tracks
 * which files import/export what symbols.
 */

export interface FileNode {
  path: string;
  imports: ImportInfo[];
  exports: ExportInfo[];
  importedBy: string[];
  language: 'typescript' | 'javascript' | 'css' | 'json' | 'other';
  isEntryPoint: boolean;
  isComponent: boolean;
  isPage: boolean;
  isRouter: boolean;
  isService: boolean;
  isUtil: boolean;
}

export interface ImportInfo {
  source: string;
  resolvedPath?: string;
  symbols: string[];
  isDefault: boolean;
  isNamespace: boolean;
  isDynamic: boolean;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'default' | 'other';
  isDefault: boolean;
}

export interface FileRelationshipGraph {
  nodes: Map<string, FileNode>;
  circularDependencies: string[][];
  orphanFiles: string[];
  entryPoints: string[];
  criticalFiles: string[];
  dependencyDepth: Map<string, number>;
}

export interface ImportUpdateResult {
  filePath: string;
  oldImport: string;
  newImport: string;
  applied: boolean;
  reason?: string;
}

/**
 * Detect the language/type of a file based on its extension and path
 */
function detectFileLanguage(filePath: string): FileNode['language'] {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.css') || filePath.endsWith('.scss')) return 'css';
  if (filePath.endsWith('.json')) return 'json';
  return 'other';
}

/**
 * Detect file role based on path
 */
function detectFileRole(filePath: string): Partial<FileNode> {
  return {
    isComponent: filePath.includes('/components/'),
    isPage: filePath.includes('/pages/'),
    isRouter: filePath.includes('/routers/') || filePath.endsWith('Router.ts'),
    isService: filePath.includes('/services/'),
    isUtil: filePath.includes('/utils/') || filePath.includes('/lib/') || filePath.includes('/helpers/'),
    isEntryPoint: filePath.endsWith('index.ts') || filePath.endsWith('index.tsx') ||
                  filePath.endsWith('main.ts') || filePath.endsWith('main.tsx') ||
                  filePath.endsWith('App.tsx') || filePath.endsWith('App.ts'),
  };
}

/**
 * Parse all imports from a file's content
 */
export function parseImports(content: string, filePath: string): ImportInfo[] {
  const imports: ImportInfo[] = [];

  // Static imports: import { a, b } from 'module'
  const staticImportRegex = /import\s+(?:type\s+)?(?:(\*\s+as\s+\w+|\{[^}]*\}|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = staticImportRegex.exec(content)) !== null) {
    const importClause = match[1] || '';
    const source = match[2];

    const symbols: string[] = [];
    let isDefault = false;
    let isNamespace = false;

    if (importClause.startsWith('* as')) {
      isNamespace = true;
      symbols.push(importClause.replace('* as', '').trim());
    } else if (importClause.startsWith('{')) {
      // Named imports
      const named = importClause.replace(/[{}]/g, '').split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean);
      symbols.push(...named);
    } else if (importClause) {
      // Default import
      isDefault = true;
      symbols.push(importClause.trim());
    }

    imports.push({
      source,
      symbols,
      isDefault,
      isNamespace,
      isDynamic: false,
    });
  }

  // Side-effect imports: import 'module'
  const sideEffectRegex = /import\s+['"]([^'"]+)['"]/g;
  while ((match = sideEffectRegex.exec(content)) !== null) {
    imports.push({
      source: match[1],
      symbols: [],
      isDefault: false,
      isNamespace: false,
      isDynamic: false,
    });
  }

  // Dynamic imports: import('module')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push({
      source: match[1],
      symbols: [],
      isDefault: false,
      isNamespace: false,
      isDynamic: true,
    });
  }

  return imports;
}

/**
 * Parse all exports from a file's content
 */
export function parseExports(content: string): ExportInfo[] {
  const exports: ExportInfo[] = [];

  // Named exports: export function/class/const/interface/type
  const namedExportRegex = /export\s+(?:async\s+)?(?:(function|class|const|let|var|interface|type|enum))\s+(\w+)/g;
  let match;

  while ((match = namedExportRegex.exec(content)) !== null) {
    const keyword = match[1];
    const name = match[2];
    let type: ExportInfo['type'] = 'other';

    if (keyword === 'function') type = 'function';
    else if (keyword === 'class') type = 'class';
    else if (keyword === 'interface') type = 'interface';
    else if (keyword === 'type') type = 'type';
    else if (keyword === 'const' || keyword === 'let' || keyword === 'var') type = 'const';

    exports.push({ name, type, isDefault: false });
  }

  // Default exports: export default ...
  const defaultExportRegex = /export\s+default\s+(?:function\s+)?(\w+)?/g;
  while ((match = defaultExportRegex.exec(content)) !== null) {
    exports.push({
      name: match[1] || 'default',
      type: 'default',
      isDefault: true,
    });
  }

  // Re-exports: export { a, b } from 'module'
  const reExportRegex = /export\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = reExportRegex.exec(content)) !== null) {
    const symbols = match[1].split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean);
    for (const sym of symbols) {
      exports.push({ name: sym, type: 'other', isDefault: false });
    }
  }

  return exports;
}

/**
 * Resolve a relative import path to an absolute path
 */
export function resolveImportPath(importSource: string, currentFilePath: string, allFiles: string[]): string | undefined {
  // Skip external modules
  if (!importSource.startsWith('.') && !importSource.startsWith('/')) {
    return undefined;
  }

  // Handle @/* aliases
  if (importSource.startsWith('@/')) {
    const resolved = importSource.replace('@/', 'client/src/');
    return findFileWithExtensions(resolved, allFiles);
  }

  // Handle @shared/* aliases
  if (importSource.startsWith('@shared/')) {
    const resolved = importSource.replace('@shared/', 'shared/');
    return findFileWithExtensions(resolved, allFiles);
  }

  // Resolve relative paths
  const currentDir = currentFilePath.split('/').slice(0, -1).join('/');
  const parts = importSource.split('/');
  const resolvedParts = currentDir.split('/');

  for (const part of parts) {
    if (part === '..') {
      resolvedParts.pop();
    } else if (part !== '.') {
      resolvedParts.push(part);
    }
  }

  const resolvedPath = resolvedParts.join('/');
  return findFileWithExtensions(resolvedPath, allFiles);
}

/**
 * Find a file by trying different extensions
 */
function findFileWithExtensions(basePath: string, allFiles: string[]): string | undefined {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

  // Exact match
  if (allFiles.includes(basePath)) return basePath;

  // Try with extensions
  for (const ext of extensions) {
    const withExt = basePath + ext;
    if (allFiles.includes(withExt)) return withExt;
  }

  return undefined;
}

/**
 * Build a complete file relationship graph for a project
 */
export function buildFileRelationshipGraph(files: Record<string, string>): FileRelationshipGraph {
  const nodes = new Map<string, FileNode>();
  const allFilePaths = Object.keys(files);

  // First pass: create all nodes
  for (const [filePath, content] of Object.entries(files)) {
    const language = detectFileLanguage(filePath);
    const role = detectFileRole(filePath);

    const imports = (language === 'typescript' || language === 'javascript')
      ? parseImports(content, filePath)
      : [];

    const exports = (language === 'typescript' || language === 'javascript')
      ? parseExports(content)
      : [];

    // Resolve import paths
    for (const imp of imports) {
      imp.resolvedPath = resolveImportPath(imp.source, filePath, allFilePaths);
    }

    nodes.set(filePath, {
      path: filePath,
      imports,
      exports,
      importedBy: [],
      language,
      isEntryPoint: role.isEntryPoint || false,
      isComponent: role.isComponent || false,
      isPage: role.isPage || false,
      isRouter: role.isRouter || false,
      isService: role.isService || false,
      isUtil: role.isUtil || false,
    });
  }

  // Second pass: build importedBy relationships
  for (const [filePath, node] of nodes.entries()) {
    for (const imp of node.imports) {
      if (imp.resolvedPath && nodes.has(imp.resolvedPath)) {
        const targetNode = nodes.get(imp.resolvedPath)!;
        if (!targetNode.importedBy.includes(filePath)) {
          targetNode.importedBy.push(filePath);
        }
      }
    }
  }

  // Find circular dependencies using DFS
  const circularDependencies = findCircularDependencies(nodes);

  // Find orphan files (not imported by anyone and not an entry point)
  const orphanFiles = Array.from(nodes.values())
    .filter(node => node.importedBy.length === 0 && !node.isEntryPoint)
    .map(node => node.path);

  // Find entry points
  const entryPoints = Array.from(nodes.values())
    .filter(node => node.isEntryPoint)
    .map(node => node.path);

  // Calculate dependency depth
  const dependencyDepth = calculateDependencyDepth(nodes);

  // Find critical files (imported by many files)
  const criticalFiles = Array.from(nodes.values())
    .filter(node => node.importedBy.length >= 3)
    .sort((a, b) => b.importedBy.length - a.importedBy.length)
    .map(node => node.path);

  return {
    nodes,
    circularDependencies,
    orphanFiles,
    entryPoints,
    criticalFiles,
    dependencyDepth,
  };
}

/**
 * Find circular dependencies using DFS
 */
function findCircularDependencies(nodes: Map<string, FileNode>): string[][] {
  const circular: string[][] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(path: string, stack: string[]): void {
    if (inStack.has(path)) {
      const cycleStart = stack.indexOf(path);
      circular.push(stack.slice(cycleStart).concat(path));
      return;
    }
    if (visited.has(path)) return;

    visited.add(path);
    inStack.add(path);
    stack.push(path);

    const node = nodes.get(path);
    if (node) {
      for (const imp of node.imports) {
        if (imp.resolvedPath && nodes.has(imp.resolvedPath)) {
          dfs(imp.resolvedPath, [...stack]);
        }
      }
    }

    inStack.delete(path);
  }

  for (const path of nodes.keys()) {
    if (!visited.has(path)) {
      dfs(path, []);
    }
  }

  return circular;
}

/**
 * Calculate the dependency depth of each file
 */
function calculateDependencyDepth(nodes: Map<string, FileNode>): Map<string, number> {
  const depth = new Map<string, number>();

  function getDepth(path: string, visited: Set<string>): number {
    if (depth.has(path)) return depth.get(path)!;
    if (visited.has(path)) return 0; // Circular dependency

    visited.add(path);
    const node = nodes.get(path);
    if (!node || node.imports.length === 0) {
      depth.set(path, 0);
      return 0;
    }

    let maxDepth = 0;
    for (const imp of node.imports) {
      if (imp.resolvedPath && nodes.has(imp.resolvedPath)) {
        const d = getDepth(imp.resolvedPath, new Set(visited));
        maxDepth = Math.max(maxDepth, d + 1);
      }
    }

    depth.set(path, maxDepth);
    return maxDepth;
  }

  for (const path of nodes.keys()) {
    getDepth(path, new Set());
  }

  return depth;
}

/**
 * Find all files that would be affected by changing a specific file
 */
export function findAffectedFiles(
  changedFilePath: string,
  graph: FileRelationshipGraph,
  maxDepth: number = 5
): string[] {
  const affected = new Set<string>();
  const queue: Array<{ path: string; depth: number }> = [{ path: changedFilePath, depth: 0 }];

  while (queue.length > 0) {
    const { path, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    const node = graph.nodes.get(path);
    if (!node) continue;

    for (const importedBy of node.importedBy) {
      if (!affected.has(importedBy)) {
        affected.add(importedBy);
        queue.push({ path: importedBy, depth: depth + 1 });
      }
    }
  }

  return Array.from(affected);
}

/**
 * Update all imports when a file is moved or renamed
 */
export function updateImportsForFileMove(
  oldPath: string,
  newPath: string,
  graph: FileRelationshipGraph,
  files: Record<string, string>
): ImportUpdateResult[] {
  const results: ImportUpdateResult[] = [];
  const affectedFiles = findAffectedFiles(oldPath, graph);

  for (const affectedFile of affectedFiles) {
    const content = files[affectedFile];
    if (!content) continue;

    const node = graph.nodes.get(affectedFile);
    if (!node) continue;

    let updatedContent = content;
    let hasChanges = false;

    for (const imp of node.imports) {
      if (imp.resolvedPath === oldPath) {
        // Calculate new relative path
        const newRelativePath = calculateRelativePath(affectedFile, newPath);
        const oldImportStr = imp.source;

        // Update the import in content
        const escapedOld = oldImportStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(['"])${escapedOld}(['"])`, 'g');
        const newContent = updatedContent.replace(regex, `$1${newRelativePath}$2`);

        if (newContent !== updatedContent) {
          results.push({
            filePath: affectedFile,
            oldImport: oldImportStr,
            newImport: newRelativePath,
            applied: true,
          });
          updatedContent = newContent;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      files[affectedFile] = updatedContent;
    }
  }

  return results;
}

/**
 * Calculate relative path from one file to another
 */
function calculateRelativePath(fromFile: string, toFile: string): string {
  const fromParts = fromFile.split('/').slice(0, -1);
  const toParts = toFile.split('/');

  // Remove common prefix
  let commonLength = 0;
  while (commonLength < fromParts.length && commonLength < toParts.length - 1 &&
         fromParts[commonLength] === toParts[commonLength]) {
    commonLength++;
  }

  const upCount = fromParts.length - commonLength;
  const downPath = toParts.slice(commonLength).join('/');

  let relativePath = '';
  if (upCount === 0) {
    relativePath = './' + downPath;
  } else {
    relativePath = '../'.repeat(upCount) + downPath;
  }

  // Remove file extension for TypeScript imports
  return relativePath.replace(/\.(ts|tsx)$/, '');
}

/**
 * Detect which symbols are used from a specific import
 */
export function detectUsedSymbols(content: string, importSource: string): string[] {
  const usedSymbols: string[] = [];
  const imports = parseImports(content, '');

  const relevantImport = imports.find(imp => imp.source === importSource);
  if (!relevantImport) return [];

  for (const symbol of relevantImport.symbols) {
    // Check if symbol is actually used in the file (not just imported)
    const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'g');
    const importLine = `import.*${symbol}.*from.*${importSource}`;
    const contentWithoutImport = content.replace(new RegExp(importLine, 'g'), '');
    const occurrences = (contentWithoutImport.match(symbolRegex) || []).length;

    if (occurrences > 0) {
      usedSymbols.push(symbol);
    }
  }

  return usedSymbols;
}

/**
 * Find unused imports in a file
 */
export function findUnusedImports(content: string, filePath: string): ImportInfo[] {
  const imports = parseImports(content, filePath);
  const unusedImports: ImportInfo[] = [];

  for (const imp of imports) {
    if (imp.symbols.length === 0) continue; // Skip side-effect imports

    const usedSymbols = detectUsedSymbols(content, imp.source);
    if (usedSymbols.length === 0) {
      unusedImports.push(imp);
    }
  }

  return unusedImports;
}

/**
 * Generate a summary of the file relationship graph
 */
export function summarizeFileGraph(graph: FileRelationshipGraph): string {
  let summary = '## تحليل علاقات الملفات\n\n';

  summary += `**إجمالي الملفات:** ${graph.nodes.size}\n`;
  summary += `**نقاط الدخول:** ${graph.entryPoints.length}\n`;
  summary += `**الملفات الحرجة:** ${graph.criticalFiles.length}\n`;
  summary += `**الملفات المعزولة:** ${graph.orphanFiles.length}\n`;
  summary += `**التبعيات الدائرية:** ${graph.circularDependencies.length}\n\n`;

  if (graph.criticalFiles.length > 0) {
    summary += '### الملفات الأكثر استخداماً:\n';
    for (const file of graph.criticalFiles.slice(0, 5)) {
      const node = graph.nodes.get(file);
      summary += `- \`${file}\` (مستخدم في ${node?.importedBy.length || 0} ملفات)\n`;
    }
    summary += '\n';
  }

  if (graph.circularDependencies.length > 0) {
    summary += '### ⚠️ تبعيات دائرية:\n';
    for (const cycle of graph.circularDependencies.slice(0, 3)) {
      summary += `- ${cycle.join(' → ')}\n`;
    }
    summary += '\n';
  }

  return summary;
}
