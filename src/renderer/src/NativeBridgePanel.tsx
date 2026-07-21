import { AppWindow, ListTree, RefreshCcw, ScanSearch } from "lucide-react";
import type { AccessibilityTreeSnapshot } from "../../shared/accessibility-tree-model";
import type { TargetAppId, WindowDiscoverySnapshot } from "../../shared/window-discovery-model";

const stateLabels: Record<WindowDiscoverySnapshot["targets"][number]["state"], string> = {
  focused: "전면",
  running: "실행 중",
  not_running: "대기",
  helper_unavailable: "확인 불가",
};

const accessibilityStatusLabels: Record<AccessibilityTreeSnapshot["status"], string> = {
  readable: "텍스트 확인 가능",
  empty: "노드 없음",
  permission_missing: "권한 필요",
  app_not_running: "앱 대기",
  helper_unavailable: "확인 불가",
};

type NativeBridgePanelProps = {
  readonly snapshot: WindowDiscoverySnapshot | undefined;
  readonly accessibilitySnapshot: AccessibilityTreeSnapshot | undefined;
  readonly onRefresh: () => Promise<void>;
  readonly onFocusTarget: (targetId: TargetAppId) => Promise<void>;
  readonly onReadAccessibilityTree: (targetId: TargetAppId) => Promise<void>;
};

export const NativeBridgePanel = ({
  snapshot,
  accessibilitySnapshot,
  onRefresh,
  onFocusTarget,
  onReadAccessibilityTree,
}: NativeBridgePanelProps) => (
  <section className="bridge-panel glass-panel" aria-label="Native helper window discovery">
    <div className="bridge-heading">
      <div>
        <p className="eyebrow">Native Spike</p>
        <h2 className="bridge-title">Discord와 Chrome 창 식별</h2>
      </div>
      <button
        type="button"
        className="icon-button"
        onClick={onRefresh}
        aria-label="창 상태 새로고침"
      >
        <RefreshCcw size={16} aria-hidden="true" />
      </button>
    </div>

    {snapshot?.errorMessage !== undefined ? (
      <p className="bridge-warning">{snapshot.errorMessage}</p>
    ) : null}

    <div className="target-grid">
      {(snapshot?.targets ?? []).map((target) => (
        <article className="target-card" key={target.id}>
          <div className="target-title">
            <AppWindow size={16} aria-hidden="true" />
            <strong>{target.title}</strong>
          </div>
          <dl>
            <div>
              <dt>상태</dt>
              <dd>{stateLabels[target.state]}</dd>
            </div>
            <div>
              <dt>창</dt>
              <dd>{target.windowCount}개</dd>
            </div>
          </dl>
          <button
            type="button"
            className="secondary-button target-action"
            onClick={() => onFocusTarget(target.id)}
            disabled={!snapshot?.helperAvailable}
          >
            <ScanSearch size={15} aria-hidden="true" />
            포커스
          </button>
          <button
            type="button"
            className="secondary-button target-action"
            onClick={() => onReadAccessibilityTree(target.id)}
            disabled={!snapshot?.helperAvailable}
          >
            <ListTree size={15} aria-hidden="true" />
            AX 읽기
          </button>
        </article>
      ))}
    </div>

    {accessibilitySnapshot !== undefined ? (
      <article className="accessibility-summary">
        <div className="accessibility-summary-header">
          <strong>{accessibilitySnapshot.target.title}</strong>
          <span>{accessibilityStatusLabels[accessibilitySnapshot.status]}</span>
        </div>
        <p>
          노드 {accessibilitySnapshot.nodeCount}개 · 텍스트 노드{" "}
          {accessibilitySnapshot.textNodeCount}개
        </p>
      </article>
    ) : null}
  </section>
);
