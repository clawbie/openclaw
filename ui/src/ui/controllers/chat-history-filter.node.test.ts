import { describe, expect, it, vi } from "vitest";
import { loadChatHistory, type ChatState } from "./chat.ts";

describe("loadChatHistory (node)", () => {
  it("filters assistant delivery-mirror transcript entries from history", async () => {
    const messages = [
      { role: "user", content: [{ type: "text", text: "Hello" }] },
      // Internal transcript entry: should be hidden in WebChat history
      {
        role: "assistant",
        provider: "openclaw",
        model: "delivery-mirror",
        content: [{ type: "text", text: "Visible reply (duplicate mirror)" }],
      },
      // Real assistant message: should be kept
      {
        role: "assistant",
        provider: "openrouter",
        model: "anthropic/claude-3.7",
        content: [{ type: "text", text: "Visible reply" }],
      },
      // Not a mirror: should be kept
      {
        role: "assistant",
        provider: "openclaw",
        model: "some-internal-model",
        content: [{ type: "text", text: "Internal but not mirror" }],
      },
    ];

    const request = vi.fn().mockResolvedValue({ messages, thinkingLevel: "low" });

    const state: ChatState = {
      client: { request } as unknown as ChatState["client"],
      connected: true,
      sessionKey: "main",
      chatLoading: false,
      chatMessages: [],
      chatThinkingLevel: null,
      chatSending: false,
      chatMessage: "",
      chatAttachments: [],
      chatRunId: null,
      chatStream: null,
      chatStreamStartedAt: null,
      lastError: null,
    };

    await loadChatHistory(state);

    expect(request).toHaveBeenCalledWith("chat.history", { sessionKey: "main", limit: 200 });
    expect(state.chatMessages).toEqual([messages[0], messages[2], messages[3]]);
    expect(state.chatThinkingLevel).toBe("low");
  });
});
