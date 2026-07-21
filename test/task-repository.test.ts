import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { TaskRepository } from "../src/main/task-repository";
import { createPlannedTask, markStageReadyForReview, pauseTask } from "../src/shared/task-model";

const tempDirectories: string[] = [];

const createTempDatabasePath = (): string => {
  const directory = mkdtempSync(join(tmpdir(), "doon-repository-"));
  tempDirectories.push(directory);
  return join(directory, "doon.sqlite");
};

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("task repository", () => {
  it("loads the saved task when the repository is reopened", () => {
    const databasePath = createTempDatabasePath();
    const task = createPlannedTask(
      {
        command: "문서를 만들어줘",
        contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
      },
      "task-1",
    );

    const repository = new TaskRepository(databasePath);
    repository.saveTask(task);
    repository.close();

    const reopenedRepository = new TaskRepository(databasePath);
    const restoredTask = reopenedRepository.loadLatestTask();
    reopenedRepository.close();

    expect(restoredTask).toEqual(task);
  });

  it("loads the latest stage state after a task is updated", () => {
    const databasePath = createTempDatabasePath();
    const task = createPlannedTask(
      {
        command: "문서를 만들어줘",
        contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
      },
      "task-1",
    );
    const reviewedTask = markStageReadyForReview(task, "requirements_collected");
    const pausedTask = pauseTask(reviewedTask);

    const repository = new TaskRepository(databasePath);
    repository.saveTask(task);
    repository.saveTask(pausedTask);
    const restoredTask = repository.loadLatestTask();
    repository.close();

    expect(restoredTask?.status).toBe("paused_by_user");
    expect(restoredTask?.pausedFrom).toBe("awaiting_review");
    expect(restoredTask?.stages[0]?.state).toBe("awaiting_review");
  });
});
