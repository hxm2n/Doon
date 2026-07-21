import { CircleStop, Play, RotateCcw, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import type { OnboardingStatus } from "../../shared/onboarding-model";
import type { SystemPermissionId, SystemPermissionSnapshot } from "../../shared/permission-model";
import type { StageId, TaskSnapshot } from "../../shared/task-model";
import { NativeBridgePanel } from "./NativeBridgePanel";
import { OnboardingPanel } from "./OnboardingPanel";
import { TaskWorkspace } from "./TaskWorkspace";
import { useNativeBridgeState } from "./useNativeBridgeState";

const defaultCommand =
  "학생회 디스코드에서 행사 계획서 요구사항을 확인하고, 형식에 맞는 한글 문서를 만들어서 학생회 문서 폴더에 저장해줘.";

export const App = () => {
  const [command, setCommand] = useState(defaultCommand);
  const nativeBridge = useNativeBridgeState();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | undefined>(undefined);
  const [permissionSnapshot, setPermissionSnapshot] = useState<
    SystemPermissionSnapshot | undefined
  >(undefined);
  const [revision, setRevision] = useState("");
  const [task, setTask] = useState<TaskSnapshot | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      window.doon.getOnboardingStatus(),
      window.doon.getSystemPermissionSnapshot(),
      window.doon.getCurrentTask(),
    ]).then(([savedOnboardingStatus, savedPermissionSnapshot, savedTask]) => {
      if (isMounted) {
        setOnboardingStatus(savedOnboardingStatus);
        setPermissionSnapshot(savedPermissionSnapshot);
        setTask(savedTask);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = async () => {
    setOnboardingStatus(await window.doon.completeOnboarding());
  };

  const resetOnboarding = async () => {
    const nextOnboardingStatus = await window.doon.resetOnboarding();
    setOnboardingStatus(nextOnboardingStatus);
  };

  const refreshPermissions = async () => {
    setPermissionSnapshot(await window.doon.getSystemPermissionSnapshot());
  };

  const openPermissionSettings = async (permissionId: SystemPermissionId) => {
    await window.doon.openSystemPermissionSettings({ permissionId });
    await refreshPermissions();
  };

  if (onboardingStatus === undefined) {
    return (
      <main className="onboarding-shell">
        <section className="onboarding-panel glass-panel" aria-label="Doon loading">
          <p className="eyebrow">Doon</p>
          <h1>작업 범위를 확인하는 중</h1>
        </section>
      </main>
    );
  }

  if (!onboardingStatus.scopeConfirmed) {
    return (
      <OnboardingPanel
        onConfirm={completeOnboarding}
        permissionSnapshot={permissionSnapshot}
        onOpenPermissionSettings={openPermissionSettings}
        onRefreshPermissions={refreshPermissions}
      />
    );
  }

  const createTask = async () => {
    const nextTask = await window.doon.createTask({
      command,
      contextLine: "Discord - 학생회 · 현재 채널 · 학생회 문서 폴더",
    });
    setTask(nextTask);
  };

  const startStage = async (stageId: StageId) => {
    setTask(await window.doon.startStage({ stageId }));
  };

  const approveStage = async (stageId: StageId) => {
    setRevision("");
    setTask(await window.doon.approveStage({ stageId }));
  };

  const reviseStage = async (stageId: StageId) => {
    if (revision.trim().length === 0) {
      return;
    }
    setTask(await window.doon.reviseStage({ stageId, instruction: revision }));
    setRevision("");
  };

  const rerunStage = async (stageId: StageId) => {
    setRevision("");
    setTask(await window.doon.rerunStage({ stageId }));
  };

  const pauseTask = async () => setTask(await window.doon.pauseTask());
  const resumeTask = async () => setTask(await window.doon.resumeTask());
  const cancelTask = async () => setTask(await window.doon.cancelTask());
  const { proposeAction, ...nativeBridgePanel } = nativeBridge;

  return (
    <main className="app-shell">
      <section className="palette glass-panel" aria-label="Doon command palette">
        <header className="palette-header">
          <div>
            <p className="eyebrow">Doon</p>
            <h1>귀찮은 문서 작업을 단계별로 끝내기</h1>
          </div>
          <div className="status-pill">
            <Shield size={14} aria-hidden="true" />
            <span>{task?.status ?? "ready"}</span>
          </div>
        </header>

        <label className="command-label" htmlFor="command">
          요청
        </label>
        <textarea
          id="command"
          value={command}
          onChange={(event) => setCommand(event.currentTarget.value)}
          className="command-input"
          rows={3}
        />

        <div className="context-row">
          <span>Discord - 학생회 · 현재 채널 · 학생회 문서 폴더</span>
          <button type="button" className="ghost-button" onClick={resetOnboarding}>
            범위 초기화
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="action-row">
          <button type="button" className="primary-button" onClick={createTask}>
            <Play size={16} aria-hidden="true" />
            작업 계획 만들기
          </button>
          {task !== undefined ? (
            <button
              type="button"
              className="icon-button"
              onClick={cancelTask}
              aria-label="작업 중단"
            >
              <CircleStop size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </section>

      <NativeBridgePanel
        {...nativeBridgePanel}
        onProposeAction={() =>
          proposeAction(command, task?.currentStageId ?? "requirements_collected")
        }
      />

      <TaskWorkspace
        task={task}
        revision={revision}
        onRevisionChange={setRevision}
        onStartStage={startStage}
        onApproveStage={approveStage}
        onReviseStage={reviseStage}
        onRerunStage={rerunStage}
        onPauseTask={pauseTask}
        onResumeTask={resumeTask}
      />
    </main>
  );
};
