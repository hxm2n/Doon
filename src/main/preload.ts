import { contextBridge, ipcRenderer } from "electron";
import { z } from "zod";
import {
  type AccessibilityTreeSnapshot,
  accessibilityTreeSnapshotSchema,
  type ReadAccessibilityTreeInput,
  readAccessibilityTreeInputSchema,
} from "../shared/accessibility-tree-model";
import {
  type ActionProposal,
  actionProposalSchema,
  type ProposeActionInput,
  proposeActionInputSchema,
} from "../shared/action-proposal-model";
import {
  type ChromeSessionInput,
  type ChromeSessionSnapshot,
  chromeSessionInputSchema,
  chromeSessionSnapshotSchema,
} from "../shared/chrome-session-model";
import { type OnboardingStatus, onboardingStatusSchema } from "../shared/onboarding-model";
import {
  type OpenSystemPermissionSettingsInput,
  openSystemPermissionSettingsInputSchema,
  type SystemPermissionSnapshot,
  systemPermissionSnapshotSchema,
} from "../shared/permission-model";
import {
  type PersistenceDiagnosticSnapshot,
  persistenceDiagnosticSnapshotSchema,
} from "../shared/persistence-diagnostic-model";
import type {
  CreateTaskInput,
  RevisionInput,
  StageActionInput,
  TaskSnapshot,
} from "../shared/task-model";
import { parseOptionalTaskSnapshot } from "../shared/task-snapshot-parser";
import {
  type CaptureWindowInput,
  captureWindowInputSchema,
  type WindowCaptureSnapshot,
  windowCaptureSnapshotSchema,
} from "../shared/window-capture-model";
import {
  type FocusTargetAppInput,
  focusTargetAppInputSchema,
  type WindowDiscoverySnapshot,
  windowDiscoverySnapshotSchema,
} from "../shared/window-discovery-model";

export type DoonAppInfo = {
  readonly name: string;
  readonly version: string;
};

export type DoonApi = {
  readonly getAppInfo: () => Promise<DoonAppInfo>;
  readonly getOnboardingStatus: () => Promise<OnboardingStatus>;
  readonly completeOnboarding: () => Promise<OnboardingStatus>;
  readonly resetOnboarding: () => Promise<OnboardingStatus>;
  readonly runPersistenceDiagnostic: () => Promise<PersistenceDiagnosticSnapshot>;
  readonly getSystemPermissionSnapshot: () => Promise<SystemPermissionSnapshot>;
  readonly openSystemPermissionSettings: (
    input: OpenSystemPermissionSettingsInput,
  ) => Promise<void>;
  readonly getWindowDiscoverySnapshot: () => Promise<WindowDiscoverySnapshot>;
  readonly focusTargetApp: (input: FocusTargetAppInput) => Promise<WindowDiscoverySnapshot>;
  readonly readAccessibilityTree: (
    input: ReadAccessibilityTreeInput,
  ) => Promise<AccessibilityTreeSnapshot>;
  readonly captureWindow: (input: CaptureWindowInput) => Promise<WindowCaptureSnapshot>;
  readonly readChromeSession: (input: ChromeSessionInput) => Promise<ChromeSessionSnapshot>;
  readonly launchChromeSession: (input: ChromeSessionInput) => Promise<ChromeSessionSnapshot>;
  readonly proposeAction: (input: ProposeActionInput) => Promise<ActionProposal>;
  readonly getCurrentTask: () => Promise<TaskSnapshot | undefined>;
  readonly createTask: (input: CreateTaskInput) => Promise<TaskSnapshot | undefined>;
  readonly startStage: (input: StageActionInput) => Promise<TaskSnapshot | undefined>;
  readonly approveStage: (input: StageActionInput) => Promise<TaskSnapshot | undefined>;
  readonly reviseStage: (input: RevisionInput) => Promise<TaskSnapshot | undefined>;
  readonly rerunStage: (input: StageActionInput) => Promise<TaskSnapshot | undefined>;
  readonly pauseTask: () => Promise<TaskSnapshot | undefined>;
  readonly resumeTask: () => Promise<TaskSnapshot | undefined>;
  readonly cancelTask: () => Promise<TaskSnapshot | undefined>;
};

const appInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
});

const invokeTask = async (
  channel: string,
  input?: CreateTaskInput | StageActionInput | RevisionInput,
): Promise<TaskSnapshot | undefined> => {
  const result =
    input === undefined
      ? await ipcRenderer.invoke(channel)
      : await ipcRenderer.invoke(channel, input);
  return parseOptionalTaskSnapshot(result);
};

const doonApi: DoonApi = {
  getAppInfo: async () => appInfoSchema.parse(await ipcRenderer.invoke("doon:app-info")),
  getOnboardingStatus: async () =>
    onboardingStatusSchema.parse(await ipcRenderer.invoke("doon:get-onboarding-status")),
  completeOnboarding: async () =>
    onboardingStatusSchema.parse(await ipcRenderer.invoke("doon:complete-onboarding")),
  resetOnboarding: async () =>
    onboardingStatusSchema.parse(await ipcRenderer.invoke("doon:reset-onboarding")),
  runPersistenceDiagnostic: async () =>
    persistenceDiagnosticSnapshotSchema.parse(
      await ipcRenderer.invoke("doon:run-persistence-diagnostic"),
    ),
  getSystemPermissionSnapshot: async () =>
    systemPermissionSnapshotSchema.parse(
      await ipcRenderer.invoke("doon:get-system-permission-snapshot"),
    ),
  openSystemPermissionSettings: async (input) => {
    await ipcRenderer.invoke(
      "doon:open-system-permission-settings",
      openSystemPermissionSettingsInputSchema.parse(input),
    );
  },
  getWindowDiscoverySnapshot: async () =>
    windowDiscoverySnapshotSchema.parse(
      await ipcRenderer.invoke("doon:get-window-discovery-snapshot"),
    ),
  focusTargetApp: async (input) =>
    windowDiscoverySnapshotSchema.parse(
      await ipcRenderer.invoke("doon:focus-target-app", focusTargetAppInputSchema.parse(input)),
    ),
  readAccessibilityTree: async (input) =>
    accessibilityTreeSnapshotSchema.parse(
      await ipcRenderer.invoke(
        "doon:read-accessibility-tree",
        readAccessibilityTreeInputSchema.parse(input),
      ),
    ),
  captureWindow: async (input) =>
    windowCaptureSnapshotSchema.parse(
      await ipcRenderer.invoke("doon:capture-window", captureWindowInputSchema.parse(input)),
    ),
  readChromeSession: async (input) =>
    chromeSessionSnapshotSchema.parse(
      await ipcRenderer.invoke("doon:read-chrome-session", chromeSessionInputSchema.parse(input)),
    ),
  launchChromeSession: async (input) =>
    chromeSessionSnapshotSchema.parse(
      await ipcRenderer.invoke("doon:launch-chrome-session", chromeSessionInputSchema.parse(input)),
    ),
  proposeAction: async (input) =>
    actionProposalSchema.parse(
      await ipcRenderer.invoke("doon:propose-action", proposeActionInputSchema.parse(input)),
    ),
  getCurrentTask: () => invokeTask("doon:get-current-task"),
  createTask: (input) => invokeTask("doon:create-task", input),
  startStage: (input) => invokeTask("doon:start-stage", input),
  approveStage: (input) => invokeTask("doon:approve-stage", input),
  reviseStage: (input) => invokeTask("doon:revise-stage", input),
  rerunStage: (input) => invokeTask("doon:rerun-stage", input),
  pauseTask: () => invokeTask("doon:pause-task"),
  resumeTask: () => invokeTask("doon:resume-task"),
  cancelTask: () => invokeTask("doon:cancel-task"),
};

contextBridge.exposeInMainWorld("doon", doonApi);
