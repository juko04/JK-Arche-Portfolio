/**
 * Julian Kotara — The Heliostat Sun-Clock & Ray Caster Engine
 * Site 2: The Sun-Clock Pavilion & Heliostat Compass
 * 
 * Interactive 360° Solar Compass, Dynamic Trigonometric Cast Shadows,
 * CCT Daylight Transitions & Quantitative Solar Metrics.
 * 
 * Adheres strictly to GSAP 3 performance & Emil Kowalski design engineering.
 */

(function () {
  'use strict';

  // Solar Coordinates & State
  const solarState = {
    azimuth: 180,    // 0° = North, 90° = East, 180° = South (Noon), 270° = West
    altitude: 75,   // 0° = Horizon, 90° = Zenith
    isDragging: false,
    activeDial: null, // 'hero' or 'nav'
    isSweeping: false,
    sweepTimeline: null
  };

  // Presets calibrated to Boulder, CO (40.0° N)
  const SOLAR_PRESETS = {
    morning: {
      azimuth: 105,
      altitude: 24,
      name: '08:00 AM · Morning Rake',
      cct: '4200K Morning Rake',
      kelvin: 4200,
      badge: 'Low-Angle Raking Beam',
      tint: 'rgba(217, 119, 6, 0.06)'
    },
    noon: {
      azimuth: 180,
      altitude: 75,
      name: '12:00 PM · High Noon',
      cct: '6500K Clear Sky Noon',
      kelvin: 6500,
      badge: 'Direct Solar Incident',
      tint: 'rgba(59, 130, 246, 0.03)'
    },
    afternoon: {
      azimuth: 250,
      altitude: 32,
      name: '16:30 PM · Western Rake',
      cct: '3800K Afternoon Sun',
      kelvin: 3800,
      badge: 'Low-Angle Raking Beam',
      tint: 'rgba(245, 158, 11, 0.06)'
    },
    dusk: {
      azimuth: 295,
      altitude: 8,
      name: '19:30 PM · Golden Twilight',
      cct: '2700K Low Horizon Dusk',
      kelvin: 2700,
      badge: 'Grazing Dusk Amber',
      tint: 'rgba(217, 119, 6, 0.12)'
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initHeliostatEngine();
    initGSAPMotion();
  });

  function initHeliostatEngine() {
    // Hero Dial Elements
    const heroDial = document.getElementById('compass-dial-wrap');
    const heroSunPuck = document.getElementById('compass-sun-marker');
    const heroRayVector = document.getElementById('compass-ray-vector');

    // Pinned Nav Header Dial Elements (persistent in viewport)
    const navDial = document.getElementById('nav-compass-dial');
    const navSunPuck = document.getElementById('nav-sun-marker');
    const navRayVector = document.getElementById('nav-ray-vector');

    // Readout Elements
    const readoutAzimuth = document.getElementById('val-azimuth');
    const navReadoutAzimuth = document.getElementById('nav-val-azimuth');
    const readoutAltitude = document.getElementById('val-elevation');
    const readoutCct = document.getElementById('val-cct');
    const readoutStatus = document.getElementById('solar-status-text');
    const ambientWash = document.getElementById('solar-ambient-wash');
    const dynamicBeamBadge = document.getElementById('hud-incident-mode');

    // Buttons
    const presetButtons = document.querySelectorAll('[data-preset]');
    const sweepToggleBtn = document.getElementById('solar-sweep-btn');

    // Dial Radius Configuration
    const HERO_RADIUS = 80; // px
    const NAV_RADIUS = 18;  // px

    /**
     * Calculate trigonometric cast shadows and CCT in a 60fps rAF loop
     * Exact requested formula:
     *   rad = azimuth * Math.PI / 180;
     *   shadowX = -Math.sin(rad) * length;
     *   shadowY = Math.cos(rad) * length;
     */
    function updateSolarPhysics(az, alt, animateDuration = 0) {
      solarState.azimuth = ((az % 360) + 360) % 360;
      solarState.altitude = Math.max(3, Math.min(88, alt));

      const azimuth = solarState.azimuth;
      const altitude = solarState.altitude;

      // Trigonometric Ray Shadow Calculation
      const rad = (azimuth * Math.PI) / 180;
      const normAlt = Math.max(0.04, Math.min(1, altitude / 90));

      // Length inversely proportional to altitude (long at dusk, short at noon)
      const length = 8 + (1 - normAlt) * 52;
      const shadowX = -Math.sin(rad) * length;
      const shadowY = Math.cos(rad) * length;
      const shadowBlur = 12 + (1 - normAlt) * 36;
      const shadowOpacity = (0.05 + (1 - normAlt) * 0.09).toFixed(3);

      // Opposite subtle highlight (light striking leading edge)
      const highlightX = (-shadowX * 0.08).toFixed(1);
      const highlightY = (-shadowY * 0.08).toFixed(1);

      // CCT and Ambient Lighting Interpolation
      let cctText = '6500K Clear Sky Noon';
      let cctKelvin = 6500;
      let washTint = 'rgba(59, 130, 246, 0.02)';
      let incidentMode = 'Direct Solar Incident';

      if (altitude <= 14) {
        cctText = '2700K Low Horizon Dusk';
        cctKelvin = 2700;
        washTint = 'rgba(217, 119, 6, 0.12)';
        incidentMode = 'Grazing Dusk Amber (2700K)';
      } else if (altitude <= 35) {
        cctText = '3800K Warm Rake Angle';
        cctKelvin = 3800;
        washTint = 'rgba(245, 158, 11, 0.06)';
        incidentMode = 'Low-Angle Raking Beam (3800K)';
      } else if (altitude <= 60) {
        cctText = '5000K Direct Solar Beam';
        cctKelvin = 5000;
        washTint = 'rgba(248, 247, 243, 0.03)';
        incidentMode = 'Temperate Architectural Beam (5000K)';
      } else {
        cctText = '6500K Clear Sky Noon';
        cctKelvin = 6500;
        washTint = 'rgba(59, 130, 246, 0.03)';
        incidentMode = 'Zenith D65 Solar Beam (6500K)';
      }

      // Update Text Readouts
      const azRounded = Math.round(azimuth);
      const altRounded = Math.round(altitude);

      if (readoutAzimuth) readoutAzimuth.textContent = `${azRounded}° Azimuth`;
      if (navReadoutAzimuth) navReadoutAzimuth.textContent = `${azRounded}° Az / ${altRounded}° Alt`;
      if (readoutAltitude) readoutAltitude.textContent = `${altRounded}° Altitude`;
      if (readoutCct) readoutCct.textContent = cctText;
      if (readoutStatus) readoutStatus.textContent = `${azRounded}° / ${altRounded}° · ${cctKelvin}K`;
      if (dynamicBeamBadge) dynamicBeamBadge.textContent = incidentMode;
      if (ambientWash) ambientWash.style.background = washTint;

      // Update Dial Visuals (Hero & Nav)
      // On a clock compass, 0° = Top (-Y), 90° = Right (+X), 180° = Bottom (+Y), 270° = Left (-X)
      // Angle for CSS coordinate space:
      // radDial = (azimuth - 90) * Math.PI / 180
      const dialRad = (azimuth - 90) * (Math.PI / 180);
      const dialNormDist = (90 - altitude) / 90;

      // Hero Dial Position
      if (heroSunPuck) {
        const heroDist = dialNormDist * HERO_RADIUS;
        const heroX = 100 + Math.cos(dialRad) * heroDist;
        const heroY = 100 + Math.sin(dialRad) * heroDist;
        heroSunPuck.style.left = `${heroX}px`;
        heroSunPuck.style.top = `${heroY}px`;

        if (heroRayVector) {
          const heroAngle = (dialRad * 180) / Math.PI;
          heroRayVector.style.width = `${heroDist}px`;
          heroRayVector.style.transform = `rotate(${heroAngle}deg)`;
        }
      }

      // Nav Dial Position
      if (navSunPuck) {
        const navDist = dialNormDist * NAV_RADIUS;
        const navX = 24 + Math.cos(dialRad) * navDist;
        const navY = 24 + Math.sin(dialRad) * navDist;
        navSunPuck.style.left = `${navX}px`;
        navSunPuck.style.top = `${navY}px`;

        if (navRayVector) {
          const navAngle = (dialRad * 180) / Math.PI;
          navRayVector.style.width = `${navDist}px`;
          navRayVector.style.transform = `rotate(${navAngle}deg)`;
        }
      }

      // Apply CSS custom variables to root with optional GSAP momentum smoothing
      const root = document.documentElement;

      if (animateDuration > 0 && typeof gsap !== 'undefined') {
        const currentX = parseFloat(getComputedStyle(root).getPropertyValue('--sun-shadow-x')) || 0;
        const currentY = parseFloat(getComputedStyle(root).getPropertyValue('--sun-shadow-y')) || 12;
        const currentBlur = parseFloat(getComputedStyle(root).getPropertyValue('--sun-shadow-blur')) || 24;

        const proxy = { x: currentX, y: currentY, blur: currentBlur };
        gsap.to(proxy, {
          x: shadowX,
          y: shadowY,
          blur: shadowBlur,
          duration: animateDuration,
          ease: 'power3.out',
          overwrite: 'auto',
          onUpdate: () => {
            applyCssVariables(root, proxy.x, proxy.y, proxy.blur, shadowOpacity, highlightX, highlightY, washTint, azimuth, altitude);
          }
        });
      } else {
        applyCssVariables(root, shadowX, shadowY, shadowBlur, shadowOpacity, highlightX, highlightY, washTint, azimuth, altitude);
      }
    }

    function applyCssVariables(root, sx, sy, blur, opacity, hx, hy, tint, az, alt) {
      const sxFixed = typeof sx === 'number' ? sx.toFixed(2) : sx;
      const syFixed = typeof sy === 'number' ? sy.toFixed(2) : sy;
      const blurFixed = typeof blur === 'number' ? blur.toFixed(2) : blur;

      root.style.setProperty('--sun-shadow-x', `${sxFixed}px`);
      root.style.setProperty('--sun-shadow-y', `${syFixed}px`);
      root.style.setProperty('--sun-shadow-blur', `${blurFixed}px`);
      root.style.setProperty('--sun-shadow-opacity', opacity);
      root.style.setProperty('--sun-highlight-x', `${hx}px`);
      root.style.setProperty('--sun-highlight-y', `${hy}px`);

      // Backwards-compatible aliases
      root.style.setProperty('--shadow-x', `${sxFixed}px`);
      root.style.setProperty('--shadow-y', `${syFixed}px`);
      root.style.setProperty('--shadow-blur', `${blurFixed}px`);
      root.style.setProperty('--shadow-opacity', opacity);
      root.style.setProperty('--ray-x', `${sxFixed}px`);
      root.style.setProperty('--ray-y', `${syFixed}px`);
      root.style.setProperty('--ray-blur', `${blurFixed}px`);
      root.style.setProperty('--ray-opacity', opacity);

      root.style.setProperty('--cct-tint', tint);
      root.style.setProperty('--solar-azimuth', `${az.toFixed(1)}deg`);
      root.style.setProperty('--solar-altitude', `${alt.toFixed(1)}deg`);
    }

    // ==========================================
    // POINTER DRAG INTERACTION (Hero & Nav Dials)
    // ==========================================
    function setupDialDrag(dialElement, maxRadius) {
      if (!dialElement) return;

      function handleDragCoord(clientX, clientY) {
        const rect = dialElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        // Azimuth (0° North = -Y, 90° East = +X, 180° South = +Y, 270° West = -X)
        let angleRad = Math.atan2(dy, dx);
        let angleDeg = (angleRad * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg += 360;

        // Altitude from radial distance: center = 90° zenith, rim = 5° horizon
        const dist = Math.min(maxRadius, Math.sqrt(dx * dx + dy * dy));
        const computedAltitude = Math.max(4, 90 - (dist / maxRadius) * 85);

        // Deactivate preset buttons during manual drag
        presetButtons.forEach(btn => btn.classList.remove('active'));
        if (solarState.isSweeping && solarState.sweepTimeline) {
          solarState.sweepTimeline.kill();
          solarState.isSweeping = false;
          if (sweepToggleBtn) sweepToggleBtn.classList.remove('active');
        }

        updateSolarPhysics(angleDeg, computedAltitude, 0);
      }

      dialElement.addEventListener('pointerdown', (e) => {
        solarState.isDragging = true;
        dialElement.setPointerCapture(e.pointerId);
        handleDragCoord(e.clientX, e.clientY);
      });

      dialElement.addEventListener('pointermove', (e) => {
        if (!solarState.isDragging) return;
        handleDragCoord(e.clientX, e.clientY);
      });

      dialElement.addEventListener('pointerup', (e) => {
        if (!solarState.isDragging) return;
        solarState.isDragging = false;
        try { dialElement.releasePointerCapture(e.pointerId); } catch (_) {}
      });

      dialElement.addEventListener('pointercancel', () => {
        solarState.isDragging = false;
      });
    }

    setupDialDrag(heroDial, HERO_RADIUS);
    setupDialDrag(navDial, NAV_RADIUS);

    // ==========================================
    // PRESET BUTTONS
    // ==========================================
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        const preset = SOLAR_PRESETS[key];
        if (!preset) return;

        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (solarState.isSweeping && solarState.sweepTimeline) {
          solarState.sweepTimeline.kill();
          solarState.isSweeping = false;
          if (sweepToggleBtn) sweepToggleBtn.classList.remove('active');
        }

        updateSolarPhysics(preset.azimuth, preset.altitude, 0.65);
      });
    });

    // ==========================================
    // "SWEEP DAY" SOLAR CYCLE ANIMATION
    // ==========================================
    if (sweepToggleBtn && typeof gsap !== 'undefined') {
      sweepToggleBtn.addEventListener('click', () => {
        if (solarState.isSweeping) {
          if (solarState.sweepTimeline) solarState.sweepTimeline.pause();
          solarState.isSweeping = false;
          sweepToggleBtn.classList.remove('active');
          sweepToggleBtn.textContent = 'Play Solar Sweep';
          return;
        }

        solarState.isSweeping = true;
        sweepToggleBtn.classList.add('active');
        sweepToggleBtn.textContent = 'Pause Solar Sweep';
        presetButtons.forEach(b => b.classList.remove('active'));

        const cycleObj = { az: 100, alt: 20 };

        solarState.sweepTimeline = gsap.timeline({
          repeat: -1,
          onUpdate: () => {
            updateSolarPhysics(cycleObj.az, cycleObj.alt, 0);
          }
        });

        // Dawn (100° Az, 20° Alt) -> Noon (180° Az, 76° Alt) -> Dusk (295° Az, 8° Alt)
        solarState.sweepTimeline
          .to(cycleObj, { az: 180, alt: 76, duration: 4.5, ease: 'sine.inOut' })
          .to(cycleObj, { az: 295, alt: 8, duration: 4.5, ease: 'sine.inOut' })
          .to(cycleObj, { az: 360, alt: 4, duration: 1.5, ease: 'power1.in' })
          .set(cycleObj, { az: 90, alt: 10 })
          .to(cycleObj, { az: 100, alt: 20, duration: 1.5, ease: 'power1.out' });
      });
    }

    // Initial Calibration (Noon)
    updateSolarPhysics(180, 75, 0);
  }

  // ==========================================
  // GSAP 3 ENTRANCE & SCROLL ANIMATIONS
  // ==========================================
  function initGSAPMotion() {
    if (typeof gsap === 'undefined') return;

    const ctx = gsap.context(() => {
      // Hero Elements Staggered Reveal
      gsap.from('.hero-datum-bar, .hero-headline, .hero-lead-text, .heliostat-instrument-box', {
        duration: 0.85,
        y: 22,
        autoAlpha: 0,
        stagger: 0.08,
        ease: 'power3.out',
        force3D: true
      });

      // Study Cards Reveal on Scroll
      const cards = document.querySelectorAll('.study-card, .curatorial-card, .work-list-item');
      cards.forEach(card => {
        if (typeof ScrollTrigger !== 'undefined') {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none none'
            },
            duration: 0.75,
            y: 20,
            autoAlpha: 0,
            ease: 'power3.out',
            force3D: true
          });
        }
      });
    });

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      ctx.revert();
    });
  }

})();
