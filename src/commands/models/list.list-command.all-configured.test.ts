import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const printModelTable = vi.fn();
  return {
    loadModelsConfig: vi.fn().mockResolvedValue({
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
      models: {
        providers: {
          "openai-codex": {
            baseUrl: "https://chatgpt.com/backend-api",
            api: "openai-codex-responses",
            models: [
              {
                id: "gpt-5.4",
                name: "GPT-5.4",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 272000,
                maxTokens: 128000,
              },
            ],
          },
        },
      },
    }),
    ensureAuthProfileStore: vi.fn().mockReturnValue({ version: 1, profiles: {}, order: {} }),
    loadModelRegistry: vi.fn().mockResolvedValue({
      models: [],
      availableKeys: undefined,
      availabilityErrorMessage: undefined,
      registry: {
        find: vi.fn().mockReturnValue(null),
        getAll: vi.fn().mockReturnValue([]),
        getAvailable: vi.fn().mockImplementation(() => {
          throw new Error("availability unsupported");
        }),
      },
    }),
    resolveConfiguredEntries: vi.fn().mockReturnValue({
      entries: [
        {
          key: "openai-codex/gpt-5.4",
          ref: { provider: "openai-codex", model: "gpt-5.4" },
          tags: new Set(["configured"]),
          aliases: [],
        },
      ],
    }),
    printModelTable,
  };
});

vi.mock("../../agents/auth-profiles.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../agents/auth-profiles.js")>();
  return {
    ...actual,
    ensureAuthProfileStore: mocks.ensureAuthProfileStore,
  };
});

vi.mock("./load-config.js", () => ({
  loadModelsConfig: mocks.loadModelsConfig,
}));

vi.mock("./list.registry.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./list.registry.js")>();
  return {
    ...actual,
    loadModelRegistry: mocks.loadModelRegistry,
  };
});

vi.mock("./list.configured.js", () => ({
  resolveConfiguredEntries: mocks.resolveConfiguredEntries,
}));

vi.mock("./list.table.js", () => ({
  printModelTable: mocks.printModelTable,
}));

import { modelsListCommand } from "./list.list-command.js";

describe("modelsListCommand --all configured models", () => {
  it("includes config-only provider models in --all output", async () => {
    const runtime = { log: vi.fn(), error: vi.fn() };

    await modelsListCommand({ json: true, all: true }, runtime as never);

    expect(mocks.printModelTable).toHaveBeenCalled();
    const rows = mocks.printModelTable.mock.calls.at(-1)?.[0] as Array<{ key: string }>;

    expect(rows).toEqual([
      expect.objectContaining({
        key: "openai-codex/gpt-5.4",
      }),
    ]);
  });
});
