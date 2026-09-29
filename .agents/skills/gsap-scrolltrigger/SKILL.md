---
name: gsap-scrolltrigger
description: >-
  GSAP ScrollTrigger advanced patterns, parallax effects, pinned sections, scrubbed timelines, and scroll performance.
  Use when building scroll-driven animations, parallax effects, horizontal scroll sections, sticky pin interactions,
  scrubbed sun/daylight transitions, or optimizing scroll event performance.
---

# GSAP ScrollTrigger — Advanced Scroll-Driven Motion

This skill provides patterns, formulas, and best practices for creating smooth scroll-linked experiences using GSAP’s ScrollTrigger plugin.

---

## 1. Setup & Registration

Always register ScrollTrigger before creating any scroll-linked tweens:
```javascript
gsap.registerPlugin(ScrollTrigger);
```

---

## 2. Core ScrollTrigger Patterns

### A. Simple Entrance on Scroll (Trigger Once)
```javascript
gsap.from('.feature-card', {
  scrollTrigger: {
    trigger: '.feature-card',
    start: 'top 85%', // When top of element hits 85% of viewport
    toggleActions: 'play none none none', // Play once
    once: true
  },
  y: 40,
  autoAlpha: 0,
  duration: 0.8,
  ease: 'power3.out'
});
```

### B. Smooth Scrubbed Timeline (Linked to Scroll Position)
```javascript
const scrubTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: '.scroll-container',
    start: 'top top',
    end: '+=1000', // 1000px of scroll distance
    scrub: 1, // Smooth catch-up delay in seconds (1s damping)
    pin: true, // Pin the section while scrolling
    anticipatePin: 1
  }
});

scrubTimeline
  .to('.sun-indicator', { rotation: 180, ease: 'none' })
  .to('.lighting-overlay', { opacity: 0.8, ease: 'none' }, 0)
  .to('.project-model', { y: -100, ease: 'none' }, 0);
```

### C. Parallax Image / Diagram Layers
```javascript
gsap.utils.toArray('.parallax-image').forEach(img => {
  gsap.to(img, {
    yPercent: -20, // Move 20% relative to element height
    ease: 'none',
    scrollTrigger: {
      trigger: img,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.5
    }
  });
});
```

### D. Staggered Batch Reveals (Grid Items & Galleries)
Use `ScrollTrigger.batch` for efficient observation of many cards:
```javascript
ScrollTrigger.batch('.gallery-item', {
  onEnter: batch => gsap.to(batch, {
    autoAlpha: 1,
    y: 0,
    stagger: 0.08,
    overwrite: true
  }),
  start: 'top 90%',
  once: true
});
```

---

## 3. Critical ScrollTrigger Best Practices

1. **`scrub: 0.5` – `1` for Buttery Damping**:
   - Setting `scrub: true` links 1:1 with scroll position. Adding a small number like `0.5` or `1` introduces physics damping that smooths out jagged mouse wheels.
2. **`pinSpacing: true` (Default)**:
   - Preserves layout space so content below doesn't abruptly jump while an element is pinned.
3. **`invalidateOnRefresh: true`**:
   - Automatically recalculates dynamic values on window resize (essential for responsive layouts).
4. **Call `ScrollTrigger.refresh()` After Dynamic DOM Changes**:
   - If images or fonts load asynchronously after page load, call `ScrollTrigger.refresh()` to recalculate trigger positions.
5. **Always Kill or Revert on Dynamic Route Changes**:
   ```javascript
   ScrollTrigger.getAll().forEach(trigger => trigger.kill());
   ```

---

## 4. Architectural Portfolio Integrations

- **Solar & Time Scrubbing**: Link the sun's trajectory and dynamic shadows directly to page scroll or horizontal rail position.
- **Hero Reveal Sequence**: Smoothly unveil architectural renderings, kicker text, and typography as the user scrolls.
- **Horizontal Gallery Pinning**: Seamlessly convert vertical page scroll into horizontal project exploration.
