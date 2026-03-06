import { describe, expect, it } from "vitest";
import { extractToolCards } from "./tool-cards.ts";

describe("extractToolCards", () => {
  it("extracts tool result text from OpenAI-style content blocks", () => {
    const message = {
      role: "assistant",
      content: [
        {
          type: "tool_result",
          name: "exec",
          content: [{ type: "text", text: "hello from tool" }],
        },
      ],
    };

    const cards = extractToolCards(message);
    expect(cards).toEqual([
      {
        kind: "result",
        name: "exec",
        text: "hello from tool",
      },
    ]);
  });

  it("extracts tool result text from string content", () => {
    const message = {
      role: "assistant",
      content: [{ type: "tool_result", name: "exec", content: "ok" }],
    };

    const cards = extractToolCards(message);
    expect(cards).toEqual([
      {
        kind: "result",
        name: "exec",
        text: "ok",
      },
    ]);
  });

  it("extracts tool result text from toolResult.text", () => {
    const message = {
      role: "assistant",
      content: [{ type: "tool_result", name: "exec", text: "from text" }],
    };

    const cards = extractToolCards(message);
    expect(cards).toEqual([
      {
        kind: "result",
        name: "exec",
        text: "from text",
      },
    ]);
  });
});
