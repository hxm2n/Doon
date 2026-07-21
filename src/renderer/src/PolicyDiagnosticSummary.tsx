import type { ExecutionPolicyDiagnosticSnapshot } from "../../shared/execution-policy-diagnostic-model";

const policyDiagnosticStatusLabels: Record<ExecutionPolicyDiagnosticSnapshot["status"], string> = {
  allowed: "정책 허용",
  blocked: "정책 차단",
};

type PolicyDiagnosticSummaryProps = {
  readonly policyDiagnostic: ExecutionPolicyDiagnosticSnapshot;
};

export const PolicyDiagnosticSummary = ({ policyDiagnostic }: PolicyDiagnosticSummaryProps) => (
  <article className="policy-diagnostic-summary">
    <div className="policy-diagnostic-summary-header">
      <strong>{policyDiagnosticStatusLabels[policyDiagnostic.status]}</strong>
      <span>
        {policyDiagnostic.probedAction.type} · {policyDiagnostic.context.stageId}
      </span>
    </div>
    <p>
      {policyDiagnostic.decision.status === "allowed"
        ? "현재 Chrome 세션에서 승인된 probe 액션을 실행할 수 있습니다."
        : `차단 사유: ${policyDiagnostic.decision.reason}`}
    </p>
  </article>
);
