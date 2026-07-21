import { describe, expect, it } from "vitest";
import {
  accessibilityTreeSnapshotSchema,
  canExtractTextFromAccessibilityTree,
  createUnavailableAccessibilityTreeSnapshot,
} from "../src/shared/accessibility-tree-model";

describe("accessibility tree model", () => {
  it("Given a readable trusted tree When text nodes exist Then extraction can continue", () => {
    const snapshot = accessibilityTreeSnapshotSchema.parse({
      platform: "darwin",
      checkedAt: "2026-07-21T00:00:00.000Z",
      helperAvailable: true,
      target: {
        id: "discord",
        title: "Discord",
        bundleId: "com.hnc.Discord",
      },
      status: "readable",
      accessTrusted: true,
      nodeCount: 2,
      textNodeCount: 1,
      nodes: [
        {
          role: "AXStaticText",
          title: "",
          value: "행사 계획서 요구사항",
          description: "",
          depth: 1,
          childCount: 0,
        },
      ],
    });

    expect(canExtractTextFromAccessibilityTree(snapshot)).toBe(true);
  });

  it("Given a missing permission tree When text extraction is checked Then extraction stops", () => {
    const snapshot = createUnavailableAccessibilityTreeSnapshot(
      "discord",
      "Swift Helper는 macOS에서만 실행됩니다.",
      "2026-07-21T00:00:00.000Z",
      "darwin",
    );

    expect(accessibilityTreeSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(canExtractTextFromAccessibilityTree(snapshot)).toBe(false);
  });
});
