import { describe, expect, it } from "vitest";

import { extractToolCards } from "./tool-cards.ts";

describe("extractToolCards", () => {
  it("extracts tool result text from nested content blocks", () => {
    const cards = extractToolCards({
      role: "assistant",
      content: [
        {
          type: "toolResult",
          name: "exec",
          content: [{ type: "text", text: "hello from stdout" }],
        },
      ],
    });

    expect(cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "result", name: "exec", text: "hello from stdout" }),
      ]),
    );
  });
});
