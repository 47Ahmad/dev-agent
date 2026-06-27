import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  plan: mysqlEnum("plan", ["free", "pro", "team"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Workspaces - Multi-tenant support
 */
export const workspaces = mysqlTable("workspaces", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  plan: mysqlEnum("plan", ["free", "pro", "team"]).default("free").notNull(),
  generationCredits: int("generationCredits").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

/**
 * Projects - Generated websites
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspaceId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Versions - Version history and snapshots
 */
export const projectVersions = mysqlTable("projectVersions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  versionNumber: int("versionNumber").notNull(),
  name: varchar("name", { length: 255 }),
  prompt: text("prompt").notNull(),
  html: text("html").notNull(),
  css: text("css").notNull(),
  js: text("js").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = typeof projectVersions.$inferInsert;

/**
 * Generation History - Track all generations
 */
export const generationHistory = mysqlTable("generationHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }),
  workspaceId: varchar("workspaceId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  prompt: text("prompt").notNull(),
  model: varchar("model", { length: 64 }).notNull(),
  tokensUsed: int("tokensUsed").default(0),
  creditsUsed: decimal("creditsUsed", { precision: 10, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationHistory = typeof generationHistory.$inferSelect;
export type InsertGenerationHistory = typeof generationHistory.$inferInsert;

/**
 * Usage Tracking - For billing and limits
 */
export const usageTracking = mysqlTable("usageTracking", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspaceId", { length: 64 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  generationsCount: int("generationsCount").default(0),
  creditsUsed: decimal("creditsUsed", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

/**
 * API Keys - For external integrations
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspaceId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Deployments - Track all deployments
 */
export const deployments = mysqlTable("deployments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  versionId: varchar("versionId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "building", "deployed", "failed"]).default("pending").notNull(),
  url: varchar("url", { length: 255 }),
  provider: varchar("provider", { length: 64 }).notNull(),
  logs: text("logs"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = typeof deployments.$inferInsert;

/**
 * Custom Domains - For projects
 */
export const customDomains = mysqlTable("customDomains", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "verified", "failed"]).default("pending").notNull(),
  sslStatus: mysqlEnum("sslStatus", ["pending", "active", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomDomain = typeof customDomains.$inferSelect;
export type InsertCustomDomain = typeof customDomains.$inferInsert;

/**
 * Templates - Reusable project templates
 */
export const templates = mysqlTable("templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(),
  thumbnail: varchar("thumbnail", { length: 255 }),
  html: text("html").notNull(),
  css: text("css").notNull(),
  js: text("js").notNull(),
  isPublic: int("isPublic").default(1).notNull(),
  createdBy: int("createdBy").notNull(),
  downloads: int("downloads").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Marketplace Components - For the marketplace
 */
export const marketplaceComponents = mysqlTable("marketplaceComponents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(),
  code: text("code").notNull(),
  preview: varchar("preview", { length: 255 }),
  createdBy: int("createdBy").notNull(),
  downloads: int("downloads").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  isPublic: int("isPublic").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketplaceComponent = typeof marketplaceComponents.$inferSelect;
export type InsertMarketplaceComponent = typeof marketplaceComponents.$inferInsert;

/**
 * Billing History - Track all transactions
 */
export const billingHistory = mysqlTable("billingHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspaceId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["charge", "credit", "refund"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = typeof billingHistory.$inferInsert;

/**
 * Project Files - For the code editor
 */
export const projectFiles = mysqlTable("projectFiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  content: text("content"),
  language: varchar("language", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;
