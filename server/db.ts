import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, workspaces, projects, projectVersions, generationHistory, usageTracking, deployments, customDomains, templates, marketplaceComponents, projectFiles, billingHistory, apiKeys } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER OPERATIONS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// WORKSPACE OPERATIONS
// ============================================

export async function createWorkspace(userId: number, name: string, plan: 'free' | 'pro' | 'team' = 'free') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `ws-${nanoid()}`;
  await db.insert(workspaces).values({
    id,
    userId,
    name,
    plan,
    generationCredits: plan === 'free' ? 10 : plan === 'pro' ? 100 : 1000,
  });

  return id;
}

export async function getUserWorkspaces(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(workspaces).where(eq(workspaces.userId, userId));
}

export async function getWorkspace(workspaceId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============================================
// PROJECT OPERATIONS
// ============================================

export async function createProject(workspaceId: string, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `proj-${nanoid()}`;
  await db.insert(projects).values({
    id,
    workspaceId,
    name,
    description,
  });

  return id;
}

export async function getWorkspaceProjects(workspaceId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.workspaceId, workspaceId));
}

export async function getProject(projectId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProjectStatus(projectId: string, status: 'draft' | 'published' | 'archived') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({ status }).where(eq(projects.id, projectId));
}

// ============================================
// PROJECT VERSION OPERATIONS
// ============================================

export async function saveProjectVersion(
  projectId: string,
  prompt: string,
  html: string,
  css: string,
  js: string,
  metadata?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current version count
  const versions = await db.select().from(projectVersions).where(eq(projectVersions.projectId, projectId));
  const versionNumber = versions.length + 1;

  const id = `ver-${nanoid()}`;
  await db.insert(projectVersions).values({
    id,
    projectId,
    versionNumber,
    prompt,
    html,
    css,
    js,
    metadata,
  });

  return id;
}

export async function getProjectVersions(projectId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectVersions).where(eq(projectVersions.projectId, projectId));
}

export async function getProjectVersion(versionId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(projectVersions).where(eq(projectVersions.id, versionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============================================
// GENERATION HISTORY OPERATIONS
// ============================================

export async function recordGeneration(
  workspaceId: string,
  userId: number,
  prompt: string,
  model: string,
  projectId?: string,
  status: 'success' | 'failed' | 'pending' = 'pending',
  error?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `gen-${nanoid()}`;
  await db.insert(generationHistory).values({
    id,
    projectId,
    workspaceId,
    userId,
    prompt,
    model,
    status,
    error,
  });

  return id;
}

export async function getGenerationHistory(workspaceId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(generationHistory).where(eq(generationHistory.workspaceId, workspaceId)).limit(limit);
}

// ============================================
// USAGE TRACKING OPERATIONS
// ============================================

export async function getOrCreateUsageTracking(workspaceId: string, month: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(usageTracking).where(
    and(eq(usageTracking.workspaceId, workspaceId), eq(usageTracking.month, month))
  ).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const id = `usage-${nanoid()}`;
  await db.insert(usageTracking).values({
    id,
    workspaceId,
    month,
  });

  return { id, workspaceId, month, generationsCount: 0, creditsUsed: '0' };
}

export async function incrementUsageCount(workspaceId: string, creditsUsed: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const tracking = await getOrCreateUsageTracking(workspaceId, month);

  // Update counts
  const currentCount = tracking.generationsCount ?? 0;
  const currentCredits = parseFloat(String(tracking.creditsUsed ?? '0'));
  
  await db.update(usageTracking).set({
    generationsCount: currentCount + 1,
    creditsUsed: String(currentCredits + creditsUsed),
  }).where(eq(usageTracking.id, tracking.id));
}

// ============================================
// DEPLOYMENT OPERATIONS
// ============================================

export async function createDeployment(projectId: string, versionId: string, provider: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `deploy-${nanoid()}`;
  await db.insert(deployments).values({
    id,
    projectId,
    versionId,
    provider,
  });

  return id;
}

export async function getProjectDeployments(projectId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(deployments).where(eq(deployments.projectId, projectId));
}

export async function updateDeploymentStatus(deploymentId: string, status: string, url?: string, error?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(deployments).set({ status: status as any, url, error }).where(eq(deployments.id, deploymentId));
}

// ============================================
// CUSTOM DOMAIN OPERATIONS
// ============================================

export async function createCustomDomain(projectId: string, domain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `domain-${nanoid()}`;
  await db.insert(customDomains).values({
    id,
    projectId,
    domain,
  });

  return id;
}

export async function getProjectDomains(projectId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(customDomains).where(eq(customDomains.projectId, projectId));
}

export async function updateDomainStatus(domainId: string, status: string, sslStatus?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(customDomains).set({ status: status as any, sslStatus: sslStatus as any }).where(eq(customDomains.id, domainId));
}

// ============================================
// TEMPLATE OPERATIONS
// ============================================

export async function createTemplate(name: string, category: string, html: string, css: string, js: string, createdBy: number, description?: string, thumbnail?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `tmpl-${nanoid()}`;
  await db.insert(templates).values({
    id,
    name,
    category,
    html,
    css,
    js,
    createdBy,
    description,
    thumbnail,
  });

  return id;
}

export async function getPublicTemplates(category?: string) {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return db.select().from(templates).where(and(eq(templates.isPublic, 1), eq(templates.category, category)));
  }
  return db.select().from(templates).where(eq(templates.isPublic, 1));
}

export async function getTemplate(templateId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============================================
// MARKETPLACE COMPONENT OPERATIONS
// ============================================

export async function createMarketplaceComponent(name: string, category: string, code: string, createdBy: number, description?: string, preview?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `comp-${nanoid()}`;
  await db.insert(marketplaceComponents).values({
    id,
    name,
    category,
    code,
    createdBy,
    description,
    preview,
  });

  return id;
}

export async function getPublicComponents(category?: string) {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return db.select().from(marketplaceComponents).where(and(eq(marketplaceComponents.isPublic, 1), eq(marketplaceComponents.category, category)));
  }
  return db.select().from(marketplaceComponents).where(eq(marketplaceComponents.isPublic, 1));
}

// ============================================
// PROJECT FILE OPERATIONS
// ============================================

export async function createProjectFile(projectId: string, name: string, path: string, type: string, content?: string, language?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `file-${nanoid()}`;
  await db.insert(projectFiles).values({
    id,
    projectId,
    name,
    path,
    type,
    content,
    language,
  });

  return id;
}

export async function getProjectFiles(projectId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));
}

export async function updateProjectFile(fileId: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projectFiles).set({ content }).where(eq(projectFiles.id, fileId));
}

// ============================================
// BILLING HISTORY OPERATIONS
// ============================================

export async function recordBillingTransaction(workspaceId: string, type: string, amount: number, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `bill-${nanoid()}`;
  await db.insert(billingHistory).values({
    id,
    workspaceId,
    type: type as any,
    amount: amount.toString() as any,
    description,
  });

  return id;
}

export async function getBillingHistory(workspaceId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(billingHistory).where(eq(billingHistory.workspaceId, workspaceId)).limit(limit);
}


// ============================================
// API KEY OPERATIONS
// ============================================

export async function createApiKey(workspaceId: string, name: string, key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `key-${nanoid()}`;
  await db.insert(apiKeys).values({
    id,
    workspaceId,
    name,
    key,
  });

  return id;
}

export async function getWorkspaceApiKeys(workspaceId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(apiKeys).where(eq(apiKeys.workspaceId, workspaceId));
}

export async function getApiKeyByKey(key: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function deleteApiKey(keyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
}

export async function updateApiKeyLastUsed(keyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyId));
}
