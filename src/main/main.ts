import path from "node:path";
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { readAccessibilityTreeInputSchema } from "../shared/accessibility-tree-model";
import { proposeActionInputSchema } from "../shared/action-proposal-model";
import { chromeSessionInputSchema } from "../shared/chrome-session-model";
import { completeOnboardingStatus, resetOnboardingStatus } from "../shared/onboarding-model";
import { openSystemPermissionSettingsInputSchema } from "../shared/permission-model";
import {
  approveStage,
  cancelTask,
  createPlannedTask,
  createTaskInputSchema,
  markStageReadyForReview,
  pauseTask,
  rerunStage,
  resumeTask,
  reviseStage,
  revisionInputSchema,
  stageActionInputSchema,
  type TaskSnapshot,
} from "../shared/task-model";
import { captureWindowInputSchema } from "../shared/window-capture-model";
import { focusTargetAppInputSchema } from "../shared/window-discovery-model";
import { buildChromeSessionPolicyDiagnostic } from "./execution-policy-diagnostic";
import { proposeGeminiAction } from "./gemini-action-provider";
import {
  captureWindowSnapshot,
  focusTargetApp,
  launchChromeSessionSnapshot,
  readAccessibilityTreeSnapshot,
  readChromeSessionSnapshot,
  readWindowDiscoverySnapshot,
} from "./native-window-discovery";
import { openSystemPermissionSettings, readSystemPermissionSnapshot } from "./system-permissions";
import { TaskRepository } from "./task-repository";

let mainWindow: BrowserWindow | undefined;
let currentTask: TaskSnapshot | undefined;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 680,
    minWidth: 760,
    minHeight: 560,
    title: "Doon",
    titleBarStyle: "hiddenInset",
    backgroundColor: "#EEF0F3",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL !== undefined) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

const focusMainWindow = (): void => {
  if (mainWindow === undefined || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
};

const persistCurrentTask = (repository: TaskRepository): TaskSnapshot | undefined => {
  if (currentTask !== undefined) {
    repository.saveTask(currentTask);
  }
  return currentTask;
};

const registerIpcHandlers = (repository: TaskRepository): void => {
  ipcMain.handle("doon:app-info", () => ({
    name: "Doon",
    version: app.getVersion(),
  }));

  ipcMain.handle("doon:get-current-task", () => currentTask);

  ipcMain.handle("doon:get-onboarding-status", () => repository.loadOnboardingStatus());

  ipcMain.handle("doon:run-persistence-diagnostic", () => repository.runPersistenceDiagnostic());

  ipcMain.handle("doon:get-system-permission-snapshot", () => readSystemPermissionSnapshot());

  ipcMain.handle("doon:open-system-permission-settings", (_event, payload: unknown) => {
    const input = openSystemPermissionSettingsInputSchema.parse(payload);
    return openSystemPermissionSettings(input.permissionId);
  });

  ipcMain.handle("doon:get-window-discovery-snapshot", () => readWindowDiscoverySnapshot());

  ipcMain.handle("doon:focus-target-app", (_event, payload: unknown) => {
    const input = focusTargetAppInputSchema.parse(payload);
    return focusTargetApp(input);
  });

  ipcMain.handle("doon:read-accessibility-tree", (_event, payload: unknown) => {
    const input = readAccessibilityTreeInputSchema.parse(payload);
    return readAccessibilityTreeSnapshot(input);
  });

  ipcMain.handle("doon:capture-window", (_event, payload: unknown) => {
    const input = captureWindowInputSchema.parse(payload);
    return captureWindowSnapshot(input);
  });

  ipcMain.handle("doon:read-chrome-session", (_event, payload: unknown) => {
    const input = chromeSessionInputSchema.parse(payload);
    return readChromeSessionSnapshot(input);
  });

  ipcMain.handle("doon:launch-chrome-session", (_event, payload: unknown) => {
    const input = chromeSessionInputSchema.parse(payload);
    return launchChromeSessionSnapshot(input);
  });

  ipcMain.handle("doon:run-policy-diagnostic", async (_event, payload: unknown) => {
    const input = chromeSessionInputSchema.parse(payload);
    return buildChromeSessionPolicyDiagnostic(await readChromeSessionSnapshot(input));
  });

  ipcMain.handle("doon:propose-action", (_event, payload: unknown) => {
    const input = proposeActionInputSchema.parse(payload);
    return proposeGeminiAction(input);
  });

  ipcMain.handle("doon:complete-onboarding", () => {
    const onboardingStatus = completeOnboardingStatus(new Date().toISOString());
    repository.saveOnboardingStatus(onboardingStatus);
    return onboardingStatus;
  });

  ipcMain.handle("doon:reset-onboarding", () => {
    const onboardingStatus = resetOnboardingStatus();
    repository.saveOnboardingStatus(onboardingStatus);
    return onboardingStatus;
  });

  ipcMain.handle("doon:create-task", (_event, payload: unknown) => {
    const input = createTaskInputSchema.parse(payload);
    currentTask = createPlannedTask(input, crypto.randomUUID());
    return persistCurrentTask(repository);
  });

  ipcMain.handle("doon:start-stage", (_event, payload: unknown) => {
    const input = stageActionInputSchema.parse(payload);
    if (currentTask === undefined) {
      return undefined;
    }
    currentTask = markStageReadyForReview(currentTask, input.stageId);
    return persistCurrentTask(repository);
  });

  ipcMain.handle("doon:approve-stage", (_event, payload: unknown) => {
    const input = stageActionInputSchema.parse(payload);
    if (currentTask === undefined) {
      return undefined;
    }
    currentTask = approveStage(currentTask, input.stageId);
    return persistCurrentTask(repository);
  });

  ipcMain.handle("doon:revise-stage", (_event, payload: unknown) => {
    const input = revisionInputSchema.parse(payload);
    if (currentTask === undefined) {
      return undefined;
    }
    currentTask = reviseStage(currentTask, input);
    return persistCurrentTask(repository);
  });

  ipcMain.handle("doon:rerun-stage", (_event, payload: unknown) => {
    const input = stageActionInputSchema.parse(payload);
    if (currentTask === undefined) {
      return undefined;
    }
    currentTask = rerunStage(currentTask, input);
    return persistCurrentTask(repository);
  });

  ipcMain.handle("doon:pause-task", () => {
    if (currentTask === undefined) {
      return undefined;
    }
    currentTask = pauseTask(currentTask);
    return persistCurrentTask(repository);
  });

  ipcMain.handle("doon:resume-task", () => {
    if (currentTask === undefined) {
      return undefined;
    }
    currentTask = resumeTask(currentTask);
    return persistCurrentTask(repository);
  });

  ipcMain.handle("doon:cancel-task", () => {
    if (currentTask === undefined) {
      return undefined;
    }
    currentTask = cancelTask(currentTask);
    return persistCurrentTask(repository);
  });
};

app.whenReady().then(() => {
  const repository = new TaskRepository(path.join(app.getPath("userData"), "doon.sqlite"));
  currentTask = repository.loadLatestTask();
  registerIpcHandlers(repository);
  createWindow();
  globalShortcut.register("CommandOrControl+Shift+Space", focusMainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
