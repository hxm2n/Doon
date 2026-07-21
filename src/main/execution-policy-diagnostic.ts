import type { ChromeSessionSnapshot } from "../shared/chrome-session-model";
import type { ExecutionPolicyDiagnosticSnapshot } from "../shared/execution-policy-diagnostic-model";
import {
  type ExecutionAction,
  type ExecutionContext,
  type ExecutionObservation,
  evaluateActionPolicy,
} from "../shared/execution-policy-model";

const chromeSessionGeneration = 1;
const hancomDocsOrigin = "https://www.hancomdocs.com";
const approvedClipboardProbe = "Doon 정책 게이트 진단";

export const buildChromeSessionPolicyDiagnostic = (
  chromeSession: ChromeSessionSnapshot,
  checkedAt = new Date().toISOString(),
): ExecutionPolicyDiagnosticSnapshot => {
  const requiredWindowTitleMarker = chromeSession.markerTitle || "Doon Chrome Session";
  const context: ExecutionContext = {
    taskId: "native-bridge-policy-diagnostic",
    generation: chromeSessionGeneration,
    stageId: "document_formatted",
    targetAppId: "chrome",
    requiredWindowTitleMarker,
    chromeOrigin: hancomDocsOrigin,
    approvedClipboardValue: approvedClipboardProbe,
  };
  const observation: ExecutionObservation = {
    generation: chromeSessionGeneration,
    frontmostTargetAppId: "chrome",
    activeWindowTitle: chromeSession.windowTitle,
    chromeOrigin: hancomDocsOrigin,
  };
  const probedAction: ExecutionAction = {
    type: "press_key",
    targetAppId: "chrome",
    keyCombo: "CommandOrControl+V",
  };
  const decision = evaluateActionPolicy(context, observation, probedAction);

  return {
    status: decision.status,
    checkedAt,
    context,
    observation,
    probedAction,
    decision,
  };
};
