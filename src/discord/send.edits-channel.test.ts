import { Routes } from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import { editChannelDiscord } from "./send.channels.js";
import { makeDiscordRest } from "./send.test-harness.js";

describe("editChannelDiscord", () => {
  it("passes applied_tags when appliedTags is provided", async () => {
    const { rest, patchMock } = makeDiscordRest();

    await editChannelDiscord(
      {
        channelId: "123",
        appliedTags: ["tag1", "tag2"],
      },
      { rest, token: "t" },
    );

    expect(patchMock).toHaveBeenCalledWith(Routes.channel("123"), {
      body: expect.objectContaining({ applied_tags: ["tag1", "tag2"] }),
    });
  });

  it("omits applied_tags when appliedTags is undefined", async () => {
    const { rest, patchMock } = makeDiscordRest();

    await editChannelDiscord(
      {
        channelId: "123",
        name: "new-name",
      },
      { rest, token: "t" },
    );

    expect(patchMock).toHaveBeenCalledWith(Routes.channel("123"), {
      body: expect.not.objectContaining({ applied_tags: expect.anything() }),
    });
  });
});
