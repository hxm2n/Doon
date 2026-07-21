import { contextBridge, ipcRenderer } from "electron";
import { z } from "zod";
import type {
  CreateTaskInput,
  RevisionInput,
  StageActionInput,
  TaskSnapshot,
} from "../shared/task-model";
import { parseOptionalTaskSnapshot } from "../shared/task-snapshot-parser";

export type DoonAppInfo = {
  readonly name: string;
  readonly version: string;
};

export type DoonApi = {
  readonly getAppInfo: () => Promise<DoonAppInfo>;
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
