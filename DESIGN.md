---
name: Log Horizon
description: A quiet diary with warm stone light surfaces and graphite dark surfaces and a stationary Pile writing line.
colors:
  canvas: "#eeebe6"
  page: "#faf8f4"
  sidebar: "#eeebe6"
  text: "#35312d"
  muted: "#696057"
  line: "#e3ded6"
  field: "#efebe5"
  hover: "#e8e2d9"
  selected: "#e4ddd3"
  accent: "#35312d"
  button-text: "#faf8f4"
  danger: "#a63530"
  error-bg: "#fff0ee"
  shade: "rgb(0 0 0 / 18%)"
  dark-canvas: "#17191c"
  dark-page: "#202327"
  dark-sidebar: "#25292e"
  dark-text: "#e2e5e9"
  dark-muted: "#adb5bf"
  dark-line: "#373e46"
  dark-field: "#2b3036"
  dark-hover: "#373e46"
  dark-selected: "#353e48"
  dark-accent: "#e2e5e9"
  dark-button-text: "#202327"
  dark-danger: "#ffaaa1"
  dark-error-bg: "#3c2422"
  dark-shade: "rgb(0 0 0 / 45%)"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.8
  dialog-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "20px"
    fontWeight: 500
    letterSpacing: "-0.025em"
  navigation:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 400
  metadata:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "11px"
    fontWeight: 400
rounded:
  control: "999px"
  surface: "24px"
  entry: "16px"
  popover: "18px"
  field: "12px"
spacing:
  shell: "8px"
  control-gap: "8px"
  section: "20px"
  dialog: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.button-text}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-secondary:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-icon:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    height: "34px"
    width: "34px"
    padding: "0"
  password-input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
  entry-navigation:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.text}"
    rounded: "{rounded.entry}"
    padding: "12px"
  thought-input:
    textColor: "{colors.text}"
    typography: "{typography.body}"
  dialog:
    backgroundColor: "{colors.page}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
    padding: "24px"
    width: "min(480px, calc(100vw - 32px))"
  choice-group:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.control}"
    padding: "3px"
  size-stepper:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.control}"
    padding: "2px"
  switch:
    backgroundColor: "{colors.selected}"
    rounded: "{rounded.control}"
    width: "36px"
    height: "22px"
    padding: "3px"
---

# Design System: Log Horizon

## Overview

**Creative North Star: "A quiet diary, plain writing."**

A quiet diary with rounded modern controls, warm stone light surfaces and graphite dark surfaces, and plain writing. The main page is a softly rounded surface within a narrow canvas inset. Interface sizing and corner treatment draw on the user’s Loftlyy reference without importing decorative content.

Writing is the focus: system sans-serif by default, optional titles, no date heading or decorative prompt. Freewrite is continuous text; Pile is a flowing page of thoughts with a stationary borderless input beneath a moving thought history.

**Key Characteristics:**
- Warm stone light and graphite dark surfaces.
- Rounded 24px surfaces and compact pill controls.
- Borderless system-sans writing with optional titles.
- Animated overlay history without moving the writing column.
- Plain thoughts, a stationary input, and quiet icon save states.

## Colors

The frontmatter records exact light tokens and their `dark-` counterparts. Warm pale stone `page` sits within a deeper stone `canvas`; the dark theme uses cool neutral graphite surfaces. `sidebar` and `field` distinguish navigation and controls. `text` and `muted` provide the hierarchy; `line`, `hover`, and `selected` separate and identify states. `accent` is neutral, used for primary actions and enabled switches. Error ink and error wash are the only expressive colors. `shade` dims modal and drawer backdrops.

## Typography

System sans-serif is the default for both writing and interface. Writing begins at 18px with 1.8 line height and can be adjusted from 16–24px. Lato and Georgia/Times New Roman serif remain optional writing faces. Optional titles use the chosen writing family at 23px, weight 500, line height 1.5; narrow titles use 21px.

Navigation titles are 13px regular. Control labels are generally 12px; metadata and save-state tooltips use compact supporting text. Dialog titles are 20px medium with slightly tight tracking. Empty-state headings are 24px medium system text. Do not introduce decorative display typography.

## Layout

The `100dvh` shell has an 8px canvas inset and a flexible main surface with 24px corners. A quiet 64px top toolbar holds only the navigation toggle and entry-actions menu, plus a lock icon while private entries are unlocked. Creation, writing settings, and privacy changes live in the menu or sidebar. The centered writing container is at most 760px wide, including 62px 44px 90px padding (672px maximum text width). The 36px status footer stays quiet at the bottom.

The entry drawer begins closed and overlays the left side at an 8px inset. It is 280px wide, limited to the viewport minus 40px, with a scrim behind it. Opening it never shifts the writing column. Dialogs are centered, at most 480px wide, and vertically scrollable within the viewport.

At 759px and below the toolbar becomes 60px high, writing padding becomes 38px 24px 65px, dialog padding becomes 20px, and metadata remains visible beneath thoughts. At 390px and below toolbar gaps and radio choices tighten further. Pile fills the available writing height. Its bottom-aligned history scrolls independently above a stationary 150px input slot, which reduces to 110px when viewport height is 600px or less. The textarea grows only up to 96px. Appending scrolls the history without changing the input’s vertical position. There is no date heading or decorative context above the writing. An optional title appears only when present or explicitly requested.

## Elevation & Depth

Depth comes from tonal surfaces and a small shadow vocabulary: popovers use `0 8px 24px rgb(0 0 0 / 8%)`; selected radio segments use `0 1px 3px rgb(0 0 0 / 7%)`; switch thumbs use `0 1px 3px rgb(0 0 0 / 14%)`. Main writing surfaces and dialogs have no decorative shadow.

The drawer translates and fades over 240ms with `cubic-bezier(.2,.8,.2,1)` while its scrim fades. Controls transition over 120ms; thought metadata and switch thumbs use 160ms transitions. Arriving thoughts fade and rise 8px over 180ms with ease-out. The saving spinner rotates over 0.8 seconds. Reduced motion disables transitions and animations.

## Shapes

The main page, drawer, and dialogs share a 24px surface radius. Compact controls are pills: header icon buttons are 34px, thought action icons are 28px, and primary/secondary and drawer creation controls are at least 36px. History rows use 16px corners, popovers 18px, and password fields/menu actions 12px. Writing remains borderless. Icons use simple unfilled strokes and rounded caps.

## Components

- **Freewrite:** an auto-growing borderless textarea with a short “Write…” placeholder, caret-only focus, and no surrounding rectangle. Optional titles use a thin focus underline.
- **Pile:** plain thoughts form a bottom-aligned, independently scrolling history, without bubbles or separators. Timestamp and labelled pencil/check/trash controls appear beneath thoughts on hover/focus; narrow screens keep them visible. Editing is inline with a bottom rule. The borderless input remains stationary in its reserved slot, with internal scrolling beyond 96px. A 30px “Add” pill appears only when the draft is nonempty. Enter adds a thought and Shift+Enter adds a line. New thoughts animate into the history; only history scrolls on append. The first delete click turns the same trash button into a red check on an error-wash background. A second click deletes; Escape, blur, or four seconds cancels. No confirmation row is added, and successful deletion returns focus to the input.
- **Navigation:** rounded rows contain type/lock icons, title, date, and type. Selection uses the selected fill. Search is a 36px pill with a focus-within ring. The drawer animates independently of the main page.
- **Menu rows:** every action pairs text with a 16px icon, including a dedicated export glyph. Icons use muted ink; destructive row icons inherit the danger color.
- **Buttons:** primary actions use neutral accent fill and contrasting text; secondary and creation actions use the field fill. Quiet actions have no resting fill. Disabled controls use 40% opacity. Button hover changes the surface or reduces primary opacity to 85%.
- **Focus:** standard controls use a 2px muted outline offset 3px; search uses a containing ring. Writing fields have no enclosing outline. Title focus changes its bottom border.
- **Settings:** custom pill radio groups replace native selects for appearance and font, with arrow-key navigation and a raised selected segment. Text size uses a minus/output/plus stepper with 16–24px bounds. Word count uses a 36px by 22px switch with a moving 16px thumb.
- **Saving:** a quiet check icon represents saved state. The check remains stable during brief saves; a spinner appears only after saving lasts 350ms. Failures show an alert/retry icon. Tooltips and screen-reader-only status text identify each state; aria-live is off to avoid repeated announcements. Persistent saved-status prose is absent.
- **Privacy and dialogs:** privacy changes are explicit menu actions; a header lock control appears while private entries are unlocked; locked rows conceal their titles and preserve date/type. Password fields use rounded inset fills and visible labels. Dialogs and settings use compact sections, with optional explanatory details collapsed.

## Do's and Don'ts

### Do:
- Do keep Freewrite and Pile input borderless on the page.
- Do keep the Pile input stationary while its thought history moves.
- Do use compact pill controls and the shared surface radius.
- Do retain accessible names for quiet icon states and controls.
- Do respect reduced-motion preferences for drawer, spinner, and state animations.

### Don't:
- Don’t add chat bubbles, a boxed composer, or a send-arrow treatment to Pile.
- Don’t add decorative prompts or date headings above writing.
- Don’t add blue or olive accents to the stone and graphite palette.
- Don’t move the writing column when the entry drawer opens.
