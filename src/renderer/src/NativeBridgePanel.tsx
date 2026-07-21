import { AppWindow, Camera, Globe, ListTree, RefreshCcw, ScanSearch } from "lucide-react";
import type { AccessibilityTreeSnapshot } from "../../shared/accessibility-tree-model";
import type { ActionProposal } from "../../shared/action-proposal-model";
import type { ChromeSessionSnapshot } from "../../shared/chrome-session-model";
import type { WindowCaptureSnapshot } from "../../shared/window-capture-model";
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

const captureStatusLabels: Record<WindowCaptureSnapshot["status"], string> = {
  captured: "캡처됨",
  permission_missing: "권한 필요",
  app_not_running: "앱 대기",
  window_not_found: "창 없음",
  capture_failed: "캡처 실패",
  unsupported_macos: "macOS 미지원",
  helper_unavailable: "확인 불가",
};

const proposalStatusLabels: Record<ActionProposal["status"], string> = {
  proposed: "제안됨",
  configuration_missing: "설정 필요",
  provider_error: "호출 실패",
};

const chromeSessionStatusLabels: Record<ChromeSessionSnapshot["status"], string> = {
  chrome_not_running: "Chrome 대기",
  window_not_found: "세션 창 없음",
  window_found: "세션 창 확인",
  launch_requested: "실행 요청됨",
  helper_unavailable: "확인 불가",
};

type NativeBridgePanelProps = {
  readonly snapshot: WindowDiscoverySnapshot | undefined;
  readonly accessibilitySnapshot: AccessibilityTreeSnapshot | undefined;
  readonly captureSnapshot: WindowCaptureSnapshot | undefined;
  readonly actionProposal: ActionProposal | undefined;
  readonly chromeSessionSnapshot: ChromeSessionSnapshot | undefined;
  readonly onRefresh: () => Promise<void>;
  readonly onFocusTarget: (targetId: TargetAppId) => Promise<void>;
  readonly onReadAccessibilityTree: (targetId: TargetAppId) => Promise<void>;
  readonly onCaptureWindow: (targetId: TargetAppId) => Promise<void>;
  readonly onReadChromeSession: () => Promise<void>;
  readonly onLaunchChromeSession: () => Promise<void>;
  readonly onProposeAction: () => Promise<void>;
};

export const NativeBridgePanel = ({
  snapshot,
  accessibilitySnapshot,
  captureSnapshot,
  actionProposal,
  chromeSessionSnapshot,
  onRefresh,
  onFocusTarget,
  onReadAccessibilityTree,
  onCaptureWindow,
  onReadChromeSession,
  onLaunchChromeSession,
  onProposeAction,
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
    <button type="button" className="secondary-button target-action" onClick={onProposeAction}>
      <ScanSearch size={15} aria-hidden="true" />
      AI 행동 제안
    </button>
    <div className="bridge-action-grid">
      <button
        type="button"
        className="secondary-button target-action"
        onClick={onReadChromeSession}
      >
        <Globe size={15} aria-hidden="true" />
        Chrome 세션 확인
      </button>
      <button
        type="button"
        className="secondary-button target-action"
        onClick={onLaunchChromeSession}
      >
        <Globe size={15} aria-hidden="true" />
        테스트 창 열기
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
          <button
            type="button"
            className="secondary-button target-action"
            onClick={() => onCaptureWindow(target.id)}
            disabled={!snapshot?.helperAvailable}
          >
            <Camera size={15} aria-hidden="true" />창 캡처
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

    {captureSnapshot !== undefined ? (
      <article className="window-capture-summary">
        <div className="window-capture-summary-header">
          <strong>{captureSnapshot.target.title}</strong>
          <span>{captureStatusLabels[captureSnapshot.status]}</span>
        </div>
        <p>
          {captureSnapshot.imageWidth} x {captureSnapshot.imageHeight} ·{" "}
          {captureSnapshot.byteCount.toLocaleString()} bytes
        </p>
      </article>
    ) : null}

    {actionProposal !== undefined ? (
      <article className="action-proposal-summary">
        <div className="action-proposal-summary-header">
          <strong>{proposalStatusLabels[actionProposal.status]}</strong>
          <span>{actionProposal.action?.type ?? "no_action"}</span>
        </div>
        <p>{actionProposal.reason}</p>
      </article>
    ) : null}

    {chromeSessionSnapshot !== undefined ? (
      <article className="chrome-session-summary">
        <div className="chrome-session-summary-header">
          <strong>{chromeSessionStatusLabels[chromeSessionSnapshot.status]}</strong>
          <span>{chromeSessionSnapshot.sessionId}</span>
        </div>
        <p>{chromeSessionSnapshot.windowTitle || chromeSessionSnapshot.markerTitle}</p>
      </article>
    ) : null}
  </section>
);
