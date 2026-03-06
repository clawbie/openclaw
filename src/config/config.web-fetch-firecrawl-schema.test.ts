import { describe, expect, it } from "vitest";

import { validateConfigObjectRaw } from "./validation.js";

describe("config schema: tools.web.fetch.firecrawl", () => {
  it("accepts tools.web.fetch.firecrawl block", () => {
    const raw = {
      tools: {
        web: {
          fetch: {
            firecrawl: {
              apiKey: "fc-test",
              baseUrl: "https://api.firecrawl.dev",
              onlyMainContent: true,
              maxAgeMs: 172800000,
              timeoutSeconds: 60,
            },
          },
        },
      },
    };

    const validated = validateConfigObjectRaw(raw);
    expect(validated.ok).toBe(true);
    if (!validated.ok) {
      throw new Error(validated.issues.map((iss) => `${iss.path}: ${iss.message}`).join("\n"));
    }
  });

  it("rejects unknown key under tools.web.fetch.firecrawl", () => {
    const raw = {
      tools: {
        web: {
          fetch: {
            firecrawl: {
              apiKey: "fc-test",
              nope: true,
            },
          },
        },
      },
    };

    const validated = validateConfigObjectRaw(raw);
    expect(validated.ok).toBe(false);
    if (validated.ok) {
      throw new Error("Expected validation to fail");
    }
    expect(validated.issues.some((iss) => iss.path === "tools.web.fetch.firecrawl")).toBe(true);
  });
});
