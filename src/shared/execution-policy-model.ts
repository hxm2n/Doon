import { z } from "zod";
import { stageIdSchema } from "./task-model";
import { targetAppIdSchema } from "./window-discovery-model";

export const executionActionTypes = [
  "click",
  "type_text",
  "press_key",
  "set_clipboard",
  "verify_hwp",
  "move_downloaded_hwp",
] as const;

export const policyBlockReasons = [
  "generation_mismatch",
  "action_target_mismatch",
  "frontmost_app_mismatch",
  "window_title_mismatch",
  "chrome_origin_mismatch",
  "clipboard_value_not_approved",
  "key_combo_not_allowed",
  "output_directory_handle_mismatch",
  "stage_not_allowed",
] as const;

export const allowedKeyCombosByStage = {
  requirements_collected: ["CommandOrControl+C", "ArrowDown", "ArrowUp"],
  content_drafted: ["CommandOrControl+C"],
  document_formatted: ["CommandOrControl+V", "CommandOrControl+S", "Tab", "Enter"],
  file_saved: ["CommandOrControl+S", "Enter"],
} as const;

export const policyBlockReasonSchema = z.enum(policyBlockReasons);

export const executionContextSchema = z.object({
  taskId: z.string().trim().min(1),
  generation: z.number().int().nonnegative(),
  stageId: stageIdSchema,
  targetAppId: targetAppIdSchema,
  requiredWindowTitleMarker: z.string().trim().min(1),
  chromeOrigin: z.string().url().optional(),
  outputDirectoryHandleId: z.string().trim().min(1).optional(),
  approvedClipboardValue: z.string().optional(),
});

export const executionObservationSchema = z.object({
  generation: z.number().int().nonnegative(),
  frontmostTargetAppId: targetAppIdSchema,
  activeWindowTitle: z.string(),
  chromeOrigin: z.string().url().optional(),
  outputDirectoryHandleId: z.string().trim().min(1).optional(),
});

const guiActionBaseSchema = z.object({
  targetAppId: targetAppIdSchema,
});

export const clickActionSchema = guiActionBaseSchema.extend({
  type: z.literal("click"),
  elementRole: z.string().trim().min(1),
  elementLabel: z.string().trim().min(1),
});

export const typeTextActionSchema = guiActionBaseSchema.extend({
  type: z.literal("type_text"),
  text: z.string().trim().min(1),
});

export const pressKeyActionSchema = guiActionBaseSchema.extend({
  type: z.literal("press_key"),
  keyCombo: z.string().trim().min(1),
});

export const setClipboardActionSchema = guiActionBaseSchema.extend({
  type: z.literal("set_clipboard"),
  value: z.string(),
});

const hwpFileActionBaseSchema = guiActionBaseSchema.extend({
  expectedFileName: z
    .string()
    .trim()
    .min(1)
    .regex(/\.hwp$/u),
  outputDirectoryHandleId: z.string().trim().min(1),
});

export const verifyHwpActionSchema = hwpFileActionBaseSchema.extend({
  type: z.literal("verify_hwp"),
});

export const moveDownloadedHwpActionSchema = hwpFileActionBaseSchema.extend({
  type: z.literal("move_downloaded_hwp"),
});

export const executionActionSchema = z.discriminatedUnion("type", [
  clickActionSchema,
  typeTextActionSchema,
  pressKeyActionSchema,
  setClipboardActionSchema,
  verifyHwpActionSchema,
  moveDownloadedHwpActionSchema,
]);

export const policyDecisionSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("allowed") }),
  z.object({ status: z.literal("blocked"), reason: policyBlockReasonSchema }),
]);

export type ExecutionContext = z.infer<typeof executionContextSchema>;
export type ExecutionObservation = z.infer<typeof executionObservationSchema>;
export type ExecutionAction = z.infer<typeof executionActionSchema>;
export type PolicyBlockReason = z.infer<typeof policyBlockReasonSchema>;
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;

export const evaluateActionPolicy = (
  context: ExecutionContext,
  observation: ExecutionObservation,
  action: ExecutionAction,
): PolicyDecision => {
  const baseDecision = evaluateBasePolicy(context, observation, action);
  if (baseDecision.status === "blocked") {
    return baseDecision;
  }

  switch (action.type) {
    case "click":
    case "type_text":
      return { status: "allowed" };
    case "press_key":
      return isKeyComboAllowed(context.stageId, action.keyCombo)
        ? { status: "allowed" }
        : { status: "blocked", reason: "key_combo_not_allowed" };
    case "set_clipboard":
      return action.value === context.approvedClipboardValue
        ? { status: "allowed" }
        : { status: "blocked", reason: "clipboard_value_not_approved" };
    case "verify_hwp":
    case "move_downloaded_hwp":
      return evaluateHwpFilePolicy(context, observation, action);
    default:
      return assertNever(action);
  }
};

const evaluateBasePolicy = (
  context: ExecutionContext,
  observation: ExecutionObservation,
  action: ExecutionAction,
): PolicyDecision => {
  if (context.generation !== observation.generation) {
    return { status: "blocked", reason: "generation_mismatch" };
  }
  if (action.targetAppId !== context.targetAppId) {
    return { status: "blocked", reason: "action_target_mismatch" };
  }
  if (observation.frontmostTargetAppId !== context.targetAppId) {
    return { status: "blocked", reason: "frontmost_app_mismatch" };
  }
  if (!observation.activeWindowTitle.includes(context.requiredWindowTitleMarker)) {
    return { status: "blocked", reason: "window_title_mismatch" };
  }
  if (context.chromeOrigin !== undefined && observation.chromeOrigin !== context.chromeOrigin) {
    return { status: "blocked", reason: "chrome_origin_mismatch" };
  }
  return { status: "allowed" };
};

const isKeyComboAllowed = (stageId: ExecutionContext["stageId"], keyCombo: string): boolean =>
  allowedKeyCombosByStage[stageId].some((allowedKeyCombo) => allowedKeyCombo === keyCombo);

const evaluateHwpFilePolicy = (
  context: ExecutionContext,
  observation: ExecutionObservation,
  action: Extract<ExecutionAction, { readonly type: "verify_hwp" | "move_downloaded_hwp" }>,
): PolicyDecision => {
  if (context.stageId !== "file_saved") {
    return { status: "blocked", reason: "stage_not_allowed" };
  }
  if (
    context.outputDirectoryHandleId !== action.outputDirectoryHandleId ||
    observation.outputDirectoryHandleId !== action.outputDirectoryHandleId
  ) {
    return { status: "blocked", reason: "output_directory_handle_mismatch" };
  }
  return { status: "allowed" };
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled execution action: ${JSON.stringify(value)}`);
};
