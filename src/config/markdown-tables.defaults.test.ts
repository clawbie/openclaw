import { describe, expect, it } from "vitest";
import { resolveMarkdownTableMode } from "./markdown-tables.ts";

describe("resolveMarkdownTableMode - defaults", () => {
  it("defaults telegram to code mode (Telegram does not support markdown tables)", () => {
    expect(resolveMarkdownTableMode({ cfg: undefined, channel: "telegram" })).toBe("code");
  });

  it("defaults whatsapp to bullets", () => {
    expect(resolveMarkdownTableMode({ cfg: undefined, channel: "whatsapp" })).toBe("bullets");
  });

  it("defaults signal to bullets", () => {
    expect(resolveMarkdownTableMode({ cfg: undefined, channel: "signal" })).toBe("bullets");
  });
});
