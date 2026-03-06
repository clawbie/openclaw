import { describe, expect, it, vi } from "vitest";
import { VoiceCallConfigSchema } from "./config.js";
import { CallManager } from "./manager.js";
import { FakeProvider, createTestStorePath } from "./manager.test-harness.js";

describe("CallManager initial message on call.answered", () => {
  it("skips speaking initial message on answered when streaming is enabled", async () => {
    const config = VoiceCallConfigSchema.parse({
      enabled: true,
      provider: "twilio",
      fromNumber: "+15550000000",
      streaming: { enabled: true },
    });

    const manager = new CallManager(config, createTestStorePath());
    await manager.initialize(new FakeProvider("twilio"), "https://example.com/voice/webhook");

    // Seed an active call that has an initial message.
    (manager as unknown as { activeCalls: Map<string, unknown> }).activeCalls.set("call-1", {
      callId: "call-1",
      providerCallId: "provider-call-1",
      provider: "twilio",
      direction: "outbound",
      state: "ringing",
      from: "+15550000000",
      to: "+15550000001",
      startedAt: Date.now(),
      transcript: [],
      processedEventIds: [],
      metadata: { initialMessage: "hello" },
    });

    const speakSpy = vi.spyOn(manager, "speakInitialMessage").mockResolvedValue(undefined);

    // Access private method for targeted unit coverage.
    (
      manager as unknown as {
        maybeSpeakInitialMessageOnAnswered: (call: { metadata?: unknown; providerCallId?: string }) =>
          void;
      }
    ).maybeSpeakInitialMessageOnAnswered({
      providerCallId: "provider-call-1",
      metadata: { initialMessage: "hello" },
    });

    expect(speakSpy).not.toHaveBeenCalled();
  });

  it("speaks initial message on answered when streaming is disabled", async () => {
    const config = VoiceCallConfigSchema.parse({
      enabled: true,
      provider: "twilio",
      fromNumber: "+15550000000",
      streaming: { enabled: false },
    });

    const manager = new CallManager(config, createTestStorePath());
    await manager.initialize(new FakeProvider("twilio"), "https://example.com/voice/webhook");

    const speakSpy = vi.spyOn(manager, "speakInitialMessage").mockResolvedValue(undefined);

    (
      manager as unknown as {
        maybeSpeakInitialMessageOnAnswered: (call: { metadata?: unknown; providerCallId?: string }) =>
          void;
      }
    ).maybeSpeakInitialMessageOnAnswered({
      providerCallId: "provider-call-1",
      metadata: { initialMessage: "hello" },
    });

    expect(speakSpy).toHaveBeenCalledTimes(1);
    expect(speakSpy).toHaveBeenCalledWith("provider-call-1");
  });
});
