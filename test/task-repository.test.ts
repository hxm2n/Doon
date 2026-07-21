import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { TaskRepository } from "../src/main/task-repository";
import { defaultOnboardingStatus } from "../src/shared/onboarding-model";
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

  it("loads the saved onboarding confirmation when the repository is reopened", () => {
    const databasePath = createTempDatabasePath();
    const confirmedStatus = {
      scopeConfirmed: true,
      confirmedAt: "2026-07-21T00:00:00.000Z",
    };

    const repository = new TaskRepository(databasePath);
    repository.saveOnboardingStatus(confirmedStatus);
    repository.close();

    const reopenedRepository = new TaskRepository(databasePath);
    const restoredStatus = reopenedRepository.loadOnboardingStatus();
    reopenedRepository.close();

    expect(restoredStatus).toEqual(confirmedStatus);
  });

  it("returns the default onboarding status before confirmation", () => {
    const repository = new TaskRepository(createTempDatabasePath());
    const restoredStatus = repository.loadOnboardingStatus();
    repository.close();

    expect(restoredStatus).toEqual(defaultOnboardingStatus);
  });

  it("runs a SQLite persistence diagnostic without storing user content", () => {
    const repository = new TaskRepository(createTempDatabasePath());
    const diagnostic = repository.runPersistenceDiagnostic();
    repository.close();

    expect(diagnostic.status).toBe("ready");
    expect(diagnostic.journalMode).toBe("wal");
    expect(diagnostic.secureDelete).toBe(true);
    expect(diagnostic.smokeKey).toBe("sqlite_smoke");
    expect(diagnostic.taskCount).toBe(0);
    expect(diagnostic.settingCount).toBe(0);
  });
});
