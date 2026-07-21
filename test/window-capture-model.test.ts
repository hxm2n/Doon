import { describe, expect, it } from "vitest";
import {
  canUseWindowCapture,
  createUnavailableWindowCaptureSnapshot,
  windowCaptureSnapshotSchema,
} from "../src/shared/window-capture-model";

describe("window capture model", () => {
  it("Given a captured window When capture is checked Then visual context can continue", () => {
    const snapshot = windowCaptureSnapshotSchema.parse({
      platform: "darwin",
      checkedAt: "2026-07-21T00:00:00.000Z",
      helperAvailable: true,
      target: {
        id: "discord",
        title: "Discord",
        bundleId: "com.hnc.Discord",
      },
      status: "captured",
      screenCaptureTrusted: true,
      windowTitle: "학생회",
      windowBounds: {
        x: 10,
        y: 20,
        width: 800,
        height: 600,
      },
      imageWidth: 1600,
      imageHeight: 1200,
      byteCount: 24_000,
      filePath: "/private/tmp/doon-window-capture-discord.png",
      errorMessage: null,
    });

    expect(canUseWindowCapture(snapshot)).toBe(true);
  });

  it("Given a missing helper capture When capture is checked Then visual context stops", () => {
    const snapshot = createUnavailableWindowCaptureSnapshot(
      "chrome",
      "Swift Helper가 아직 빌드되지 않았습니다.",
      "2026-07-21T00:00:00.000Z",
      "darwin",
    );

    expect(windowCaptureSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(canUseWindowCapture(snapshot)).toBe(false);
  });

  it("Given a Swift failure payload When nil fields are omitted Then parsing still succeeds", () => {
    const snapshot = windowCaptureSnapshotSchema.parse({
      platform: "darwin",
      checkedAt: "2026-07-21T00:00:00.000Z",
      helperAvailable: true,
      target: {
        id: "discord",
        title: "Discord",
        bundleId: "com.hnc.Discord",
      },
      status: "permission_missing",
      screenCaptureTrusted: false,
      windowTitle: "",
      imageWidth: 0,
      imageHeight: 0,
      byteCount: 0,
      filePath: "",
    });

    expect(canUseWindowCapture(snapshot)).toBe(false);
  });
});
