import { describe, expect, it, vi } from "vitest";
import { createConfigIO } from "./io.js";

describe("config miskey warnings", () => {
  it("warns when Feishu credentials are placed under feishu-openclaw-plugin plugin config", () => {
    const warn = vi.fn();
    const io = createConfigIO({
      fs: {
        existsSync: () => true,
        readFileSync: () => "{}",
      } as any,
      json5: {
        parse: () => ({
          plugins: {
            entries: {
              "feishu-openclaw-plugin": {
                enabled: true,
                config: { appId: "abc", appSecret: "def" },
              },
            },
          },
        }),
      } as any,
      logger: { warn, error: () => {} },
      configPath: "/tmp/openclaw.json",
      env: {},
      homedir: () => "/tmp",
    });

    // loadConfig triggers warnOnConfigMiskeys on the parsed + resolved config.
    io.loadConfig();
    expect(
      warn.mock.calls.some((call) =>
        String(call[0]).includes("plugins.entries.feishu-openclaw-plugin.config"),
      ),
    ).toBe(true);
    expect(
      warn.mock.calls.some((call) => String(call[0]).includes("channels.feishu")),
    ).toBe(true);
  });
});
