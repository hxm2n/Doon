import path from "node:path";
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
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
