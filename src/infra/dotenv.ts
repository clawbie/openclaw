import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { resolveConfigDir } from "../utils.js";

function expandDotEnvVars(parsed: Record<string, string>) {
  const memo = new Map<string, string>();

  function resolveVar(name: string, stack: string[]): string | undefined {
    // Preserve shell/env precedence over .env-defined values.
    const fromEnv = process.env[name];
    if (fromEnv !== undefined) return fromEnv;

    const cached = memo.get(name);
    if (cached !== undefined) return cached;

    const raw = parsed[name];
    if (raw === undefined) return undefined;

    // Prevent infinite recursion like A=$A or A=$B, B=$A.
    if (stack.includes(name)) return raw;

    const expanded = expandValue(raw, [...stack, name]);
    memo.set(name, expanded);
    return expanded;
  }

  function expandValue(value: string, stack: string[]): string {
    // Respect escaped dollars: \$FOO stays $FOO.
    const placeholder = "__OPENCLAW_ESCAPED_DOLLAR__";
    const protectedValue = value.replaceAll("\\$", placeholder);

    const expanded = protectedValue.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_m, braced, bare) => {
      const name = String(braced ?? bare);
      return resolveVar(name, stack) ?? "";
    });

    return expanded.replaceAll(placeholder, "$");
  }

  const out: Record<string, string> = {};
  for (const key of Object.keys(parsed)) {
    out[key] = expandValue(parsed[key]!, [key]);
  }
  return out;
}

function loadEnvFile(filePath: string, opts: { override: boolean }) {
  if (!fs.existsSync(filePath)) return;
  const contents = fs.readFileSync(filePath, "utf8");
  const parsed = dotenv.parse(contents);
  const expanded = expandDotEnvVars(parsed);

  for (const [key, value] of Object.entries(expanded)) {
    if (!opts.override && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

export function loadDotEnv(opts?: { quiet?: boolean }) {
  // Keep signature stable; quiet is accepted for compatibility with dotenv.config.
  // We intentionally avoid writing to stdout/stderr regardless.
  void (opts?.quiet ?? true);

  // Load from process CWD first.
  loadEnvFile(path.join(process.cwd(), ".env"), { override: false });

  // Then load global fallback: ~/.openclaw/.env (or OPENCLAW_STATE_DIR/.env),
  // without overriding any env vars already present.
  const globalEnvPath = path.join(resolveConfigDir(process.env), ".env");
  loadEnvFile(globalEnvPath, { override: false });
}
