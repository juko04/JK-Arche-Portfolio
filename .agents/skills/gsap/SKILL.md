---
name: gsap
description: >-
  GreenSock Animation Platform (GSAP 3) core architecture, timelines, performance optimization, and plugins.
  Use when creating GSAP tweens, timeline choreography, staggered reveals, buttery smooth hardware-accelerated animations,
  integrating GSAP plugins (Flip, Draggable, Observer, SplitText), or debugging animation performance.
---

# GSAP (GreenSock Animation Platform) — Core & Architecture

This skill provides modern GSAP 3 patterns, timeline choreography, performance rules, and plugin integrations for building production-grade animations.

---

## 1. Modern GSAP 3 Core Syntax

Always use modern GSAP 3 methods (`gsap.to()`, `gsap.from()`, `gsap.fromTo()`, `gsap.timeline()`). Never use legacy TweenMax/TweenLite syntax.

### A. Basic Tweens
```javascript
// Animate to target state
gsap.to('.hero-title', {
  y: 0,
  autoAlpha: 1, // Combines opacity + visibility: visible for clean rendering
  duration: 0.8,
  ease: 'power3.out'
});

// Animate from initial state to natural CSS state
gsap.from('.project-card', {
  y: 30,
  opacity: 0,
  duration: 0.6,
  stagger: 0.08, // Stagger elements sequentially
  ease: 'power2.out'
});

// Explicit From-To (prevents flash of unstyled content / initial jump)
gsap.fromTo('.badge', 
  { scale: 0.8, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' }
);
```

### B. Timelines (Sequencing & Choreography)
Use timelines for synchronized or sequential multi-element animations:
```javascript
const tl = gsap.timeline({
  defaults: {
    duration: 0.6,
    ease: 'power3.out'
  },
  onComplete: () => console.log('Choreography finished')
});

tl.from('.nav-monogram', { y: -20, autoAlpha: 0 })
  .from('.nav-links a', { y: -10, autoAlpha: 0, stagger: 0.05 }, '-=0.3') // 0.3s overlap
  .from('.hero-headline', { y: 40, autoAlpha: 0, duration: 0.8 }, '-=0.2')
  .from('.project-rail', { x: 50, autoAlpha: 0, duration: 0.9 }, '<0.2'); // Starts 0.2s after previous start
```

---

## 2. GSAP Easing Cheatsheet

| GSAP Ease | CSS Equivalent | Best Use Case |
| :--- | :--- | :--- |
| `power3.out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard entrance animations, cards, modals |
| `power2.out` | `cubic-bezier(0.25, 1, 0.5, 1)` | Fast micro-interactions, subtle reveals |
| `power4.out` | `cubic-bezier(0.08, 1, 0.2, 1)` | High-drama cinematic entrance |
| `power2.in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Rapid exit / dismissal animations |
| `expo.out` | `cubic-bezier(0.19, 1, 0.22, 1)` | Premium luxury UI feel |
| `back.out(1.2)` | Slight overshoot spring | Playful micro-feedback (badges, checkmarks) |
| `none` | `linear` | Endless continuous rotations, marquee tickers, color cycles |

---

## 3. High-Performance Animation Rules

1. **Hardware-Accelerated Properties**:
   - Prefer: `x`, `y`, `z`, `scale`, `scaleX`, `scaleY`, `rotation`, `skewX`, `autoAlpha`.
   - Avoid: `top`, `left`, `bottom`, `right`, `width`, `height`, `margin`, `padding` (triggers layout reflow).
2. **`autoAlpha` Over `opacity`**:
   - `autoAlpha: 0` automatically sets `visibility: hidden` when opacity hits 0, preventing hidden elements from blocking clicks and saving browser paint cycles.
3. **`force3D: true`**:
   - Forces GPU composition layering (`translate3d`), eliminating subpixel jitter during movement.
4. **Context & Cleanups (`gsap.context()`)**:
   - Encapsulate animations in a context to cleanly revert/destroy on route change:
   ```javascript
   const ctx = gsap.context(() => {
     gsap.to('.box', { x: 100 });
   }, containerRef);
   
   // Cleanup when unmounting or switching views:
   ctx.revert();
   ```

---

## 4. Key GSAP Plugins

- **Flip Plugin**: Seamlessly animates layout changes between state switches (e.g. grid to list view, expanding cards).
  ```javascript
  const state = Flip.getState('.card');
  card.classList.toggle('expanded');
  Flip.from(state, { duration: 0.5, ease: 'power3.inOut', scale: true });
  ```
- **Draggable**: Physics-based dragging with inertia/momentum and bounds.
- **Observer**: Unified touch, pointer, and wheel gesture listener for custom interactive sliders and page snapping.
