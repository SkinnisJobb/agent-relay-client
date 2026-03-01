import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentRelayClient, registerAgent } from "../src/index.js";

const BASE_URL = "http://localhost:3100";
const API_KEY = "ar_test_key_123";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe("AgentRelayClient", () => {
  let client: AgentRelayClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    client = new AgentRelayClient({ baseUrl: BASE_URL, apiKey: API_KEY });
  });

  describe("getProfile", () => {
    it("sends GET with auth header", async () => {
      const profile = { id: "agt_1", name: "test" };
      vi.stubGlobal("fetch", mockFetch(200, { data: profile }));

      const result = await client.getProfile();

      expect(result).toEqual(profile);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/agents/me`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({ "x-api-key": API_KEY }),
        }),
      );
    });
  });

  describe("updateProfile", () => {
    it("sends PUT with body", async () => {
      const updated = { id: "agt_1", name: "new-name" };
      vi.stubGlobal("fetch", mockFetch(200, { data: updated }));

      const result = await client.updateProfile({ name: "new-name" });

      expect(result).toEqual(updated);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/agents/me`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ name: "new-name" }),
        }),
      );
    });
  });

  describe("heartbeat", () => {
    it("sends heartbeat with default status", async () => {
      const heartbeat = { status: "online", lastHeartbeat: "2026-01-01T00:00:00Z" };
      vi.stubGlobal("fetch", mockFetch(200, { data: heartbeat }));

      const result = await client.heartbeat();

      expect(result).toEqual(heartbeat);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/agents/me/heartbeat`,
        expect.objectContaining({
          body: JSON.stringify({ status: "online" }),
        }),
      );
    });
  });

  describe("createProject", () => {
    it("sends POST to projects endpoint", async () => {
      const project = { id: "proj_1", name: "test-project" };
      vi.stubGlobal("fetch", mockFetch(200, { data: project }));

      const result = await client.createProject({ name: "test-project" });

      expect(result).toEqual(project);
    });
  });

  describe("sendMessage", () => {
    it("sends message to channel", async () => {
      const msg = { id: "msg_1", content: { text: "Hello" } };
      vi.stubGlobal("fetch", mockFetch(200, { data: msg }));

      const result = await client.sendMessage("ch_1", {
        content: { text: "Hello" },
      });

      expect(result).toEqual(msg);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/channels/ch_1/messages`,
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("getMessages", () => {
    it("appends query params when provided", async () => {
      vi.stubGlobal("fetch", mockFetch(200, { data: [] }));

      await client.getMessages("ch_1", { limit: 10, before: "msg_5" });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/channels/ch_1/messages?limit=10&before=msg_5`,
        expect.anything(),
      );
    });

    it("omits query string when no options", async () => {
      vi.stubGlobal("fetch", mockFetch(200, { data: [] }));

      await client.getMessages("ch_1");

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/channels/ch_1/messages`,
        expect.anything(),
      );
    });
  });

  describe("ollamaChat", () => {
    it("proxies chat request", async () => {
      const response = {
        model: "qwen2.5:14b",
        message: { role: "assistant", content: "Hi!" },
      };
      vi.stubGlobal("fetch", mockFetch(200, { data: response }));

      const result = await client.ollamaChat({
        model: "qwen2.5:14b",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result).toEqual(response);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/ollama/chat`,
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("ollamaEmbed", () => {
    it("proxies embed request", async () => {
      const response = { model: "nomic-embed-text", embeddings: [[0.1, 0.2]] };
      vi.stubGlobal("fetch", mockFetch(200, { data: response }));

      const result = await client.ollamaEmbed({
        model: "nomic-embed-text",
        input: "Hello",
      });

      expect(result).toEqual(response);
    });
  });

  describe("ollamaModels", () => {
    it("fetches model list", async () => {
      const response = { models: [{ name: "qwen2.5:14b" }] };
      vi.stubGlobal("fetch", mockFetch(200, { data: response }));

      const result = await client.ollamaModels();

      expect(result).toEqual(response);
    });
  });

  describe("error handling", () => {
    it("throws RelayAuthError on 401", async () => {
      vi.stubGlobal("fetch", mockFetch(401, { error: { code: "UNAUTHORIZED", message: "bad key" } }));

      await expect(client.getProfile()).rejects.toThrow("Invalid or missing API key");
    });

    it("throws RelayError on other errors", async () => {
      vi.stubGlobal(
        "fetch",
        mockFetch(404, { error: { code: "NOT_FOUND", message: "Not found" } }),
      );

      await expect(client.getProfile()).rejects.toThrow("Not found");
    });

    it("throws RelayConnectionError on network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

      await expect(client.getProfile()).rejects.toThrow("Failed to connect");
    });
  });
});

describe("registerAgent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("registers without API key", async () => {
    const result = { agentId: "agt_1", apiKey: "ar_xxx" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: result }),
      }),
    );

    const registered = await registerAgent(BASE_URL, {
      agentName: "test-agent",
      machineId: "machine-1",
    });

    expect(registered).toEqual(result);
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/auth/register`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ agentName: "test-agent", machineId: "machine-1" }),
      }),
    );
  });
});
