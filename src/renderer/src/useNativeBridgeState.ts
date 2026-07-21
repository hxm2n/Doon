import { useEffect, useState } from "react";
import type { AccessibilityTreeSnapshot } from "../../shared/accessibility-tree-model";
import type { ActionProposal } from "../../shared/action-proposal-model";
import {
  type ChromeSessionSnapshot,
  createChromeSessionId,
} from "../../shared/chrome-session-model";
import type { ExecutionPolicyDiagnosticSnapshot } from "../../shared/execution-policy-diagnostic-model";
import type { PersistenceDiagnosticSnapshot } from "../../shared/persistence-diagnostic-model";
import type { StageId } from "../../shared/task-model";
import type { WindowCaptureSnapshot } from "../../shared/window-capture-model";
import type { TargetAppId, WindowDiscoverySnapshot } from "../../shared/window-discovery-model";

const demoChromeSessionId = createChromeSessionId("mvp-hancom-docs");

export type NativeBridgeState = {
  readonly snapshot: WindowDiscoverySnapshot | undefined;
  readonly accessibilitySnapshot: AccessibilityTreeSnapshot | undefined;
  readonly captureSnapshot: WindowCaptureSnapshot | undefined;
  readonly actionProposal: ActionProposal | undefined;
  readonly chromeSessionSnapshot: ChromeSessionSnapshot | undefined;
  readonly policyDiagnostic: ExecutionPolicyDiagnosticSnapshot | undefined;
  readonly persistenceDiagnostic: PersistenceDiagnosticSnapshot | undefined;
  readonly onRefresh: () => Promise<void>;
  readonly onFocusTarget: (targetId: TargetAppId) => Promise<void>;
  readonly onReadAccessibilityTree: (targetId: TargetAppId) => Promise<void>;
  readonly onCaptureWindow: (targetId: TargetAppId) => Promise<void>;
  readonly onReadChromeSession: () => Promise<void>;
  readonly onLaunchChromeSession: () => Promise<void>;
  readonly onRunPolicyDiagnostic: () => Promise<void>;
  readonly onRunPersistenceDiagnostic: () => Promise<void>;
  readonly proposeAction: (command: string, stageId: StageId) => Promise<void>;
};

export const useNativeBridgeState = (): NativeBridgeState => {
  const [snapshot, setSnapshot] = useState<WindowDiscoverySnapshot | undefined>(undefined);
  const [accessibilitySnapshot, setAccessibilitySnapshot] = useState<
    AccessibilityTreeSnapshot | undefined
  >(undefined);
  const [captureSnapshot, setCaptureSnapshot] = useState<WindowCaptureSnapshot | undefined>(
    undefined,
  );
  const [actionProposal, setActionProposal] = useState<ActionProposal | undefined>(undefined);
  const [chromeSessionSnapshot, setChromeSessionSnapshot] = useState<
    ChromeSessionSnapshot | undefined
  >(undefined);
  const [policyDiagnostic, setPolicyDiagnostic] = useState<
    ExecutionPolicyDiagnosticSnapshot | undefined
  >(undefined);
  const [persistenceDiagnostic, setPersistenceDiagnostic] = useState<
    PersistenceDiagnosticSnapshot | undefined
  >(undefined);

  useEffect(() => {
    let isMounted = true;
    window.doon.getWindowDiscoverySnapshot().then((nextSnapshot) => {
      if (isMounted) {
        setSnapshot(nextSnapshot);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshWindowDiscovery = async () => {
    setSnapshot(await window.doon.getWindowDiscoverySnapshot());
  };

  const focusTargetApp = async (targetId: TargetAppId) => {
    setSnapshot(await window.doon.focusTargetApp({ targetId }));
  };

  const readAccessibilityTree = async (targetId: TargetAppId) => {
    setAccessibilitySnapshot(await window.doon.readAccessibilityTree({ targetId }));
  };

  const captureWindow = async (targetId: TargetAppId) => {
    setCaptureSnapshot(await window.doon.captureWindow({ targetId }));
  };

  const readChromeSession = async () => {
    setChromeSessionSnapshot(
      await window.doon.readChromeSession({ sessionId: demoChromeSessionId }),
    );
  };

  const launchChromeSession = async () => {
    setChromeSessionSnapshot(
      await window.doon.launchChromeSession({ sessionId: demoChromeSessionId }),
    );
  };

  const runPersistenceDiagnostic = async () => {
    setPersistenceDiagnostic(await window.doon.runPersistenceDiagnostic());
  };

  const runPolicyDiagnostic = async () => {
    setPolicyDiagnostic(await window.doon.runPolicyDiagnostic({ sessionId: demoChromeSessionId }));
  };

  const proposeAction = async (command: string, stageId: StageId) => {
    setActionProposal(
      await window.doon.proposeAction({
        command,
        stageId,
        accessibilitySnapshot,
        captureSnapshot,
      }),
    );
  };

  return {
    snapshot,
    accessibilitySnapshot,
    captureSnapshot,
    actionProposal,
    chromeSessionSnapshot,
    policyDiagnostic,
    persistenceDiagnostic,
    onRefresh: refreshWindowDiscovery,
    onFocusTarget: focusTargetApp,
    onReadAccessibilityTree: readAccessibilityTree,
    onCaptureWindow: captureWindow,
    onReadChromeSession: readChromeSession,
    onLaunchChromeSession: launchChromeSession,
    onRunPolicyDiagnostic: runPolicyDiagnostic,
    onRunPersistenceDiagnostic: runPersistenceDiagnostic,
    proposeAction,
  };
};
