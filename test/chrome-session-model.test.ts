import { describe, expect, it } from "vitest";
import {
  chromeSessionSnapshotSchema,
  createChromeSessionId,
  createUnavailableChromeSessionSnapshot,
  isDoonChromeSessionIdentified,
} from "../src/shared/chrome-session-model";

describe("chrome session model", () => {
  it("Given a command seed When creating a session id Then it is stable and parseable", () => {
    const sessionId = createChromeSessionId("MVP Hancom Docs");

    expect(sessionId).toBe("doon-mvp-hancom-docs");
  });

  it("Given an empty command seed When creating a session id Then it falls back to a valid marker", () => {
    const sessionId = createChromeSessionId("!!!");

    expect(sessionId).toBe("doon-session");
  });

  it("Given a matching Chrome window When checking identity Then the session is identified", () => {
    const snapshot = chromeSessionSnapshotSchema.parse({
      platform: "darwin",
      checkedAt: "2026-07-21T00:00:00.000Z",
      helperAvailable: true,
      sessionId: "doon-mvp-hancom-docs",
      status: "window_found",
      launchUrl: "file:///tmp/doon-chrome-session-doon-mvp-hancom-docs.html",
      markerTitle: "Doon Chrome Session doon-mvp-hancom-docs",
      windowTitle: "Doon Chrome Session doon-mvp-hancom-docs",
      windowBounds: {
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
      },
    });

    expect(isDoonChromeSessionIdentified(snapshot)).toBe(true);
  });

  it("Given helper unavailable When checking identity Then the session is not identified", () => {
    const snapshot = createUnavailableChromeSessionSnapshot(
      "doon-mvp-hancom-docs",
      "Swift Helper가 아직 빌드되지 않았습니다.",
      "2026-07-21T00:00:00.000Z",
      "darwin",
    );

    expect(chromeSessionSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(isDoonChromeSessionIdentified(snapshot)).toBe(false);
  });

  it("Given Chrome launch was requested When no marker window is visible Then the session is not identified", () => {
    const snapshot = chromeSessionSnapshotSchema.parse({
      platform: "darwin",
      checkedAt: "2026-07-21T00:00:00.000Z",
      helperAvailable: true,
      sessionId: "doon-mvp-hancom-docs",
      status: "launch_requested",
      launchUrl: "file:///tmp/doon-chrome-session-doon-mvp-hancom-docs.html",
      markerTitle: "Doon Chrome Session doon-mvp-hancom-docs",
      windowTitle: "",
      windowBounds: null,
    });

    expect(isDoonChromeSessionIdentified(snapshot)).toBe(false);
  });
});
