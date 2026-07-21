import { z } from "zod";

export const taskStatuses = [
  "ready",
  "interpreting",
  "needs_clarification",
  "planned",
  "executing",
  "awaiting_review",
  "revising",
  "paused_by_user",
  "blocked",
  "failed",
  "completed",
  "cancelled",
] as const;

export const stageDefinitions = [
  {
    id: "requirements_collected",
    title: "요구사항 정리",
    outcome: "Discord 요구사항 수집 및 구조화 결과",
    context: "Discord 데스크톱",
  },
  {
    id: "content_drafted",
    title: "문서 초안",
    outcome: "문서 구조와 본문 초안",
    context: "Doon 결과 검토 화면",
  },
  {
    id: "document_formatted",
    title: "한컴독스 작성",
    outcome: "한컴독스에 작성하고 형식을 적용한 문서 미리보기",
    context: "Doon이 만든 Chrome 창의 한컴독스",
  },
  {
    id: "file_saved",
    title: "파일 저장 검증",
    outcome: "승인된 로컬 폴더에 저장하고 검증한 .hwp 파일",
    context: "Chrome 다운로드와 Swift 파일 capability",
  },
] as const;

export const stageStates = ["pending", "active", "awaiting_review", "approved"] as const;
export const stageIds = [
  "requirements_collected",
  "content_drafted",
  "document_formatted",
  "file_saved",
] as const;

export const taskStatusSchema = z.enum(taskStatuses);
export const stageIdSchema = z.enum(stageIds);
export const stageStateSchema = z.enum(stageStates);

export const createTaskInputSchema = z.object({
  command: z.string().trim().min(1),
  contextLine: z.string().trim().min(1),
});

export const revisionInputSchema = z.object({
  stageId: stageIdSchema,
  instruction: z.string().trim().min(1),
});

export const stageActionInputSchema = z.object({
  stageId: stageIdSchema,
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type StageId = z.infer<typeof stageIdSchema>;
export type StageState = z.infer<typeof stageStateSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type RevisionInput = z.infer<typeof revisionInputSchema>;
export type StageActionInput = z.infer<typeof stageActionInputSchema>;

export type StageSnapshot = {
  readonly id: StageId;
  readonly title: string;
  readonly outcome: string;
  readonly context: string;
  readonly state: StageState;
  readonly result: string;
};

export const stageSnapshotSchema = z.object({
  id: stageIdSchema,
  title: z.string(),
  outcome: z.string(),
  context: z.string(),
  state: stageStateSchema,
  result: z.string(),
});

export type TaskSnapshot = {
  readonly id: string;
  readonly command: string;
  readonly contextLine: string;
  readonly status: TaskStatus;
  readonly currentStageId: StageId;
  readonly pausedFrom?: TaskStatus;
  readonly stages: readonly StageSnapshot[];
};

export const taskSnapshotSchema = z.object({
  id: z.string(),
  command: z.string(),
  contextLine: z.string(),
  status: taskStatusSchema,
  currentStageId: stageIdSchema,
  pausedFrom: taskStatusSchema.optional(),
  stages: z.array(stageSnapshotSchema),
});

const firstStage = stageDefinitions[0];

export const createPlannedTask = (input: CreateTaskInput, id: string): TaskSnapshot => ({
  id,
  command: input.command,
  contextLine: input.contextLine,
  status: "planned",
  currentStageId: firstStage.id,
  stages: stageDefinitions.map((stage, index) => ({
    ...stage,
    state: index === 0 ? "active" : "pending",
    result:
      index === 0
        ? "요구사항을 읽기 전입니다. 실행을 시작하면 Discord 테스트 채널을 확인합니다."
        : "",
  })),
});

export const markStageReadyForReview = (task: TaskSnapshot, stageId: StageId): TaskSnapshot => ({
  ...task,
  status: "awaiting_review",
  currentStageId: stageId,
  stages: task.stages.map((stage) =>
    stage.id === stageId
      ? {
          ...stage,
          state: "awaiting_review",
          result: getDemoResult(stageId),
        }
      : stage,
  ),
});

export const approveStage = (task: TaskSnapshot, stageId: StageId): TaskSnapshot => {
  const currentIndex = task.stages.findIndex((stage) => stage.id === stageId);
  if (currentIndex < 0) {
    return task;
  }

  const nextStage = task.stages[currentIndex + 1];
  return {
    ...task,
    status: nextStage === undefined ? "completed" : "executing",
    currentStageId: nextStage?.id ?? stageId,
    stages: task.stages.map((stage, index) => {
      if (stage.id === stageId) {
        return { ...stage, state: "approved" };
      }
      if (index === currentIndex + 1) {
        return { ...stage, state: "active" };
      }
      return stage;
    }),
  };
};

export const pauseTask = (task: TaskSnapshot): TaskSnapshot => {
  if (task.status === "completed" || task.status === "cancelled") {
    return task;
  }
  return { ...task, status: "paused_by_user", pausedFrom: task.status };
};

export const resumeTask = (task: TaskSnapshot): TaskSnapshot => {
  if (task.status !== "paused_by_user") {
    return task;
  }
  return {
    id: task.id,
    command: task.command,
    contextLine: task.contextLine,
    status: task.pausedFrom ?? "planned",
    currentStageId: task.currentStageId,
    stages: task.stages,
  };
};

export const cancelTask = (task: TaskSnapshot): TaskSnapshot => ({
  ...task,
  status: "cancelled",
});

export const reviseStage = (task: TaskSnapshot, input: RevisionInput): TaskSnapshot => ({
  ...task,
  status: "revising",
  currentStageId: input.stageId,
  stages: task.stages.map((stage) =>
    stage.id === input.stageId
      ? {
          ...stage,
          state: "awaiting_review",
          result: `${stage.result}\n수정 요청: ${input.instruction}`,
        }
      : stage,
  ),
});

const getDemoResult = (stageId: StageId): string => {
  switch (stageId) {
    case "requirements_collected":
      return "학생회 행사 계획서 요구사항 7개를 구조화했습니다. 누락된 항목은 예산 승인자와 제출 마감입니다.";
    case "content_drafted":
      return "목적, 일정, 역할, 예산, 안전 계획, 홍보 계획, 제출 체크리스트로 문서 초안을 구성했습니다.";
    case "document_formatted":
      return "한컴독스 문서에 제목, 섹션, 표 형식을 적용했고 저장 전 미리보기를 확인했습니다.";
    case "file_saved":
      return "2026 여름축제 행사계획서.hwp 파일을 학생회 문서 폴더에 저장하고 형식과 크기를 확인했습니다.";
    default:
      return assertNever(stageId);
  }
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled stage: ${value}`);
};
