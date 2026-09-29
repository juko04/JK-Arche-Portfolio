---
name: emil-design-eng
description: >-
  Emil Kowalski's design engineering philosophy, UI craft sensibility, and micro-interaction guidelines.
  Use when designing user interfaces, creating micro-interactions, tuning button/card feedback,
  improving layout aesthetics, choosing shadow/border layering, or auditing visual polish and tactile feel.
---

# Emil Kowalski — Design Engineering & UI Craft

This skill encodes the design engineering philosophy, craft sensibility, and invisible UI details articulated by Emil Kowalski (creator of Vaul, Sonner, animations.dev, former design engineer at Vercel and Linear).

---

## 1. Core Philosophy & Craft Sensibility

> *"Taste is not innate; taste is a trained instinct. The difference between software that is 'good enough' and software that feels exceptional is the accumulation of invisible details."*

1. **Restraint Over Decoration**: Never add animation just because you can. Every transition must communicate state change, spatial continuity, or physical feedback. If removing an animation makes the tool feel faster and just as clear, remove it.
2. **Speed & Responsiveness**: Interfaces must feel instantaneous. Feedback on click/touch should happen on `pointerdown` or within 1 frame (0–16ms). Transitions should rarely exceed 200–300ms for micro-interactions.
3. **Physical Plausibility**: Elements enter and exit following physical laws—they accelerate, decelerate, have weight, and maintain spatial origin.

---

## 2. Easing & Curve Rules

### The Cardinal Rule of Easing:
- **ENTERING elements**: ALWAYS use `ease-out` (starts fast, glides smoothly to rest). The user initiated an action and expects immediate visible reaction; the deceleration gives the human eye time to process.
- **EXITING elements**: ALWAYS use `ease-in` or fast linear-out (starts slower, accelerates out of sight). The user already saw the content; dismissing it should be rapid.
- **MOVING elements (Point A to Point B)**: ALWAYS use `ease-in-out` or a smooth spring.
- **NEVER use `ease-in` for an entering element** (it feels sluggish and laggy).
- **NEVER use `linear` for physical movement** (it feels robotic and artificial).

### Custom Easing Constants (Emil’s Craft Palette)
Replace default browser easings with these refined cubic-bezier curves:

```css
:root {
  /* Fast & responsive - micro-interactions, tooltips, toggles */
  --ease-out-fast: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Smooth expressive - modals, dialogs, drawers, layout shifts */
  --ease-out-expressive: cubic-bezier(0.2, 0.9, 0.1, 1);
  
  /* Natural spring-like feel without bounce - dropdowns, popovers */
  --ease-out-natural: cubic-bezier(0.25, 1, 0.5, 1);
  
  /* Swift exit - element dismissals */
  --ease-in-swift: cubic-bezier(0.7, 0, 0.84, 0);
  
  /* State morphing - continuous spatial movement */
  --ease-in-out-smooth: cubic-bezier(0.65, 0, 0.35, 1);
}
```

---

## 3. Duration Guidelines

| UI Element / Interaction | Recommended Duration | Easing |
| :--- | :--- | :--- |
| **Button press / Active state** | `80ms – 120ms` | `--ease-out-fast` |
| **Hover state / Color / Shadow** | `120ms – 180ms` | `ease-out` |
| **Tooltips / Badges** | `150ms – 200ms` | `--ease-out-fast` |
| **Dropdown menus / Popovers** | `180ms – 240ms` | `--ease-out-expressive` |
| **Modals / Dialogs / Overlays** | `240ms – 320ms` | `--ease-out-expressive` |
| **Drawers / Bottom Sheets (Vaul style)** | `300ms – 400ms` | Physics spring (`damping: 25-30, stiffness: 300`) |
| **Page / Full-screen View Transitions** | `300ms – 450ms` | `--ease-out-expressive` |

---

## 4. Invisible UI Details & Recipes

### 1. Tactile Button Press (Scale & Depth)
Buttons should depress slightly on `:active`, giving physical feedback:
```css
.button {
  transition: transform 120ms var(--ease-out-fast), 
              box-shadow 120ms var(--ease-out-fast),
              background-color 150ms ease;
  transform: scale(1);
}

.button:hover {
  transform: scale(1.015);
}

.button:active {
  transform: scale(0.975);
  transition-duration: 60ms;
}
```

### 2. Layered Shadows Over Solid Borders
Solid 1px black borders look harsh and flat. Use multi-layered translucent shadows for natural elevation:
```css
/* Premium elevated card shadow */
.card-elevated {
  background: var(--bg-surface);
  box-shadow: 
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 2px 4px rgba(0, 0, 0, 0.02),
    0 8px 16px rgba(0, 0, 0, 0.04),
    0 16px 32px rgba(0, 0, 0, 0.04);
}

/* Dark mode subtle glow rim */
[data-theme="dark"] .card-elevated {
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 16px 32px rgba(0, 0, 0, 0.4);
}
```

### 3. Origin-Aware Popovers & Menus
Dropdowns and popovers should scale out from their trigger anchor, not from their center:
```css
.popover-from-top {
  transform-origin: top center;
  animation: popoverEnter 180ms var(--ease-out-fast) forwards;
}

@keyframes popoverEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### 4. Smooth Layout Morphing with FLIP
When an element moves from one place to another, avoid jumping. Animate using `transform: translate()` rather than `top`/`left`.

---

## 5. Craft Checklist

Before delivering any UI component or animation, verify:
- [ ] **Instant Feedback:** Does interactive feedback (hover/active) trigger without perceptible delay?
- [ ] **Correct Directional Easing:** Is the entrance using `ease-out` and exit using fast `ease-in`?
- [ ] **Hardware Acceleration:** Are animations strictly using `transform` and `opacity`? (Zero animating `width`, `height`, `margin`, `top`, `left`).
- [ ] **Subtle Scales:** Are scale animations subtle (`0.95` to `1.0` or `1.0` to `0.975`), avoiding cartoonish ballooning?
- [ ] **Reduced Motion Support:** Is `@media (prefers-reduced-motion: reduce)` respected with instant cuts or soft opacity fades?
- [ ] **Optical Balance:** Do icons, text baselines, and border-radii align optically rather than purely mathematically?
