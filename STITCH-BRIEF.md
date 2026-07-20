# Doon Stitch Generation Brief

## Purpose

Generate the first coherent desktop-product design set for Doon. Use `DESIGN.md` as the canonical design system and `PRD-Doon.md` as the product-behavior reference.

This batch covers only the core delegated-work loop:

1. Request an outcome.
2. Review the proposed stages.
3. Watch compact execution status.
4. Review a meaningful stage result.
5. Pause or recover when the user takes control.
6. Verify the completed outcome.

Do not generate the installation website or broad settings screens in this batch.

## Shared Scenario

Use one realistic scenario across every screen so the designs form a believable prototype:

> The user asks Doon to read the requirements in a student council Discord channel, create a Korean Hangul document that follows those requirements, and save it in the requested folder.

Example request in Korean:

> 학생회 디스코드에서 행사 계획서 요구사항을 확인하고, 형식에 맞는 한글 문서를 만들어서 학생회 문서 폴더에 저장해줘.

The generated document is `2026 여름축제 행사계획서.hwp`.

## Project Setup Prompt

Create a native-feeling macOS desktop utility named Doon. Doon is a personal AI computer operator that finishes multi-step digital work on the user's computer while keeping the user in control through meaningful stage reviews.

Use the imported `DESIGN.md` as the single visual and interaction source of truth. The interface must feel calm, precise, capable, and respectful, like a trustworthy operating-system utility rather than a chatbot or futuristic AI showcase.

Design light appearance first at a 1440 x 900 desktop context. Use Korean as the primary interface language. Ensure Korean labels fit naturally without truncation. Keep every overlay inside the safe area of the active display and leave the underlying work visible.

Required visual behavior:

- Native macOS visual grammar using the `Soft Amber Glass` material and restrained butter-yellow action color from `DESIGN.md`.
- Make the material unmistakably glass: the active context for the current stage must remain faintly visible through each overlay. Use Discord for command, planning, and requirements collection; use a Doon result surface for the content-draft review; use the Doon-controlled Chrome window with Hancom Docs for formatting, file-save review, and document-stage pause states. Colors must refract softly, and every pane needs a bright top/left rim, darker lower edge, clipped upper sheen, and diffuse ambient shadow. A translucent white rectangle with blur is not sufficient.
- Use a semi-transparent diagonal white-to-warm membrane rather than an opaque white panel. Preserve readable text with small localized reading patches, not by making the entire pane solid.
- Maximum corner radius of 8px for panels and 6px for controls.
- Use borders before shadows and never nest cards inside cards.
- Use SF Pro-like system typography with zero letter spacing.
- Use icons and text together for status, risk, and unfamiliar controls.
- Keep pause and stop available while Doon is executing.
- Show outcome-level stages, not click-by-click logs or model reasoning.
- A review must show the produced result and the consequence of approval.
- Do not use chat bubbles as the default layout.
- Each screen has one primary message and one primary decision. Show no more than three information groups and no more than two visible text actions.
- Scope, evidence, detailed history, privacy, and secondary metadata stay behind one compact disclosure control. Do not display all of them at once.

Never include:

- Purple-blue gradients, neon glows, AI orbs, bokeh, particles, or abstract AI artwork.
- Oversized marketing typography, decorative cards, pill-heavy controls, or three equal feature cards.
- Raw cursor coordinates, chain-of-thought, low-level click histories, or fake progress percentages.
- Generic buttons such as `확인`, `예`, or `OK` when a specific action label is available.
- Emoji, celebratory animation, or anthropomorphic copy.

## Screen 1: Command Palette, Ready

Generate a 640px-wide macOS command palette centered near the upper third of a 1440 x 900 desktop. The user's Discord window remains visible behind it with only a restrained dimming treatment.

Contents:

- Product label `Doon` and a compact ready indicator in one quiet header line.
- A focused natural-language command input containing the shared scenario request.
- One compact context line: `Discord - 학생회 · 현재 채널 · 학생회 문서 폴더`. Do not render three separate chips.
- Primary command button `작업 계획 만들기`.
- One discreet keyboard shortcut hint.
- Put the plain-language scope disclosure behind `범위 보기`; do not show it by default.

Do not show examples, onboarding copy, extra suggestion cards, recent commands, or secondary feature explanations. The command itself must dominate the pane.

## Screen 2: Planned Task

Generate the expanded command palette after Doon has interpreted the request. Preferred size is 640 x 520.

Lead with only the intended outcome:

> 요구사항에 맞는 행사계획서 한글 문서를 만들어 지정된 폴더에 저장합니다.

Show four outcome-level stages as one quiet vertical sequence with minimal icons:

1. `요구사항 수집 및 정리`
2. `문서 구조와 내용 초안 작성`
3. `한컴독스 문서 형식 적용`
4. `HWP 파일 저장 및 확인`

These labels map 1:1, in order, to `requirements_collected`, `content_drafted`, `document_formatted`, and `file_saved` in `TECH-STACK.md`. Do not rename, merge, or split them in generated screens.

Show only:

- The outcome sentence.
- The four compact stage rows.
- Primary action `작업 시작` and secondary action `범위 수정`.
- One collapsed `완료 조건 및 권한 보기` disclosure containing scope and completion conditions.

Place `취소` in a small close control rather than a third text button. Do not add explanatory cards, app logos, permissions panels, estimated time, or low-level application switches.

## Screen 3: Execution HUD

Generate a compact persistent execution HUD attached near the top-right screen edge without covering the current controlled context. Discord is visible for stage 1, the Doon result surface for stage 2 review, and Chrome with Hancom Docs for stages 3 and 4. Target size is approximately 360 x 104.

Show:

- Current task: `행사계획서 문서 만들기`.
- Current stage: `1/4 요구사항 확인 중`.
- Compact progress represented by completed stages, never a fake percentage.
- Icon buttons with tooltips for `일시정지` and `중단`.
- One expand affordance. Only after expansion show `필수 항목 7개를 찾았습니다.` and scope evidence.

The collapsed HUD has exactly two text lines plus the progress indicator and icon controls. It must feel persistent but quiet and must never look like a floating chat message.

## Screen 4: Checkpoint Review

Use this checkpoint window after every outcome-level stage. The pictured example is the review for stage 3, `document_formatted`, after the draft has been entered and formatted in Hancom Docs. Preferred width is 520px, usable height up to 680px.

Keep the Doon-controlled Chrome window and Hancom Docs visibly recognizable around the checkpoint. The review pane may contain an opaque document preview, but it must not imply that the document was created directly inside Discord.

Lead with the result:

> 한컴독스에 행사계획서를 작성하고 형식을 적용했습니다.

Show a large, readable document preview for `2026 여름축제 행사계획서.hwp`. In the preview, reveal only the title and the first three section headings so the document itself remains the visual focus:

- 행사 개요
- 추진 목적
- 세부 일정

Below the preview, show one concise line: `요구사항 7개를 반영했고 저장 전 최종 확인이 필요합니다.` Include the destination `학생회 문서/행사계획서` as muted metadata on the same line.

Explain the consequence:

> 승인하면 이 문서를 HWP로 내려받아 학생회 문서 폴더에 저장하고 파일을 확인합니다.

Actions:

- Primary `승인하고 계속`
- Secondary `수정 요청`
- Put `다시 실행` in the overflow menu and keep `중단` as a safety icon control.

Do not show a separate change-summary panel, checklist panel, evidence panel, or all seven sections outside the preview. When `수정 요청` is selected, replace the action row with one revision input attached directly to this result. Do not turn the whole window into a chat conversation.

## Screen 5: Paused by User and Recovery

Generate the Execution HUD immediately after the user moves the pointer or types in the controlled application.

State label:

> 사용자가 제어하여 일시정지됨

Supporting copy:

> Doon이 마우스와 키보드 제어를 해제했습니다. 자동으로 다시 시작하지 않습니다.

Show:

- The current stage in one muted line.
- Primary action `다시 시작`.
- Secondary disclosure `현재 상태 보기`.
- An icon control for `중단`.

Do not combine recovery diagnostics with this paused state. The expanded `현재 상태 보기` may reveal the last completed result only. A changed-layout recovery state belongs to a separate future screen and is not part of this six-screen generation.

## Screen 6: Completed Task and Activity

Generate the Doon main window at approximately 1040 x 720 after successful completion.

Lead with the verified outcome:

> 행사계획서 문서를 만들고 저장했습니다.

Show:

- A direct result row for `2026 여름축제 행사계획서.hwp`.
- Destination `학생회 문서/행사계획서` and one concise verified status line.
- Primary action `문서 열기` and secondary action `Finder에서 보기`.
- One collapsed `작업 세부 정보` disclosure. Only when expanded may it show the four-stage history, verified sections, and privacy disclosure.

Use an unframed main layout with a restrained navigation rail, but keep only `활동` visibly selected and do not fill the first viewport with other navigation content. The completed file result occupies the visual center with generous empty space. Put `비슷한 작업 다시 맡기기` and `기록 삭제` in an overflow menu. Do not add charts, analytics, assistant biography, recommendation cards, or page sections inside floating cards.

## Variant Pass

After the six light-appearance screens are coherent:

1. Generate dark-appearance variants using the exact semantic dark tokens in `DESIGN.md`.
2. Generate long-Korean-copy variants for the command palette, checkpoint review, and paused state.
3. Generate keyboard-focus states for the primary flow.
4. Connect the six screens into a clickable prototype in the listed order.

## Acceptance Checklist

- The six screens look like one macOS product, not six independent concepts.
- The same task, document name, stage names, and destination persist throughout.
- The current task, stage, status, and next decision are readable at a glance.
- Every default screen has one dominant result or decision, no more than three information groups, and no more than two visible text actions.
- Glass panes visibly transmit and refract the active application for the current stage; no pane reads as an opaque white card.
- Pause and stop remain available during execution.
- Every approval shows a result and consequence.
- Every one of the four stage results uses the same approval, revision, rerun, and stop contract before the next stage begins.
- User input pauses Doon and requires explicit resume.
- Risk and status are never communicated by color alone.
- Korean text fits without clipped primary actions.
- The active application remains visible around overlays.
- No banned visual patterns from `DESIGN.md` appear.

## Current Simplification Correction Prompt

Apply this as a visual and density correction to all six existing screens in `Doon Soft Amber Glass macOS UI`. Preserve the Korean scenario, exact HWP filename, destination, stage names, and task order. Do not redesign the product into a dashboard.

The current screens are too opaque and too dense. Regenerate each screen with unmistakable optical glass and one-decision-at-a-time composition:

1. Keep the real stage-appropriate context visibly recognizable behind every overlay: Discord for command, planning, and `requirements_collected`; a Doon result surface for `content_drafted`; then the Doon-controlled Chrome window with Hancom Docs for `document_formatted`, `file_saved`, and their reviews. Use a semi-transparent white-to-soft-amber membrane, 24-28px background blur, increased saturation, a bright top/left refractive rim, a darker bottom/right edge, a clipped upper specular sheen, and both short contact and diffuse ambient shadows. Do not use an opaque white or gray panel. Do not place a flat solid rectangle behind the whole overlay.
2. Use generous negative space. Each screen shows one primary message, one supporting line, and one primary decision. Limit the default view to three information groups and two visible text actions.
3. Command screen: show Doon header, command input, one compact context line, and `작업 계획 만들기`. Hide examples and scope copy behind `범위 보기`.
4. Plan screen: show outcome, four compact stages, and `작업 시작` plus `범위 수정`. Collapse permissions and completion conditions into one disclosure.
5. HUD screen: show exactly task, current stage, stage progress, pause icon, stop icon, and expand chevron. Hide the last event until expanded.
6. Checkpoint screen: make the document preview dominant. Show only three section headings, one concise result line, `승인하고 계속`, and `수정 요청`. Put rerun in overflow and keep stop as a safety icon.
7. Pause screen: show the paused state, one supporting sentence, current stage, `다시 시작`, and `현재 상태 보기`. Do not combine a recovery workflow into this screen.
8. Completion screen: show the verified outcome, one file row, destination, `문서 열기`, `Finder에서 보기`, and one collapsed `작업 세부 정보`. Keep history, seven sections, privacy text, repeat action, and delete action out of the default view.

The desired impression is a small piece of optically layered macOS glass floating above the active work context, not a white SaaS card, dashboard, analytics page, or dense specification sheet.

## Current Generated Stitch Project

- Project: [Doon Soft Amber Glass macOS UI](https://stitch.withgoogle.com/projects/6979018365994581050)
- Generated: 2026-07-20
- Visual direction: cool neutral macOS context, translucent functional glass, and soft butter-yellow `#E8CF72` actions

### Glass and Density Correction

The user review found that the first Soft Amber pass had stronger color but still read as opaque panels and exposed too much supporting information at once. The design contract and Stitch prompts were corrected around two stricter rules: a pane must show five visible optical layers, and each default surface must carry one result or decision with no more than three information groups.

Latest reference screens:

- `1. 명령 입력 v4`: canonical overlay reference. The full canvas is one crisp Discord window, only the pixels under the Doon pane are blurred, the pane has visible refractive edges and ambient depth, and no Doon dashboard or sidebar is present.
- `2. 작업 계획 확인 v5`: four stage rows, one collapsed detail row, and the `작업 시작` decision are shown directly on one pane. Cards, permission blocks, estimates, and explanatory sections are removed.
- The remaining generated frames are composition references only. Their task data and backdrop are not implementation authority; regenerate them from the canonical four-stage contract and stage-appropriate Discord or Chrome/Hancom context above before implementation handoff.

Manual canvas QA was performed at fit view and enlarged selection view. The individually corrected command, plan, and checkpoint screens no longer use a full-screen Doon shell and are substantially less dense. Stitch still adapts the glass membrane toward a darker tint on a dark Discord backdrop, so `DESIGN.md` remains the implementation authority for exact light and dark opacity, rim, sheen, saturation, and shadow values.
