import {
  type ExecutionAction,
  type ExecutionContext,
  type ExecutionObservation,
  evaluateActionPolicy,
  type PolicyDecision,
} from "../shared/execution-policy-model";

export type ActionDispatchResult =
  | { readonly status: "executed"; readonly summary: string }
  | { readonly status: "failed"; readonly reason: string };

export type PolicyPreflightRunInput = {
  readonly context: ExecutionContext;
  readonly observation: ExecutionObservation;
  readonly action: ExecutionAction;
  readonly dispatch: (action: ExecutionAction) => Promise<ActionDispatchResult>;
};

export type PolicyPreflightRunResult =
  | {
      readonly status: "blocked";
      readonly decision: Extract<PolicyDecision, { readonly status: "blocked" }>;
    }
  | {
      readonly status: "executed";
      readonly decision: Extract<PolicyDecision, { readonly status: "allowed" }>;
      readonly dispatchResult: Extract<ActionDispatchResult, { readonly status: "executed" }>;
    }
  | {
      readonly status: "failed";
      readonly decision: Extract<PolicyDecision, { readonly status: "allowed" }>;
      readonly dispatchResult: Extract<ActionDispatchResult, { readonly status: "failed" }>;
    };

export const runPolicyPreflightAction = async (
  input: PolicyPreflightRunInput,
): Promise<PolicyPreflightRunResult> => {
  const decision = evaluateActionPolicy(input.context, input.observation, input.action);
  if (decision.status === "blocked") {
    return { status: "blocked", decision };
  }

  const dispatchResult = await input.dispatch(input.action);
  if (dispatchResult.status === "failed") {
    return { status: "failed", decision, dispatchResult };
  }

  return { status: "executed", decision, dispatchResult };
};
