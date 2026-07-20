# Doon 기술 스택 및 실행 아키텍처

## 문서 개요

- **상태:** 기술 스택 인터뷰 완료, 구현 전 초안
- **작성일:** 2026년 07월 20일
- **대상:** 3일 MVP
- **초기 플랫폼:** macOS, Apple Silicon(arm64). 주 개발·검증 장비는 M4 Mac이며 실제 macOS 버전은 빌드 검증 기록에 남긴다.
- **연관 문서:** [PRD](./PRD-Doon.md), [디자인 명세](./DESIGN.md), [Stitch 디자인 브리프](./STITCH-BRIEF.md)

이 문서는 Doon MVP의 기술 선택, 각 기술의 책임, 안전 경계, 확장 방향을 기록한다. 구체적인 라이브러리 버전과 내부 구현 방식은 개발 착수 시 기술 스파이크를 거쳐 확정하되, 이 문서의 제품 경계와 데이터 원칙은 임의로 변경하지 않는다.

---

## 1. MVP 기술 목표

Doon MVP는 UI 시연이 아니라 실제 macOS 환경에서 하나의 작업을 끝내는 것을 기술적 성공 기준으로 삼는다.

### 골든 플로우

1. 사용자가 어떤 화면에 있든 전역 단축키로 Doon을 호출한다.
2. Doon이 설치된 Discord 데스크톱 앱을 실행하고 테스트 채널로 이동한다.
3. 비민감 테스트 메시지에서 문서 요구사항을 읽고 정리한 뒤 첫 번째 단계 승인을 받는다.
4. 문서 구조와 내용 초안을 만들고 두 번째 단계 승인을 받는다.
5. Doon이 기존 Google Chrome 프로필로 새 창을 열어 한컴독스에 문서 형식을 적용하고 세 번째 단계 승인을 받는다.
6. 승인된 문서를 `.hwp`로 내려받아 사용자가 요청한 로컬 폴더에 저장하고 파일명, 형식, 위치를 검증한다.
7. 사용자가 네 번째 단계 결과를 승인하면 Doon이 작업을 완료 처리하고 알린다.

### MVP 완료 조건

- 실제 Discord와 Chrome을 화면에 보이는 방식으로 조작한다.
- 한컴독스에서 생성한 `.hwp` 파일이 요청된 로컬 폴더에 존재하는지 확인한다.
- 접근성 트리와 화면 이미지를 함께 사용해 현재 상태를 판단한다.
- 사용자가 단계별 결과를 승인, 수정, 일시 중지 또는 중단할 수 있다.
- 오류나 앱 종료 후 마지막으로 승인된 단계부터 다시 시작할 수 있다.
- 두 사람의 Apple Silicon Mac에 `.app` 또는 `.dmg` 형태로 설치할 수 있다.

---

## 2. 확정 기술 스택

| 영역 | 선택 | 책임 |
| :--- | :--- | :--- |
| 데스크톱 런타임 | Electron 안정 버전 | 앱 생명주기, 창, 메뉴바, 전역 단축키, 알림, 패키징 |
| UI | React + TypeScript + Vite | 명령 입력, HUD, 단계 결과, 승인, 복구 화면 |
| 데스크톱 패키징 | Electron Forge | arm64 `.app` 및 `.dmg` 생성 |
| 에이전트 런타임 | Electron Main Process의 Node.js | 작업 계획, 상태 전이, AI 호출, 실행 정책, 로그 |
| macOS 네이티브 브리지 | 최소 Swift 실행 파일 | 접근성, 화면 캡처, 입력 이벤트, 앱·창 제어, Keychain |
| AI SDK | `@google/genai` | Gemini 표준 멀티모달 API 호출과 구조화된 응답 처리 |
| AI 모델 | Gemini 3.5 Flash (`gemini-3.5-flash`) 무료 등급 | 화면·접근성 맥락 기반 행동 제안, 의도 해석, 문서 초안 생성 |
| 구조 검증 | Zod | AI 응답, 행동 명령, IPC 메시지 검증 |
| 로컬 저장소 | SQLite | 작업, 단계 결과, 승인, 재개 지점, 최소 실행 기록 저장 |
| 초기 서버 | 없음 | MVP는 로컬 앱에서 실행하며 별도 회원·동기화 서버를 두지 않음 |

### 선택 이유

- 팀이 TypeScript와 React에 가장 익숙하므로 제품 UI와 에이전트 오케스트레이션을 해당 스택에 집중한다.
- 실제 macOS 제어는 순수 JavaScript에 억지로 포함하지 않고 Swift 브리지에 격리한다.
- Electron은 앱 내부 UI뿐 아니라 메뉴바, 전역 단축키, 다중 창과 설치 패키징을 한 흐름에서 처리할 수 있다.
- Gemini에는 최소 화면 캡처와 접근성 맥락을 보내고, Doon이 정의한 Zod 행동 스키마에 맞는 다음 행동만 구조화된 응답으로 받는다.
- SQLite에는 개별 화면 좌표가 아니라 의미 있는 작업 단계와 승인 결과를 저장한다.

---

## 3. 실행 아키텍처

```text
React Renderer
  명령 입력 / 상태 표시 / 승인 / 수정 / 중단
          |
          v
Electron Main Process
  Task Orchestrator / Policy Engine / State Machine
          |
          +---- AIProvider --------> Gemini API
          |
          +---- TaskRepository ----> SQLite
          |
          +---- ComputerDriver ----> Swift Helper
                                      AXUIElement
                                      ScreenCaptureKit
                                      CGEvent
                                      NSWorkspace
                                      Keychain
```

### 프로세스 책임

#### React Renderer

- 사용자의 자연어 명령을 입력받는다.
- 현재 단계와 실행 상태를 보여준다.
- 단계 결과를 승인, 수정 또는 다시 실행하도록 한다.
- 일시 중지, 재개, 중단을 제공한다.
- 운영체제 API, API 키, 파일 시스템에 직접 접근하지 않는다.

Renderer를 생성하는 모든 `BrowserWindow`는 `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity: true`를 고정한다. Renderer에는 임의 채널을 호출할 수 있는 `ipcRenderer`를 노출하지 않고, preload가 다음의 좁은 타입 API만 `window.doon`으로 제공한다.

- 작업 생성
- 작업 상태 구독
- 단계 승인, 수정 요청 또는 다시 실행
- 일시 중지, 재개, 취소

preload와 Main Process 양쪽에서 IPC 요청과 응답을 Zod로 검증한다. Main Process는 최상위 프레임과 패키징된 Doon 앱 origin에서 온 요청만 처리하고, 하위 프레임·알 수 없는 sender·등록되지 않은 채널은 거부한다. Renderer의 새 창 생성과 앱 밖 탐색은 차단하며, 외부 링크 열기는 고정된 `https` origin 허용 목록을 통과한 경우에만 Main Process가 처리한다. Renderer의 CSP는 기본적으로 `default-src 'self'`이며 Gemini 호출, Keychain, 파일 접근은 Main Process에서만 수행한다.

#### Electron Main Process

- Renderer 요청을 검증하고 작업을 생성한다.
- 작업을 의미 있는 단계로 나누고 상태 전이를 관리한다.
- AI가 제안한 행동을 허용 목록과 현재 앱 범위에 대조한다.
- Swift Helper에 승인된 행동만 전달한다.
- 새 화면 상태를 확인한 뒤 다음 행동 또는 사용자 승인을 결정한다.

#### Swift Helper

Swift Helper는 별도 arm64 실행 파일로 패키징하며, 표준 입출력의 JSON Lines 프로토콜로 Electron과 통신한다.

초기 명령 집합은 다음으로 제한한다.

- `check_permissions`
- `launch_app`
- `focus_window`
- `list_windows`
- `read_accessibility_tree`
- `capture_window`
- `click`
- `type_text`
- `press_key`
- `set_clipboard`

Keychain 저장과 조회는 Electron Main Process만 호출할 수 있는 별도 내부 경로로 둔다. 해당 명령은 AI 행동 스키마와 Renderer IPC에 노출하지 않으며 API 키 값을 로그나 SQLite에 기록하지 않는다.

출력 폴더 선택과 파일 이동도 AI 행동 스키마에서 분리한다. 사용자가 직접 호출한 Swift `NSOpenPanel`이 선택된 디렉터리를 canonicalize하고, Swift Helper 내부에만 실제 경로를 보관한 채 Main Process에는 현재 task에 묶인 불투명 `OutputDirectoryHandle`만 반환한다. 3일 unsigned·non-MAS MVP에서는 운영체제가 폴더 접근을 강제하지 않으므로 이 Helper capability가 권한 경계이며 앱 종료, 작업 중단 또는 task 완료 시 폐기한다. 서명과 App Sandbox를 적용하는 공개 빌드에서는 같은 handle의 내부 저장 방식을 security-scoped bookmark로 교체한다.

세 번째 단계 승인 후 Main Process만 Swift Helper의 내부 `move_downloaded_hwp`와 `verify_hwp` capability를 호출할 수 있다. Helper는 승인 이후 Chrome 다운로드 폴더에 새로 생긴 예상 파일명 하나만 대상으로 삼는다. Source와 `OutputDirectoryHandle`은 no-follow 방식으로 열고 모든 경로 구성요소에서 symlink를 거부하며, canonical path, `.hwp` 확장자와 파일 형식, 비어 있지 않은 크기를 검증한다. AI와 Renderer는 handle을 해석할 수 없고 source path, destination path, filename을 직접 전달하거나 변경할 수 없다.

파일은 destination 디렉터리 안의 무작위 임시 이름에 배타적으로 생성해 복사, `fsync`, 형식 검증을 마친 뒤 원자적으로 최종 이름으로 바꾼다. 대상 파일이 없을 때는 충돌 시 실패하는 exclusive rename을 사용한다. 대상 파일이 이미 있으면 사용자에게 device, inode, 크기, 수정 시각으로 구성된 `DestinationSnapshot`을 보여 승인받고, 교체 직전에 같은 snapshot인지 다시 확인한다. 파일이 바뀌었거나 새 충돌이 생기면 교체하지 않고 승인을 다시 요청한다. 실패하거나 중단되면 임시 파일만 제거하고 기존 파일은 보존한다.

앱별 탐색 규칙이나 AI 판단은 Swift Helper에 넣지 않는다. Swift는 macOS 기능을 안전하고 일관된 명령으로 노출하는 어댑터 역할만 담당한다.

#### 명령 실행 계약

저수준 명령은 단독으로 실행할 수 없다. Main Process는 각 단계가 시작될 때 다음 값이 포함된 `ExecutionContext`를 만들고, 모든 명령에 해당 컨텍스트를 결합한다.

- 작업 및 단계 ID
- 허용된 앱 bundle ID와 등록된 창 ID
- 사용자가 승인한 Discord 테스트 서버와 채널 식별자
- Chrome에서 허용된 정확한 origin과 현재 문서 식별자
- 사용자가 선택한 계정 또는 현재 로그인 상태에 대한 확인 결과
- Swift Helper가 보유하고 현재 task에 묶은 불투명 `OutputDirectoryHandle`
- 허용된 행동 유형, 최대 행동 횟수, 만료 시각

정책 엔진은 매 행동 직전에 전면 앱, 접근성 창, 대상 요소와 Chrome 주소창의 origin을 다시 읽어 `ExecutionContext`와 비교한다. `click`은 등록된 창 안의 접근성 요소 또는 검증된 요소 경계로만 제한하고, `type_text`는 해당 창의 편집 가능한 요소에만 허용한다. `press_key`는 단계별 키 조합 허용 목록을 사용하며, `set_clipboard`는 현재 단계가 생성한 문자열만 기록하고 붙여넣기 직후 비운다.

AI는 앱, 창, Discord 서버·채널, 계정, origin, 파일 경로를 임의로 확장할 수 없다. Discord 메시지와 웹 문서의 내용은 관찰 데이터일 뿐 Doon에 대한 명령으로 취급하지 않으며, 원래 사용자 요청과 승인된 수정 지시만 작업 범위를 바꿀 수 있다. Chrome 계정 전환과 프로필 설정 화면은 조작하지 않고 새 탭과 팝업은 차단한다. 계정 식별을 자동 검증할 수 없으면 실행 전에 사용자 확인을 받는다. 파일 이동은 `OutputDirectoryHandle`이 가리키는 폴더 아래의 단일 `.hwp` 파일로 한정한다. 현재 화면이나 접근성 트리가 예상 경계와 다르거나 삭제·결제·전송·공유·업로드·배포 UI로 진입하면 명령을 실행하지 않고 단계를 중지한다.

---

## 4. 에이전트 실행 방식

Doon은 고정 좌표 매크로나 완전 자율 에이전트가 아니다. 허용된 행동 집합 안에서 화면을 관찰하고 다음 행동을 선택하는 제한형 에이전트로 구현한다.

```text
Observe -> Decide -> Validate -> Act -> Verify -> Checkpoint
```

### 화면 인식 우선순위

1. macOS 접근성 트리에서 앱, 창, 버튼, 입력창, 텍스트를 구조적으로 읽는다.
2. 접근성 정보가 없거나 불완전하면 대상 창 영역만 캡처한다.
3. AI에는 작업에 필요한 접근성 정보와 최소 화면 영역만 전달한다.
4. 행동 후 접근성 트리와 새 캡처를 다시 확인해 결과를 검증한다.

### 앱별 경계

- **Discord:** 설치된 데스크톱 앱만 MVP 대상으로 한다.
- **한컴독스:** Google Chrome에서 사용하는 웹 버전만 대상으로 한다.
- **Chrome:** 현재 사용자의 기존 프로필을 사용하되 Doon이 새로 만든 창만 관찰하고 조작한다.
- **로컬 결과물:** 한컴독스에서 `.hwp`로 내려받은 단일 파일만 요청된 폴더로 이동하고, 같은 이름의 기존 파일이 있으면 덮어쓰기 전에 사용자의 승인을 받는다.
- **로그인:** Discord, Chrome, 한컴독스 로그인이 이미 완료된 상태를 전제로 한다.

Discord와 Chrome 조작 책임은 각각의 명시적 경계로 분리한다. 범용 `TargetResolver`, 플러그인 시스템, 임의 앱 레지스트리는 MVP에 만들지 않는다. 이후 지원 앱을 늘릴 때 현재 경계를 교체하거나 확장한다.

---

## 5. 작업 상태와 복구

작업은 클릭이 아니라 단계 결과물을 중심으로 저장한다.

### 기본 상태

```text
ready
interpreting
needs_clarification
planned
executing
awaiting_review
revising
paused_by_user
blocked
failed
completed
cancelled
```

### 골든 플로우 단계

| Stage ID | 결과물 | 완료 조건 | 실행 맥락 |
| :--- | :--- | :--- | :--- |
| `requirements_collected` | Discord 요구사항 구조화 결과 | 승인된 테스트 채널에서 필수 요구사항과 누락 항목을 정리함 | Discord 데스크톱 |
| `content_drafted` | 문서 구조와 본문 초안 | 요구사항이 문서 섹션과 본문에 반영됨 | Doon 결과 검토 화면 |
| `document_formatted` | 한컴독스 문서 미리보기 | 승인된 초안이 한컴독스에 입력되고 제목·섹션·형식이 확인됨 | Doon이 만든 Chrome 창의 한컴독스 |
| `file_saved` | 로컬 `.hwp` 파일 | 승인된 폴더에서 예상 파일명, 형식, 크기와 경로가 검증됨 | Chrome 다운로드와 Swift 파일 capability |

위 네 단계 ID와 순서는 PRD, 디자인, Stitch, SQLite가 함께 사용하는 단일 기준이다. 각 단계가 완료되면 상태는 반드시 `awaiting_review`가 되며 사용자는 승인, 수정 요청, 다시 실행, 중단 중 하나를 선택한다. 승인 전에는 다음 단계가 시작되지 않는다. 수정과 다시 실행은 같은 stage ID에서 새 결과 버전을 만들고, 네 번째 단계 승인 후에만 작업 상태를 `completed`로 전환한다.

상태 전이는 다음 규칙을 따른다.

- 단계 실행 성공: `executing -> awaiting_review`
- 1~3단계 승인: `awaiting_review -> executing`으로 전환하고 다음 stage ID를 시작
- 4단계 승인: `awaiting_review -> completed`
- 수정 요청: `awaiting_review -> revising -> awaiting_review`, 같은 stage ID에 새 결과 버전 생성
- 다시 실행: `awaiting_review -> executing -> awaiting_review`, 같은 stage ID를 처음부터 재실행
- 사용자 입력: `executing` 또는 `revising`에서 `paused_by_user`로 전환하고, 명시적 재개 시 중단 전 상태로 복귀
- 복구 가능한 경계 불일치: `blocked`, 실행 불가능한 오류: `failed`
- 중단: `interpreting`, `planned`, `executing`, `awaiting_review`, `revising`, `paused_by_user`, `blocked`, `failed` 중 어느 상태에서도 `cancelled`

중단 전이는 원자적으로 현재 `ExecutionContext`와 출력 폴더 capability를 폐기하고, 대기 중인 AI 요청·Helper 명령·파일 이동을 취소하며, 입력 이벤트 생성을 멈추고 클립보드를 비운다. 폐기된 task ID의 예약 명령과 늦게 도착한 응답은 Main Process에서 거부한다. `cancelled` 상태에서는 새 작업을 만들기 전까지 재개할 수 없다.

### 복구 원칙

- 마지막 승인 단계와 그 결과물을 SQLite에 저장한다.
- 재실행 시 마지막 승인 단계 다음부터 새 화면 상태를 다시 관찰한다.
- 마지막 클릭 좌표나 중간 키 입력부터 재생하지 않는다.
- 화면 상태가 달라졌다면 같은 목표를 달성하기 위한 새 행동을 계획한다.

---

## 6. AI 및 데이터 정책

### MVP AI 정책

- Gemini 3.5 Flash의 표준 멀티모달 무료 등급만 사용한다. 무료 등급에서 제공되지 않는 Gemini Computer Use 도구는 MVP에서 호출하지 않는다.
- Gemini는 화면과 접근성 맥락을 해석하고 Doon의 제한된 행동 스키마에 맞는 제안만 반환한다. 실제 관찰, 정책 검증, 실행과 결과 확인 루프는 Doon이 소유한다.
- 무료 한도를 초과하거나 모델을 사용할 수 없으면 유료 호출로 자동 전환하지 않고 작업을 중지해 사용자에게 설정 오류를 알린다.
- 비민감 테스트용 Discord 채널과 테스트용 한컴독스 문서만 사용한다.
- 화면 전체가 아니라 현재 작업과 관련된 앱 또는 창 영역만 전송한다.
- 원본 스크린샷은 기본적으로 디스크에 저장하지 않는다.
- SQLite에는 승인된 단계 결과와 재개에 필요한 상태만 저장하고, 원본 화면·API 키·세션 쿠키는 저장하지 않는다.
- 실행 로그에는 화면 본문과 비밀값을 남기지 않고 앱, 단계, 행동 유형, 성공 여부만 기록한다.
- Gemini API 키는 코드나 설치 파일에 포함하지 않는다.
- 각 개발자가 자신의 키를 입력하고 macOS Keychain에 저장한다.
- 첫 실행 전에 모델 공급자, 전송되는 화면 범위, 무료 등급의 데이터 조건과 Computer Use 도구를 사용하지 않는다는 점을 고지하고 사용자의 동의를 받는다.

### 로컬 이력 보존 및 삭제

- 진행 중이거나 승인 대기 중인 작업 상태는 재개를 위해 유지한다.
- 완료, 실패, 취소된 작업 이력과 단계 결과는 기본 30일 뒤 자동 삭제한다.
- 작업·단계와 연결된 행동 이력은 SQLite에 저장하고 7일 동안만 유지한다. 별도 진단 파일에는 task ID와 사용자 콘텐츠를 기록하지 않으며, 파일당 5 MiB에서 회전하고 최대 3개 파일을 보관한다.
- 앱 시작 시와 하루 한 번 만료된 SQLite 행과 로그 파일을 정리한다.
- 사용자는 작업 하나 또는 전체 이력을 즉시 삭제할 수 있다. 삭제 시 작업, 단계, 승인, 수정, SQLite 행동 이력을 트랜잭션으로 함께 제거한다. task ID가 없는 진단 파일에는 삭제할 작업별 데이터가 존재하지 않는다.
- SQLite는 외래 키 cascade와 `secure_delete=ON`을 사용한다. 삭제 중 새 쓰기를 막고 모든 reader를 닫은 뒤 `PRAGMA wal_checkpoint(TRUNCATE)`가 성공할 때까지 완료로 표시하지 않는다. `SQLITE_BUSY`가 발생하면 제한된 횟수로 재시도하고, 계속 실패하면 삭제 실패를 알린 채 다음 앱 시작 전에 다시 수행한다. Doon은 이력 데이터의 별도 백업이나 클라우드 복제를 만들지 않는다.
- 이력 삭제는 Doon 내부 데이터만 제거하며, 사용자가 요청해 생성한 `.hwp` 결과물은 자동으로 삭제하지 않는다.

Gemini 무료 등급에 전송된 콘텐츠는 Google 제품 개선에 사용될 수 있으므로, 실제 개인 대화나 업무 데이터 사용은 금지한다. 공개 사용자 단계에서는 유료 데이터 정책과 서버 프록시를 도입한 뒤 이 제한을 다시 검토한다.

### 공개 버전 전환

MVP의 직접 API 호출은 `AIProvider` 뒤에 둔다. 공개 버전에서는 다음 구조로 교체한다.

```text
Doon Desktop -> Doon API Gateway -> AI Provider
```

서버는 사용자 인증, 사용량 제한, API 키 보호, 모델 라우팅, 감사 가능한 요청 메타데이터를 담당한다. 화면 원본을 장기 저장하는 서버 구조는 기본값으로 채택하지 않는다.

---

## 7. 안전 및 권한 경계

Doon은 실제 사용자 Mac을 조작하므로 완전한 실행 샌드박스를 적용할 수 없다. 대신 실행 권한을 제품 정책으로 제한한다.

### 필수 권한

- 접근성 권한
- 화면 및 시스템 오디오 기록 권한 중 화면 캡처에 필요한 범위
- 알림 권한

### 필수 안전장치

- 허용된 앱과 창만 조작한다.
- AI가 제안한 명령을 Zod 스키마와 정책 엔진으로 검증한다.
- 클릭, 입력, 키 조합 등 허용된 행동만 실행한다.
- 삭제, 결제, 메시지 전송, 공유, 배포는 MVP 행동 집합에서 제외한다.
- 사용자가 언제든 실행을 멈출 수 있는 전역 중단 단축키를 제공한다.
- 행동 횟수와 단계 실행 시간에 상한을 둔다.
- AI가 불확실하거나 화면 상태가 예상과 다르면 사용자에게 제어권을 반환한다.

Chrome은 기존 프로필을 사용하지만 Doon이 만든 새 창만 실행 컨텍스트에 등록한다. 다른 창이나 탭은 탐색, 캡처, 조작 대상에 포함하지 않는다.

앱 허용 목록만으로 행동을 승인하지 않는다. Main Process 정책 엔진은 `ExecutionContext`의 앱, 창, 계정 확인, origin, 출력 폴더, 행동 유형을 모두 만족한 경우에만 Swift Helper에 명령을 전달한다. Swift Helper는 명령마다 현재 전면 앱과 창 ID를 다시 확인하고 불일치 시 실행하지 않는다.

---

## 8. 패키징 및 지원 환경

### MVP

- M4 개발 Mac을 포함한 Apple Silicon arm64 전용
- 안정적인 번들 ID 사용
- `.app` 및 `.dmg` 생성
- 두 개발자의 Mac에서 직접 설치 및 권한 부여
- Apple Developer 서명과 공증은 제외
- 두 번째 Mac도 Apple Silicon인지 구현 전에 확인

### 공개 배포 전 필수 작업

- Apple Developer ID 서명
- macOS 공증
- 자동 업데이트 정책
- Universal 또는 별도 Intel 빌드 필요성 재평가
- 지원 macOS 최소 버전 확정
- 권한 설명과 개인정보 처리 안내가 포함된 설치 홈페이지

Electron은 공식적으로 Electron Forge를 패키징 및 배포 도구로 권장한다. 공개 배포 단계에서는 서명과 공증을 필수로 적용한다.

---

## 9. MVP 제외 범위

- 외부 사용자를 위한 회원가입과 로그인
- AWS 등 별도 백엔드 인프라
- 실제 개인·업무 Discord 데이터 처리
- 백그라운드에서 사용자를 상시 관찰하는 습관 학습
- Discord 외 임의 메신저 지원
- Safari와 기타 브라우저 지원
- Discord 웹 지원
- 한글 데스크톱 앱과 HWPX 직접 생성
- 임의의 서버와 채널을 완전히 자율적으로 추론하는 기능
- 결제, 메시지 전송, 파일 삭제, 외부 공유
- Intel Mac과 Windows 지원
- 서명·공증된 공개 설치 파일과 설치 홈페이지

---

## 10. 구현 전 기술 스파이크

본 구현에 들어가기 전에 다음 항목을 작은 실행 코드로 검증한다.

1. Electron 앱이 접근성 및 화면 기록 권한 상태를 정확히 안내할 수 있는지 확인한다.
2. Swift Helper가 Discord와 Chrome 창을 식별하고 포커스할 수 있는지 확인한다.
3. Discord의 요구사항 텍스트가 접근성 트리에서 어느 수준까지 노출되는지 확인한다.
4. ScreenCaptureKit으로 지정한 창만 캡처되는지 확인한다.
5. Gemini 3.5 Flash 무료 등급의 표준 멀티모달 호출이 macOS 캡처와 접근성 맥락을 입력받아 Doon 행동 스키마에 맞는 구조화된 제안을 반환하는지 확인한다.
6. Chrome 기존 프로필의 새 창을 안정적으로 식별하고 한컴독스 입력, `.hwp` 다운로드, 요청 폴더 저장을 수행할 수 있는지 확인한다.
7. 패키징된 arm64 앱에서 Swift Helper와 SQLite가 정상 동작하는지 확인한다.

스파이크가 실패하면 제품 목표를 낮추기 전에 접근성 트리, 화면 인식, 앱 제어 중 어느 경계가 실패했는지 분리해 판단한다.

---

## 11. 참고 자료

- [Electron Forge 배포 개요](https://www.electronjs.org/docs/latest/tutorial/forge-overview)
- [Electron 애플리케이션 패키징](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)
- [Electron과 네이티브 코드](https://www.electronjs.org/docs/latest/tutorial/native-code-and-electron)
- [Apple ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit)
- [Gemini 구조화된 출력](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini Computer Use](https://ai.google.dev/gemini-api/docs/computer-use) - 무료 등급에서 제외한 도구의 제약 확인용
- [Gemini API 가격 및 무료 등급](https://ai.google.dev/gemini-api/docs/pricing)
