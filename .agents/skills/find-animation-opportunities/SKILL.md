---
name: find-animation-opportunities
description: >-
  Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't.
  Read-only analysis; proposes motion with exact values without writing intrusive code.
  Use when the user asks "what could be animated here?", "how can we make this feel more alive?",
  or wants to discover subtle, tasteful animation opportunities.
---

# Finding Animation Opportunities

This skill audits interfaces to identify high-leverage moments where subtle motion will elevate the user experience—while strictly filtering out unnecessary, sluggish, or decorative animations.

---

## 1. Operating Posture & The Principle of Restraint

> *"Sometimes the best animation is no animation."* (Emil Kowalski)

An opportunity finder that suggests motion everywhere produces the bloated, laggy interfaces this skill exists to prevent. This skill functions as a **filter first, finder second**. Most candidates will be rejected. A concise list of 2–4 high-conviction, subtle opportunities beats a long wishlist.

---

## 2. The 4-Stage Gate

Every candidate interaction must pass all four criteria in sequence:

### Stage 1: Frequency — How often does the user see or interact with this?

| Frequency | Verdict | Action |
| :--- | :--- | :--- |
| **100+ times/day** (keyboard shortcuts, quick nav, search typing) | **REJECT** | Zero animation. Must feel instant. |
| **Tens of times/day** (hover states, primary list toggles) | **Strictly Filtered** | Only near-imperceptible, instant feedback (`80ms–150ms`). |
| **Occasional** (modals, drawers, lightboxes, filter tabs) | **ELIGIBLE** | Standard refined animation (`180ms–300ms`). |
| **Rare / First-Time** (onboarding, hero entrance, success celebration) | **ELIGIBLE** | Controlled delight budget. |

*Rule:* Keyboard-initiated navigation, search filters, and high-speed actions should never wait on animations.

---

### Stage 2: Purpose — Why does this animate?
The motion must fulfill at least one explicit purpose:
1. **Feedback:** Confirming the UI registered user input (tactile press scale, active state color shift).
2. **Spatial Consistency:** Explaining where an element came from or went (drawer sliding from its anchor, card expanding to modal).
3. **State Indication:** Making a mode change legible (day/night solar transition, accordion fold).
4. **Preventing Jarring Teleportation:** Softening abrupt content pop-in without slowing the eye.
5. **Direct Interaction:** Responding directly to 1:1 user drag, scroll, or cursor position.

*Rule:* "Because it looks flashy" is an immediate rejection.

---

### Stage 3: Speed & Duration Budget

| Interaction | Duration Limit | Easing / Physics |
| :--- | :--- | :--- |
| **Button / Link Press** | `80ms – 140ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Tooltips / Badges** | `120ms – 180ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Dropdowns / Filters / Selects** | `160ms – 220ms` | `cubic-bezier(0.2, 0.9, 0.1, 1)` |
| **Modals / Lightboxes / Dialogs** | `220ms – 300ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Scroll Scrubbing / Parallax** | Dynamic (1:1 with 0.5s–1s damping) | `scrub: 0.8` |

---

### Stage 4: Function — Does motion help or hinder?
- If animation blocks user input or adds cognitive delay: **REJECT**.
- If animation enhances spatial awareness and perceived quality: **ACCEPT**.

---

## 3. Recommended Output Format

When analyzing a page or component, present findings in this structured format:

```markdown
### 1. [Component Name] — [Interaction Type]
- **Target:** `selector or component`
- **Purpose:** Spatial Consistency / Feedback / State Indication
- **Frequency:** Occasional / Rare
- **Current State:** Instant jump / unstyled transition
- **Proposed Recipe:**
  - Property: `transform: scale(...)` or `autoAlpha`
  - Duration: `180ms`
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (or GSAP `power3.out`)
- **Why It Elevates the UI:** [1 sentence explanation]
```
