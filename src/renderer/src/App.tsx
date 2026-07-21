import {
  Check,
  ChevronDown,
  CircleStop,
  FileCheck,
  Pause,
  Play,
  RotateCcw,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type StageId, stageDefinitions, type TaskSnapshot } from "../../shared/task-model";

const defaultCommand =
  "학생회 디스코드에서 행사 계획서 요구사항을 확인하고, 형식에 맞는 한글 문서를 만들어서 학생회 문서 폴더에 저장해줘.";

export const App = () => {
  const [command, setCommand] = useState(defaultCommand);
  const [revision, setRevision] = useState("");
  const [task, setTask] = useState<TaskSnapshot | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    window.doon.getCurrentTask().then((savedTask) => {
      if (isMounted) {
        setTask(savedTask);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const pauseTask = async () => setTask(await window.doon.pauseTask());
  const resumeTask = async () => setTask(await window.doon.resumeTask());
  const cancelTask = async () => setTask(await window.doon.cancelTask());

  const activeStage = task?.stages.find((stage) => stage.id === task.currentStageId);

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
          <button type="button" className="ghost-button">
            범위 보기
            <ChevronDown size={14} aria-hidden="true" />
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

      <section className="workspace" aria-label="Task plan and review">
        <div className="hud glass-panel">
          <div>
            <p className="caption">현재 단계</p>
            <strong>{activeStage?.title ?? "대기 중"}</strong>
          </div>
          <div className="hud-actions">
            <button type="button" className="icon-button" onClick={pauseTask} aria-label="일시정지">
              <Pause size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={resumeTask} aria-label="재개">
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
                  onClick={() => startStage(stage.id)}
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
              onChange={(event) => setRevision(event.currentTarget.value)}
              className="revision-input"
              rows={2}
              placeholder="수정 방향을 입력"
            />
            <div className="approval-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => approveStage(activeStage.id)}
              >
                <Check size={16} aria-hidden="true" />
                승인
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => reviseStage(activeStage.id)}
              >
                <RotateCcw size={16} aria-hidden="true" />
                수정 반영
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
};
