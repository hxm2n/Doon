import { Check, FileCheck, Pause, Play, RefreshCcw, RotateCcw } from "lucide-react";
import { type StageId, stageDefinitions, type TaskSnapshot } from "../../shared/task-model";

type TaskWorkspaceProps = {
  readonly task: TaskSnapshot | undefined;
  readonly revision: string;
  readonly onRevisionChange: (revision: string) => void;
  readonly onStartStage: (stageId: StageId) => Promise<void>;
  readonly onApproveStage: (stageId: StageId) => Promise<void>;
  readonly onReviseStage: (stageId: StageId) => Promise<void>;
  readonly onRerunStage: (stageId: StageId) => Promise<void>;
  readonly onPauseTask: () => Promise<void>;
  readonly onResumeTask: () => Promise<void>;
};

export const TaskWorkspace = ({
  task,
  revision,
  onRevisionChange,
  onStartStage,
  onApproveStage,
  onReviseStage,
  onRerunStage,
  onPauseTask,
  onResumeTask,
}: TaskWorkspaceProps) => {
  const activeStage = task?.stages.find((stage) => stage.id === task.currentStageId);

  return (
    <section className="workspace" aria-label="Task plan and review">
      <div className="hud glass-panel">
        <div>
          <p className="caption">현재 단계</p>
          <strong>{activeStage?.title ?? "대기 중"}</strong>
        </div>
        <div className="hud-actions">
          <button type="button" className="icon-button" onClick={onPauseTask} aria-label="일시정지">
            <Pause size={16} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button" onClick={onResumeTask} aria-label="재개">
            <Play size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="stage-list">
        {(task?.stages ?? stageDefinitions).map((stage) => (
          <article className="stage-row" key={stage.id}>
            <div className="stage-marker" data-state={"state" in stage ? stage.state : "pending"}>
              {"state" in stage && stage.state === "approved" ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <FileCheck size={15} aria-hidden="true" />
              )}
            </div>
            <div className="stage-copy">
              <div className="stage-title">
                <strong>{stage.title}</strong>
                <span>{"state" in stage ? stage.state : "pending"}</span>
              </div>
              <p>{stage.outcome}</p>
              <small>{stage.context}</small>
            </div>
            {"state" in stage && stage.state === "active" ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onStartStage(stage.id)}
              >
                실행
              </button>
            ) : null}
          </article>
        ))}
      </div>

      {activeStage !== undefined ? (
        <section className="review-panel" aria-label="Stage checkpoint review">
          <div>
            <p className="eyebrow">Checkpoint</p>
            <h2>{activeStage.title}</h2>
            <p>{activeStage.result || "이 단계의 결과를 기다리고 있습니다."}</p>
          </div>
          <textarea
            value={revision}
            onChange={(event) => onRevisionChange(event.currentTarget.value)}
            className="revision-input"
            rows={2}
            placeholder="수정 방향을 입력"
          />
          <div className="approval-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => onApproveStage(activeStage.id)}
            >
              <Check size={16} aria-hidden="true" />
              승인
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onReviseStage(activeStage.id)}
            >
              <RotateCcw size={16} aria-hidden="true" />
              수정 반영
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => onRerunStage(activeStage.id)}
              aria-label="현재 단계 재실행"
              title="현재 단계 재실행"
            >
              <RefreshCcw size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
};
