import { describe, expect, it } from "vitest";
import {
  approveStage,
  createPlannedTask,
  markStageReadyForReview,
  pauseTask,
  rerunStage,
  resumeTask,
  reviseStage,
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

  it("keeps a revised stage ready for another approval", () => {
    const task = createPlannedTask(
      {
        command: "문서를 만들어줘",
        contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
      },
      "task-1",
    );
    const reviewed = markStageReadyForReview(task, "requirements_collected");

    const revised = reviseStage(reviewed, {
      stageId: "requirements_collected",
      instruction: "누락 항목을 더 구체적으로 적어줘",
    });

    expect(revised.status).toBe("awaiting_review");
    expect(revised.currentStageId).toBe("requirements_collected");
    expect(revised.stages[0]?.state).toBe("awaiting_review");
    expect(revised.stages[0]?.result).toContain("수정 요청");
  });

  it("reruns the same stage without advancing to the next stage", () => {
    const task = createPlannedTask(
      {
        command: "문서를 만들어줘",
        contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
      },
      "task-1",
    );
    const reviewed = markStageReadyForReview(task, "requirements_collected");

    const rerunning = rerunStage(reviewed, { stageId: "requirements_collected" });

    expect(rerunning.status).toBe("executing");
    expect(rerunning.currentStageId).toBe("requirements_collected");
    expect(rerunning.stages[0]?.state).toBe("active");
    expect(rerunning.stages[0]?.result).toBe("");
    expect(rerunning.stages[1]?.state).toBe("pending");
  });
});
