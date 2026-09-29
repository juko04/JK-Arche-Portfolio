---
name: emil-animate
description: >-
  Emil Kowalski's practical animation recipes, spring physics, duration rules, and animation audits.
  Use when building animations from scratch, converting CSS transitions to spring physics,
  auditing animation timing, creating clip-path reveals, or implementing smooth interactive gestures.
---

# Emil Kowalski — Animation Recipes & Spring Physics

This skill provides concrete recipes, physics constants, and code patterns for building silky, intentional animations based on Emil Kowalski's *animations.dev* teachings.

---

## 1. Spring Physics vs. Easing

Springs model real physical objects with mass, tension (stiffness), and friction (damping). They prevent awkward transitions when users interrupt an animation mid-flight.

### Standard Spring Presets

| Spring Profile | Stiffness | Damping | Mass | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Snappy / Tight** | `400` | `30` | `0.8` | Buttons, switches, toggles, badges |
| **Natural / Smooth** | `300` | `28` | `1.0` | Modals, dialogs, dropdowns, cards |
| **Gentle / Floating** | `180` | `22` | `1.2` | Large drawer drags, bottom sheets, image lightboxes |
| **Bouncy (Use Sparingly)** | `350` | `18` | `1.0` | Playful delight (e.g. confetti, celebration icons) |

### Rule on Bouncing:
> **Keep bounce under control.** In professional software (Linear, Apple, Vercel), 95% of UI animations should **not bounce**. Use critically damped or slightly underdamped springs that come to rest smoothly without oscillation.

---

## 2. Common Animation Recipes

### A. Polished Modal / Dialog Entrance & Exit
```css
/* Dialog Backdrop */
.modal-backdrop {
  opacity: 0;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.4);
  transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-backdrop[data-state="open"] {
  opacity: 1;
}

/* Dialog Container */
.modal-panel {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
  transition: 
    opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
.modal-panel[data-state="open"] {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.modal-panel[data-state="closing"] {
  opacity: 0;
  transform: scale(0.98) translateY(4px);
  transition: 
    opacity 140ms cubic-bezier(0.7, 0, 0.84, 0),
    transform 160ms cubic-bezier(0.7, 0, 0.84, 0);
}
```

### B. Clip-Path Luminous Curtain / Card Reveal
Smooth wipe reveal without pushing other elements:
```css
.reveal-curtain {
  clip-path: inset(0 0 100% 0 round var(--radius-sm));
  transition: clip-path 450ms cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-curtain.is-visible {
  clip-path: inset(0 0 0% 0 round var(--radius-sm));
}
```

### C. Staggered List Entrance
Stagger items with a tight delta (30ms–50ms between items, capped at 6 items):
```css
.stagger-item {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.stagger-container.is-visible .stagger-item:nth-child(1) { transition-delay: 0ms; opacity: 1; transform: translateY(0); }
.stagger-container.is-visible .stagger-item:nth-child(2) { transition-delay: 35ms; opacity: 1; transform: translateY(0); }
.stagger-container.is-visible .stagger-item:nth-child(3) { transition-delay: 70ms; opacity: 1; transform: translateY(0); }
.stagger-container.is-visible .stagger-item:nth-child(4) { transition-delay: 105ms; opacity: 1; transform: translateY(0); }
```

---

## 3. Review & Audit Framework

When auditing or reviewing code animations, flag these common antipatterns:
1. ❌ **Animating `left`/`top`/`margin`/`width`/`height`:** Triggers browser layout/reflow. Replace with `transform: translate3d()` and `transform: scale()`.
2. ❌ **`ease-in` on entrance:** Feels like software lagging before responding.
3. ❌ **Overly long durations (> 400ms for simple UI):** Makes users wait.
4. ❌ **Missing `will-change` cleanup:** Leaving `will-change: transform` on dozens of elements drains GPU memory. Only apply during active interaction or state change.
5. ❌ **Unresponsive hover exits:** When hover ends, return state quickly (100–150ms).
