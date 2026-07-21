import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { app } from "electron";
import {
  type AccessibilityTreeSnapshot,
  createUnavailableAccessibilityTreeSnapshot,
  nativeAccessibilityTreePayloadSchema,
  type ReadAccessibilityTreeInput,
} from "../shared/accessibility-tree-model";
import {
  createUnavailableWindowDiscoverySnapshot,
  type FocusTargetAppInput,
  nativeWindowDiscoveryPayloadSchema,
  targetAppDefinitions,
  type WindowDiscoverySnapshot,
} from "../shared/window-discovery-model";

const execFileAsync = promisify(execFile);
const helperExecutableName = "DoonHelper";

type HelperRunResult =
  | { readonly kind: "ok"; readonly stdout: string }
  | { readonly kind: "unavailable"; readonly message: string };

const getHelperPath = (): string =>
  app.isPackaged
    ? path.join(process.resourcesPath, helperExecutableName)
    : path.join(process.cwd(), "native", "macos-helper", helperExecutableName);

const currentTimestamp = (): string => new Date().toISOString();

const helperUnavailable = (message: string): WindowDiscoverySnapshot =>
  createUnavailableWindowDiscoverySnapshot(message, currentTimestamp(), process.platform);

const parseHelperOutput = (stdout: string): WindowDiscoverySnapshot => ({
  ...nativeWindowDiscoveryPayloadSchema.parse(JSON.parse(stdout)),
  helperAvailable: true,
});

const readHelperOutput = async (args: readonly string[]): Promise<HelperRunResult> => {
  if (process.platform !== "darwin") {
    return { kind: "unavailable", message: "Swift Helper는 macOS에서만 실행됩니다." };
  }

  const helperPath = getHelperPath();
  if (!fs.existsSync(helperPath)) {
    return { kind: "unavailable", message: "Swift Helper가 아직 빌드되지 않았습니다." };
  }

  try {
    const { stdout } = await execFileAsync(helperPath, [...args], {
      timeout: 5_000,
      maxBuffer: 1024 * 1024,
    });
    return { kind: "ok", stdout };
  } catch (error) {
    if (error instanceof Error) {
      return { kind: "unavailable", message: error.message };
    }
    throw error;
  }
};

export const readWindowDiscoverySnapshot = async (): Promise<WindowDiscoverySnapshot> => {
  const result = await readHelperOutput(["list_windows"]);
  return result.kind === "ok"
    ? parseHelperOutput(result.stdout)
    : helperUnavailable(result.message);
};

export const focusTargetApp = async (
  input: FocusTargetAppInput,
): Promise<WindowDiscoverySnapshot> => {
  if (!targetAppDefinitions.some((target) => target.id === input.targetId)) {
    return helperUnavailable(`지원하지 않는 앱입니다: ${input.targetId}`);
  }
  const result = await readHelperOutput(["focus_app", input.targetId]);
  return result.kind === "ok"
    ? parseHelperOutput(result.stdout)
    : helperUnavailable(result.message);
};

export const readAccessibilityTreeSnapshot = async (
  input: ReadAccessibilityTreeInput,
): Promise<AccessibilityTreeSnapshot> => {
  const result = await readHelperOutput(["read_ax_tree", input.targetId]);
  if (result.kind === "unavailable") {
    return createUnavailableAccessibilityTreeSnapshot(
      input.targetId,
      result.message,
      currentTimestamp(),
      process.platform,
    );
  }
  return {
    ...nativeAccessibilityTreePayloadSchema.parse(JSON.parse(result.stdout)),
    helperAvailable: true,
  };
};
