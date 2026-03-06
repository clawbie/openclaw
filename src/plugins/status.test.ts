import { describe, expect, it, vi } from "vitest";

const loadConfigMock = vi.fn();
const loadOpenClawPluginsMock = vi.fn();

vi.mock("../config/config.js", () => ({
  loadConfig: (...args: unknown[]) => loadConfigMock(...args),
}));

vi.mock("./loader.js", () => ({
  loadOpenClawPlugins: (...args: unknown[]) => loadOpenClawPluginsMock(...args),
}));

vi.mock("../logging/subsystem.js", () => ({
  createSubsystemLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock("./logger.js", () => ({
  createPluginLoaderLogger: (logger: unknown) => logger,
}));

vi.mock("../agents/agent-scope.js", () => ({
  resolveAgentWorkspaceDir: () => "/tmp/workspace",
  resolveDefaultAgentId: () => "default",
}));

vi.mock("../agents/workspace.js", () => ({
  resolveDefaultAgentWorkspaceDir: () => "/tmp/workspace-default",
}));

import { buildPluginStatusReport } from "./status.js";

describe("buildPluginStatusReport", () => {
  it("loads config with secret resolution enabled", () => {
    loadConfigMock.mockReturnValue({});
    loadOpenClawPluginsMock.mockReturnValue({
      plugins: [],
      tools: [],
      hooks: [],
      typedHooks: [],
      channels: [],
      providers: [],
      gatewayHandlers: {},
      httpRoutes: [],
      cliRegistrars: [],
      services: [],
      commands: [],
      diagnostics: [],
    });

    buildPluginStatusReport();

    expect(loadConfigMock).toHaveBeenCalledTimes(1);
    expect(loadConfigMock).toHaveBeenCalledWith({ resolveSecrets: true });
  });
});
