import { describe, expect, it } from "vitest";
import { buildChromeSessionPolicyDiagnostic } from "../src/main/execution-policy-diagnostic";
import { chromeSessionSnapshotSchema } from "../src/shared/chrome-session-model";

const windowFoundChromeSession = chromeSessionSnapshotSchema.parse({
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

describe("execution policy diagnostic", () => {
  it("Given a matching Chrome marker window When diagnosing policy Then the paste probe is allowed", () => {
    const diagnostic = buildChromeSessionPolicyDiagnostic(windowFoundChromeSession);

    expect(diagnostic.status).toBe("allowed");
    expect(diagnostic.decision).toEqual({ status: "allowed" });
    expect(diagnostic.context.stageId).toBe("document_formatted");
    expect(diagnostic.probedAction.type).toBe("press_key");
  });

  it("Given a missing Chrome marker window When diagnosing policy Then the window mismatch is reported", () => {
    const diagnostic = buildChromeSessionPolicyDiagnostic({
      ...windowFoundChromeSession,
      status: "window_not_found",
      windowTitle: "",
    });

    expect(diagnostic.status).toBe("blocked");
    expect(diagnostic.decision).toEqual({ status: "blocked", reason: "window_title_mismatch" });
  });

  it("Given an unavailable helper snapshot When diagnosing policy Then the diagnostic still returns a blocked result", () => {
    const diagnostic = buildChromeSessionPolicyDiagnostic({
      ...windowFoundChromeSession,
      helperAvailable: false,
      status: "helper_unavailable",
      markerTitle: "",
      windowTitle: "",
      errorMessage: "Swift Helper가 아직 빌드되지 않았습니다.",
    });

    expect(diagnostic.status).toBe("blocked");
    expect(diagnostic.context.requiredWindowTitleMarker).toBe("Doon Chrome Session");
    expect(diagnostic.decision).toEqual({ status: "blocked", reason: "window_title_mismatch" });
  });
});
