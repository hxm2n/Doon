import { describe, expect, it } from "vitest";
import { evaluateActionPolicy } from "../src/shared/execution-policy-model";

const baseContext = {
  taskId: "task-1",
  generation: 3,
  stageId: "document_formatted",
  targetAppId: "chrome",
  requiredWindowTitleMarker: "Doon Hancom Session",
  chromeOrigin: "https://www.hancomdocs.com",
  outputDirectoryHandleId: "output-handle-1",
  approvedClipboardValue: "승인된 문서 본문",
} as const;

const matchingObservation = {
  generation: 3,
  frontmostTargetAppId: "chrome",
  activeWindowTitle: "Doon Hancom Session - 한컴독스",
  chromeOrigin: "https://www.hancomdocs.com",
  outputDirectoryHandleId: "output-handle-1",
} as const;

describe("execution policy model", () => {
  it("allows a paste command inside the approved Hancom Chrome session", () => {
    const decision = evaluateActionPolicy(baseContext, matchingObservation, {
      type: "press_key",
      targetAppId: "chrome",
      keyCombo: "CommandOrControl+V",
    });

    expect(decision).toEqual({ status: "allowed" });
  });

  it("blocks GUI actions when another app is frontmost", () => {
    const decision = evaluateActionPolicy(
      baseContext,
      { ...matchingObservation, frontmostTargetAppId: "discord" },
      {
        type: "type_text",
        targetAppId: "chrome",
        text: "회의록",
      },
    );

    expect(decision).toEqual({ status: "blocked", reason: "frontmost_app_mismatch" });
  });

  it("blocks clipboard writes that were not approved for the current stage", () => {
    const decision = evaluateActionPolicy(baseContext, matchingObservation, {
      type: "set_clipboard",
      targetAppId: "chrome",
      value: "다른 문서 본문",
    });

    expect(decision).toEqual({ status: "blocked", reason: "clipboard_value_not_approved" });
  });

  it("blocks a key combo outside the current stage allowlist", () => {
    const decision = evaluateActionPolicy(
      { ...baseContext, stageId: "requirements_collected" },
      matchingObservation,
      {
        type: "press_key",
        targetAppId: "chrome",
        keyCombo: "CommandOrControl+V",
      },
    );

    expect(decision).toEqual({ status: "blocked", reason: "key_combo_not_allowed" });
  });

  it("allows moving a downloaded HWP only after the output handle matches", () => {
    const decision = evaluateActionPolicy(
      { ...baseContext, stageId: "file_saved" },
      matchingObservation,
      {
        type: "move_downloaded_hwp",
        targetAppId: "chrome",
        expectedFileName: "student-council.hwp",
        outputDirectoryHandleId: "output-handle-1",
      },
    );

    expect(decision).toEqual({ status: "allowed" });
  });

  it("blocks file actions when the output handle changes", () => {
    const decision = evaluateActionPolicy(
      { ...baseContext, stageId: "file_saved" },
      { ...matchingObservation, outputDirectoryHandleId: "output-handle-2" },
      {
        type: "verify_hwp",
        targetAppId: "chrome",
        expectedFileName: "student-council.hwp",
        outputDirectoryHandleId: "output-handle-1",
      },
    );

    expect(decision).toEqual({ status: "blocked", reason: "output_directory_handle_mismatch" });
  });
});
