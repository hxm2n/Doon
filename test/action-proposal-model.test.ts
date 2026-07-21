import { describe, expect, it } from "vitest";
import {
  actionProposalSchema,
  canExecuteProposedAction,
  createMissingGeminiApiKeyProposal,
} from "../src/shared/action-proposal-model";

describe("action proposal model", () => {
  it("Given a proposed allowed action When it is checked Then it can execute", () => {
    const proposal = actionProposalSchema.parse({
      status: "proposed",
      checkedAt: "2026-07-21T00:00:00.000Z",
      model: "gemini-3.5-flash",
      reason: "Discord 상태를 먼저 확인해야 합니다.",
      action: {
        type: "read_accessibility_tree",
        targetId: "discord",
      },
    });

    expect(canExecuteProposedAction(proposal)).toBe(true);
  });

  it("Given a missing API key proposal When it is checked Then it cannot execute", () => {
    const proposal = createMissingGeminiApiKeyProposal("2026-07-21T00:00:00.000Z");

    expect(actionProposalSchema.parse(proposal)).toEqual(proposal);
    expect(canExecuteProposedAction(proposal)).toBe(false);
  });
});
