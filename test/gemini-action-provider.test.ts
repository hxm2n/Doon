import { describe, expect, it } from "vitest";
import {
  buildGeminiActionPrompt,
  parseGeminiActionProposal,
  proposeGeminiAction,
} from "../src/main/gemini-action-provider";

const input = {
  command: "Discord 요구사항을 읽고 한글 문서를 작성해줘.",
  stageId: "requirements_collected",
} as const;

describe("gemini action provider", () => {
  it("Given no API key When proposing an action Then it returns a configuration error", async () => {
    const proposal = await proposeGeminiAction(input, "");

    expect(proposal.status).toBe("configuration_missing");
    expect(proposal.errorMessage).toContain("GEMINI_API_KEY");
  });

  it("Given model JSON When parsing Then it validates the restricted action", () => {
    const proposal = parseGeminiActionProposal(
      JSON.stringify({
        status: "proposed",
        checkedAt: "2026-07-21T00:00:00.000Z",
        model: "gemini-3.5-flash",
        reason: "화면 정보가 부족해 Discord 접근성 트리를 먼저 읽습니다.",
        action: {
          type: "read_accessibility_tree",
          targetId: "discord",
        },
      }),
    );

    expect(proposal.action?.type).toBe("read_accessibility_tree");
  });

  it("Given command context When building a prompt Then unsafe actions stay excluded", () => {
    const prompt = buildGeminiActionPrompt(input, "2026-07-21T00:00:00.000Z");

    expect(prompt).toContain("Never propose typing, clicking");
    expect(prompt).toContain("requirements_collected");
  });
});
