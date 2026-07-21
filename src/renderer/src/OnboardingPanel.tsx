import { Check, Shield } from "lucide-react";

type OnboardingPanelProps = {
  readonly onConfirm: () => Promise<void>;
};

const scopeItems = [
  {
    title: "허용 앱",
    description: "Discord 데스크톱과 Doon이 새로 여는 Chrome 창만 MVP 대상으로 둡니다.",
  },
  {
    title: "작업 방식",
    description: "각 단계 결과를 먼저 보여주고, 승인 전에는 다음 단계로 넘어가지 않습니다.",
  },
  {
    title: "저장 경계",
    description: "한컴독스에서 내려받은 단일 .hwp 파일만 사용자가 승인한 폴더에 저장합니다.",
  },
] as const;

export const OnboardingPanel = ({ onConfirm }: OnboardingPanelProps) => (
  <main className="onboarding-shell">
    <section className="onboarding-panel glass-panel" aria-label="Doon onboarding">
      <div className="onboarding-hero">
        <p className="eyebrow">Doon setup</p>
        <h1>시작 전에 작업 범위를 확인합니다</h1>
        <p>
          Doon은 허용된 앱과 단계 안에서만 움직이고, 사용자가 결과를 승인해야 다음 작업을
          진행합니다.
        </p>
      </div>

      <div className="scope-list">
        {scopeItems.map((item) => (
          <div className="scope-row" key={item.title}>
            <span className="scope-icon">
              <Shield size={15} aria-hidden="true" />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="primary-button onboarding-action" onClick={onConfirm}>
        <Check size={16} aria-hidden="true" />
        범위 확인하고 시작
      </button>
    </section>
  </main>
);
