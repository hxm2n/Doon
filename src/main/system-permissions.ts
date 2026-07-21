import { Notification, shell, systemPreferences } from "electron";
import type {
  SystemPermissionId,
  SystemPermissionSnapshot,
  SystemPermissionState,
} from "../shared/permission-model";

const permissionSettingsUrls: Record<SystemPermissionId, string> = {
  accessibility: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
  screen_recording: "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
  notifications: "x-apple.systempreferences:com.apple.preference.notifications",
};

const mapMediaAccessStatus = (
  status: ReturnType<typeof systemPreferences.getMediaAccessStatus>,
): SystemPermissionState => {
  switch (status) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    case "restricted":
      return "restricted";
    case "not-determined":
      return "not_determined";
    case "unknown":
      return "unknown";
  }
};

export const readSystemPermissionSnapshot = (): SystemPermissionSnapshot => {
  const checkedAt = new Date().toISOString();
  const isMac = process.platform === "darwin";
  const accessibilityState: SystemPermissionState =
    isMac && systemPreferences.isTrustedAccessibilityClient(false) ? "granted" : "not_determined";
  const screenRecordingState: SystemPermissionState = isMac
    ? mapMediaAccessStatus(systemPreferences.getMediaAccessStatus("screen"))
    : "not_supported";
  const notificationState: SystemPermissionState = Notification.isSupported()
    ? "unknown"
    : "not_supported";

  return {
    platform: process.platform,
    checkedAt,
    permissions: [
      {
        id: "accessibility",
        title: "접근성",
        description: "Discord와 Chrome 창을 읽고 클릭, 입력, 포커스 이동을 수행하는 데 필요합니다.",
        state: accessibilityState,
        required: true,
        actionLabel: "접근성 설정 열기",
      },
      {
        id: "screen_recording",
        title: "화면 기록",
        description:
          "접근성 트리만으로 부족한 창 영역을 확인하고 단계 결과를 검증하는 데 필요합니다.",
        state: screenRecordingState,
        required: true,
        actionLabel: "화면 기록 설정 열기",
      },
      {
        id: "notifications",
        title: "알림",
        description:
          "사용자 승인이 필요하거나 작업이 끝났을 때 macOS 알림으로 알려주는 데 필요합니다.",
        state: notificationState,
        required: true,
        actionLabel: "알림 설정 열기",
      },
    ],
  };
};

export const openSystemPermissionSettings = async (
  permissionId: SystemPermissionId,
): Promise<void> => {
  await shell.openExternal(permissionSettingsUrls[permissionId]);
};
