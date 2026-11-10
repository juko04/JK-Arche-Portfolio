/**
 * Julian Kotara — The Heliostat Sun-Clock & Ray Caster Engine
 * Site 2: The Sun-Clock Pavilion & Heliostat Compass
 * 
 * Dr. Andrew Marsh 2D Stereographic Sun-Path Projection (Boulder, CO · 40.0° N),
 * Continuous 60fps Mathematical CCT & Color Interpolation,
 * Dynamic Upstream/Downstream Card Shadow Stacking, Nocturnal Mode,
 * and Real-Time Astronomical Solar Calculation.
 * 
 * Adheres strictly to GSAP 3 performance & Emil Kowalski design engineering.
 */

(function () {
  'use strict';

  // Solar Coordinates & State
  const solarState = {
    azimuth: 180,     // 0° = North, 90° = East, 180° = South (Noon), 270° = West
    altitude: 75,    // 0° = Horizon, 90° = Zenith, < 0° = Night / Below Horizon
    isDragging: false,
    activeDial: null,
    isSweeping: false,
    sweepTimeline: null,
    isLiveSync: false,
    liveTimer: null,
    userLocation: { lat: 40.015, lon: -105.27, label: 'Boulder, CO' }
  };

  // Presets calibrated to Boulder, CO (40.0° N)
  const SOLAR_PRESETS = {
    morning: {
      azimuth: 105,
      altitude: 24,
      name: '08:00 AM · Morning Rake',
      badge: 'Low-Angle Morning Beam'
    },
    noon: {
      azimuth: 180,
      altitude: 75,
      name: '12:00 PM · High Noon',
      badge: 'Zenith Direct Solar Beam (D65)'
    },
    afternoon: {
      azimuth: 250,
      altitude: 32,
      name: '16:30 PM · Western Rake',
      badge: 'Raking Golden Beam'
    },
    dusk: {
      azimuth: 295,
      altitude: 6,
      name: '19:30 PM · Golden Twilight',
      badge: 'Grazing Dusk Amber'
    },
    night: {
      azimuth: 345,
      altitude: -14,
      name: '22:00 PM · Nocturnal Mode',
      badge: 'Electric Luminaire Integration (Nocturnal)'
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initHeliostatEngine();
    initGSAPMotion();
  });

  function initHeliostatEngine() {
    // Andrew Marsh Stereographic Hero Dial Elements
    const heroDial = document.getElementById('compass-dial-wrap');
    const heroSunPuck = document.getElementById('compass-sun-marker');
    const marshRayLine = document.getElementById('marsh-ray-line');
    const marshActivePath = document.getElementById('marsh-active-trajectory');

    // Pinned Nav Header Dial Elements
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
    const liveSyncBtn = document.getElementById('btn-live-solar');

    // Stereographic Dial Geometry (Andrew Marsh standard)
    const HERO_RADIUS = 120; // px (radius of outer horizon 0° elevation circle in 280x280 SVG)
    const HERO_CX = 140;     // px center X
    const HERO_CY = 140;     // px center Y
    const NAV_RADIUS = 18;   // px
    const NAV_CX = 24;
    const NAV_CY = 24;

    /**
     * Continuous Mathematical Lighting & CCT Interpolation.
     * Computes seamless RGB colors across the full daylight to nocturnal spectrum.
     */
    function getContinuousLighting(alt) {
      const stops = [
        { alt: -14, kelvin: 2200, canvas: [13, 14, 18], paper: [20, 22, 30], surface: [27, 30, 40], ink: [244, 243, 239], inkSec: [170, 167, 158], tint: [13, 14, 18, 0.45], dialBg: [20, 22, 30], isNight: true },
        { alt: 0,   kelvin: 2600, canvas: [246, 231, 213], paper: [238, 217, 195], surface: [255, 253, 248], ink: [17, 17, 16], inkSec: [64, 62, 58], tint: [217, 119, 6, 0.16], dialBg: [246, 243, 236], isNight: false },
        { alt: 15,  kelvin: 3800, canvas: [250, 242, 228], paper: [242, 231, 213], surface: [255, 255, 255], ink: [17, 17, 16], inkSec: [64, 62, 58], tint: [245, 158, 11, 0.08], dialBg: [248, 246, 240], isNight: false },
        { alt: 45,  kelvin: 5200, canvas: [249, 246, 240], paper: [241, 237, 230], surface: [255, 255, 255], ink: [17, 17, 16], inkSec: [64, 62, 58], tint: [217, 119, 6, 0.04], dialBg: [248, 248, 247], isNight: false },
        { alt: 75,  kelvin: 6500, canvas: [248, 249, 250], paper: [239, 241, 244], surface: [255, 255, 255], ink: [17, 17, 16], inkSec: [64, 62, 58], tint: [59, 130, 246, 0.03], dialBg: [245, 247, 250], isNight: false }
      ];

      let p0 = stops[0], p1 = stops[stops.length - 1];
      if (alt <= stops[0].alt) {
        p0 = p1 = stops[0];
      } else if (alt >= stops[stops.length - 1].alt) {
        p0 = p1 = stops[stops.length - 1];
      } else {
        for (let i = 0; i < stops.length - 1; i++) {
          if (alt >= stops[i].alt && alt <= stops[i + 1].alt) {
            p0 = stops[i];
            p1 = stops[i + 1];
            break;
          }
        }
      }

      const range = p1.alt - p0.alt;
      const t = range === 0 ? 0 : Math.max(0, Math.min(1, (alt - p0.alt) / range));
      const tSmooth = t * t * (3 - 2 * t);

      const lerp = (a, b) => Math.round(a + (b - a) * tSmooth);
      const lerpArr = (arrA, arrB) => arrA.map((v, i) => lerp(v, arrB[i]));

      const canvas = lerpArr(p0.canvas, p1.canvas);
      const paper = lerpArr(p0.paper, p1.paper);
      const surface = lerpArr(p0.surface, p1.surface);
      const dialBg = lerpArr(p0.dialBg, p1.dialBg);
      const kelvin = Math.round(p0.kelvin + (p1.kelvin - p0.kelvin) * t);

      return {
        kelvin,
        canvasStr: `rgb(${canvas[0]}, ${canvas[1]}, ${canvas[2]})`,
        paperStr: `rgb(${paper[0]}, ${paper[1]}, ${paper[2]})`,
        surfaceStr: `rgb(${surface[0]}, ${surface[1]}, ${surface[2]})`,
        dialBgStr: `rgb(${dialBg[0]}, ${dialBg[1]}, ${dialBg[2]})`,
        isNight: alt <= 0
      };
    }

    function getCctDescriptor(k) {
      if (k <= 2600) return 'Dusk Amber / Twilight';
      if (k <= 3400) return 'Warm Horizon Rake';
      if (k <= 4400) return 'Warm Architectural Daylight';
      if (k <= 5500) return 'Direct Solar Beam';
      return 'Zenith Clear Sky Daylight (D65)';
    }

    /**
     * Dynamic Upstream/Downstream Card Stacking
     * Ensures shadows from upstream cards smoothly pass over downstream cards,
     * maintaining physical coplanar height across all plates.
     */
    function updateCardShadowStacking(sx, sy) {
      const cardSelectors = [
        '.studies-grid .study-card',
        '.curatorial-grid .curatorial-card'
      ];

      cardSelectors.forEach(sel => {
        const cards = document.querySelectorAll(sel);
        if (!cards || cards.length < 2) return;

        const cardData = Array.from(cards).map(card => {
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          // Dot product along shadow projection vector:
          // Smaller projection = closer to sun = upstream = higher z-index!
          const projection = cx * sx + cy * sy;
          return { card, projection };
        });

        // Upstream cards have smaller projection
        cardData.sort((a, b) => a.projection - b.projection);

        // Assign descending z-index so upstream card's shadow casts OVER downstream card
        const baseZ = 20;
        cardData.forEach((item, index) => {
          item.card.style.zIndex = baseZ - index;
        });
      });
    }

    /**
     * Compute Active Day Sun-Path Arc for Boulder, CO (40.0° N)
     * Renders today's stereographic sun-path trajectory in the Andrew Marsh chart.
     */
    function updateActiveDayArc(alt, az) {
      if (!marshActivePath) return;

      // Estimate solar declination from altitude at current azimuth
      const phi = 40.0 * Math.PI / 180;
      const azRad = (az * Math.PI) / 180;
      const altRad = (Math.max(2, alt) * Math.PI) / 180;

      // Declination approximation: sin(decl) = sin(phi)*sin(alt) + cos(phi)*cos(alt)*cos(az)
      const sinDecl = Math.sin(phi) * Math.sin(altRad) + Math.cos(phi) * Math.cos(altRad) * Math.cos(azRad);
      const decl = Math.asin(Math.max(-0.4, Math.min(0.4, sinDecl)));
      const declDeg = (decl * 180) / Math.PI;

      const pts = [];
      for (let h = -120; h <= 120; h += 3) {
        const H = (h * Math.PI) / 180;
        const sinA = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H);
        const a = Math.asin(Math.max(-1, Math.min(1, sinA)));
        const aDeg = (a * 180) / Math.PI;
        if (aDeg < 0) continue;

        const cosAzi = (Math.sin(decl) - Math.sin(phi) * Math.sin(a)) / (Math.cos(phi) * Math.cos(a));
        let aziDeg = Math.acos(Math.max(-1, Math.min(1, cosAzi))) * (180 / Math.PI);
        if (h > 0) aziDeg = 360 - aziDeg;

        const r = HERO_RADIUS * (90 - aDeg) / 90;
        const theta = (aziDeg - 90) * (Math.PI / 180);
        const x = HERO_CX + r * Math.cos(theta);
        const y = HERO_CY + r * Math.sin(theta);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }

      if (pts.length > 2) {
        marshActivePath.setAttribute('d', 'M ' + pts.join(' L '));
      } else {
        marshActivePath.setAttribute('d', '');
      }
    }

    /**
     * Primary 60fps Physics & Lighting Loop.
     * Computes shadow projections, smooth CCT, Andrew Marsh stereographic dial,
     * and dynamic card overlapping.
     */
    function updateSolarPhysics(az, alt, animateDuration = 0) {
      solarState.azimuth = ((az % 360) + 360) % 360;
      solarState.altitude = alt;

      const azimuth = solarState.azimuth;
      const altitude = solarState.altitude;
      const root = document.documentElement;

      const lighting = getContinuousLighting(altitude);

      // Night Mode Class
      if (lighting.isNight) {
        root.classList.add('solar-night');
      } else {
        root.classList.remove('solar-night');
      }

      // Shadow Calculations
      let shadowX, shadowY, shadowBlur, shadowOpacity;
      let textShadowX, textShadowY, textShadowBlur, textShadowOpacity;

      if (lighting.isNight) {
        shadowX = 0;
        shadowY = 14;
        shadowBlur = 6;
        shadowOpacity = 0.55;

        textShadowX = 0;
        textShadowY = 8;
        textShadowBlur = 2.0;
        textShadowOpacity = 0.70;
      } else {
        const rad = (azimuth * Math.PI) / 180;
        const normAlt = Math.max(0.04, Math.min(1, altitude / 90));

        // Surface & Card Sharp Sun Ray Shadow
        const length = 14 + (1 - normAlt) * 54;
        shadowX = -Math.sin(rad) * length;
        shadowY = Math.cos(rad) * length;
        shadowBlur = 1.5 + (1 - normAlt) * 3.0;
        shadowOpacity = (0.24 + (1 - normAlt) * 0.14).toFixed(3);

        // Hero Headline Single Cast Shadow (strictly BEHIND foreground text)
        const textLength = 5 + (1 - normAlt) * 20;
        textShadowX = -Math.sin(rad) * textLength;
        textShadowY = Math.cos(rad) * textLength;
        textShadowBlur = 1.0 + (1 - normAlt) * 2.0;
        textShadowOpacity = (0.28 + (1 - normAlt) * 0.14).toFixed(3);
      }

      // Dynamic Card Overlapping (upstream shadows cast over downstream cards)
      updateCardShadowStacking(shadowX, shadowY);

      // Update Text Readouts
      const azRounded = Math.round(azimuth);
      const altRounded = Math.round(altitude);
      const cctDesc = getCctDescriptor(lighting.kelvin);

      if (readoutAzimuth) readoutAzimuth.textContent = `${azRounded}° Azimuth`;
      if (readoutAltitude) readoutAltitude.textContent = lighting.isNight ? `${altRounded}° (Below Horizon)` : `${altRounded}° Altitude`;
      if (readoutCct) readoutCct.textContent = `${lighting.kelvin}K ${cctDesc}`;
      if (readoutStatus) readoutStatus.textContent = lighting.isNight ? `${azRounded}° / Night · ${lighting.kelvin}K` : `${azRounded}° / ${altRounded}° · ${lighting.kelvin}K`;
      if (navReadoutAzimuth) navReadoutAzimuth.textContent = lighting.isNight ? `${azRounded}° Az / Night` : `${azRounded}° Az / ${altRounded}° Alt`;
      if (dynamicBeamBadge && !solarState.isLiveSync) dynamicBeamBadge.textContent = `${cctDesc} (${lighting.kelvin}K)`;

      // Update Dr. Andrew Marsh Stereographic Sun Position & Vector
      const dialRad = (azimuth - 90) * (Math.PI / 180);
      const dialNormDist = lighting.isNight ? 1.05 : Math.max(0, Math.min(1, (90 - altitude) / 90));

      if (heroSunPuck) {
        const heroDist = dialNormDist * HERO_RADIUS;
        const heroX = HERO_CX + Math.cos(dialRad) * heroDist;
        const heroY = HERO_CY + Math.sin(dialRad) * heroDist;
        heroSunPuck.style.left = `${heroX.toFixed(1)}px`;
        heroSunPuck.style.top = `${heroY.toFixed(1)}px`;

        if (marshRayLine) {
          // Ray from center through sun puck to outer rim
          const rimX = HERO_CX + Math.cos(dialRad) * HERO_RADIUS;
          const rimY = HERO_CY + Math.sin(dialRad) * HERO_RADIUS;
          marshRayLine.setAttribute('x1', HERO_CX);
          marshRayLine.setAttribute('y1', HERO_CY);
          marshRayLine.setAttribute('x2', rimX.toFixed(1));
          marshRayLine.setAttribute('y2', rimY.toFixed(1));
        }

        updateActiveDayArc(altitude, azimuth);
      }

      // Nav Mini Dial Position
      if (navSunPuck) {
        const navDist = dialNormDist * NAV_RADIUS;
        const navX = NAV_CX + Math.cos(dialRad) * navDist;
        const navY = NAV_CY + Math.sin(dialRad) * navDist;
        navSunPuck.style.left = `${navX.toFixed(1)}px`;
        navSunPuck.style.top = `${navY.toFixed(1)}px`;

        if (navRayVector) {
          const navAngle = (dialRad * 180) / Math.PI;
          navRayVector.style.width = `${navDist.toFixed(1)}px`;
          navRayVector.style.transform = `rotate(${navAngle}deg)`;
        }
      }

      // Apply Continuous CSS Custom Properties
      if (animateDuration > 0 && typeof gsap !== 'undefined') {
        const currentX = parseFloat(getComputedStyle(root).getPropertyValue('--sun-shadow-x')) || 0;
        const currentY = parseFloat(getComputedStyle(root).getPropertyValue('--sun-shadow-y')) || 16;
        const currentBlur = parseFloat(getComputedStyle(root).getPropertyValue('--sun-shadow-blur')) || 2;
        const currentTx = parseFloat(getComputedStyle(root).getPropertyValue('--text-shadow-x')) || 0;
        const currentTy = parseFloat(getComputedStyle(root).getPropertyValue('--text-shadow-y')) || 12;
        const currentTblur = parseFloat(getComputedStyle(root).getPropertyValue('--text-shadow-blur')) || 1.5;

        const proxy = {
          x: currentX,
          y: currentY,
          blur: currentBlur,
          tx: currentTx,
          ty: currentTy,
          tblur: currentTblur,
          alt: solarState.altitude,
          az: solarState.azimuth
        };

        gsap.to(proxy, {
          x: shadowX,
          y: shadowY,
          blur: shadowBlur,
          tx: textShadowX,
          ty: textShadowY,
          tblur: textShadowBlur,
          alt: alt,
          az: az,
          duration: animateDuration,
          ease: 'power3.out',
          overwrite: 'auto',
          onUpdate: () => {
            const liveLight = getContinuousLighting(proxy.alt);
            applyCssVariables(
              root,
              proxy.x,
              proxy.y,
              proxy.blur,
              shadowOpacity,
              proxy.tx,
              proxy.ty,
              proxy.tblur,
              textShadowOpacity,
              liveLight.canvasStr,
              liveLight.paperStr,
              liveLight.surfaceStr,
              liveLight.dialBgStr,
              proxy.az,
              proxy.alt
            );
          }
        });
      } else {
        applyCssVariables(
          root,
          shadowX,
          shadowY,
          shadowBlur,
          shadowOpacity,
          textShadowX,
          textShadowY,
          textShadowBlur,
          textShadowOpacity,
          lighting.canvasStr,
          lighting.paperStr,
          lighting.surfaceStr,
          lighting.dialBgStr,
          azimuth,
          altitude
        );
      }
    }

    function applyCssVariables(
      root,
      sx,
      sy,
      blur,
      opacity,
      tsx,
      tsy,
      tblur,
      topacity,
      canvas,
      paper,
      surface,
      dialBg,
      az,
      alt
    ) {
      const sxFixed = typeof sx === 'number' ? sx.toFixed(2) : sx;
      const syFixed = typeof sy === 'number' ? sy.toFixed(2) : sy;
      const blurFixed = typeof blur === 'number' ? blur.toFixed(2) : blur;

      const tsxFixed = typeof tsx === 'number' ? tsx.toFixed(2) : tsx;
      const tsyFixed = typeof tsy === 'number' ? tsy.toFixed(2) : tsy;
      const tblurFixed = typeof tblur === 'number' ? tblur.toFixed(2) : tblur;

      // Cards & Panels Sharp Shadows
      root.style.setProperty('--sun-shadow-x', `${sxFixed}px`);
      root.style.setProperty('--sun-shadow-y', `${syFixed}px`);
      root.style.setProperty('--sun-shadow-blur', `${blurFixed}px`);
      root.style.setProperty('--sun-shadow-opacity', opacity);

      // Hero Headline Directional Cast Shadow (strictly BEHIND text)
      root.style.setProperty('--text-shadow-x', `${tsxFixed}px`);
      root.style.setProperty('--text-shadow-y', `${tsyFixed}px`);
      root.style.setProperty('--text-shadow-blur', `${tblurFixed}px`);
      root.style.setProperty('--text-shadow-opacity', topacity);

      // Continuous CCT Material Colors
      if (canvas) root.style.setProperty('--bg-canvas', canvas);
      if (paper) root.style.setProperty('--bg-paper', paper);
      if (surface) root.style.setProperty('--bg-surface', surface);
      if (dialBg) root.style.setProperty('--dial-bg', dialBg);

      root.style.setProperty('--solar-azimuth', `${az.toFixed(1)}deg`);
      root.style.setProperty('--solar-altitude', `${alt.toFixed(1)}deg`);
    }

    // ==========================================
    // POINTER DRAG INTERACTION (Hero & Nav Dials)
    // ==========================================
    function setupDialDrag(dialElement, maxRadius, centerXOffset, centerYOffset) {
      if (!dialElement) return;

      function handleDragCoord(clientX, clientY) {
        const rect = dialElement.getBoundingClientRect();
        const centerX = rect.left + centerXOffset;
        const centerY = rect.top + centerYOffset;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        // Azimuth (0° North = -Y, 90° East = +X, 180° South = +Y, 270° West = -X)
        let angleRad = Math.atan2(dy, dx);
        let angleDeg = (angleRad * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg += 360;

        // Altitude from radial distance: center = 90° zenith, rim = 0° horizon
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = dist / maxRadius;

        let computedAltitude;
        if (normDist >= 1.0) {
          // Pulled to or past the outer horizon ring dips into night mode
          computedAltitude = Math.max(-14, -(normDist - 1.0) * 45);
        } else {
          computedAltitude = Math.max(0, 90 - normDist * 90);
        }

        // Deactivate preset buttons & live sync during manual drag
        presetButtons.forEach(btn => btn.classList.remove('active'));
        stopLiveSolarSync();

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

    setupDialDrag(heroDial, HERO_RADIUS, 140, 140);
    setupDialDrag(navDial, NAV_RADIUS, 24, 24);

    // ==========================================
    // PRESET BUTTONS (Morning, Noon, Afternoon, Dusk, Night)
    // ==========================================
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        const preset = SOLAR_PRESETS[key];
        if (!preset) return;

        stopLiveSolarSync();
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (solarState.isSweeping && solarState.sweepTimeline) {
          solarState.sweepTimeline.kill();
          solarState.isSweeping = false;
          if (sweepToggleBtn) sweepToggleBtn.classList.remove('active');
        }

        updateSolarPhysics(preset.azimuth, preset.altitude, 0.75);
      });
    });

    // ==========================================
    // "SWEEP DAY" 24-HOUR SOLAR CYCLE ANIMATION
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

        stopLiveSolarSync();
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

        // Continuous smooth cycle: Dawn -> Noon -> Dusk -> Night -> Dawn
        solarState.sweepTimeline
          .to(cycleObj, { az: 180, alt: 76, duration: 4.5, ease: 'sine.inOut' })
          .to(cycleObj, { az: 295, alt: 6, duration: 4.5, ease: 'sine.inOut' })
          .to(cycleObj, { az: 345, alt: -14, duration: 2.5, ease: 'power1.inOut' })
          .set(cycleObj, { az: 90, alt: -5 })
          .to(cycleObj, { az: 100, alt: 20, duration: 2.5, ease: 'power1.out' });
      });
    }

    // ==========================================
    // REAL-TIME ASTRONOMICAL SOLAR TIME & LOCATION
    // ==========================================
    function calculateAstronomicalSolarPosition(lat, lon, date = new Date()) {
      const startOfYear = new Date(date.getFullYear(), 0, 0);
      const diff = date - startOfYear;
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

      const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
      const tzOffsetHours = -date.getTimezoneOffset() / 60;
      const standardMeridian = tzOffsetHours * 15;

      const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hours - 12) / 24);

      const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
                     - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));

      const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
                   - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
                   - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

      const timeOffset = eqtime + 4 * (lon - standardMeridian);
      let tst = hours * 60 + timeOffset;
      tst = ((tst % 1440) + 1440) % 1440;

      let haDeg = (tst / 4) - 180;
      const haRad = haDeg * (Math.PI / 180);
      const latRad = lat * (Math.PI / 180);

      const sinAlt = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
      const altitudeRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
      const altitudeDeg = altitudeRad * (180 / Math.PI);

      const cosAz = (Math.sin(decl) - Math.sin(latRad) * Math.sin(altitudeRad)) / (Math.cos(latRad) * Math.cos(altitudeRad));
      let azimuthDeg = Math.acos(Math.max(-1, Math.min(1, cosAz))) * (180 / Math.PI);

      if (haDeg > 0) azimuthDeg = 360 - azimuthDeg;

      return {
        azimuth: ((azimuthDeg % 360) + 360) % 360,
        altitude: altitudeDeg,
        isNight: altitudeDeg <= 0
      };
    }

    function initLiveSolarSync() {
      if (!liveSyncBtn) return;

      liveSyncBtn.addEventListener('click', () => {
        if (solarState.isLiveSync) {
          stopLiveSolarSync();
          return;
        }

        startLiveSolarSync();
      });
    }

    function startLiveSolarSync() {
      solarState.isLiveSync = true;
      if (liveSyncBtn) liveSyncBtn.classList.add('active');
      presetButtons.forEach(b => b.classList.remove('active'));

      if (solarState.isSweeping && solarState.sweepTimeline) {
        solarState.sweepTimeline.kill();
        solarState.isSweeping = false;
        if (sweepToggleBtn) {
          sweepToggleBtn.classList.remove('active');
          sweepToggleBtn.textContent = 'Play Solar Sweep';
        }
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            solarState.userLocation = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              label: `${pos.coords.latitude.toFixed(1)}°N, ${pos.coords.longitude.toFixed(1)}°W`
            };
            applyCurrentSolarPosition();
          },
          () => {
            solarState.userLocation = { lat: 40.015, lon: -105.27, label: 'Boulder, CO' };
            applyCurrentSolarPosition();
          },
          { timeout: 4000 }
        );
      } else {
        solarState.userLocation = { lat: 40.015, lon: -105.27, label: 'Boulder, CO' };
        applyCurrentSolarPosition();
      }

      if (solarState.liveTimer) clearInterval(solarState.liveTimer);
      solarState.liveTimer = setInterval(applyCurrentSolarPosition, 30000);
    }

    function applyCurrentSolarPosition() {
      if (!solarState.isLiveSync) return;
      const now = new Date();
      const solar = calculateAstronomicalSolarPosition(
        solarState.userLocation.lat,
        solarState.userLocation.lon,
        now
      );

      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (dynamicBeamBadge) {
        if (solar.isNight) {
          dynamicBeamBadge.textContent = `📍 Live Sun Sync: ${timeStr} (${solarState.userLocation.label}) · Night Mode`;
        } else {
          dynamicBeamBadge.textContent = `📍 Live Sun Sync: ${timeStr} (${solarState.userLocation.label}) · ${Math.round(solar.azimuth)}° Az / ${Math.round(solar.altitude)}° Alt`;
        }
      }

      updateSolarPhysics(solar.azimuth, solar.altitude, 0.75);
    }

    function stopLiveSolarSync() {
      solarState.isLiveSync = false;
      if (liveSyncBtn) liveSyncBtn.classList.remove('active');
      if (solarState.liveTimer) {
        clearInterval(solarState.liveTimer);
        solarState.liveTimer = null;
      }
    }

    initLiveSolarSync();

    // Initial Calibration (Noon Default)
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

    window.addEventListener('beforeunload', () => {
      ctx.revert();
    });
  }

})();
