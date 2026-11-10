/**
 * Julian Kotara — The Heliostat Sun-Clock & Ray Caster Engine
 * Site 2: The Sun-Clock Pavilion & Heliostat Compass
 * 
 * Interactive 360° Solar Compass, Dynamic Trigonometric Cast Shadows,
 * Dynamic CCT Daylight Shifting, Full Nocturnal Architectural Mode,
 * and Real-Time Astronomical Location-Based Solar Positioning.
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
      cct: '4200K Morning Daylight',
      kelvin: 4200,
      badge: 'Low-Angle Morning Beam (4200K)',
      canvas: '#FAF5ED',
      paper: '#F3ECE1',
      tint: 'rgba(217, 119, 6, 0.08)'
    },
    noon: {
      azimuth: 180,
      altitude: 75,
      name: '12:00 PM · High Noon',
      cct: '6500K Clear Sky Noon',
      kelvin: 6500,
      badge: 'Zenith Direct Solar Beam (6500K)',
      canvas: '#F8F9FA',
      paper: '#EFF1F4',
      tint: 'rgba(59, 130, 246, 0.03)'
    },
    afternoon: {
      azimuth: 250,
      altitude: 32,
      name: '16:30 PM · Western Rake',
      cct: '3800K Afternoon Sun',
      kelvin: 3800,
      badge: 'Raking Golden Beam (3800K)',
      canvas: '#FAF2E4',
      paper: '#F2E7D5',
      tint: 'rgba(245, 158, 11, 0.08)'
    },
    dusk: {
      azimuth: 295,
      altitude: 8,
      name: '19:30 PM · Golden Twilight',
      cct: '2700K Low Horizon Dusk',
      kelvin: 2700,
      badge: 'Grazing Dusk Amber (2700K)',
      canvas: '#F6E7D5',
      paper: '#EED9C3',
      tint: 'rgba(217, 119, 6, 0.16)'
    },
    night: {
      azimuth: 345,
      altitude: -14,
      name: '22:00 PM · Nocturnal Mode',
      cct: '3000K Artificial Luminaires',
      kelvin: 3000,
      badge: 'Electric Luminaire Integration (3000K)',
      canvas: '#0D0E12',
      paper: '#14161E',
      tint: 'rgba(13, 14, 18, 0.5)'
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
    const liveSyncBtn = document.getElementById('btn-live-solar');

    // Dial Radius Configuration
    const HERO_RADIUS = 80; // px
    const NAV_RADIUS = 18;  // px

    /**
     * Calculate trigonometric cast shadows, dynamic CCT, and day/night mode
     * in a hardware-accelerated 60fps loop.
     */
    function updateSolarPhysics(az, alt, animateDuration = 0) {
      solarState.azimuth = ((az % 360) + 360) % 360;
      solarState.altitude = alt;

      const azimuth = solarState.azimuth;
      const altitude = solarState.altitude;
      const root = document.documentElement;

      const isNight = altitude <= 0;

      // 1. NIGHT MODE TOGGLE
      if (isNight) {
        root.classList.add('solar-night');
      } else {
        root.classList.remove('solar-night');
      }

      // 2. SHADOW CALCULATIONS
      let shadowX, shadowY, shadowBlur, shadowOpacity;
      let textShadowX, textShadowY, textShadowBlur, textShadowOpacity;
      let bgCanvas, bgPaper, cctText, cctKelvin, washTint, incidentMode;

      if (isNight) {
        // Deep nocturnal artificial luminaire / moon casting
        shadowX = 0;
        shadowY = 14;
        shadowBlur = 6;
        shadowOpacity = 0.55;

        // Hero headline shadow strictly behind letters
        textShadowX = 0;
        textShadowY = 8;
        textShadowBlur = 2.0;
        textShadowOpacity = 0.70;

        bgCanvas = '#0D0E12';
        bgPaper = '#14161E';
        cctText = '3000K Electric Luminaires & Night';
        cctKelvin = 3000;
        washTint = 'rgba(13, 14, 18, 0.45)';
        incidentMode = 'Electric Luminaire Integration (3000K Nocturnal)';
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

        // Dynamic CCT & Material Color Shifting with Solar Elevation
        if (altitude <= 12) {
          bgCanvas = '#F6E7D5';
          bgPaper = '#EED9C3';
          cctText = '2700K Low Horizon Dusk';
          cctKelvin = 2700;
          washTint = 'rgba(217, 119, 6, 0.16)';
          incidentMode = 'Grazing Dusk Amber (2700K)';
        } else if (altitude <= 35) {
          bgCanvas = '#FAF2E4';
          bgPaper = '#F2E7D5';
          cctText = '3800K Warm Rake Angle';
          cctKelvin = 3800;
          washTint = 'rgba(245, 158, 11, 0.08)';
          incidentMode = 'Low-Angle Raking Beam (3800K)';
        } else if (altitude <= 60) {
          bgCanvas = '#FAF5ED';
          bgPaper = '#F3ECE1';
          cctText = '4800K Direct Solar Beam';
          cctKelvin = 4800;
          washTint = 'rgba(217, 119, 6, 0.04)';
          incidentMode = 'Temperate Architectural Beam (4800K)';
        } else {
          bgCanvas = '#F8F9FA';
          bgPaper = '#EFF1F4';
          cctText = '6500K Clear Sky Noon';
          cctKelvin = 6500;
          washTint = 'rgba(59, 130, 246, 0.03)';
          incidentMode = 'Zenith Direct Solar Beam (6500K)';
        }
      }

      // Update Text Readouts
      const azRounded = Math.round(azimuth);
      const altRounded = Math.round(altitude);

      if (readoutAzimuth) readoutAzimuth.textContent = `${azRounded}° Azimuth`;
      if (readoutAltitude) readoutAltitude.textContent = isNight ? `${altRounded}° (Below Horizon)` : `${altRounded}° Altitude`;
      if (readoutCct) readoutCct.textContent = cctText;
      if (readoutStatus) readoutStatus.textContent = isNight ? `${azRounded}° / Night · ${cctKelvin}K` : `${azRounded}° / ${altRounded}° · ${cctKelvin}K`;
      if (navReadoutAzimuth) navReadoutAzimuth.textContent = isNight ? `${azRounded}° Az / Night` : `${azRounded}° Az / ${altRounded}° Alt`;
      if (dynamicBeamBadge && !solarState.isLiveSync) dynamicBeamBadge.textContent = incidentMode;
      if (ambientWash) ambientWash.style.background = washTint;

      // Update Dial Positions (Hero & Nav)
      const dialRad = (azimuth - 90) * (Math.PI / 180);
      const dialNormDist = isNight ? 1.0 : Math.max(0, Math.min(1, (90 - altitude) / 90));

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

      // Apply CSS custom properties
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
          tblur: currentTblur
        };

        gsap.to(proxy, {
          x: shadowX,
          y: shadowY,
          blur: shadowBlur,
          tx: textShadowX,
          ty: textShadowY,
          tblur: textShadowBlur,
          duration: animateDuration,
          ease: 'power3.out',
          overwrite: 'auto',
          onUpdate: () => {
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
              bgCanvas,
              bgPaper,
              washTint,
              azimuth,
              altitude
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
          bgCanvas,
          bgPaper,
          washTint,
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
      tint,
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

      // Dynamic CCT Background Colors
      if (canvas) root.style.setProperty('--bg-canvas', canvas);
      if (paper) root.style.setProperty('--bg-paper', paper);
      if (tint) root.style.setProperty('--cct-tint', tint);

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

        // Altitude from radial distance: center = 90° zenith, rim = 0° / night
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = Math.min(1.05, dist / maxRadius);

        let computedAltitude;
        if (normDist >= 0.98) {
          // Pulled to the outer rim dips into night mode
          computedAltitude = -10;
        } else {
          computedAltitude = Math.max(3, 90 - normDist * 88);
        }

        // Deactivate presets & live sync during manual drag
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

    setupDialDrag(heroDial, HERO_RADIUS);
    setupDialDrag(navDial, NAV_RADIUS);

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

        updateSolarPhysics(preset.azimuth, preset.altitude, 0.65);
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

        // Dawn (100° Az, 20° Alt) -> Noon (180° Az, 76° Alt) -> Dusk (295° Az, 8° Alt) -> Night (340° Az, -14° Alt) -> Dawn
        solarState.sweepTimeline
          .to(cycleObj, { az: 180, alt: 76, duration: 4.0, ease: 'sine.inOut' })
          .to(cycleObj, { az: 295, alt: 8, duration: 4.0, ease: 'sine.inOut' })
          .to(cycleObj, { az: 345, alt: -14, duration: 2.5, ease: 'power1.inOut' })
          .set(cycleObj, { az: 90, alt: -5 })
          .to(cycleObj, { az: 100, alt: 20, duration: 2.0, ease: 'power1.out' });
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

      // Attempt browser geolocation with quick fallback
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
            // Default to Julian's campus in Boulder, CO
            solarState.userLocation = { lat: 40.015, lon: -105.27, label: 'Boulder, CO' };
            applyCurrentSolarPosition();
          },
          { timeout: 4000 }
        );
      } else {
        solarState.userLocation = { lat: 40.015, lon: -105.27, label: 'Boulder, CO' };
        applyCurrentSolarPosition();
      }

      // Live 30s tracking interval
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

      updateSolarPhysics(solar.azimuth, solar.altitude, 0.65);
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

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      ctx.revert();
    });
  }

})();
