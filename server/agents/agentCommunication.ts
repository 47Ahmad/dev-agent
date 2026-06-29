/**
 * Agent Communication System - Phase 4A
 * Handles message passing between agents with acknowledgment,
 * broadcast support, and message history.
 */

import { nanoid } from "nanoid";
import type { AgentMessage, AgentType, MessageType } from "./types";

// ============================================
// MESSAGE STORE
// ============================================

const messageStore = new Map<string, AgentMessage>();
const inboxes = new Map<AgentType, string[]>(); // agentType -> messageIds
const messageHandlers = new Map<AgentType, ((msg: AgentMessage) => void)[]>();

// ============================================
// MESSAGE SENDING
// ============================================

/**
 * Send a message from one agent to another (or broadcast)
 */
export function sendMessage(params: {
  fromAgent: AgentType;
  toAgent: AgentType | "broadcast";
  type: MessageType;
  taskId?: string;
  payload: Record<string, unknown>;
}): AgentMessage {
  const message: AgentMessage = {
    id: `msg-${nanoid()}`,
    fromAgent: params.fromAgent,
    toAgent: params.toAgent,
    type: params.type,
    taskId: params.taskId,
    payload: params.payload,
    timestamp: new Date(),
    acknowledged: false,
  };

  messageStore.set(message.id, message);

  if (params.toAgent === "broadcast") {
    // Deliver to all registered agent inboxes
    for (const [agentType] of inboxes.entries()) {
      if (agentType !== params.fromAgent) {
        deliverToInbox(agentType, message.id);
      }
    }
  } else {
    deliverToInbox(params.toAgent, message.id);
  }

  // Trigger handlers
  triggerHandlers(params.toAgent, message);

  console.log(
    `[AgentComm] ${params.fromAgent} -> ${params.toAgent}: [${params.type}]${params.taskId ? ` (task: ${params.taskId})` : ""}`
  );

  return message;
}

/**
 * Deliver a message ID to an agent's inbox
 */
function deliverToInbox(agentType: AgentType, messageId: string): void {
  if (!inboxes.has(agentType)) {
    inboxes.set(agentType, []);
  }
  inboxes.get(agentType)!.push(messageId);
}

// ============================================
// MESSAGE RECEIVING
// ============================================

/**
 * Get all unacknowledged messages for an agent
 */
export function getInboxMessages(agentType: AgentType): AgentMessage[] {
  const messageIds = inboxes.get(agentType) ?? [];
  return messageIds
    .map((id) => messageStore.get(id))
    .filter((m): m is AgentMessage => m !== undefined && !m.acknowledged);
}

/**
 * Acknowledge a message (mark as read)
 */
export function acknowledgeMessage(messageId: string): void {
  const message = messageStore.get(messageId);
  if (message) {
    message.acknowledged = true;
    messageStore.set(messageId, message);
  }
}

/**
 * Acknowledge all messages for an agent
 */
export function acknowledgeAllMessages(agentType: AgentType): void {
  const messageIds = inboxes.get(agentType) ?? [];
  for (const id of messageIds) {
    acknowledgeMessage(id);
  }
}

// ============================================
// EVENT HANDLERS (Reactive Communication)
// ============================================

/**
 * Register a handler for incoming messages for an agent
 */
export function registerMessageHandler(
  agentType: AgentType,
  handler: (msg: AgentMessage) => void
): void {
  if (!messageHandlers.has(agentType)) {
    messageHandlers.set(agentType, []);
  }
  messageHandlers.get(agentType)!.push(handler);

  // Ensure inbox exists
  if (!inboxes.has(agentType)) {
    inboxes.set(agentType, []);
  }
}

/**
 * Trigger all registered handlers for a target agent
 */
function triggerHandlers(
  toAgent: AgentType | "broadcast",
  message: AgentMessage
): void {
  if (toAgent === "broadcast") {
    for (const [, handlers] of messageHandlers.entries()) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (err) {
          console.error("[AgentComm] Handler error:", err);
        }
      }
    }
  } else {
    const handlers = messageHandlers.get(toAgent) ?? [];
    for (const handler of handlers) {
      try {
        handler(message);
      } catch (err) {
        console.error("[AgentComm] Handler error:", err);
      }
    }
  }
}

// ============================================
// MESSAGE HISTORY & QUERIES
// ============================================

/**
 * Get all messages for a specific task
 */
export function getTaskMessages(taskId: string): AgentMessage[] {
  return Array.from(messageStore.values())
    .filter((m) => m.taskId === taskId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Get recent messages between two agents
 */
export function getMessagesBetween(
  agentA: AgentType,
  agentB: AgentType,
  limit = 50
): AgentMessage[] {
  return Array.from(messageStore.values())
    .filter(
      (m) =>
        (m.fromAgent === agentA && m.toAgent === agentB) ||
        (m.fromAgent === agentB && m.toAgent === agentA)
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get communication statistics
 */
export function getCommunicationStats(): {
  totalMessages: number;
  unacknowledgedMessages: number;
  messagesByType: Record<string, number>;
} {
  const messages = Array.from(messageStore.values());
  const byType: Record<string, number> = {};

  for (const msg of messages) {
    byType[msg.type] = (byType[msg.type] ?? 0) + 1;
  }

  return {
    totalMessages: messages.length,
    unacknowledgedMessages: messages.filter((m) => !m.acknowledged).length,
    messagesByType: byType,
  };
}

// ============================================
// CLEANUP
// ============================================

/**
 * Clear old acknowledged messages
 */
export function cleanupOldMessages(maxAgeMs = 3600000): number {
  const cutoff = new Date(Date.now() - maxAgeMs);
  let removed = 0;

  for (const [id, message] of messageStore.entries()) {
    if (message.acknowledged && message.timestamp < cutoff) {
      messageStore.delete(id);
      removed++;
    }
  }

  // Clean inbox references
  for (const [agentType, ids] of inboxes.entries()) {
    const filtered = ids.filter((id) => messageStore.has(id));
    inboxes.set(agentType, filtered);
  }

  return removed;
}

/**
 * Reset all communication state (for testing)
 */
export function resetCommunicationState(): void {
  messageStore.clear();
  inboxes.clear();
  messageHandlers.clear();
}
