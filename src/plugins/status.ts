import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../agents/agent-scope.js";
import { resolveDefaultAgentWorkspaceDir } from "../agents/workspace.js";
import { loadConfig } from "../config/config.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { loadOpenClawPlugins } from "./loader.js";
import { createPluginLoaderLogger } from "./logger.js";
import type { PluginRegistry } from "./registry.js";

export type PluginStatusReport = PluginRegistry & {
  workspaceDir?: string;
};

const log = createSubsystemLogger("plugins");

export function buildPluginStatusReport(params?: {
  config?: ReturnType<typeof loadConfig>;
  workspaceDir?: string;
}): PluginStatusReport {
  // Plugin status commands (like `openclaw plugins list`) run in a standalone CLI
  // process and do not have access to a gateway runtime snapshot.
  //
  // Some plugins evaluate whether they're "configured" during registration by
  // reading channel credentials. When credentials are supplied via SecretRef
  // objects (env/file/exec), they may intentionally remain unresolved in the CLI
  // context.
  //
  // Load config with secret resolution enabled so env-backed SecretRefs are
  // normalized where possible (and we don't falsely mark plugins as errored).
  const config = params?.config ?? loadConfig({ resolveSecrets: true });
  const workspaceDir = params?.workspaceDir
    ? params.workspaceDir
    : (resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config)) ??
      resolveDefaultAgentWorkspaceDir());

  const registry = loadOpenClawPlugins({
    config,
    workspaceDir,
    logger: createPluginLoaderLogger(log),
  });

  return {
    workspaceDir,
    ...registry,
  };
}
