import type { z } from "zod";
import { type TaskSnapshot, taskSnapshotSchema } from "./task-model";

type ParsedTaskSnapshot = z.infer<typeof taskSnapshotSchema>;

const normalizeTaskSnapshot = (task: ParsedTaskSnapshot): TaskSnapshot => {
  const snapshot = {
    id: task.id,
    command: task.command,
    contextLine: task.contextLine,
    status: task.status,
    currentStageId: task.currentStageId,
    stages: task.stages,
  };

  if (task.pausedFrom === undefined) {
    return snapshot;
  }

  return {
    ...snapshot,
    pausedFrom: task.pausedFrom,
  };
};

export const parseTaskSnapshot = (value: unknown): TaskSnapshot =>
  normalizeTaskSnapshot(taskSnapshotSchema.parse(value));

export const parseOptionalTaskSnapshot = (value: unknown): TaskSnapshot | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return parseTaskSnapshot(value);
};
