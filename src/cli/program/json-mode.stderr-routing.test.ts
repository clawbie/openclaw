import { describe, expect, it, vi } from "vitest";

import { registerPreActionHooks } from "./preaction.js";

function createProgramStub() {
  return {
    hook: vi.fn((_name: string, cb: (...args: unknown[]) => unknown) => {
      (createProgramStub as unknown as { _cb?: (...args: unknown[]) => unknown })._cb = cb;
    }),
  };
}

function getHook(program: unknown): ((thisCommand: unknown, actionCommand: unknown) => unknown) {
  const hookCall = (program as { hook: ReturnType<typeof vi.fn> }).hook.mock.calls[0];
  if (!hookCall) {
    throw new Error("hook not registered");
  }
  return hookCall[1] as (thisCommand: unknown, actionCommand: unknown) => unknown;
}

describe("preaction JSON mode", () => {
  it("routes logs to stderr when --json is present", async () => {
    const argv = process.argv;
    const original = process.env.OPENCLAW_STATE_DIR;

    const routeSpy = vi.fn();

    vi.doMock("../../logging/console.js", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../../logging/console.js")>();
      return {
        ...actual,
        routeLogsToStderr: routeSpy,
      };
    });

    // Prevent config guard from doing any work.
    vi.doMock("./config-guard.js", () => ({
      ensureConfigReady: vi.fn(async () => {}),
    }));

    // Avoid banner/log side effects from unrelated modules.
    vi.doMock("../plugin-registry.js", () => ({
      ensurePluginRegistryLoaded: vi.fn(),
    }));

    process.argv = ["node", "openclaw", "plugins", "list", "--json"];

    const program = createProgramStub();
    registerPreActionHooks(program as any, "0.0.0-test");

    const hook = getHook(program);
    await hook({}, { parent: null, name: () => "openclaw" });

    expect(routeSpy).toHaveBeenCalledTimes(1);

    // restore
    process.argv = argv;
    if (original === undefined) {
      delete process.env.OPENCLAW_STATE_DIR;
    } else {
      process.env.OPENCLAW_STATE_DIR = original;
    }
  });
});
