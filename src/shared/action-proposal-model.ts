import { z } from "zod";
import { accessibilityTreeSnapshotSchema } from "./accessibility-tree-model";
import { stageIdSchema } from "./task-model";
import { windowCaptureSnapshotSchema } from "./window-capture-model";
import { targetAppIdSchema } from "./window-discovery-model";

export const doonActionTypes = [
  "focus_app",
  "read_accessibility_tree",
  "capture_window",
  "ask_user",
  "stop",
] as const;

export const actionProposalStatuses = [
  "proposed",
  "configuration_missing",
  "provider_error",
] as const;

export const doonActionTypeSchema = z.enum(doonActionTypes);
export const actionProposalStatusSchema = z.enum(actionProposalStatuses);

export const proposeActionInputSchema = z.object({
  command: z.string().trim().min(1),
  stageId: stageIdSchema,
  accessibilitySnapshot: accessibilityTreeSnapshotSchema.optional(),
  captureSnapshot: windowCaptureSnapshotSchema.optional(),
});

export const proposedActionSchema = z.object({
  type: doonActionTypeSchema,
  targetId: targetAppIdSchema.optional(),
  userPrompt: z.string().trim().optional(),
});

export const actionProposalSchema = z.object({
  status: actionProposalStatusSchema,
  checkedAt: z.string(),
  model: z.string(),
  reason: z.string(),
  action: proposedActionSchema.optional(),
  errorMessage: z.string().optional(),
});

export type DoonActionType = z.infer<typeof doonActionTypeSchema>;
export type ProposeActionInput = z.infer<typeof proposeActionInputSchema>;
export type ProposedAction = z.infer<typeof proposedActionSchema>;
export type ActionProposal = z.infer<typeof actionProposalSchema>;

export const createMissingGeminiApiKeyProposal = (checkedAt: string): ActionProposal => ({
  status: "configuration_missing",
  checkedAt,
  model: "gemini-3.5-flash",
  reason: "Gemini API 키가 없어 AI 행동 제안을 실행하지 않았습니다.",
  errorMessage: "GEMINI_API_KEY 환경 변수를 설정해야 합니다.",
});

export const canExecuteProposedAction = (proposal: ActionProposal): boolean =>
  proposal.status === "proposed" && proposal.action !== undefined;
