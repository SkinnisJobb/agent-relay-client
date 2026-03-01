// --- Client config ---

export interface RelayClientConfig {
  baseUrl: string;
  apiKey: string;
}

// --- Agent ---

export interface AgentProfile {
  id: string;
  name: string;
  machineId: string;
  status: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
  lastHeartbeat: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface HeartbeatResult {
  status: string;
  lastHeartbeat: string;
}

// --- Auth ---

export interface RegisterInput {
  agentName: string;
  machineId: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface RegisterResult {
  agentId: string;
  apiKey: string;
}

// --- Projects ---

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

// --- Channels ---

export type ChannelType = "general" | "direct" | "broadcast";

export interface Channel {
  id: string;
  projectId: string;
  name: string;
  type: ChannelType;
  description: string | null;
  createdAt: string;
}

export interface CreateChannelInput {
  name: string;
  type?: ChannelType;
  description?: string;
}

// --- Messages ---

export type MessageType = "instruction" | "context" | "query" | "response" | "memory-snapshot";
export type MessagePriority = "low" | "normal" | "high" | "urgent";

export interface Message {
  id: string;
  channelId: string;
  fromAgentId: string;
  targetAgentId: string | null;
  type: MessageType;
  priority: MessagePriority;
  content: string;
  metadata: Record<string, unknown>;
  replyToId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface SendMessageInput {
  type?: MessageType;
  priority?: MessagePriority;
  content: string;
  targetAgentId?: string;
  replyToId?: string;
  metadata?: Record<string, unknown>;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: string;
  after?: string;
}

// --- Snapshots ---

export interface Snapshot {
  id: string;
  projectId: string;
  agentId: string;
  label: string | null;
  summary: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface CreateSnapshotInput {
  summary: string;
  data: Record<string, unknown>;
  label?: string;
}

// --- Ollama ---

export interface OllamaChatInput {
  model: string;
  messages: Array<{ role: string; content: string }>;
  options?: Record<string, unknown>;
}

export interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  total_duration?: number;
  eval_count?: number;
  [key: string]: unknown;
}

export interface OllamaGenerateInput {
  model: string;
  prompt: string;
  system?: string;
  options?: Record<string, unknown>;
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  total_duration?: number;
  [key: string]: unknown;
}

export interface OllamaEmbedInput {
  model: string;
  input: string | string[];
}

export interface OllamaEmbedResponse {
  model: string;
  embeddings: number[][];
  [key: string]: unknown;
}

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  [key: string]: unknown;
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

// --- Invites ---

export interface Invite {
  id: string;
  projectId: string;
  invitedBy: string;
  role: string;
  token: string;
  expiresAt: string;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
}

export interface CreateInviteInput {
  role?: string;
  expiresInHours?: number;
}

// --- API response wrapper ---

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
