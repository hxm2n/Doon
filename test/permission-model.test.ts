import { describe, expect, it } from "vitest";
import {
  areRequiredSystemPermissionsGranted,
  type SystemPermissionSnapshot,
} from "../src/shared/permission-model";

const createPermissionSnapshot = (
  states: readonly ["granted", "granted", "granted" | "denied" | "unknown"],
): SystemPermissionSnapshot => ({
  platform: "darwin",
  checkedAt: "2026-07-21T00:00:00.000Z",
  permissions: [
    {
      id: "accessibility",
      title: "접근성",
      description: "접근성 권한",
      state: states[0],
      required: true,
      actionLabel: "접근성 설정 열기",
    },
    {
      id: "screen_recording",
      title: "화면 기록",
      description: "화면 기록 권한",
      state: states[1],
      required: true,
      actionLabel: "화면 기록 설정 열기",
    },
    {
      id: "notifications",
      title: "알림",
      description: "알림 권한",
      state: states[2],
      required: true,
      actionLabel: "알림 설정 열기",
    },
  ],
});

describe("permission model", () => {
  it("reports ready when every required permission is granted", () => {
    const snapshot = createPermissionSnapshot(["granted", "granted", "granted"]);

    expect(areRequiredSystemPermissionsGranted(snapshot)).toBe(true);
  });

  it("reports not ready when any required permission still needs attention", () => {
    const snapshot = createPermissionSnapshot(["granted", "granted", "unknown"]);

    expect(areRequiredSystemPermissionsGranted(snapshot)).toBe(false);
  });
});
