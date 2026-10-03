---
name: KTuner Assistant
description: A tuning loop that lives inside a Claude/ChatGPT-style conversation.
colors:
  bg: "#ffffff"
  bg-side: "#f9f9f9"
  bg-raised: "#ffffff"
  bg-soft: "#f4f4f4"
  bg-hover: "#ececec"
  ink: "#0d0d0d"
  ink-2: "#424242"
  ink-3: "#6b6b6b"
  line: "rgba(13, 13, 13, 0.1)"
  line-2: "rgba(13, 13, 13, 0.16)"
  code: "#f7f7f8"
  accent: "#5b45c2"
  accent-ink: "#ffffff"
  accent-soft: "rgba(91, 69, 194, 0.1)"
  ok: "#1a7f4b"
  ok-soft: "rgba(26, 127, 75, 0.1)"
  watch: "#9a6700"
  watch-soft: "rgba(191, 135, 0, 0.13)"
  stop: "#c62828"
  stop-soft: "rgba(198, 40, 40, 0.1)"
  none: "#5d5d5d"
  none-soft: "rgba(13, 13, 13, 0.06)"
  dark-bg: "#212121"
  dark-bg-side: "#171717"
  dark-bg-raised: "#262626"
  dark-bg-soft: "#2f2f2f"
  dark-bg-hover: "#3a3a3a"
  dark-ink: "#ececec"
  dark-ink-2: "#c8c8c8"
  dark-ink-3: "#9b9b9b"
  dark-code: "#1b1b1b"
  dark-accent: "#8b78e6"
  dark-ok: "#4ac381"
  dark-watch: "#e2b340"
  dark-stop: "#f0716a"
  dark-none: "#a3a3a3"
typography:
  display:
    fontFamily: "ui-sans-serif, -apple-system, system-ui, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "clamp(24px, 3.2vw, 30px)"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "ui-sans-serif, -apple-system, system-ui, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  title:
    fontFamily: "ui-sans-serif, -apple-system, system-ui, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "ui-sans-serif, -apple-system, system-ui, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "ui-sans-serif, -apple-system, system-ui, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, -apple-system, system-ui, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
  numeral:
    fontFamily: "ui-monospace, \"SF Mono\", SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  mono:
    fontFamily: "ui-monospace, \"SF Mono\", SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  bubble: "20px"
  composer: "26px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  turn: "28px"
  side: "260px"
  col: "768px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-default:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.bg-soft}"
  button-send:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    size: "36px"
  button-send-disabled:
    backgroundColor: "{colors.line-2}"
    textColor: "{colors.bg}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.sm}"
    size: "36px"
  icon-button-hover:
    backgroundColor: "{colors.bg-hover}"
    textColor: "{colors.ink}"
  composer:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.composer}"
    padding: "10px 10px 10px 12px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "38px"
  chip-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
  user-bubble:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.bg-raised}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  card-ask:
    backgroundColor: "{colors.accent-soft}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  pill-good:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "22px"
  pill-watch:
    backgroundColor: "{colors.watch-soft}"
    textColor: "{colors.watch}"
    rounded: "{rounded.pill}"
    height: "22px"
  pill-stop:
    backgroundColor: "{colors.stop-soft}"
    textColor: "{colors.stop}"
    rounded: "{rounded.pill}"
    height: "22px"
  pill-none:
    backgroundColor: "{colors.none-soft}"
    textColor: "{colors.none}"
    rounded: "{rounded.pill}"
    height: "22px"
  field-input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  side-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "38px"
  side-item-hover:
    backgroundColor: "{colors.bg-hover}"
---

# Design System: KTuner Assistant

## Overview

**Creative North Star: "The Familiar Chat"**

The world is the chat-assistant category canon played straight: the owner's brief pinned it ("copy it, do not invent"). A neutral grey sidebar on the left, one 768px reading column, a rounded composer at the bottom, and assistant turns that carry generative-UI cards instead of forms. Anyone who has used ChatGPT or Claude already knows where everything is; the novelty lives in what the cards say, not in how the shell looks.

Density is calm and conversational. Body text is 16px at 1.6 line-height; cards and tool rows step down to 13–14px so the numbers sit in a quieter register than the conversation. Hierarchy comes from weight (600 vs 400) and the three-step ink ramp, not from size jumps or colour. Colour is reserved: one indigo accent for send, focus, selection and primary action; four verdict colours that only ever appear inside a pill next to their word.

Light and dark are both first-class. Every token is a custom property on `:root`; dark follows `prefers-color-scheme` unless `[data-theme]` overrides it, and the dark values are the ChatGPT greys (#212121 / #171717 / #2f2f2f).

**Key Characteristics:**
- Category-canon shell: 260px sidebar, 768px centred thread, pill composer pinned to the bottom.
- System UI type everywhere; mono with tabular numerals for every number the owner might type into KTuner.
- One accent (indigo), four semantic verdict colours, everything else neutral grey.
- Hairline-bordered 12px cards; no shadows except the composer.
- The live work row: a shimmering "Reading your log…" line that collapses into "Worked for 1.1 s" with the tool steps behind a disclosure.

## Colors

Neutral greys carry the whole interface; colour only appears where it means something.

### Primary
- **Copilot Indigo** (`accent`; dark `dark-accent`): send button, primary buttons, focus outlines, links, citation markers, the "now" dot in the journey stepper, the ask-card border and tint, selected chips, the primary chart series and changed map cells. `accent-soft` is its 10% tint for selection, the ask card and driven map rows.

### Tertiary (semantic verdicts)
- **Healthy Green** (`ok` / `ok-soft`): the "good" verdict pill, completed tool ticks, ticked KTuner cells, saved-profile confirmation.
- **Caution Amber** (`watch` / `watch-soft`): the "watch" verdict pill, the "unchecked" tag on model thinking, chart marker lines.
- **Stop Red** (`stop` / `stop-soft`): the "stop" verdict pill, error banners, composer errors, stop note icons.
- **Unknown Grey** (`none` / `none-soft`): the "can't tell yet" and locked pills.

### Neutral
- **Canvas White / Chat Charcoal** (`bg` / `dark-bg`): main column and composer backdrop.
- **Sidebar Mist / Sidebar Black** (`bg-side` / `dark-bg-side`): the sidebar surface, one step off the canvas.
- **Raised** (`bg-raised`): card and file-chip fill; in dark it lifts one step above the canvas.
- **Soft Grey** (`bg-soft`): composer, user bubble, KTuner group headers, numbered-step discs, chart tracks, map grid cells.
- **Hover Grey** (`bg-hover`): hover fill for sidebar items and icon buttons; also the map-version pill.
- **Ink ramp** (`ink`, `ink-2`, `ink-3`): primary text, secondary text, and muted metadata/placeholder text.
- **Hairlines** (`line`, `line-2`): `line` for card borders and row dividers; `line-2` for control strokes (chips, round buttons, inputs), stepper rails and chart axes.
- **Code Well** (`code`): background of tool input/output `pre` blocks.

### Named Rules
**The One Accent Rule.** Indigo is the only hue that means "act here". Nothing decorative is ever indigo.

**The Pill-Carries-Its-Word Rule.** A verdict is shown as a pill (tinted background, coloured text, 6px dot) that always states its verdict in words. Outside pills, the verdict colours mark only state (a ticked cell, a passed tool, an error), never decoration, a card fill or a large field.

## Typography

**Body Font:** system UI stack (`ui-sans-serif, -apple-system, system-ui, "Segoe UI"…`)
**Label/Mono Font:** system mono stack (`ui-monospace, "SF Mono"…`) with tabular numerals

**Character:** The platform's own sans, deliberately unbranded, so the shell reads as the familiar chat tool; mono is the voice of the car's data.

### Hierarchy
- **Display** (600, clamp(24px, 3.2vw, 30px), -0.015em): the empty-state greeting only, balanced and centred.
- **Headline** (600, 17px, -0.01em): the title of the next-step card.
- **Title** (600, 14–15px): card and section headings, top-bar title, brand name; usually led by a 16px muted line icon.
- **Body** (400, 16px, 1.6): conversation prose and the user bubble. The thread column caps lines near 768px.
- **Body small** (400, 13.5–14px, 1.4–1.5): card content, option rows, tool rows, sidebar items.
- **Label** (600, 12–12.5px): verdict pills, sidebar group headings (sentence case, `ink-3`), table headers, stat captions.
- **Numeral** (mono 600, 18px, tabular): headline stats in the report card. Smaller mono (11–13px) for cell values, gauge names, tool names, timings, chart ticks and the map grid.

### Named Rules
**The Mono-Means-Number Rule.** Any value the owner reads off or types into KTuner (cells, gauges, stats, timings) is set in mono with tabular numerals. Prose never is.

**The Sentence-Case Rule.** Headings and labels are sentence case at normal tracking. No uppercase, no letter-spaced small caps.

## Layout

App shell is a full-height flex row (`100dvh`): fixed 260px sidebar, then a main column with a 52px top bar, a scrolling thread, and the composer pinned at the bottom. The thread is centred at max 768px with 20px side padding and 28px between turns; the composer is 40px narrower than the column and sits under a 24px fade from transparent to `bg`.

The empty state centres the greeting, a one-line subtitle (max 560px), the composer and a wrapped row of suggestion chips, with the group lifted by 12vh bottom padding.

User turns are right-aligned bubbles (max min(80%, 560px)); assistant turns are an avatar plus a flexible body with 14px internal gap. Inside cards, rhythm runs on 4 / 8 / 10–14px steps; rows are separated by hairlines, not gaps.

Responsive: at ≤1023px the sidebar becomes an off-canvas drawer (min(300px, 86vw)) with a 40% black scrim. At ≤640px the thread padding tightens to 14px, the assistant avatar is dropped, touch targets (send, attach, top-bar buttons, chips) grow to 44px, stats go 4 → 2 columns, the profile grid goes to one column, gauge tables reflow to labelled blocks, and the disclaimer hides.

## Elevation & Depth

Flat. Depth comes from tonal surfaces (sidebar one step off canvas, soft-grey wells, raised cards in dark) and 1px hairlines. There are two shadows and both are functional.

### Shadow Vocabulary
- **Composer lift** (`--shadow-composer`: `0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px var(--line)` light; hairline ring only in dark): the composer is the one floating object. Focus adds a `line-2` ring.
- **Drawer** (`0 0 40px rgba(0,0,0,0.2)`): the off-canvas sidebar on narrow screens, with its scrim.

### Named Rules
**The Only-The-Composer-Floats Rule.** Cards, bubbles, chips and pills never take a shadow. Separation is a hairline or a tone step.

## Shapes

Soft, consistent rounding on a short scale: 4px for tiny chips and bar tracks, 8px for controls (icon buttons, sidebar rows, inputs, code wells, error banners, KTuner groups and cells), 12px for cards and file chips, 20px for user bubbles, 26px for the composer, full pills for buttons, chips and verdict pills, and circles for send/attach, avatar and stepper dots. Borders are 1px hairlines; the only dashed line is the drop-target outline (1.5px accent) and chart reference series. Icons are 24-grid line SVGs, stroke 1.8, round caps and joins, 14–18px.

## Components

### Buttons
Quiet and round, like the chat tools they copy.
- **Shape:** full pill (999px), min-height 40px, 0 16px padding, 14px/600.
- **Default:** `ink` fill with `bg` text. **Primary:** accent fill with `accent-ink`. **Ghost:** transparent with a `line-2` stroke.
- **Hover / Focus:** filled buttons drop to 0.88 opacity; ghost gains a `bg-soft` fill. Focus is a 2px accent outline at 2px offset (global). Disabled is 0.4 opacity.
- **Send:** 36px accent circle with an up-arrow; disabled turns `line-2` grey; presses scale to 0.94. **Attach:** 36px circle with `line-2` stroke.
- **Icon button:** 36px, 8px radius, `ink-3`, hover to `bg-hover` and `ink`.
- **Link button:** accent text, underlined at 3px offset ("Show all 6 options").

### Chips
- **Style:** pill, 38px tall, 1px `line-2` stroke, transparent, 14px `ink-2`, optional 16px leading icon.
- **State:** hover fills `bg-soft`; selected (`.on`) takes an accent stroke and `accent-soft` fill. Used for suggestions under the composer and after a turn, and for answer options in the ask card.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `bg-raised`.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px `line`.
- **Internal Padding:** 14px 16px. Heading row is 14px/600 with a 16px `ink-3` icon and an optional right-aligned pill.
- **Ask card:** the human-in-the-loop question; accent border, `accent-soft` fill, chips sit on `bg-raised`.
- **Section:** the same heading and body without a box, for plain parts of a turn.

### Inputs / Fields
- **Composer:** `bg-soft` fill, 26px radius, composer shadow, borderless auto-growing textarea (max 200px), attach left, send right, muted hint between.
- **Field:** 40px, 8px radius, 1px `line-2`, `bg` fill, 14.5px text, label above in 13px `ink-3`.
- **Focus:** 2px accent outline. **Error:** 13px `stop` text under the composer; banner errors use `stop-soft` with `stop` text.

### Navigation
- **Sidebar:** brand mark (26px `ink` tile, 8px radius) and collapse toggle, then 38px rows (icon + 14px label, 8px radius, hover `bg-hover`). Groups are headed by 12px/600 `ink-3` sentence-case labels. A `bg-hover` map-version pill sits under the car summary. Export/Import live in a footer above a hairline.
- **Journey stepper:** 15px circle dots on a 1px `line-2` rail; done = filled `ink-3` with a check, now = accent ring with bold label and a muted sub-line, upcoming = hollow.
- **Mobile:** sidebar becomes a drawer; the top bar shows menu, car and Map version.

### Verdict Pill
22px pill, 12.5px/600, 6px leading dot in `currentColor`, tinted background from the matching `-soft` token. Four states: good, watch, stop, none.

### Work Row (signature)
While tools run: a 14px spinner and a shimmering `ink-3`→`ink` gradient line naming the current step ("Reading your log…"). When done it collapses to a disclosure ("Worked for 1.1 s") with a chevron that rotates 90°; inside, tool rows (green tick, label, mono name, mono timing) hang off a 1px `line-2` rail and open to mono input/output wells on `code`.

### KTuner Card
Groups of cells to type, each group a hairline box with a `bg-soft` header and mono table tags; cells are 40px tiles in an auto-fill grid (min 150px) with a checkbox, muted column label and mono value; a ticked cell turns `ok` stroke on `ok-soft`.

### Charts
Inline SVG plots: axes `line-2`, grid `line`, 11px mono ticks, the primary series a 2px accent line, the comparison series a 1.5px dashed `ink-3`, markers dashed `watch`. Horizontal bars use `bg-soft` tracks with `line-2` fills and accent for the highlighted bar. Map grids are 11px mono cells on `bg-soft`, driven rows `accent-soft`, changed cells solid accent.

## Do's and Don'ts

### Do:
- **Do** keep the shell identical to the chat category: 260px sidebar, 768px thread, pill composer at the bottom.
- **Do** use `accent` only for send, primary action, focus, links, selection and the current journey step.
- **Do** put every verdict in a pill with its word, coloured from the matching `-soft` / text pair.
- **Do** set every number the owner reads or types in mono with tabular numerals.
- **Do** separate card rows with 1px `line` hairlines and keep cards at 12px radius with no shadow.
- **Do** define colours only as the `:root` custom properties and give each a dark value under both `prefers-color-scheme` and `[data-theme="dark"]`.
- **Do** grow touch targets to 44px at ≤640px.

### Don't:
- **Don't** add shadows to cards, bubbles, chips or pills; only the composer and the mobile drawer float.
- **Don't** use verdict colours as card fills, card borders or decoration; they mark verdicts and state only.
- **Don't** introduce a brand display face; the system stack is the type.
- **Don't** put uppercase or letter-spaced labels above headings; headings stand on their own in sentence case.
- **Don't** rebuild the old dashboard-of-forms arrangement; inputs arrive as cards inside an assistant turn.
