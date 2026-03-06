import { describe, expect, it } from "vitest";
import { validateConfigObjectRaw } from "./validation.js";

describe("Agent runtime schema", () => {
  it("accepts agents.list[].runtime for ACP agent entries (issue #38321)", () => {
    const raw = {
      agents: {
        list: [
          {
            id: "code-agent",
            runtime: {
              type: "acp",
              acp: {
                cwd: "/tmp",
              },
            },
          },
        ],
      },
    };

    const res = validateConfigObjectRaw(raw);
    expect(res.ok).toBe(true);
  });
});
