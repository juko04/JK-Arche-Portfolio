# Project Guidelines & Motion Standards (GSAP & Emil Kowalski Design Engineering)

This repository adheres to strict standards for architectural visual design, GreenSock (GSAP) motion engineering, and Emil Kowalski design craft. All AI agents and pair programmers working in this codebase must observe the following rules:

---

## 1. GSAP Animation & Motion Engineering Rules

*(Derived from [GreenSock Official Agent Skills](https://github.com/greensock/gsap-skills))*

### A. Modern Syntax & Architecture
- **GSAP 3 Only:** Always use modern GSAP 3 syntax (`gsap.to()`, `gsap.from()`, `gsap.fromTo()`, `gsap.timeline()`). Never introduce legacy `TweenMax`, `TweenLite`, or `TimelineMax`.
- **Plugin Registration:** Always explicitly register plugins before use:
  ```javascript
  gsap.registerPlugin(ScrollTrigger, Flip, Draggable, Observer);
  ```
- **Context & Lifecycle Management:** Use `gsap.context()` when binding animations to specific DOM containers to guarantee clean memory teardown and prevent duplicate trigger leaks:
  ```javascript
  const ctx = gsap.context(() => {
    // animations here
  }, containerElement);
  
  // Clean up on component/view teardown:
  ctx.revert();
  ```

### B. 60fps Hardware-Accelerated Performance
- **Transform Properties Only:** Animate using GPU-composited properties: `x`, `y`, `z`, `scale`, `scaleX`, `scaleY`, `rotation`, `skewX`, `autoAlpha`.
- **Never Animate Layout Properties:** Do not animate `top`, `left`, `right`, `bottom`, `width`, `height`, `margin`, or `padding` during scroll or frequent updates (prevents browser reflow/layout thrashing).
- **Use `autoAlpha`:** Prefer `autoAlpha` over `opacity` when hiding/showing elements (automatically toggles `visibility: hidden` at 0 opacity to stop render overhead and pointer capture).
- **`force3D: true`:** Use `force3D: true` for elements experiencing continuous translation or parallax.

### C. ScrollTrigger Best Practices
- **Smooth Damping:** Use numeric values for scrub (e.g. `scrub: 0.8` or `scrub: 1`) to provide silky momentum damping on wheel and trackpad scroll.
- **Responsive Invalidation:** Include `invalidateOnRefresh: true` on dynamic coordinate triggers.
- **Refresh on Asynchronous Assets:** Trigger `ScrollTrigger.refresh()` when images or fonts complete rendering.

---

## 2. Emil Kowalski UI Craft & Motion Philosophy

*(Derived from [Emil Kowalski's Design Engineering](https://emilkowal.ski/skill))*

### A. Easing & Directional Motion
- **Entering Elements:** ALWAYS use `ease-out` (e.g., `cubic-bezier(0.16, 1, 0.3, 1)` or GSAP `power3.out`). Elements must start fast and glide gracefully to rest.
- **Exiting Elements:** ALWAYS use `ease-in` (e.g., `cubic-bezier(0.7, 0, 0.84, 0)` or GSAP `power2.in`). Elements accelerate quickly offscreen.
- **NEVER use `ease-in` for entering elements** (causes perceived input lag).
- **NEVER use `linear` for physical motion** (feels unnatural).

### B. Micro-Interaction Duration Budgets
- **Button / Active State Feedback:** `80ms – 120ms`
- **Tooltips & Small Dropdowns:** `140ms – 200ms`
- **Modals, Drawers & Lightboxes:** `220ms – 320ms`
- **Avoid Long Sluggish Durations:** Micro-interactions should never make the user wait.

### C. Tactile Feedback & Elevation
- **Active Press Scale:** Buttons and interactive cards should depress slightly (`scale(0.975)`) on `:active`.
- **Layered Shadows:** Favor subtle, layered translucent shadows over harsh solid borders.

---

## 3. Skill & Customization Index

The workspace includes detailed, on-demand skills located in `.agents/skills/`:
- **`emil-design-eng`**: Core UI craft, micro-interactions, and visual polish rules.
- **`emil-animate`**: Spring physics formulas, clip-path reveals, and timing recipes.
- **`find-animation-opportunities`**: 4-stage gate audit to find high-leverage motion opportunities and reject clutter.
- **`pick-ui-library`**: Curated, zero-bloat frontend library recommendations.
- **`gsap`**: GSAP 3 core engine, timelines, and GPU performance optimization.
- **`gsap-scrolltrigger`**: Advanced scroll-driven motion, pinning, parallax, and scrubbed transitions.
