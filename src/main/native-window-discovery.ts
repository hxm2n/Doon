import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { app } from "electron";
import {
  createUnavailableWindowDiscoverySnapshot,
  type FocusTargetAppInput,
  nativeWindowDiscoveryPayloadSchema,
  targetAppDefinitions,
  type WindowDiscoverySnapshot,
} from "../shared/window-discovery-model";

const execFileAsync = promisify(execFile);
const helperExecutableName = "DoonHelper";

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

const runHelper = async (args: readonly string[]): Promise<WindowDiscoverySnapshot> => {
  if (process.platform !== "darwin") {
    return helperUnavailable("Swift Helper는 macOS에서만 실행됩니다.");
  }

  const helperPath = getHelperPath();
  if (!fs.existsSync(helperPath)) {
    return helperUnavailable("Swift Helper가 아직 빌드되지 않았습니다.");
  }

  try {
    const { stdout } = await execFileAsync(helperPath, [...args], {
      timeout: 5_000,
      maxBuffer: 1024 * 1024,
    });
    return parseHelperOutput(stdout);
  } catch (error) {
    if (error instanceof Error) {
      return helperUnavailable(error.message);
    }
    throw error;
  }
};

export const readWindowDiscoverySnapshot = async (): Promise<WindowDiscoverySnapshot> =>
  runHelper(["list_windows"]);

export const focusTargetApp = async (
  input: FocusTargetAppInput,
): Promise<WindowDiscoverySnapshot> => {
  if (!targetAppDefinitions.some((target) => target.id === input.targetId)) {
    return helperUnavailable(`지원하지 않는 앱입니다: ${input.targetId}`);
  }
  return runHelper(["focus_app", input.targetId]);
};
