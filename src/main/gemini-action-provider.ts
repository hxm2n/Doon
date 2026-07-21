import { GoogleGenAI, type Schema, Type } from "@google/genai";
import {
  type ActionProposal,
  actionProposalSchema,
  createMissingGeminiApiKeyProposal,
  type ProposeActionInput,
} from "../shared/action-proposal-model";

const modelName = "gemini-3.5-flash";
const geminiApiKeyEnvName = "GEMINI_API_KEY";

const actionProposalResponseSchema: Schema = {
  type: Type.OBJECT,
  required: ["status", "checkedAt", "model", "reason", "action"],
  properties: {
    status: {
      type: Type.STRING,
      format: "enum",
      enum: ["proposed"],
    },
    checkedAt: {
      type: Type.STRING,
    },
    model: {
      type: Type.STRING,
    },
    reason: {
      type: Type.STRING,
    },
    action: {
      type: Type.OBJECT,
      required: ["type"],
      properties: {
        type: {
          type: Type.STRING,
          format: "enum",
          enum: ["focus_app", "read_accessibility_tree", "capture_window", "ask_user", "stop"],
        },
        targetId: {
          type: Type.STRING,
          format: "enum",
          enum: ["discord", "chrome"],
          nullable: true,
        },
        userPrompt: {
          type: Type.STRING,
          nullable: true,
        },
      },
    },
  },
};

const summarizeInput = (input: ProposeActionInput): string =>
  JSON.stringify({
    command: input.command,
    stageId: input.stageId,
    accessibility: input.accessibilitySnapshot
      ? {
          target: input.accessibilitySnapshot.target.id,
          status: input.accessibilitySnapshot.status,
          accessTrusted: input.accessibilitySnapshot.accessTrusted,
          nodeCount: input.accessibilitySnapshot.nodeCount,
          textNodeCount: input.accessibilitySnapshot.textNodeCount,
          sampleNodes: input.accessibilitySnapshot.nodes.slice(0, 8),
        }
      : undefined,
    capture: input.captureSnapshot
      ? {
          target: input.captureSnapshot.target.id,
          status: input.captureSnapshot.status,
          screenCaptureTrusted: input.captureSnapshot.screenCaptureTrusted,
          imageWidth: input.captureSnapshot.imageWidth,
          imageHeight: input.captureSnapshot.imageHeight,
          byteCount: input.captureSnapshot.byteCount,
        }
      : undefined,
  });

export const buildGeminiActionPrompt = (input: ProposeActionInput, checkedAt: string): string => `
You are Doon's local desktop action planner.
Return exactly one JSON object matching the response schema.
Only propose one of the allowed actions.
Never propose typing, clicking, deleting, sending messages, payments, sharing, uploading, or deployment.
Prefer read_accessibility_tree before capture_window when accessibility status is missing.
Prefer capture_window when accessibility is unavailable or has no readable text.
Use ask_user when the next safe action is ambiguous.
Use stop when the request is outside the approved MVP boundary.

checkedAt: ${checkedAt}
model: ${modelName}
context: ${summarizeInput(input)}
`;

export const parseGeminiActionProposal = (rawText: string): ActionProposal =>
  actionProposalSchema.parse(JSON.parse(rawText));

export const proposeGeminiAction = async (
  input: ProposeActionInput,
  apiKey = process.env[geminiApiKeyEnvName],
): Promise<ActionProposal> => {
  const checkedAt = new Date().toISOString();
  if (apiKey === undefined || apiKey.trim().length === 0) {
    return createMissingGeminiApiKeyProposal(checkedAt);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: buildGeminiActionPrompt(input, checkedAt),
      config: {
        responseMimeType: "application/json",
        responseSchema: actionProposalResponseSchema,
      },
    });
    return parseGeminiActionProposal(response.text ?? "");
  } catch (error) {
    return {
      status: "provider_error",
      checkedAt,
      model: modelName,
      reason: "Gemini 행동 제안 호출 또는 응답 검증에 실패했습니다.",
      errorMessage: error instanceof Error ? error.message : "Unknown Gemini provider error.",
    };
  }
};
