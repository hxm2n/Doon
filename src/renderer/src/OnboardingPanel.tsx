import { Check, ExternalLink, RefreshCcw, Shield } from "lucide-react";
import {
  areRequiredSystemPermissionsGranted,
  type SystemPermissionId,
  type SystemPermissionSnapshot,
  type SystemPermissionState,
} from "../../shared/permission-model";

type OnboardingPanelProps = {
  readonly onConfirm: () => Promise<void>;
  readonly permissionSnapshot: SystemPermissionSnapshot | undefined;
  readonly onOpenPermissionSettings: (permissionId: SystemPermissionId) => Promise<void>;
  readonly onRefreshPermissions: () => Promise<void>;
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

const permissionStateLabels: Record<SystemPermissionState, string> = {
  granted: "허용됨",
  denied: "거부됨",
  restricted: "제한됨",
  not_determined: "확인 필요",
  not_supported: "지원 안 됨",
  unknown: "설정 확인 필요",
};

export const OnboardingPanel = ({
  onConfirm,
  permissionSnapshot,
  onOpenPermissionSettings,
  onRefreshPermissions,
}: OnboardingPanelProps) => {
  const permissionReady =
    permissionSnapshot !== undefined && areRequiredSystemPermissionsGranted(permissionSnapshot);

  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel glass-panel" aria-label="Doon onboarding">
        <div className="onboarding-hero">
          <p className="eyebrow">Doon setup</p>
          <h1>시작 전에 작업 범위와 권한을 확인합니다</h1>
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

        <section className="permission-panel" aria-label="macOS required permissions">
          <div className="permission-header">
            <div>
              <p className="caption">필수 권한</p>
              <strong>{permissionReady ? "실행 준비 완료" : "설정 확인 필요"}</strong>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={onRefreshPermissions}
              aria-label="권한 상태 새로고침"
              title="권한 상태 새로고침"
            >
              <RefreshCcw size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="permission-list">
            {permissionSnapshot?.permissions.map((permission) => (
              <div className="permission-row" data-state={permission.state} key={permission.id}>
                <div>
                  <strong>{permission.title}</strong>
                  <p>{permission.description}</p>
                </div>
                <div className="permission-action">
                  <span>{permissionStateLabels[permission.state]}</span>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onOpenPermissionSettings(permission.id)}
                  >
                    {permission.actionLabel}
                    <ExternalLink size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )) ?? (
              <div className="permission-row" data-state="unknown">
                <div>
                  <strong>권한 상태를 읽는 중</strong>
                  <p>macOS 권한 정보를 확인하고 있습니다.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <button type="button" className="primary-button onboarding-action" onClick={onConfirm}>
          <Check size={16} aria-hidden="true" />
          범위 확인하고 시작
        </button>
      </section>
    </main>
  );
};
