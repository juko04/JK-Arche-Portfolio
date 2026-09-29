---
name: pick-ui-library
description: >-
  Pick the right library for a given frontend task from a curated, opinionated list — numbers, OTP inputs,
  charts, command menus, virtualization, drag and drop, toasts, state, styling, and motion.
  Use when deciding which library, tool, or UI primitive to use for a specific frontend task.
---

# Picking The Right UI Library (Emil Kowalski’s Curated Stack)

This skill provides opinionated, production-tested library recommendations for frontend development. When asked what to use for a component or interaction, recommend from this curated list to maintain elite craft standards.

---

## 1. Operating Rules

1. **Identify the Underlying Need:** Match the fundamental user task (e.g. accessible dialog, gesture physics, smooth layout shift) rather than just keyword matching.
2. **One Clear Recommendation:** Recommend the single best library with a 1-sentence rationale. Avoid overwhelming option matrices unless specifically requested.
3. **Favor Zero-Bloat & Primitives:** Choose headless primitives and performant micro-libraries over heavy all-in-one UI frameworks.

---

## 2. The Curated Library Directory

### A. UI Components & Headless Primitives

| Task | Recommended Library | Why |
| :--- | :--- | :--- |
| **Unstyled Accessible Primitives** (dialogs, popovers, menus, selects) | **[Base UI](https://base-ui.com)** or **[Radix UI](https://www.radix-ui.com)** | World-class accessibility, unstyled for full CSS control, reliable keyboard navigation. |
| **Command Palettes (⌘K)** | **[cmdk](https://cmdk.paco.me)** | Fast, unstyled, composable command menu built by Paco Coursey. |
| **Toasts & Notifications** | **[Sonner](https://sonner.emilkowal.ski)** | Stacked, interactive, expandable physics-based toast notifications by Emil Kowalski. |
| **Bottom Sheets & Mobile Drawers** | **[Vaul](https://vaul.emilkowal.ski)** | Gesture-driven iOS-style drawer with physics dismissal and scaling backdrops. |
| **OTP / Pin Verification Inputs** | **[input-otp](https://input-otp.rodz.dev)** | Accessible, zero-friction one-time passcode inputs with full styling freedom. |
| **Context Menus & Dropdowns** | **Radix UI Dropdown / Base UI Menu** | Focus trapping, collision detection, and screen edge repositioning out of the box. |

---

### B. Animation, Motion & Gestures

| Task | Recommended Library | Why |
| :--- | :--- | :--- |
| **Complex Timelines & Scroll Orchestration** | **[GSAP](https://gsap.com) + ScrollTrigger** | Unmatched performance, subpixel rendering, scroll scrubbing, pinning, and timeline sequencing. |
| **React Component Motion & Layout FLIP** | **[Motion (Framer Motion)](https://motion.dev)** | Declarative React motion, spring physics, and effortless `layoutId` transitions. |
| **Direct Touch & Gesture Dragging** | **GSAP Draggable / [@use-gesture](https://use-gesture.netlify.app)** | High-frequency pointer tracking with velocity and inertia momentum. |
| **Smooth Momentum Page Scroll** | **[Lenis](https://lenis.darkroom.engineering)** | Lightweight, non-intrusive smooth scroll that integrates flawlessly with GSAP ScrollTrigger. |

---

### C. Data Visualization, Layout & Utilities

| Task | Recommended Library | Why |
| :--- | :--- | :--- |
| **Charts & Graphs** | **[Recharts](https://recharts.org)** / **[LayerChart](https://layerchart.com)** | Composable SVG components with full CSS styling integration. |
| **Virtualization (Long Lists/Grids)** | **[TanStack Virtual](https://tanstack.com/virtual)** | Headless, ultra-fast DOM recycling for massive lists without memory leaks. |
| **Icons** | **[Lucide Icons](https://lucide.dev)** | Consistent, clean 24×24 vector stroke icons designed for modern UI. |
| **Date & Time Calculations** | **[date-fns](https://date-fns.org)** | Modular, tree-shakeable functional date manipulation. |
| **Solar / Daylighting Calculations** | **[SunCalc](https://github.com/mourner/suncalc)** | Precise mathematical sun azimuth, altitude, golden hour, and twilight positions. |
