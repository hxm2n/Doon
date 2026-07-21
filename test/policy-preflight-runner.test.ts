import { describe, expect, it } from "vitest";
import { runPolicyPreflightAction } from "../src/main/policy-preflight-runner";
import type {
  ExecutionAction,
  ExecutionContext,
  ExecutionObservation,
} from "../src/shared/execution-policy-model";

const context: ExecutionContext = {
  taskId: "task-1",
  generation: 1,
  stageId: "document_formatted",
  targetAppId: "chrome",
  requiredWindowTitleMarker: "Doon Chrome Session",
  chromeOrigin: "https://www.hancomdocs.com",
  approvedClipboardValue: "승인된 본문",
};

const matchingObservation: ExecutionObservation = {
  generation: 1,
  frontmostTargetAppId: "chrome",
  activeWindowTitle: "Doon Chrome Session - 한컴독스",
  chromeOrigin: "https://www.hancomdocs.com",
};

const pasteAction: ExecutionAction = {
  type: "press_key",
  targetAppId: "chrome",
  keyCombo: "CommandOrControl+V",
};

describe("policy preflight runner", () => {
  it("Given policy allows the action When running preflight Then dispatch is called once", async () => {
    const dispatchedActions: ExecutionAction[] = [];

    const result = await runPolicyPreflightAction({
      context,
      observation: matchingObservation,
      action: pasteAction,
      dispatch: async (action) => {
        dispatchedActions.push(action);
        return { status: "executed", summary: "paste dispatched" };
      },
    });

    expect(result).toEqual({
      status: "executed",
      decision: { status: "allowed" },
      dispatchResult: { status: "executed", summary: "paste dispatched" },
    });
    expect(dispatchedActions).toEqual([pasteAction]);
  });

  it("Given policy blocks the action When running preflight Then dispatch is not called", async () => {
    const dispatchedActions: ExecutionAction[] = [];

    const result = await runPolicyPreflightAction({
      context,
      observation: { ...matchingObservation, frontmostTargetAppId: "discord" },
      action: pasteAction,
      dispatch: async (action) => {
        dispatchedActions.push(action);
        return { status: "executed", summary: "should not dispatch" };
      },
    });

    expect(result).toEqual({
      status: "blocked",
      decision: { status: "blocked", reason: "frontmost_app_mismatch" },
    });
    expect(dispatchedActions).toEqual([]);
  });

  it("Given dispatch fails after policy allows When running preflight Then failure is returned", async () => {
    const result = await runPolicyPreflightAction({
      context,
      observation: matchingObservation,
      action: pasteAction,
      dispatch: async () => ({ status: "failed", reason: "helper_unavailable" }),
    });

    expect(result).toEqual({
      status: "failed",
      decision: { status: "allowed" },
      dispatchResult: { status: "failed", reason: "helper_unavailable" },
    });
  });
});
