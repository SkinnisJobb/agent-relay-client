import { RelayError, RelayAuthError, RelayConnectionError } from "./errors.js";
import type {
  RelayClientConfig,
  ApiResponse,
  AgentProfile,
  UpdateProfileInput,
  HeartbeatResult,
  RegisterResult,
  RegisterInput,
  Project,
  CreateProjectInput,
  Channel,
  CreateChannelInput,
  Message,
  SendMessageInput,
  GetMessagesOptions,
  Snapshot,
  CreateSnapshotInput,
  Invite,
  CreateInviteInput,
  OllamaChatInput,
  OllamaChatResponse,
  OllamaGenerateInput,
  OllamaGenerateResponse,
  OllamaEmbedInput,
  OllamaEmbedResponse,
  OllamaModelsResponse,
} from "./types.js";

export class AgentRelayClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: RelayClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  // --- Internal helpers ---

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
    };
    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new RelayConnectionError(this.baseUrl, err as Error);
    }

    if (!res.ok) {
      if (res.status === 401) {
        throw new RelayAuthError();
      }
      const errorBody = await res.json().catch(() => ({
        error: { code: "UNKNOWN", message: res.statusText },
      }));
      throw new RelayError(
        res.status,
        errorBody.error?.code ?? "UNKNOWN",
        errorBody.error?.message ?? res.statusText,
      );
    }

    const json = (await res.json()) as ApiResponse<T>;
    return json.data;
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  private post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  private put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  private del<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  // --- Agent management ---

  getProfile(): Promise<AgentProfile> {
    return this.get("/api/v1/agents/me");
  }

  updateProfile(input: UpdateProfileInput): Promise<AgentProfile> {
    return this.put("/api/v1/agents/me", input);
  }

  heartbeat(status: "online" | "idle" = "online"): Promise<HeartbeatResult> {
    return this.post("/api/v1/agents/me/heartbeat", { status });
  }

  // --- Projects ---

  createProject(input: CreateProjectInput): Promise<Project> {
    return this.post("/api/v1/projects", input);
  }

  getProject(projectId: string): Promise<Project> {
    return this.get(`/api/v1/projects/${projectId}`);
  }

  listProjects(): Promise<Project[]> {
    return this.get("/api/v1/projects");
  }

  // --- Channels ---

  createChannel(
    projectId: string,
    input: CreateChannelInput,
  ): Promise<Channel> {
    return this.post(`/api/v1/projects/${projectId}/channels`, input);
  }

  listChannels(projectId: string): Promise<Channel[]> {
    return this.get(`/api/v1/projects/${projectId}/channels`);
  }

  // --- Messages ---

  sendMessage(channelId: string, input: SendMessageInput): Promise<Message> {
    return this.post(`/api/v1/channels/${channelId}/messages`, input);
  }

  getMessages(
    channelId: string,
    options: GetMessagesOptions = {},
  ): Promise<Message[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.before) params.set("before", options.before);
    if (options.after) params.set("after", options.after);
    const qs = params.toString();
    return this.get(
      `/api/v1/channels/${channelId}/messages${qs ? `?${qs}` : ""}`,
    );
  }

  // --- Snapshots ---

  createSnapshot(
    projectId: string,
    input: CreateSnapshotInput,
  ): Promise<Snapshot> {
    return this.post(`/api/v1/projects/${projectId}/snapshots`, input);
  }

  listSnapshots(projectId: string): Promise<Snapshot[]> {
    return this.get(`/api/v1/projects/${projectId}/snapshots`);
  }

  // --- Invites ---

  createInvite(
    projectId: string,
    input: CreateInviteInput = {},
  ): Promise<Invite> {
    return this.post(`/api/v1/projects/${projectId}/invites`, input);
  }

  acceptInvite(token: string): Promise<{ projectId: string; role: string }> {
    return this.post(`/api/v1/invites/${token}/accept`);
  }

  // --- Ollama proxy ---

  ollamaChat(input: OllamaChatInput): Promise<OllamaChatResponse> {
    return this.post("/api/v1/ollama/chat", input);
  }

  ollamaGenerate(input: OllamaGenerateInput): Promise<OllamaGenerateResponse> {
    return this.post("/api/v1/ollama/generate", input);
  }

  ollamaEmbed(input: OllamaEmbedInput): Promise<OllamaEmbedResponse> {
    return this.post("/api/v1/ollama/embed", input);
  }

  ollamaModels(): Promise<OllamaModelsResponse> {
    return this.get("/api/v1/ollama/models");
  }
}

// --- Static helper for registration (no API key needed) ---

export async function registerAgent(
  baseUrl: string,
  input: RegisterInput,
): Promise<RegisterResult> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/auth/register`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new RelayConnectionError(baseUrl, err as Error);
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({
      error: { code: "UNKNOWN", message: res.statusText },
    }));
    throw new RelayError(
      res.status,
      errorBody.error?.code ?? "UNKNOWN",
      errorBody.error?.message ?? res.statusText,
    );
  }

  const json = (await res.json()) as ApiResponse<RegisterResult>;
  return json.data;
}
