# Design

## Source of truth

- **Status:** Draft
- **Last refreshed:** 2026-07-20
- **Primary product surfaces:** macOS desktop app, system overlay surfaces, onboarding and permissions, activity and settings window
- **Secondary product surface:** desktop app installation website (planned after the core desktop experience)
- **Evidence reviewed:**
  - [`PRD-Doon.md`](./PRD-Doon.md)
  - User direction: Codex-like translucent desktop material with a soft, low-saturation yellow identity
  - User direction: Glass morphism and liquid glass must be the default Doon style going forward
  - [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
  - [Raycast DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md)
  - [Apple DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md)
  - [Linear DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md)
  - [Zapier DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/zapier/DESIGN.md)
- **Evidence currently absent:** product UI implementation, logo, screenshots, Figma files, brand assets, and a finalized component library

This document is the canonical design contract for Doon. Product and frontend work should follow it unless a later validated decision updates this file.

## Brand

### Personality

Doon should feel capable, calm, precise, and respectful. It works inside a personal computer, so it must behave more like a reliable operating-system utility than an expressive chatbot or futuristic AI showcase.

The brand should communicate:

- Quiet competence rather than spectacle
- Clear intent rather than mysterious intelligence
- Helpful presence without demanding attention
- User ownership rather than autonomous authority
- Familiar desktop behavior with a distinct but restrained identity

### Trust signals

- Show what Doon is currently doing and why it matters to the task.
- State which screen, file, account, or capability is being accessed.
- Keep pause and stop controls available during execution.
- Present meaningful results before asking for approval.
- Explain external or irreversible effects before execution.
- Make stored history, permissions, and learned preferences inspectable and deletable.
- Use signed and notarized installers, visible version information, and clear privacy language on the installation website.

### Avoid

- Purple-blue gradients as the dominant identity
- Glowing AI orbs, bokeh, particle fields, or ambient decorative blobs
- Sci-fi control-room visuals and theatrical cursor movement
- Anthropomorphic claims such as "Doon is thinking like you"
- Constant chat bubbles when a status, preview, or direct command is clearer
- Excessive rounded pills, nested cards, and floating-card page sections
- Dark mode as a requirement for the brand; system appearance should lead
- Visual noise that competes with the user's active application
- Generic stock imagery that does not show the real product

## Product goals

### Goals

- Let a user invoke Doon without leaving the current computer workflow.
- Convert a natural-language outcome into visible, meaningful work stages.
- Make execution understandable without exposing every low-level click.
- Let the user approve, revise, pause, or stop at the right moments.
- Preserve a clear boundary between Doon's control and the user's control.
- Make privacy, permissions, recovery, and completion visible product features.
- Let the installation website establish trust and deliver the desktop app with minimal friction.

### Non-goals

- Entertaining the user with animated automation
- Reproducing a full desktop inside the Doon interface
- Requiring the user to manage low-level action logs during normal work
- Presenting every task as a long chat conversation
- Hiding risk, permission scope, failure, or partial completion behind vague language
- Turning the installation website into a generic AI marketing page

### Success signals

- A new user can invoke Doon and understand the first action without instruction.
- A user can identify the current stage and regain control within one interaction.
- Approval requests explain the result and consequence without requiring log inspection.
- Users can distinguish running, waiting, paused, failed, and completed states at a glance.
- The Doon overlay does not obscure the content being operated on.
- The installation website makes supported systems, permissions, version, and download action immediately clear.

## Personas and jobs

### Primary personas

- People who use a laptop for multi-step digital work but do not want to configure automation tools
- People who value the result of a task more than performing repetitive computer operations
- People willing to delegate execution while retaining approval and interruption rights

The product should not assume developer knowledge. Terminal terminology, API concepts, model names, and automation internals must not appear in the default experience.

### User jobs

- Tell Doon the desired outcome in natural language.
- Understand what context Doon intends to use.
- Review meaningful intermediate results.
- Approve, revise, pause, resume, or stop work.
- Verify the final result and any external effects.
- Inspect and change permissions, history, and learned preferences.
- Install or update the desktop app from an official, trustworthy source.

### Key contexts of use

- The user is already focused in another application.
- The task may cross multiple windows or tools.
- The user may watch closely, switch to another activity, or return only for approval.
- The active content may be personal, confidential, or difficult to undo.
- Network availability and third-party interfaces may change during execution.

## Information architecture

### Desktop surfaces

1. **Command Palette**
   - Global shortcut entry point
   - Natural-language input
   - Current-context summary and removable context chips
   - Optional scope and destination controls when needed

2. **Execution HUD**
   - Compact, persistent status near a screen edge
   - Current stage, current goal, pause, and stop
   - Expands into detail only on request or when blocked

3. **Checkpoint Review**
   - Stage result and completion criteria
   - Result preview or change summary
   - `Approve`, `Revise`, and `Stop` actions
   - Revision input remains attached to the result being revised

4. **Main Window**
   - Current and recent tasks
   - Task detail and stage history
   - Recovery and resume actions
   - Permissions and privacy
   - Preferences and learned memory

5. **Onboarding**
   - Product promise
   - Permission rationale before each operating-system prompt
   - Global shortcut setup
   - First controlled task

6. **System Notifications**
   - Only for approval needed, blocked work, completion, or material failure
   - Never notify for every low-level action

### Installation website surfaces

The website is a future but required product surface. It is responsible for download, trust, and installation guidance, not only promotion.

- **Home and Download:** Doon name, literal offer, actual product visual, primary desktop download action
- **Installation Guide:** system requirements, permissions, setup sequence, troubleshooting
- **Security and Privacy:** local-versus-remote processing, stored data, permission scope, deletion controls
- **Release Notes:** version, release date, fixes, known limitations
- **Help:** onboarding and recovery guidance

### Content hierarchy

For every active task, use this hierarchy:

1. Current task outcome
2. Current stage and status
3. Result or action requiring user judgment
4. Primary next action
5. Supporting details, scope, and logs

Do not lead with model reasoning, raw screenshots, coordinates, or click history.

### Focus and density contract

Every Doon surface must answer one question at a time. A surface may contain rich information in its expanded state, but its default state is intentionally sparse.

- Show one primary message, one supporting line, and one primary decision per transient surface.
- Keep no more than three visible information groups in a palette, HUD, checkpoint, pause dialog, or completion summary.
- Show at most two visible text actions. Move tertiary actions into an overflow menu unless they are safety-critical; `Stop` may remain as an icon control with a tooltip.
- Do not show scope, evidence, completion criteria, history, privacy, and next actions simultaneously. Lead with the item needed for the current decision and reveal the rest on demand.
- Use a single compact disclosure row such as `세부 정보 보기` for supporting scope, evidence, or history.
- A main window may hold more information, but its first viewport still needs one dominant result and one next action. Secondary sections begin below the fold or stay collapsed.
- If removing a block does not change the user's immediate decision, remove it from the default state.

## Design principles

### 1. Outcome over spectacle

Show what changed, what remains, and whether the requested outcome is satisfied. Cursor movement is supporting evidence, not the main product content.

### 2. Meaningful checkpoints, not permission fatigue

Every outcome-level stage ends with a review because the user can judge its result. Do not ask for approval for individual clicks, text entry, or window changes inside that stage. Additional confirmation is reserved for a newly discovered risk boundary.

### 3. Never steal control

User mouse or keyboard input in the controlled context pauses Doon immediately. The HUD must make the handoff visible and offer an explicit resume action. Doon must never fight the user for pointer or keyboard focus.

### 4. Show scope before confidence

Trust comes from showing what Doon can access and affect, not from confident language. Scope, destination, external effects, and completion conditions must be visible when relevant.

### 5. Native before branded

Follow macOS conventions for windows, menus, shortcuts, focus, permissions, notifications, and system appearance. Brand expression should not make standard desktop behavior unfamiliar.

### 6. Progressive disclosure

Default surfaces show only the current goal, status, and next decision. Plans, evidence, action logs, permissions, and recovery detail remain available without occupying the default view.

### 7. Recovery is a primary flow

Partial success, changed interfaces, missing permissions, and interrupted work are expected states. Recovery UI must preserve completed work and present a clear next action.

### Tradeoffs

- More visibility can improve trust but increase distraction. Prefer compact status plus on-demand detail.
- More approvals can improve safety but return coordination burden to the user. Approve results and meaningful risk boundaries only.
- More personalization can improve speed but raise privacy concerns. Make memory opt-in, inspectable, scoped, and deletable.
- More custom branding can increase recognition but reduce desktop familiarity. Favor native interaction and restrained visual ownership.

## Visual language

### Theme and atmosphere

The visual direction is **Soft Amber Liquid Glass**: a quiet macOS utility built from cool neutral canvases, optically layered translucent material, liquid-like rim refraction, and a soft butter-yellow action color. It should recall the calm dimensional material of Codex and modern macOS glass without copying another product's chrome, layout, or branding.

Glass is functional rather than decorative. Use it where seeing the active application behind Doon helps the user understand context: the Command Palette, Execution HUD, Checkpoint Review, transient dialogs, and compact navigation chrome. Main reading surfaces, long activity histories, settings forms, and document previews remain more opaque for legibility.

Liquid glass is now the default expression for Doon's transient desktop surfaces. It means the pane feels like a thin optical object between the user and the active app: there is depth, edge brightness, soft internal refraction, and subtle movement-ready polish. It does not mean watery animation, glossy blobs, sci-fi glow, or high-contrast decoration. The material should feel tactile but still quiet enough to sit over someone else's work.

Doon supports system light and dark appearance from the same semantic token model. Transparency must adapt to the wallpaper and underlying application without allowing either to reduce text contrast.

The desktop app should be visually quieter than the installation website. The website can use more space and product media, but it must still show the real Doon interface rather than abstract AI imagery.

### Color tokens

Use semantic names in code. Hex values are provisional until visual implementation review.

| Token | Light | Dark | Role |
| :--- | :--- | :--- | :--- |
| `canvas` | `#EEF0F3` | `#151619` | Main window background |
| `canvas-highlight` | `#F7F3E4` | `#2B281C` | Localized ambient warmth behind glass, never a full-page fill |
| `surface` | `#FAFBFC` | `#202226` | Opaque reading and form surfaces |
| `surface-elevated` | `#F3F4F6` | `#292C31` | Selected and elevated opaque regions |
| `glass` | `rgba(255, 255, 255, 0.52)` | `rgba(35, 37, 42, 0.58)` | Standard contextual glass color membrane |
| `glass-strong` | `rgba(255, 255, 255, 0.66)` | `rgba(31, 33, 38, 0.72)` | Readable glass without hiding the active application |
| `glass-subtle` | `rgba(255, 255, 255, 0.34)` | `rgba(45, 47, 53, 0.42)` | Compact HUD and transient chrome |
| `glass-warm` | `rgba(232, 207, 114, 0.16)` | `rgba(240, 217, 125, 0.12)` | Local amber refraction inside glass, never a flat fill |
| `liquid-highlight` | `rgba(255, 255, 255, 0.68)` | `rgba(255, 255, 255, 0.18)` | Curved specular highlight across glass rims |
| `liquid-shadow` | `rgba(42, 45, 52, 0.18)` | `rgba(0, 0, 0, 0.46)` | Contact and lower-edge density for thick glass |
| `liquid-caustic` | `rgba(255, 238, 169, 0.22)` | `rgba(240, 217, 125, 0.10)` | Small warm refracted streaks inside glass |
| `liquid-readability` | `rgba(255, 255, 255, 0.42)` | `rgba(18, 19, 22, 0.30)` | Local reading patch behind text on glass |
| `border` | `rgba(69, 74, 82, 0.18)` | `rgba(255, 255, 255, 0.14)` | Standard boundaries |
| `border-highlight` | `rgba(255, 255, 255, 0.86)` | `rgba(255, 255, 255, 0.24)` | Top-lit glass edge and inner refraction |
| `border-shade` | `rgba(31, 34, 40, 0.20)` | `rgba(0, 0, 0, 0.42)` | Lower glass edge that gives the pane thickness |
| `border-strong` | `rgba(55, 59, 66, 0.34)` | `rgba(255, 255, 255, 0.30)` | Focused or important boundaries |
| `text-primary` | `#191A1D` | `#F7F7F5` | Primary text |
| `text-secondary` | `#5F636B` | `#B9BBC1` | Supporting text |
| `text-tertiary` | `#858991` | `#8F929A` | Metadata and disabled text |
| `action` | `#E8CF72` | `#F0D97D` | Primary button fill and Doon identity |
| `action-hover` | `#DEC25A` | `#F4E092` | Hovered primary action |
| `action-pressed` | `#CDAA3E` | `#D8BB59` | Pressed primary action |
| `action-ink` | `#69540F` | `#F4DF8D` | Action text, selected labels, and inline emphasis |
| `on-action` | `#29230E` | `#29230E` | Text and icons on yellow action surfaces |
| `info` | `#2563A8` | `#70A7E8` | Informational state |
| `success` | `#1F7A46` | `#65C98C` | Completed and verified state |
| `warning` | `#A95F00` | `#E2A34B` | Caution and blocked state |
| `danger` | `#B9342C` | `#F07A72` | Destructive action and failure |
| `focus-ring` | `#826814` | `#F4DF8D` | Keyboard focus indicator |

Rules:

- Do not use status colors as large decorative backgrounds.
- Do not communicate state through color alone; pair color with icon and text.
- Reserve `action` for primary buttons, small active indicators, and restrained Doon identity moments.
- Use `action-ink`, not yellow fill, for links or text placed directly on light surfaces.
- Do not use pale yellow text on white or translucent light glass.
- Use neutral surfaces for most of the interface so the active application remains dominant.
- Keep `canvas-highlight` localized and soft. The product must not become a cream or yellow monochrome interface.

### Glass material recipe

Glass must read as layered material, not a transparent rectangle with blur applied.

- Build every pane from five visible layers: contextual content behind it, a translucent color membrane, background blur and saturation, a bright top/left rim, and a darker lower edge. A pane missing any of these reads as frosted plastic or a flat white card.
- Standard glass: a diagonal membrane blending `glass` into `glass-warm`, `24px` backdrop blur, `155%` saturation, and `105%` contrast. Underlying app colors and large shapes must remain faintly recognizable through it.
- Strong glass: the same optical stack using `glass-strong`, `28px` backdrop blur, and a localized opaque reading patch only directly behind long text. Do not raise the opacity of the whole panel.
- Compact glass: `glass-subtle`, `18px` backdrop blur, and a clearer rim so the small HUD still reads as a physical pane.
- Refraction rim: the top and left edges use `border-highlight`; the bottom and right edges use `border-shade`. Keep both within a single 1px boundary instead of drawing a generic gray outline.
- Specular sheen: add one clipped, non-interactive highlight across the upper 20-30% of the pane, fading from soft white to transparent. It must follow the pane radius and never sit behind body text.
- Light-mode depth: combine a bright inner top line, a faint inner lower shade, a short contact shadow, and a larger diffuse ambient shadow. The pane should appear 4-8px above the active application.
- Dark-mode depth: retain the rim and lower edge but reduce the white haze; text sits on a slightly darker localized reading patch instead of an opaque dark card.
- The background behind glass must include real application content or restrained tonal variation. Never demonstrate glass against a uniform gray or white rectangle because no refraction will be visible.
- Every glass surface needs an opaque fallback using `surface` or `surface-elevated` when transparency is reduced, unsupported, or fails contrast.
- Never stack glass panels inside other glass panels. Inner groups use dividers, opaque rows, or tonal surface changes.
- Do not blur document previews, screenshots, or the content Doon is operating on.

### Liquid glass layer system

Use the liquid glass layer system for Command Palette, Onboarding, HUD, and Checkpoint Review. The system has five named parts; each implemented surface should map to these parts rather than inventing a one-off glass recipe.

1. **Lens membrane:** the base panel blends `glass-strong`, `glass`, and `glass-warm` on a diagonal so the pane has temperature and not just opacity.
2. **Optical rim:** a 1px border uses bright top/left and darker bottom/right values. Add an inset ring where the pane is important enough to feel thick.
3. **Specular sheet:** a clipped pseudo-element sweeps across the top third with `liquid-highlight`; this sheet is wide and curved, not a discrete orb or blob.
4. **Caustic streak:** a second clipped pseudo-element uses `liquid-caustic` as a narrow diagonal refraction band. It should be visible only when the user looks for it.
5. **Reading patch:** text-heavy regions inside glass use `liquid-readability` as a localized backing layer. Do not make the whole pane opaque to solve contrast.

Implementation rules:

- Use semantic CSS variables for every liquid-glass color, shadow, blur, and transition.
- Prefer pseudo-elements on shared primitives such as `.glass-panel`, `.stage-row`, and `.review-panel` over adding decorative DOM.
- Pseudo-elements must be `pointer-events: none` and clipped by the parent radius.
- The panel content must sit above material pseudo-elements with a local stacking context.
- Liquid highlights may shift on hover or active state only when the element is interactive. Static panels should not animate by default.
- Blur must be applied to bounded panels, not the full app shell or large scrolling containers.
- Respect `prefers-reduced-transparency` and `prefers-reduced-motion`. Reduced transparency uses opaque `surface`; reduced motion removes transforms and highlight movement.
- Avoid full-screen gradient orbs, bokeh, particles, and decorative blobs. Liquid glass uses sheets, rims, and refraction bands, not floating shapes.

### Component material contract

| Primitive | Required material behavior | Notes |
| :--- | :--- | :--- |
| `.glass-panel` | Liquid glass shell with lens membrane, rim, specular sheet, caustic streak, and deep but soft shadow | Used by command palette, onboarding, HUD |
| `.primary-button` | Warm liquid action surface with subtle top highlight, inset rim, and press depth | Yellow should feel like enamel under glass, not a neon fill |
| `.secondary-button` / `.ghost-button` | Thin translucent control with rim and mild hover refraction | Keep text actions limited; tertiary actions should stay quiet |
| `.icon-button` | Compact circular lens button with visible focus ring and hover lift | Used for safety or utility actions |
| `.stage-row` | Opaque-to-translucent row with a small lens marker; active state gets stronger rim and caustic warmth | Rows must remain scannable before decorative |
| `.review-panel` | Strong glass frame with localized readable result text | This is the main judgment surface, so legibility wins |
| `.command-input` / `.revision-input` | Inset glass field with opaque text backing and focus rim | Do not make typed text sit on a busy transparent field |
| `.scope-row` | Onboarding scope row with subdued liquid lens treatment | Should look trustworthy, not like a marketing card |
| `.permission-panel` / `.permission-row` | Onboarding permission status surface with compact readable rows and state labels | Required permissions are product safety information, so clarity wins over decoration |

Surface mapping:

| Surface | Material | Reason |
| :--- | :--- | :--- |
| Command Palette | `glass-strong` | Keeps the active application visible while protecting command readability |
| Execution HUD | `glass-subtle` | Remains lightweight and contextual at the screen edge |
| Checkpoint Review | `glass-strong` shell with opaque `surface` preview | Separates user judgment from the changing application behind it |
| Pause and risk dialogs | `glass-strong` | Makes control handoff prominent without introducing a new visual language |
| Main Window sidebar | Standard `glass` over the window canvas | Creates soft navigation depth without turning content into floating cards |
| Main Window content | Opaque `surface` and unframed regions | Supports long reading, history, and settings with stable contrast |
| Installation website navigation | Standard `glass` only while overlaying product media | Preserves the same material identity without glassifying every content band |

### Typography

- **Desktop family:** SF Pro Text / SF Pro Display through macOS system fonts
- **Website family:** system UI stack first; a brand typeface may be evaluated later
- **Monospace:** SF Mono only for shortcuts, paths, identifiers, or technical detail
- **Letter spacing:** `0` across all interface text

| Style | Size | Weight | Line height | Use |
| :--- | :--- | :--- | :--- | :--- |
| `title` | 24px | 600 | 32px | Main window titles and completed outcome |
| `heading` | 18px | 600 | 26px | Panel and checkpoint headings |
| `subheading` | 15px | 600 | 22px | Stage labels and grouped controls |
| `body` | 14px | 400 | 21px | Default desktop text |
| `body-strong` | 14px | 600 | 21px | Emphasized result and action labels |
| `compact` | 13px | 400 | 18px | HUD and dense metadata |
| `caption` | 12px | 400 | 17px | Timestamp, scope, and secondary metadata |
| `command-input` | 16px | 400 | 24px | Natural-language request and revision input |
| `website-display` | 56px | 600 | 64px | Desktop website hero only |

Website display type steps down to 40px on narrow screens. Do not scale font size continuously with viewport width.

### Spacing and layout rhythm

- Base unit: `4px`
- Scale: `4, 8, 12, 16, 24, 32, 48, 64`
- Compact HUD and palette controls use `8-12px` internal gaps.
- Checkpoint and main-window sections use `16-24px` internal spacing.
- Website content bands use `48-64px` vertical spacing.
- Use full-width sections with constrained inner content on the website; do not make every section a floating card.

### Shape, radius, and elevation

- Radius scale: `4px`, `6px`, `8px`
- Buttons and inputs: `6px`
- Panels, result previews, and repeated item cards: `8px` maximum
- Status chips may use a full radius only when the pill shape communicates compact metadata.
- Use a boundary edge and inner highlight before adding an external shadow.
- Standard glass elevation: `0 1px 0 rgba(255, 255, 255, 0.74) inset`, `0 -1px 0 rgba(31, 34, 40, 0.10) inset`, `0 4px 10px rgba(27, 29, 33, 0.10)`, `0 20px 50px rgba(27, 29, 33, 0.14)` in light mode.
- Strong overlay elevation: `0 1px 0 rgba(255, 255, 255, 0.82) inset`, `0 -1px 0 rgba(31, 34, 40, 0.14) inset`, `0 6px 14px rgba(18, 19, 22, 0.12)`, `0 28px 64px rgba(18, 19, 22, 0.22)` in light mode.
- Dark glass elevation: `0 1px 0 rgba(255, 255, 255, 0.09) inset`, `0 18px 48px rgba(0, 0, 0, 0.42)`.
- Primary yellow buttons use a quiet inner highlight and a short warm shadow no darker than `rgba(91, 70, 8, 0.18)`; they must not glow.
- Do not place cards inside cards. Use dividers, grouped rows, or unframed content regions inside a panel.

### Motion

- Standard state transition: `120-180ms`, ease-out
- Panel expansion: maximum `220ms`
- Respect Reduce Motion by removing translation and scale; retain opacity or instant state change.
- Do not animate the cursor for demonstration when Doon is not actually controlling it.
- Never delay user control, status updates, or error visibility for animation.

### Imagery and iconography

- Use SF Symbols in native macOS surfaces when suitable.
- Use Lucide icons for web implementation or cross-platform surfaces when SF Symbols are unavailable.
- Icons support text for uncommon or consequential actions.
- The installation website must use real product screenshots or a clear task-flow recording as its primary visual asset.
- Do not use generated abstract AI artwork as the main explanation of the product.

## Components

### Existing components to reuse

No implementation or component library exists yet. Prefer native macOS controls and system behavior before introducing custom controls.

### Desktop components

- `CommandPalette`
- `CommandInput`
- `ContextChip`
- `ScopeDisclosure`
- `TaskPlan`
- `StageRow`
- `ExecutionHUD`
- `StatusBadge`
- `CheckpointReview`
- `ResultPreview`
- `ChangeSummary`
- `ApprovalBar`
- `RevisionInput`
- `RiskDisclosure`
- `RiskConfirmDialog`
- `PauseControl`
- `RecoveryPanel`
- `ActivityTimeline`
- `PermissionRow`
- `MemoryItem`
- `EmptyState`
- `SystemNotification`

### Installation website components

- `DownloadButton`
- `SystemRequirementSummary`
- `VersionMetadata`
- `ProductDemo`
- `PermissionExplainer`
- `SecuritySummary`
- `ReleaseNoteItem`
- `InstallTroubleshooting`

### Variants and states

All interactive components must define:

- Default
- Hover, where pointer input applies
- Keyboard focus
- Pressed
- Disabled with reason when useful
- Loading or pending
- Error
- Success, when the component represents completion

Risk controls additionally define `normal`, `caution`, `external-effect`, and `destructive` variants.

### Token and component ownership

- Semantic tokens belong in one shared theme definition per implementation surface.
- Desktop-native and website components may have different implementations but must share semantic names and status meaning.
- A new component is justified only when native controls or an existing Doon component cannot express the required behavior.

## Interaction model

### Task states

| State | User-facing label | Required UI behavior |
| :--- | :--- | :--- |
| `ready` | Ready | Command input is focused and contextual scope is visible. |
| `interpreting` | Understanding request | Show activity without claiming execution has begun. |
| `needs_clarification` | More information needed | Ask the minimum blocking question and preserve the request. |
| `planned` | Ready to start | Show outcome-level stages and relevant scope. |
| `executing` | Working | HUD shows current stage and pause/stop controls. |
| `awaiting_review` | Review needed | Bring the checkpoint result forward without stealing focus while the user is typing elsewhere. |
| `revising` | Applying changes | Keep the accepted result and revision instruction visible. |
| `paused_by_user` | Paused by you | Explain that user input caused the pause and offer resume. |
| `blocked` | Needs attention | State what is missing and the smallest recovery action. |
| `failed` | Could not complete | Preserve completed stages and offer retry, alternate path, or manual takeover. |
| `completed` | Completed | Show verified outcome and changed or created items. |
| `cancelled` | Stopped | Show what was already changed and whether cleanup is needed. |

### Checkpoint contract

Every checkpoint must answer:

1. What stage was completed?
2. What result did Doon produce or change?
3. What should the user judge?
4. What happens after approval?

Actions:

- Primary: `Approve and continue`
- Secondary: `Revise`
- Overflow: `Run again`
- Safety control: `Stop`

Do not use a generic `OK` button. Risk confirmation copy must name the actual effect.

The canonical stage IDs are `requirements_collected`, `content_drafted`, `document_formatted`, and `file_saved`, in that order. Every stage result enters `awaiting_review`; the next stage cannot begin until approval. Revision and rerun create a new result for the same stage. Approving `file_saved` moves the task to `completed`. These IDs and transitions are shared with `TECH-STACK.md` and the Stitch brief.

### Control handoff

- User input in the controlled context pauses Doon immediately.
- The Execution HUD changes to `Paused by you` and shows `Resume`.
- Doon must release pointer and keyboard control before displaying the pause state.
- Doon does not automatically resume after user input.
- Stop remains available from the HUD and main window.
- Exact global pause and emergency-stop shortcuts remain an open implementation decision.

### Risk levels

- **Level 0, observational:** Read or inspect within approved scope. No additional confirmation after scope approval.
- **Level 1, reversible local:** Create or edit recoverable local work. Confirm at the stage result.
- **Level 2, external effect:** Send, share, publish, upload, or modify a shared resource. Confirm immediately before the effect.
- **Level 3, destructive or financial:** Delete, pay, deploy, change security settings, or perform difficult-to-reverse actions. Use a dedicated confirmation with consequence and target.

## Accessibility

- **Target standard:** WCAG 2.2 AA for the website and equivalent keyboard and assistive-technology support for the desktop app
- The entire command, review, approval, pause, resume, and stop flow must be keyboard operable.
- Focus must move predictably when the palette opens, a checkpoint arrives, or a dialog closes.
- Use a visible `2px` focus indicator with sufficient contrast.
- Status must use text and icon in addition to color.
- Result previews must expose semantic headings, lists, and change descriptions.
- Respect system text size where the desktop framework permits it.
- Respect Reduce Motion and increased-contrast settings.
- Respect Reduce Transparency by replacing every glass token with its opaque fallback and removing backdrop blur without changing layout.
- Avoid relying on hover for essential explanation or actions.
- Website touch targets must be at least `44px`; compact desktop controls should be at least `32px` unless a native macOS control defines otherwise.
- Korean and English text must fit without truncating primary actions or status messages.

## Responsive behavior

### Desktop app

- Primary target: macOS laptop displays from `1280x720` upward.
- Command palette: preferred width `640px`, minimum width `520px`, maximum visible height `540px` before internal scrolling.
- Execution HUD: fixed compact dimensions; dynamic text must wrap or truncate without shifting controls.
- Checkpoint review: preferred width `480px`, usable range `420-560px`.
- Main window: preferred minimum `920x640`; collapse secondary metadata before reducing primary result space.
- Overlays must remain fully visible inside the active display's safe area and account for multiple monitors.

### Installation website

- Breakpoints: narrow below `720px`, standard `720-1079px`, wide from `1080px`.
- Navigation condenses on narrow screens, but the download action remains visible.
- The first viewport shows the Doon name, literal product offer, download action, and real product visual with a hint of the next section.
- On mobile, explain that Doon installs on desktop and offer a non-blocking way to continue later; do not imitate a desktop download.
- Product screenshots keep a stable aspect ratio and must not be heavily cropped or blurred.

## Interaction states

### Loading

- Distinguish request interpretation from computer execution.
- Show the current stage, last completed event, and whether user input is required.
- Avoid fake percentages when work cannot be measured reliably.

### Empty

- Command palette: focus the input and show no more than three outcome-oriented examples.
- Activity: explain that completed and interrupted work will appear here after the first task.
- Memory: state that nothing has been learned or saved and link to the memory policy.

### Error

- Name the failed stage and user-visible consequence.
- Preserve completed work and show retry, alternate path, or manual takeover when available.
- Do not expose raw stack traces in the default view.

### Success

- State the completed outcome first.
- List created, changed, sent, or saved items.
- Offer direct access to the result when possible.
- Do not use celebratory animation for routine completion.

### Disabled

- Explain missing permission, unavailable context, unsupported action, or conflicting state.
- Do not leave consequential controls disabled without a discoverable reason.

### Offline or slow network

- Distinguish local work that can continue from remote work that is blocked.
- Preserve task state and explain whether Doon will retry or wait for user action.

## Content voice

### Tone

- Direct, calm, specific, and concise
- Confident only about observed state
- Transparent about uncertainty, failure, and side effects
- Helpful without pretending to be human

### Terminology

- Use `task` for the user's overall requested outcome.
- Use `stage` for an outcome-level unit of work.
- Use `action` only for low-level execution detail.
- Use `review` for a user decision on a stage result.
- Use `permission` for durable access and `confirmation` for a specific consequential effect.

Korean UI should consistently use:

- 작업
- 단계
- 결과 확인
- 승인하고 계속
- 수정 요청
- 일시정지
- 다시 시작
- 중단
- 완료

### Microcopy rules

- Lead with the result: `문서 초안을 만들었습니다.`
- Name the blocker: `이 폴더에 접근할 권한이 필요합니다.`
- Name the consequence: `승인하면 이 메시지가 상대방에게 전송됩니다.`
- Avoid vague status: `처리 중`, `무언가 잘못되었습니다`, `AI가 생각 중입니다.`
- Avoid false certainty: replace `완벽하게 완료했습니다` with the verified outcome.
- Button labels describe the action; do not use `확인` or `예` when a more specific label fits.

## Installation website direction

This surface is intentionally lower priority than the desktop product but must not be forgotten. It is part of the installation and trust journey.

### First viewport

- H1: `Doon`
- Supporting offer: `하고 싶은 일을 말하면, Doon이 컴퓨터에서 끝냅니다.`
- Primary action: `Download for macOS`
- Supporting metadata: current version, system requirement, signed and notarized status
- Primary visual: a real command-to-checkpoint-to-result product recording or screenshot sequence
- Hero text sits directly over or beside the real product scene without being placed in a decorative card.

### Required content bands

1. Real product workflow
2. User control and stage reviews
3. Privacy and permission model
4. Installation steps and system requirements
5. Download and release information

### Homepage guardrails

- The page sells a working desktop product, not a future AI vision.
- Doon and the download action are first-viewport signals.
- Use actual product state and outcomes as proof.
- Avoid generic feature-card grids, abstract AI imagery, and testimonial sections before real users exist.
- Keep a hint of the next content band visible on common desktop and mobile viewports.
- Download failure, unsupported operating system, outdated OS, and update states need explicit designs.

## Do and do not

### Do

- Design around the user's current task and current application.
- Keep the current goal and state readable at a glance.
- Use real previews, diffs, targets, and consequences.
- Keep recovery and interruption visible.
- Show access scope and stored memory in plain language.
- Use restrained semantic color and system-native behavior.
- Use glass only when underlying context helps the user understand scope, progress, or control handoff.
- Make the active application visibly refract through glass; a nearly opaque white panel does not satisfy the material direction.
- Keep the soft yellow identity sparse enough that it still identifies the next primary action.
- Keep each default task surface focused on one result or decision and disclose supporting detail only when requested.
- Validate desktop overlays on small displays and multiple monitors.

### Do not

- Turn raw action logs into the primary progress interface.
- Ask for approval without a result or consequence to judge.
- Let an overlay cover the object Doon is operating on.
- Resume control silently after user input.
- Use color alone for status or risk.
- Apply transparency to long reading surfaces, document previews, or nested containers.
- Put more than three information groups or more than two visible text actions in a transient task surface.
- Use yellow as a page background, large decorative wash, or low-contrast body text.
- Hide partial completion when a later stage fails.
- Copy Raycast, Apple, Linear, or Zapier tokens and visual signatures directly.
- Build the installation homepage before the desktop product has a truthful visual to show.

## Implementation constraints

- **Desktop framework:** Electron + React + TypeScript + Vite is selected for the MVP, with a minimal Swift helper for native macOS control. Follow [`TECH-STACK.md`](./TECH-STACK.md); the implementation must support accessibility APIs, global shortcuts, menu bar presence, system permissions, multi-window behavior, notifications, and a later signing path. The three-day MVP artifact itself is unsigned and unnotarized.
- **Website framework:** not selected; defer implementation until the desktop product has a stable download artifact and real product media.
- **Design tokens:** implement the semantic token names from this document before adding component-specific colors.
- **Performance:** command palette should appear immediately after the global shortcut; expensive context gathering begins after the surface is visible.
- **Overlay safety:** overlays must avoid focus theft, controlled content occlusion, and pointer conflicts.
- **Privacy:** default interface must not expose secrets, full raw screen captures, or sensitive content in history previews.
- **History retention:** completed, failed, and cancelled task history expires after 30 days; task-linked minimal action history in SQLite expires after 7 days. Separate taskless diagnostic files contain no task ID or user content and also expire after 7 days. Deleting a task must cascade through its stages, approvals, revisions, and task-linked action history without deleting the user's generated document.
- **Renderer isolation:** Electron renderer windows must use context isolation, sandboxing, disabled Node integration, a restrictive CSP, and a narrow typed preload API. Privileged APIs and arbitrary IPC channels are never exposed to the renderer.
- **Execution policy:** each GUI action must remain bound to the approved app, registered window, account confirmation, web origin, opaque output-folder capability, and action budget defined for the current stage.
- **Compatibility:** macOS is the first supported environment; dark and light system appearance are both required.
- **Localization:** Korean is first-class; layout and controls must remain valid in English.
- **Testing:** every stateful component requires keyboard, focus, reduced-motion, light/dark, error, and long-Korean-text checks.
- **Visual QA:** desktop surfaces must be screenshot-tested at `1280x720`, `1440x900`, and a wide display. The installation website must be tested at narrow, standard, and wide breakpoints.

## Open questions

- [ ] Validate the Electron overlay and Swift helper boundary in a packaged arm64 prototype / Engineering / determines whether the selected stack satisfies native control and window behavior
- [ ] Select the Doon logo and final brand mark / Product and Design / affects iconography and installation website
- [ ] Validate Soft Amber Glass tokens against varied wallpapers and applications in light, dark, increased-contrast, and reduced-transparency modes / Design / affects contrast and brand recognition
- [ ] Choose global pause and emergency-stop shortcuts / Product and Engineering / affects safety and accessibility
- [ ] Decide local-versus-remote processing disclosures / Engineering and Security / affects onboarding and website copy
- [ ] Define signed installer, update mechanism, system requirements, and release metadata / Engineering / blocks installation website completion
- [ ] Produce a truthful desktop product recording before designing the website hero / Product and Design / blocks final website visual direction
