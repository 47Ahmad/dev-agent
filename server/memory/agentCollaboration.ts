/**
 * Agent Collaboration System - Phase 4B
 * Enables shared workspace, decisions, consensus, and conflict resolution
 * between agents working on the same project.
 */

import { nanoid } from "nanoid";
import type {
  SharedWorkspace,
  Decision,
  SharedNote,
  Conflict,
} from "./types";
import { addSharedNote as ctxAddSharedNote } from "./sharedContextEngine";
import { addKnowledge } from "./knowledgeManager";

// ============================================
// WORKSPACE STORE
// ============================================

const workspaces = new Map<string, SharedWorkspace>();  // projectId -> workspace
const decisionHistory = new Map<string, Decision[]>();  // projectId -> decisions

// ============================================
// WORKSPACE MANAGEMENT
// ============================================

/**
 * Get or create a shared workspace for a project
 */
export function getOrCreateWorkspace(projectId: string, userId: string): SharedWorkspace {
  const existing = workspaces.get(projectId);
  if (existing) return existing;

  const workspace: SharedWorkspace = {
    id: `ws-${nanoid()}`,
    projectId,
    userId,
    activeAgents: [],
    sharedDecisions: [],
    sharedNotes: [],
    conflictLog: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  workspaces.set(projectId, workspace);
  decisionHistory.set(projectId, []);
  return workspace;
}

/**
 * Get workspace for a project
 */
export function getWorkspace(projectId: string): SharedWorkspace | undefined {
  return workspaces.get(projectId);
}

/**
 * Register an agent in the shared workspace
 */
export function joinWorkspace(projectId: string, agentType: string): void {
  const ws = workspaces.get(projectId);
  if (!ws) return;

  if (!ws.activeAgents.includes(agentType)) {
    ws.activeAgents.push(agentType);
    ws.updatedAt = new Date();
  }
}

/**
 * Remove an agent from the workspace
 */
export function leaveWorkspace(projectId: string, agentType: string): void {
  const ws = workspaces.get(projectId);
  if (!ws) return;

  ws.activeAgents = ws.activeAgents.filter((a) => a !== agentType);
  ws.updatedAt = new Date();
}

// ============================================
// SHARED DECISIONS
// ============================================

/**
 * Propose a decision for consensus
 */
export function proposeDecision(params: {
  projectId: string;
  title: string;
  description: string;
  proposedBy: string;
  rationale: string;
  taskId?: string;
}): Decision {
  const ws = workspaces.get(params.projectId);
  if (!ws) throw new Error(`Workspace not found for project: ${params.projectId}`);

  const decision: Decision = {
    id: `dec-${nanoid()}`,
    title: params.title,
    description: params.description,
    proposedBy: params.proposedBy,
    agreedBy: [params.proposedBy],  // Proposer auto-agrees
    rejectedBy: [],
    status: "pending",
    rationale: params.rationale,
    taskId: params.taskId,
    createdAt: new Date(),
  };

  ws.sharedDecisions.push(decision);
  ws.updatedAt = new Date();

  // Add to history
  const history = decisionHistory.get(params.projectId) ?? [];
  history.push(decision);
  decisionHistory.set(params.projectId, history);

  // Notify via shared note
  ctxAddSharedNote(params.projectId, {
    agentType: params.proposedBy,
    content: `Decision proposed: "${params.title}" - ${params.rationale}`,
    category: "decision",
    taskId: params.taskId,
  });

  return decision;
}

/**
 * Vote on a decision (agree or reject)
 */
export function voteOnDecision(
  projectId: string,
  decisionId: string,
  agentType: string,
  vote: "agree" | "reject",
  reason?: string
): Decision | undefined {
  const ws = workspaces.get(projectId);
  if (!ws) return undefined;

  const decision = ws.sharedDecisions.find((d) => d.id === decisionId);
  if (!decision || decision.status !== "pending") return decision;

  if (vote === "agree") {
    if (!decision.agreedBy.includes(agentType)) {
      decision.agreedBy.push(agentType);
    }
    decision.rejectedBy = decision.rejectedBy.filter((a) => a !== agentType);
  } else {
    if (!decision.rejectedBy.includes(agentType)) {
      decision.rejectedBy.push(agentType);
    }
    decision.agreedBy = decision.agreedBy.filter((a) => a !== agentType);
  }

  // Check consensus: majority rule
  const totalAgents = ws.activeAgents.length || 1;
  const majority = Math.ceil(totalAgents / 2);

  if (decision.agreedBy.length >= majority) {
    decision.status = "approved";
    decision.resolvedAt = new Date();

    // Persist approved decision to knowledge base
    addKnowledge({
      title: `Decision: ${decision.title}`,
      content: `${decision.description}\nRationale: ${decision.rationale}`,
      category: "decision",
      projectId,
      importance: 0.8,
      confidence: 0.9,
      source: "agent_consensus",
      tags: ["decision", "approved"],
    });
  } else if (decision.rejectedBy.length >= majority) {
    decision.status = "rejected";
    decision.resolvedAt = new Date();
  }

  ws.updatedAt = new Date();
  return decision;
}

/**
 * Get all pending decisions for a project
 */
export function getPendingDecisions(projectId: string): Decision[] {
  const ws = workspaces.get(projectId);
  if (!ws) return [];
  return ws.sharedDecisions.filter((d) => d.status === "pending");
}

/**
 * Get decision history for a project
 */
export function getDecisionHistory(projectId: string): Decision[] {
  return decisionHistory.get(projectId) ?? [];
}

/**
 * Auto-approve a decision (for single-agent scenarios)
 */
export function autoApproveDecision(projectId: string, decisionId: string): Decision | undefined {
  const ws = workspaces.get(projectId);
  if (!ws) return undefined;

  const decision = ws.sharedDecisions.find((d) => d.id === decisionId);
  if (!decision) return undefined;

  decision.status = "approved";
  decision.resolvedAt = new Date();
  ws.updatedAt = new Date();

  addKnowledge({
    title: `Decision: ${decision.title}`,
    content: `${decision.description}\nRationale: ${decision.rationale}`,
    category: "decision",
    projectId,
    importance: 0.75,
    confidence: 0.85,
    source: "auto_approved",
    tags: ["decision", "approved", "auto"],
  });

  return decision;
}

// ============================================
// CONFLICT RESOLUTION
// ============================================

/**
 * Report a conflict between agents
 */
export function reportConflict(params: {
  projectId: string;
  type: Conflict["type"];
  description: string;
  involvedAgents: string[];
}): Conflict {
  const ws = workspaces.get(params.projectId);
  if (!ws) throw new Error(`Workspace not found for project: ${params.projectId}`);

  const conflict: Conflict = {
    id: `conflict-${nanoid()}`,
    type: params.type,
    description: params.description,
    involvedAgents: params.involvedAgents,
    status: "open",
    createdAt: new Date(),
  };

  ws.conflictLog.push(conflict);
  ws.updatedAt = new Date();

  // Add warning note
  ctxAddSharedNote(params.projectId, {
    agentType: "orchestrator",
    content: `Conflict detected: [${params.type}] ${params.description}`,
    category: "warning",
  });

  return conflict;
}

/**
 * Resolve a conflict
 */
export function resolveConflict(
  projectId: string,
  conflictId: string,
  resolution: string,
  resolvedBy: string
): Conflict | undefined {
  const ws = workspaces.get(projectId);
  if (!ws) return undefined;

  const conflict = ws.conflictLog.find((c) => c.id === conflictId);
  if (!conflict) return undefined;

  conflict.resolution = resolution;
  conflict.resolvedBy = resolvedBy;
  conflict.status = "resolved";
  conflict.resolvedAt = new Date();
  ws.updatedAt = new Date();

  // Persist resolution to knowledge
  addKnowledge({
    title: `Conflict Resolution: ${conflict.type}`,
    content: `Conflict: ${conflict.description}\nResolution: ${resolution}`,
    category: "decision",
    projectId,
    importance: 0.7,
    source: resolvedBy,
    tags: ["conflict_resolution"],
  });

  return conflict;
}

/**
 * Get open conflicts for a project
 */
export function getOpenConflicts(projectId: string): Conflict[] {
  const ws = workspaces.get(projectId);
  if (!ws) return [];
  return ws.conflictLog.filter((c) => c.status === "open");
}

// ============================================
// SHARED NOTES (Workspace-level)
// ============================================

/**
 * Add a note to the shared workspace
 */
export function addWorkspaceNote(
  projectId: string,
  note: Omit<SharedNote, "id" | "createdAt" | "acknowledged" | "acknowledgedBy">
): SharedNote {
  const ws = workspaces.get(projectId);
  if (!ws) throw new Error(`Workspace not found for project: ${projectId}`);

  const newNote: SharedNote = {
    id: `wsnote-${nanoid()}`,
    ...note,
    projectId,
    createdAt: new Date(),
    acknowledged: false,
    acknowledgedBy: [],
  };

  ws.sharedNotes.push(newNote);
  ws.updatedAt = new Date();

  return newNote;
}

/**
 * Get workspace statistics
 */
export function getWorkspaceStats(projectId: string): {
  activeAgents: number;
  pendingDecisions: number;
  approvedDecisions: number;
  openConflicts: number;
  resolvedConflicts: number;
  totalNotes: number;
} {
  const ws = workspaces.get(projectId);
  if (!ws) {
    return {
      activeAgents: 0,
      pendingDecisions: 0,
      approvedDecisions: 0,
      openConflicts: 0,
      resolvedConflicts: 0,
      totalNotes: 0,
    };
  }

  return {
    activeAgents: ws.activeAgents.length,
    pendingDecisions: ws.sharedDecisions.filter((d) => d.status === "pending").length,
    approvedDecisions: ws.sharedDecisions.filter((d) => d.status === "approved").length,
    openConflicts: ws.conflictLog.filter((c) => c.status === "open").length,
    resolvedConflicts: ws.conflictLog.filter((c) => c.status === "resolved").length,
    totalNotes: ws.sharedNotes.length,
  };
}

/**
 * Clear all workspaces (for testing)
 */
export function clearAllWorkspaces(): void {
  workspaces.clear();
  decisionHistory.clear();
}


