# Doon 기술 스택 및 실행 아키텍처

## 문서 개요

- **상태:** 기술 스택 인터뷰 완료, 구현 전 초안
- **작성일:** 2026년 07월 20일
- **대상:** 3일 MVP
- **초기 플랫폼:** macOS, Apple Silicon(arm64)
- **연관 문서:** [PRD](./PRD-Doon.md), [디자인 명세](./DESIGN.md), [Stitch 디자인 브리프](./STITCH-BRIEF.md)

이 문서는 Doon MVP의 기술 선택, 각 기술의 책임, 안전 경계, 확장 방향을 기록한다. 구체적인 라이브러리 버전과 내부 구현 방식은 개발 착수 시 기술 스파이크를 거쳐 확정하되, 이 문서의 제품 경계와 데이터 원칙은 임의로 변경하지 않는다.

---

## 1. MVP 기술 목표

Doon MVP는 UI 시연이 아니라 실제 macOS 환경에서 하나의 작업을 끝내는 것을 기술적 성공 기준으로 삼는다.

### 골든 플로우

1. 사용자가 어떤 화면에 있든 전역 단축키로 Doon을 호출한다.
2. Doon이 설치된 Discord 데스크톱 앱을 실행하고 테스트 채널로 이동한다.
3. 비민감 테스트 메시지에서 문서 요구사항을 읽고 정리한다.
4. 사용자가 단계 결과를 확인하고 승인하거나 수정한다.
5. Doon이 기존 Google Chrome 프로필로 새 창을 연다.
6. 새 Chrome 창에서 한컴독스로 이동해 문서를 작성한 뒤 `.hwp`로 내려받는다.
7. 내려받은 파일을 사용자가 요청한 로컬 폴더에 저장하고, 파일명과 위치를 검증한다.
8. Doon이 완료 상태를 사용자에게 알린다.

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
| AI SDK | `@google/genai` | Gemini API 호출과 Computer Use 상호작용 |
| AI 모델 | Gemini 3.5 Flash (`gemini-3.5-flash`) + Computer Use 도구(Preview) | 화면 기반 다음 행동 제안, 의도 해석, 문서 초안 생성 |
| 구조 검증 | Zod | AI 응답, 행동 명령, IPC 메시지 검증 |
| 로컬 저장소 | SQLite | 작업, 단계 결과, 승인, 재개 지점, 최소 실행 기록 저장 |
| 초기 서버 | 없음 | MVP는 로컬 앱에서 실행하며 별도 회원·동기화 서버를 두지 않음 |

### 선택 이유

- 팀이 TypeScript와 React에 가장 익숙하므로 제품 UI와 에이전트 오케스트레이션을 해당 스택에 집중한다.
- 실제 macOS 제어는 순수 JavaScript에 억지로 포함하지 않고 Swift 브리지에 격리한다.
- Electron은 앱 내부 UI뿐 아니라 메뉴바, 전역 단축키, 다중 창과 설치 패키징을 한 흐름에서 처리할 수 있다.
- Gemini Computer Use는 데스크톱 화면을 보고 다음 GUI 행동을 제안하는 반복 구조를 제공한다.
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
- 단계 결과를 승인하거나 수정하도록 한다.
- 일시 중지, 재개, 중단을 제공한다.
- 운영체제 API, API 키, 파일 시스템에 직접 접근하지 않는다.

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

앱별 탐색 규칙이나 AI 판단은 Swift Helper에 넣지 않는다. Swift는 macOS 기능을 안전하고 일관된 명령으로 노출하는 어댑터 역할만 담당한다.

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
created
planning
running
waiting_for_approval
revising
paused
failed
completed
cancelled
```

### 골든 플로우 단계

1. Discord 요구사항 수집 및 정리
2. 문서 구조와 초안 생성
3. 한컴독스 작성 및 저장
4. 결과 검증 및 완료 보고

각 단계는 목표, 결과물, 완료 조건, 승인 상태를 가진다. 사용자가 승인한 단계만 다음 단계의 입력으로 사용한다.

### 복구 원칙

- 마지막 승인 단계와 그 결과물을 SQLite에 저장한다.
- 재실행 시 마지막 승인 단계 다음부터 새 화면 상태를 다시 관찰한다.
- 마지막 클릭 좌표나 중간 키 입력부터 재생하지 않는다.
- 화면 상태가 달라졌다면 같은 목표를 달성하기 위한 새 행동을 계획한다.

---

## 6. AI 및 데이터 정책

### MVP AI 정책

- Gemini 무료 등급을 사용한다.
- 비민감 테스트용 Discord 채널과 테스트용 한컴독스 문서만 사용한다.
- 화면 전체가 아니라 현재 작업과 관련된 앱 또는 창 영역만 전송한다.
- 원본 스크린샷은 기본적으로 디스크에 저장하지 않는다.
- SQLite에는 승인된 단계 결과와 재개에 필요한 상태만 저장하고, 원본 화면·API 키·세션 쿠키는 저장하지 않는다.
- 실행 로그에는 화면 본문과 비밀값을 남기지 않고 앱, 단계, 행동 유형, 성공 여부만 기록한다.
- Gemini API 키는 코드나 설치 파일에 포함하지 않는다.
- 각 개발자가 자신의 키를 입력하고 macOS Keychain에 저장한다.
- 첫 실행 전에 모델 공급자, 전송되는 화면 범위, 무료 등급의 데이터 조건을 고지하고 사용자의 동의를 받는다.

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

---

## 8. 패키징 및 지원 환경

### MVP

- Apple Silicon arm64 전용
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
5. Gemini Computer Use가 macOS 데스크톱 캡처에서 유효한 행동을 반환하는지 확인한다.
6. Chrome 기존 프로필의 새 창을 안정적으로 식별하고 한컴독스 입력, `.hwp` 다운로드, 요청 폴더 저장을 수행할 수 있는지 확인한다.
7. 패키징된 arm64 앱에서 Swift Helper와 SQLite가 정상 동작하는지 확인한다.

스파이크가 실패하면 제품 목표를 낮추기 전에 접근성 트리, 화면 인식, 앱 제어 중 어느 경계가 실패했는지 분리해 판단한다.

---

## 11. 참고 자료

- [Electron Forge 배포 개요](https://www.electronjs.org/docs/latest/tutorial/forge-overview)
- [Electron 애플리케이션 패키징](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)
- [Electron과 네이티브 코드](https://www.electronjs.org/docs/latest/tutorial/native-code-and-electron)
- [Apple ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit)
- [Gemini Computer Use](https://ai.google.dev/gemini-api/docs/computer-use)
- [Gemini API 가격 및 무료 등급](https://ai.google.dev/gemini-api/docs/pricing)
