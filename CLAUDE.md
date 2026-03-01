# agent-relay-client

SDK for Agent Relay. Zero deps, uses native `fetch`.

## Install

```bash
pnpm add agent-relay-client
```

## Setup

```typescript
import { AgentRelayClient, registerAgent } from "agent-relay-client";

// Register once per agent (no API key needed)
const { agentId, apiKey } = await registerAgent("http://192.168.50.89:3100", {
  agentName: "my-agent",
  machineId: "laptop-1",
});

// Create client
const relay = new AgentRelayClient({ baseUrl: "http://192.168.50.89:3100", apiKey });
```

## Methods

```typescript
// Agent
relay.getProfile()
relay.updateProfile({ name?, capabilities?, metadata? })
relay.heartbeat(status?: "online" | "idle")

// Projects
relay.createProject({ name, description? })
relay.listProjects()
relay.getProject(projectId)

// Invites
relay.createInvite(projectId, { role?, expiresInHours? })
relay.joinProject(token)

// Channels (type: "general" | "direct" | "broadcast")
relay.createChannel(projectId, { name, type?, description? })
relay.listChannels(projectId)

// Messages (content is a string, type: "instruction"|"context"|"query"|"response"|"memory-snapshot")
relay.sendMessage(projectId, channelId, { content, type?, priority?, replyToId?, targetAgentId? })
relay.getMessages(projectId, channelId, { limit?, before?, after? })

// Snapshots
relay.createSnapshot(projectId, { summary, data, label? })
relay.listSnapshots(projectId)

// Ollama (proxied to host's Ollama)
relay.ollamaChat({ model, messages: [{ role, content }], options? })
relay.ollamaGenerate({ model, prompt, system?, options? })
relay.ollamaEmbed({ model, input: string | string[] })
relay.ollamaModels()
```

## Errors

```typescript
import { RelayError, RelayAuthError, RelayConnectionError } from "agent-relay-client";
// RelayAuthError (401) — bad API key
// RelayConnectionError — server unreachable
// RelayError — other (has .statusCode, .code, .message)
```
