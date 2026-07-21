import type { ChromeSessionSnapshot } from "../../shared/chrome-session-model";

const chromeSessionStatusLabels: Record<ChromeSessionSnapshot["status"], string> = {
  chrome_not_running: "Chrome 대기",
  window_not_found: "세션 창 없음",
  window_found: "세션 창 확인",
  launch_requested: "실행 요청됨",
  helper_unavailable: "확인 불가",
};

type ChromeSessionSummaryProps = {
  readonly chromeSessionSnapshot: ChromeSessionSnapshot;
};

export const ChromeSessionSummary = ({ chromeSessionSnapshot }: ChromeSessionSummaryProps) => (
  <article className="chrome-session-summary">
    <div className="chrome-session-summary-header">
      <strong>{chromeSessionStatusLabels[chromeSessionSnapshot.status]}</strong>
      <span>{chromeSessionSnapshot.sessionId}</span>
    </div>
    <p>{chromeSessionSnapshot.windowTitle || chromeSessionSnapshot.markerTitle}</p>
  </article>
);
