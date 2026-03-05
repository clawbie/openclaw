import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { chatHandlers } from "./chat.js";
import { createMockSessionEntry, createTranscriptFixtureSync } from "./chat.test-helpers.js";
import type { GatewayRequestContext } from "./types.js";

// Note: chat.directive-tags.test.ts defines its own createChatContext() helper.
// We keep a tiny local one here to avoid cross-test imports.
function createChatContext(): Pick<
  GatewayRequestContext,
  "broadcast" | "nodeSendToSession" | "agentRunSeq" | "logGateway"
> {
  return {
    broadcast: vi.fn() as unknown as GatewayRequestContext["broadcast"],
    nodeSendToSession: vi.fn() as unknown as GatewayRequestContext["nodeSendToSession"],
    agentRunSeq: new Map<string, number>(),
    logGateway: {
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as GatewayRequestContext["logGateway"],
  };
}

describe("gateway chat.inject", () => {
  it("creates transcript file when missing", async () => {
    const { dir, transcriptPath } = createTranscriptFixtureSync({
      prefix: "openclaw-chat-inject-missing-transcript-",
      sessionId: "sess-missing",
    });

    try {
      // Remove the transcript file but keep a session entry pointing at it.
      fs.rmSync(transcriptPath, { force: true });
      expect(fs.existsSync(transcriptPath)).toBe(false);

      const mock = createMockSessionEntry({
        transcriptPath,
        sessionId: "sess-missing",
        canonicalKey: "main",
        cfg: {},
      });

      // Patch loadSessionEntry() used by chat.inject.
      const sessionUtils = await import("../session-utils.js");
      const loadSpy = vi.spyOn(sessionUtils, "loadSessionEntry").mockReturnValue({
        cfg: mock.cfg as never,
        storePath: mock.storePath,
        entry: mock.entry as never,
        canonicalKey: mock.canonicalKey,
      });

      const respond = vi.fn();
      const context = createChatContext();

      await chatHandlers["chat.inject"]({
        params: { sessionKey: "main", message: "hello" },
        respond,
        req: {} as never,
        client: null as never,
        isWebchatConnect: () => false,
        context: context as GatewayRequestContext,
      });

      const [ok, payload] = respond.mock.calls.at(-1) ?? [];
      expect(ok).toBe(true);
      expect(payload).toMatchObject({ ok: true });

      expect(fs.existsSync(transcriptPath)).toBe(true);
      const lines = fs
        .readFileSync(transcriptPath, "utf-8")
        .split(/\r?\n/)
        .filter(Boolean);
      expect(lines.length).toBeGreaterThanOrEqual(2);
      const last = JSON.parse(lines.at(-1) as string) as Record<string, unknown>;
      expect(last.type).toBe("message");

      loadSpy.mockRestore();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
