import { describe, expect, it } from "vitest";
import {
  createUnavailableWindowDiscoverySnapshot,
  isTargetReadyForGuiControl,
  windowDiscoverySnapshotSchema,
} from "../src/shared/window-discovery-model";

describe("window discovery model", () => {
  it("Given a helper failure When snapshot is created Then target control is unavailable", () => {
    const snapshot = createUnavailableWindowDiscoverySnapshot(
      "Swift Helper가 아직 빌드되지 않았습니다.",
      "2026-07-21T00:00:00.000Z",
    );

    expect(windowDiscoverySnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(isTargetReadyForGuiControl(snapshot, "discord")).toBe(false);
  });

  it("Given a running target When readiness is checked Then GUI control can continue", () => {
    const snapshot = windowDiscoverySnapshotSchema.parse({
      platform: "darwin",
      checkedAt: "2026-07-21T00:00:00.000Z",
      helperAvailable: true,
      targets: [
        {
          id: "discord",
          title: "Discord",
          bundleId: "com.hnc.Discord",
          state: "running",
          windowCount: 1,
        },
        {
          id: "chrome",
          title: "Google Chrome",
          bundleId: "com.google.Chrome",
          state: "not_running",
          windowCount: 0,
        },
      ],
      windows: [],
    });

    expect(isTargetReadyForGuiControl(snapshot, "discord")).toBe(true);
    expect(isTargetReadyForGuiControl(snapshot, "chrome")).toBe(false);
  });
});
