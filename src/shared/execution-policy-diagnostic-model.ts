import { z } from "zod";
import {
  executionActionSchema,
  executionContextSchema,
  executionObservationSchema,
  policyDecisionSchema,
} from "./execution-policy-model";

export const executionPolicyDiagnosticStatuses = ["allowed", "blocked"] as const;

export const executionPolicyDiagnosticStatusSchema = z.enum(executionPolicyDiagnosticStatuses);

export const executionPolicyDiagnosticSnapshotSchema = z.object({
  status: executionPolicyDiagnosticStatusSchema,
  checkedAt: z.string(),
  context: executionContextSchema,
  observation: executionObservationSchema,
  probedAction: executionActionSchema,
  decision: policyDecisionSchema,
});

export type ExecutionPolicyDiagnosticSnapshot = z.infer<
  typeof executionPolicyDiagnosticSnapshotSchema
>;
