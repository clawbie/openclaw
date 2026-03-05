import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CURRENT_SESSION_VERSION } from "@mariozechner/pi-coding-agent";
import type { GatewayRequestContext } from "./types.js";

const mockState = vi.hoisted(() => ({
  dir: "",
  transcriptPath: "",
  sessionId: "sess-missing",
  mainSessionKey: "main",
}));

function createMissingTranscriptFixture(prefix: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const transcriptPath = path.join(dir, "sess.jsonl");
  // Intentionally do NOT create transcript file.
  mockState.dir = dir;
  mockState.transcriptPath = transcriptPath;
}

afterEach(() => {
  if (mockState.dir) {
    fs.rmSync(mockState.dir, { recursive: true, force: true });
  }
  mockState.dir = "";
  mockState.transcriptPath = "";
});

vi.mock("../session-utils.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../session-utils.js")>();
  return {
    ...original,
    loadSessionEntry: (rawKey: string) => ({
      cfg: {
        session: {
          mainKey: mockState.mainSessionKey,
        },
      },
      storePath: path.join(path.dirname(mockState.transcriptPath), "sessions.json"),
      entry: {
        sessionId: mockState.sessionId,
        // This is how the session metadata points at a transcript path.
        sessionFile: mockState.transcriptPath,
      },
      canonicalKey: rawKey || "main",
    }),
  };
});

const { chatHandlers } = await import("./chat.js");

// Regression test for #36170: chat.inject should create a missing transcript file.
describe("gateway chat.inject missing transcript", () => {
  it("creates transcript file if missing and appends injected message", async () => {
    createMissingTranscriptFixture("openclaw-chat-inject-missing-transcript-");

    const respond = vi.fn();
    const context = {
      broadcast: vi.fn(),
      nodeSendToSession: vi.fn(),
    } as unknown as GatewayRequestContext;

    await chatHandlers["chat.inject"]({
      params: { sessionKey: "main", message: "hello" },
      respond,
      req: {} as never,
      client: null as never,
      isWebchatConnect: () => false,
      context,
    });

    const [ok, payload] = respond.mock.calls.at(-1) ?? [];
    expect(ok).toBe(true);
    expect(payload).toMatchObject({ ok: true, messageId: expect.any(String) });

    expect(fs.existsSync(mockState.transcriptPath)).toBe(true);
    const lines = fs
      .readFileSync(mockState.transcriptPath, "utf-8")
      .split(/\r?\n/)
      .filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(2);

    const header = JSON.parse(lines[0] as string) as Record<string, unknown>;
    expect(header.type).toBe("session");
    expect(header.version).toBe(CURRENT_SESSION_VERSION);

    const last = JSON.parse(lines.at(-1) as string) as Record<string, unknown>;
    expect(last.type).toBe("message");
  });
});
