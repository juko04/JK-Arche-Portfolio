/**
 * Julian Kotara — Haute Editorial Kinematic Runway Engine
 * GSAP 3 + ScrollTrigger Silky Damped Horizontal Scrub (scrub: 0.8)
 * Multi-Plane Architectural Parallax, Monograph Spreads & Scrubber HUD
 */

document.addEventListener('DOMContentLoaded', () => {
  initKinematicRunway();
});

function initKinematicRunway() {
  const pinWrapper = document.getElementById('runway-pin-wrapper');
  const track = document.getElementById('runway-track');
  const spreads = document.querySelectorAll('.runway-spread');
  const scrubberFill = document.getElementById('scrubber-fill');
  const scrubberTrack = document.getElementById('scrubber-track');
  const percentageReadout = document.getElementById('hud-percent');
  const chapterIndicator = document.getElementById('chapter-indicator-text');
  const chapterPills = document.querySelectorAll('.chapter-pill');
  const prevBtn = document.getElementById('hud-prev');
  const nextBtn = document.getElementById('hud-next');

  if (!pinWrapper || !track) return;

  // Fallback for environments where external CDN is unreachable
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    pinWrapper.style.overflowX = 'auto';
    pinWrapper.style.overflowY = 'hidden';
    pinWrapper.style.scrollBehavior = 'smooth';
    window.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        pinWrapper.scrollLeft += e.deltaY;
      }
    }, { passive: false });
    return;
  }

  // Explicitly register plugins per GSAP 3 standards
  gsap.registerPlugin(ScrollTrigger);

  // Emil Kowalski & GSAP Context for clean lifecycle management
  const ctx = gsap.context(() => {
    const totalDistance = () => track.scrollWidth - window.innerWidth;

    // Primary Horizontal Kinematic Runway Tween
    const runwayTween = gsap.to(track, {
      x: () => -totalDistance(),
      ease: 'none',
      scrollTrigger: {
        id: 'runway-scroll',
        trigger: pinWrapper,
        pin: true,
        scrub: 0.8, // Damped numeric scrub for buttery momentum
        invalidateOnRefresh: true,
        anticipatePin: 1,
        start: 'top top',
        end: () => `+=${totalDistance()}`,
        onUpdate: (self) => {
          updateHUD(self.progress);
        }
      }
    });

    // Multi-Plane Architectural Parallax (GPU-composited transforms)
    spreads.forEach((spread) => {
      const bgLinework = spread.querySelector('.bg-elevation-linework');
      const bgNumeral = spread.querySelector('.bg-ghost-numeral');
      const fgTypo = spread.querySelector('.parallax-fg');
      const heroMedia = spread.querySelector('.plate-hero-wrap img');

      if (bgLinework) {
        gsap.to(bgLinework, {
          xPercent: -30,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: pinWrapper,
            start: 'top top',
            end: () => `+=${totalDistance()}`,
            scrub: 0.8
          }
        });
      }

      if (bgNumeral) {
        gsap.to(bgNumeral, {
          xPercent: 20,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: pinWrapper,
            start: 'top top',
            end: () => `+=${totalDistance()}`,
            scrub: 0.8
          }
        });
      }

      if (fgTypo) {
        gsap.to(fgTypo, {
          xPercent: 16,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: pinWrapper,
            start: 'top top',
            end: () => `+=${totalDistance()}`,
            scrub: 0.8
          }
        });
      }

      if (heroMedia) {
        gsap.fromTo(heroMedia, 
          { scale: 1.05 },
          {
            scale: 1.0,
            ease: 'none',
            force3D: true,
            scrollTrigger: {
              trigger: pinWrapper,
              start: 'top top',
              end: () => `+=${totalDistance()}`,
              scrub: 0.8
            }
          }
        );
      }
    });

    // Opening Grand Reveal Animation
    gsap.from('.spread-frontispiece .monograph-kicker-bar, .spread-frontispiece .monumental-headline, .spread-frontispiece .frontispiece-body, .spread-frontispiece .runway-scroll-hint', {
      duration: 1.0,
      y: 30,
      autoAlpha: 0,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.1
    });

  }, pinWrapper);

  // ==========================================
  // HUD Scrubber & Chapter Tracking
  // ==========================================
  function updateHUD(progress) {
    const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
    if (percentageReadout) {
      percentageReadout.textContent = `${pct}%`;
    }
    if (scrubberFill) {
      scrubberFill.style.width = `${pct}%`;
    }

    // Determine current spread in view
    const currentScrollX = progress * (track.scrollWidth - window.innerWidth);
    let activeSpread = spreads[0];

    spreads.forEach((spread) => {
      // If the spread's start is within the visible window center
      if (spread.offsetLeft - window.innerWidth * 0.4 <= currentScrollX) {
        activeSpread = spread;
      }
    });

    if (activeSpread) {
      const chapterLabel = activeSpread.dataset.chapter || 'COVER // FRONTISPIECE';
      if (chapterIndicator) {
        chapterIndicator.textContent = chapterLabel;
      }

      // Sync active chapter pill
      chapterPills.forEach((pill) => {
        if (pill.dataset.target === activeSpread.id) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }
  }

  // ==========================================
  // Chapter Jump Pills
  // ==========================================
  function scrollToSpread(targetId) {
    const targetSpread = document.getElementById(targetId);
    if (!targetSpread) return;

    const trigger = ScrollTrigger.getById('runway-scroll');
    if (!trigger) return;

    const maxScroll = track.scrollWidth - window.innerWidth;
    const progress = Math.min(1, Math.max(0, targetSpread.offsetLeft / maxScroll));
    const targetScrollY = trigger.start + progress * (trigger.end - trigger.start);

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }

  chapterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const targetId = pill.dataset.target;
      if (targetId) {
        scrollToSpread(targetId);
      }
    });
  });

  // ==========================================
  // Directional Stepper Buttons (Prev / Next)
  // ==========================================
  function stepSpread(direction) {
    const trigger = ScrollTrigger.getById('runway-scroll');
    if (!trigger) return;

    const currentScrollX = trigger.progress * (track.scrollWidth - window.innerWidth);
    let currentIndex = 0;

    spreads.forEach((spread, idx) => {
      if (spread.offsetLeft - 50 <= currentScrollX) {
        currentIndex = idx;
      }
    });

    let nextIndex = currentIndex + direction;
    nextIndex = Math.max(0, Math.min(spreads.length - 1, nextIndex));

    scrollToSpread(spreads[nextIndex].id);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => stepSpread(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => stepSpread(1));
  }

  // ==========================================
  // Scrubber Track Click & Drag
  // ==========================================
  if (scrubberTrack) {
    scrubberTrack.addEventListener('click', (e) => {
      const rect = scrubberTrack.getBoundingClientRect();
      const clickRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));

      const trigger = ScrollTrigger.getById('runway-scroll');
      if (!trigger) return;

      const targetScrollY = trigger.start + clickRatio * (trigger.end - trigger.start);
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  }

  // ==========================================
  // Keyboard Accessibility (Arrow Left / Right)
  // ==========================================
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      stepSpread(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      stepSpread(-1);
    } else if (e.key === 'Home') {
      scrollToSpread(spreads[0].id);
    } else if (e.key === 'End') {
      scrollToSpread(spreads[spreads.length - 1].id);
    }
  });

  // Window resize handler: recalculate ScrollTrigger metrics
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
}
