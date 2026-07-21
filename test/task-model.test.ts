import { describe, expect, it } from "vitest";
import {
  approveStage,
  createPlannedTask,
  markStageReadyForReview,
  pauseTask,
  resumeTask,
  stageDefinitions,
} from "../src/shared/task-model";

describe("task model", () => {
  it("creates the four canonical stages when a task is planned", () => {
    const task = createPlannedTask(
      {
        command: "문서를 만들어줘",
        contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
      },
      "task-1",
    );

    expect(task.status).toBe("planned");
    expect(task.stages.map((stage) => stage.id)).toEqual(stageDefinitions.map((stage) => stage.id));
    expect(task.stages[0]?.state).toBe("active");
  });

  it("moves a stage through review and approval before starting the next stage", () => {
    const task = createPlannedTask(
      {
        command: "문서를 만들어줘",
        contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
      },
      "task-1",
    );

    const reviewed = markStageReadyForReview(task, "requirements_collected");
    const approved = approveStage(reviewed, "requirements_collected");

    expect(reviewed.status).toBe("awaiting_review");
    expect(reviewed.stages[0]?.state).toBe("awaiting_review");
    expect(approved.status).toBe("executing");
    expect(approved.currentStageId).toBe("content_drafted");
    expect(approved.stages[0]?.state).toBe("approved");
    expect(approved.stages[1]?.state).toBe("active");
  });

  it("preserves the previous state when pausing and resuming", () => {
    const task = createPlannedTask(
      {
        command: "문서를 만들어줘",
        contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
      },
      "task-1",
    );

    const paused = pauseTask(task);
    const resumed = resumeTask(paused);

    expect(paused.status).toBe("paused_by_user");
    expect(paused.pausedFrom).toBe("planned");
    expect(resumed.status).toBe("planned");
  });
});
