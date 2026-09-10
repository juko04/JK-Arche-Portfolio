/**
 * Julian Kotara — Architectural & Lighting Design Portfolio
 * lighting-fx.js: Ambient Spotlight Cursor & Solar Time-of-Day Simulator
 * 
 * Features:
 * 1. Site-Wide Ambient Spotlight Cursor (60fps rAF with smooth organic easing,
 *    and enhanced luminous beam over dark pages & photography).
 * 2. Solar Daylight & Time-of-Day Engine:
 *    - Automatic local timezone support (100% private, client-side, zero network calls).
 *    - Left-to-right shadow movement following solar azimuth (top=North, bottom=South).
 *    - Subtle green canvas daylight dimming on the homepage (midday bright -> nocturnal sage).
 *    - High-contrast radiant architectural backlit night glow on "Julian Kotara".
 *    - Dynamic solar shading on top navigation (.glass-nav) carried across all pages.
 * 3. Interactive Time Scrubber Widget with manual 24h range slider and Colorado studio toggle.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Site-Wide Ambient Spotlight Cursor (Subtle on light, Vivid on dark)
  // ==========================================================================
  function initAmbientSpotlight() {
    if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) {
      return;
    }

    let spotlightLayer = document.querySelector('#ambient-spotlight-layer');
    if (!spotlightLayer) {
      spotlightLayer = document.createElement('div');
      spotlightLayer.id = 'ambient-spotlight-layer';
      spotlightLayer.className = 'ambient-spotlight-layer';
      spotlightLayer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(spotlightLayer);
    }

    // Check if current page or section is dark
    const isDarkPage = document.body.classList.contains('photo-page') || 
                       document.querySelector('.photo-container') !== null;
    if (isDarkPage) {
      spotlightLayer.classList.add('is-dark');
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isMoving = false;
    let isVisible = false;
    let fadeTimeout = null;
    let animId = null;

    function render() {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      spotlightLayer.style.setProperty('--spot-x', `${currentX.toFixed(1)}px`);
      spotlightLayer.style.setProperty('--spot-y', `${currentY.toFixed(1)}px`);

      const dist = Math.hypot(targetX - currentX, targetY - currentY);
      if (dist > 0.1 || isMoving) {
        animId = requestAnimationFrame(render);
      } else {
        animId = null;
      }
    }

    function onPointerMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
      isMoving = true;

      if (!isVisible) {
        isVisible = true;
        spotlightLayer.classList.add('is-active');
      }

      if (!animId) {
        animId = requestAnimationFrame(render);
      }

      clearTimeout(fadeTimeout);
      fadeTimeout = setTimeout(() => {
        isMoving = false;
      }, 2500);
    }

    function onPointerLeave() {
      isVisible = false;
      isMoving = false;
      spotlightLayer.classList.remove('is-active');
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave, { passive: true });
  }


  // ==========================================================================
  // 2. Solar Engine & Astronomical Time-of-Day Calculations
  // ==========================================================================
  const DEFAULT_LATITUDE = 40.015; // Boulder, CO reference latitude

  function getLiveDate(mode = 'local') {
    if (mode === 'colorado') {
      try {
        const denverStr = new Date().toLocaleString('en-US', { timeZone: 'America/Denver' });
        return new Date(denverStr);
      } catch (e) {
        return new Date();
      }
    }
    return new Date();
  }

  function getTimezoneAbbreviation(mode = 'local') {
    try {
      const tz = mode === 'colorado' ? 'America/Denver' : undefined;
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short'
      }).formatToParts(new Date());
      const tzPart = parts.find(p => p.type === 'timeZoneName');
      return tzPart ? tzPart.value : (mode === 'colorado' ? 'MDT' : 'Local');
    } catch (e) {
      return mode === 'colorado' ? 'MDT' : 'Local';
    }
  }

  function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function computeSolar(date, decimalHour, isColorado = false) {
    const N = getDayOfYear(date);
    const latRad = (DEFAULT_LATITUDE * Math.PI) / 180;

    const declinationDeg = 23.45 * Math.sin(((360 / 365) * (N - 81) * Math.PI) / 180);
    const declinationRad = (declinationDeg * Math.PI) / 180;

    const cosH0 = -Math.tan(latRad) * Math.tan(declinationRad);
    const solarNoonClock = isColorado ? 13.02 : 12.8;
    let sunriseHour = 6.5;
    let sunsetHour = 19.5;

    if (cosH0 >= -1 && cosH0 <= 1) {
      const H0Deg = (Math.acos(cosH0) * 180) / Math.PI;
      sunriseHour = solarNoonClock - H0Deg / 15;
      sunsetHour = solarNoonClock + H0Deg / 15;
    }

    const solarTime = decimalHour - (solarNoonClock - 12.0);
    const HRad = ((solarTime - 12) * 15 * Math.PI) / 180;

    const sinAlpha = Math.sin(latRad) * Math.sin(declinationRad) + Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(HRad);
    const alphaRad = Math.asin(Math.max(-1, Math.min(1, sinAlpha)));
    const alphaDeg = (alphaRad * 180) / Math.PI;

    const cosTheta = (Math.sin(declinationRad) - Math.sin(latRad) * Math.sin(alphaRad)) /
                     (Math.cos(latRad) * Math.cos(alphaRad) + 1e-6);
    const thetaClamped = Math.max(-1, Math.min(1, cosTheta));
    let thetaDeg = (Math.acos(thetaClamped) * 180) / Math.PI;

    if (HRad > 0) {
      thetaDeg = 360 - thetaDeg;
    }

    // Solar Daylight Factor S (1.0 = midday sun, 0.35 = horizon/sunset, 0.0 = deep night)
    let daylightFactor = 0;
    if (alphaDeg > 0) {
      daylightFactor = 0.35 + 0.65 * Math.min(1, alphaDeg / 35);
    } else if (alphaDeg >= -6) {
      daylightFactor = 0.35 * (alphaDeg + 6) / 6;
    } else {
      daylightFactor = 0;
    }

    let phase = 'day';
    let phaseLabel = 'Solar Daylight';
    let icon = '☀️';

    if (alphaDeg < -6) {
      phase = 'night';
      phaseLabel = 'Night · Backlit Glow';
      icon = '🌙';
    } else if (alphaDeg <= 0) {
      phase = 'twilight';
      phaseLabel = 'Twilight';
      icon = '🌆';
    } else if (alphaDeg <= 12) {
      phase = 'golden';
      phaseLabel = decimalHour < 12 ? 'Morning Golden Hour' : 'Evening Golden Hour';
      icon = '🌅';
    }

    return {
      decimalHour,
      sunriseHour,
      sunsetHour,
      altitude: alphaDeg,
      azimuth: thetaDeg,
      daylightFactor,
      phase,
      phaseLabel,
      icon
    };
  }

  function formatTime(decimalHour) {
    let normalized = decimalHour % 24;
    if (normalized < 0) normalized += 24;
    const h = Math.floor(normalized);
    const m = Math.round((normalized - h) * 60) % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : `${m}`;
    return `${displayH}:${displayM} ${period}`;
  }


  // ==========================================================================
  // 3. Dynamic Top Navigation Shading (Applied across ALL pages)
  // ==========================================================================
  function applyNavShading(S) {
    const r = Math.round(245 * S + 26 * (1 - S));
    const g = Math.round(244 * S + 29 * (1 - S));
    const b = Math.round(237 * S + 22 * (1 - S));
    const borderAlpha = (0.45 * S + 0.14 * (1 - S)).toFixed(2);
    const ink = S > 0.35 ? '#21231a' : '#ece9df';

    document.documentElement.style.setProperty('--solar-nav-bg', `rgba(${r}, ${g}, ${b}, 0.88)`);
    document.documentElement.style.setProperty('--solar-nav-border', `rgba(255, 255, 255, ${borderAlpha})`);
    document.documentElement.style.setProperty('--solar-nav-ink', ink);
  }


  // ==========================================================================
  // 4. Subtle Homepage Canvas Dimming (index.html only)
  // ==========================================================================
  function applyCanvasDimming(S) {
    const intro = document.querySelector('.intro');
    if (!intro) return;

    // Subtly modulates lightness between 65% (bright midday) and 38% (deep nocturnal sage)
    const lightness = Math.round(38 + 27 * S);
    const sat = Math.round(20 + 6 * S);
    const canvasBg = `hsl(75, ${sat}%, ${lightness}%)`;

    document.documentElement.style.setProperty('--solar-canvas-bg', canvasBg);
    document.body.style.backgroundColor = canvasBg;

    // High contrast ink tones on the dimmed green canvas
    const heroInk = S > 0.35 ? '#21231a' : '#ece9df';
    const heroMuted = S > 0.35 ? 'rgba(67, 70, 57, 0.7)' : 'rgba(236, 233, 223, 0.75)';
    const heroLine = S > 0.35 ? 'hsla(75, 14%, 12%, 0.16)' : 'rgba(255, 255, 255, 0.18)';
    const circleAlpha = (0.16 * (1 - S) + 0.35 * S).toFixed(2);

    document.documentElement.style.setProperty('--solar-hero-ink', heroInk);
    document.documentElement.style.setProperty('--solar-hero-muted', heroMuted);
    document.documentElement.style.setProperty('--solar-hero-line', heroLine);
    document.documentElement.style.setProperty('--solar-circle-alpha', circleAlpha);
  }


  // ==========================================================================
  // 5. Left-to-Right Solar Shadow & Radiant Night Glow on #hero-title
  // ==========================================================================
  function applyHeroLighting(solar, S) {
    const heroTitle = document.querySelector('#hero-title');
    if (!heroTitle) return;

    const { altitude, azimuth } = solar;

    // --- NIGHT MODE: Luminous off-white with radiant multi-tier back-glow ---
    if (altitude <= -6) {
      document.documentElement.style.setProperty('--solar-title-color', '#f5f6ed');
      heroTitle.style.textShadow = [
        '0 0 16px rgba(255, 255, 255, 0.92)',
        '0 0 38px rgba(245, 240, 220, 0.68)',
        '0 0 75px rgba(185, 215, 155, 0.45)',
        '0 0 115px rgba(150, 190, 120, 0.28)'
      ].join(', ');
      return;
    }

    // --- TWILIGHT TRANSITION (-6° to 0°): Smooth crossfade ---
    if (altitude <= 0) {
      const t = (altitude + 6) / 6; // 0 (night) to 1 (sunset)
      const titleR = Math.round(245 * (1 - t) + 33 * t);
      const titleG = Math.round(246 * (1 - t) + 35 * t);
      const titleB = Math.round(237 * (1 - t) + 26 * t);
      document.documentElement.style.setProperty('--solar-title-color', `rgb(${titleR}, ${titleG}, ${titleB})`);

      const azRad = (azimuth * Math.PI) / 180;
      const dx = (-Math.sin(azRad) * 28).toFixed(1);
      const dy = (Math.cos(azRad) * 16 * 0.7).toFixed(1);

      heroTitle.style.textShadow = [
        `0 0 ${(34 * (1 - t)).toFixed(1)}px rgba(255, 255, 255, ${(0.88 * (1 - t)).toFixed(2)})`,
        `0 0 ${(68 * (1 - t)).toFixed(1)}px rgba(245, 240, 220, ${(0.55 * (1 - t)).toFixed(2)})`,
        `${dx}px ${dy}px 24px rgba(50, 38, 26, ${(0.22 * t).toFixed(2)})`
      ].join(', ');
      return;
    }

    // --- DAYTIME: Title is dark charcoal #21231a ---
    document.documentElement.style.setProperty('--solar-title-color', '#21231a');

    // Solar azimuth mapping (top=North, bottom=South, right=East, left=West):
    // Morning (East sun): dx < 0 (points LEFT)
    // Midday (South sun): dx = 0, dy < 0 (points UP / NORTH)
    // Evening (West sun): dx > 0 (points RIGHT)
    const azRad = (azimuth * Math.PI) / 180;
    const effectiveAlt = Math.max(altitude, 6);
    const cotAlt = 1 / Math.tan((effectiveAlt * Math.PI) / 180);
    const distance = Math.min(Math.max(cotAlt * 12, 5), 32);

    const dx = (-Math.sin(azRad) * distance).toFixed(1);
    const dy = (Math.cos(azRad) * distance * 0.7).toFixed(1);

    const altRatio = Math.min(altitude / 60, 1);
    const umbraBlur = (3 + (1 - altRatio) * 6).toFixed(1);
    const penumbraBlur = (10 + (1 - altRatio) * 18).toFixed(1);

    let umbraColor = '';
    let penumbraColor = '';
    if (altitude < 16) {
      const warmth = 1 - altitude / 16;
      umbraColor = `rgba(${Math.round(45 + warmth * 40)}, ${Math.round(35 + warmth * 10)}, 25, 0.35)`;
      penumbraColor = `rgba(${Math.round(110 + warmth * 60)}, ${Math.round(75 + warmth * 25)}, 45, 0.2)`;
    } else {
      umbraColor = 'rgba(30, 32, 24, 0.28)';
      penumbraColor = 'rgba(45, 48, 36, 0.14)';
    }

    heroTitle.style.textShadow = [
      `${(dx * 0.45).toFixed(1)}px ${(dy * 0.45).toFixed(1)}px ${umbraBlur}px ${umbraColor}`,
      `${dx}px ${dy}px ${penumbraBlur}px ${penumbraColor}`
    ].join(', ');
  }


  // ==========================================================================
  // 6. Interactive Time Scrubber Widget (index.html hero)
  // ==========================================================================
  function initSolarWidget() {
    const heroSection = document.querySelector('.intro');
    if (!heroSection) return;

    let widget = document.querySelector('#solar-time-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'solar-time-widget';
      widget.className = 'solar-time-widget';
      widget.setAttribute('role', 'region');
      widget.setAttribute('aria-label', 'Solar & Lighting Simulation');

      widget.innerHTML = `
        <div class="solar-widget-collapsed-pill" id="solar-collapsed-pill" title="Click to open Solar Lighting Scrubber">
          <span class="solar-icon" id="mini-solar-icon">☀️</span>
          <span class="solar-time-text" id="mini-solar-time">--:--</span>
          <span class="solar-pulse-dot" title="Live Clock active"></span>
        </div>

        <div class="solar-widget-panel" id="solar-widget-panel">
          <div class="solar-panel-header">
            <div class="solar-title-group">
              <span class="solar-header-kicker" id="solar-header-kicker">Solar Lighting Study · Local Time</span>
              <div class="solar-status-row">
                <span class="solar-icon-large" id="solar-icon-large">☀️</span>
                <span class="solar-time-display" id="solar-time-display">--:--</span>
                <span class="solar-phase-badge" id="solar-phase-badge">Daylight</span>
              </div>
            </div>
            <button type="button" class="solar-minimize-btn" id="solar-minimize-btn" aria-label="Minimize scrubber" title="Minimize">✕</button>
          </div>

          <div class="solar-metric-details" id="solar-metric-details">
            Altitude: <strong id="solar-metric-alt">--°</strong> · Azimuth: <strong id="solar-metric-az">--°</strong>
          </div>

          <div class="solar-slider-wrapper">
            <input type="range" class="solar-range-input" id="solar-range-input" min="0" max="24" step="0.25" value="13" aria-label="Simulate Time of Day">
            <div class="solar-slider-ticks">
              <span>12A</span>
              <span class="tick-sunrise" id="tick-sunrise" title="Sunrise">Sunrise</span>
              <span>12P</span>
              <span class="tick-sunset" id="tick-sunset" title="Sunset">Sunset</span>
              <span>12A</span>
            </div>
          </div>

          <div class="solar-quick-bar">
            <button type="button" class="solar-quick-btn" data-hour="6.75">Sunrise</button>
            <button type="button" class="solar-quick-btn" data-hour="13">Noon</button>
            <button type="button" class="solar-quick-btn" data-hour="19.25">Sunset</button>
            <button type="button" class="solar-quick-btn" data-hour="22">Night Glow</button>
            <button type="button" class="solar-live-toggle is-live" id="solar-live-toggle" title="Sync to your local device clock">● Live Local</button>
            <button type="button" class="solar-quick-btn solar-co-toggle" id="solar-co-toggle" title="View Boulder, Colorado Time">CO Studio</button>
          </div>
        </div>
      `;

      heroSection.appendChild(widget);
    }

    let timeMode = 'local';
    let isLive = true;
    let isCollapsed = false;
    let currentDecimalHour = 13.0;

    const collapsedPill = widget.querySelector('#solar-collapsed-pill');
    const panel = widget.querySelector('#solar-widget-panel');
    const minimizeBtn = widget.querySelector('#solar-minimize-btn');
    const headerKicker = widget.querySelector('#solar-header-kicker');
    const liveToggle = widget.querySelector('#solar-live-toggle');
    const coToggle = widget.querySelector('#solar-co-toggle');
    const rangeInput = widget.querySelector('#solar-range-input');
    const miniIcon = widget.querySelector('#mini-solar-icon');
    const miniTime = widget.querySelector('#mini-solar-time');
    const iconLarge = widget.querySelector('#solar-icon-large');
    const timeDisplay = widget.querySelector('#solar-time-display');
    const phaseBadge = widget.querySelector('#solar-phase-badge');
    const metricAlt = widget.querySelector('#solar-metric-alt');
    const metricAz = widget.querySelector('#solar-metric-az');
    const tickSunrise = widget.querySelector('#tick-sunrise');
    const tickSunset = widget.querySelector('#tick-sunset');

    function updateWidget(solar) {
      const tzLabel = getTimezoneAbbreviation(timeMode);
      const timeStr = formatTime(solar.decimalHour);

      miniIcon.textContent = solar.icon;
      miniTime.textContent = `${timeStr} ${tzLabel}`;
      iconLarge.textContent = solar.icon;

      const liveSuffix = isLive ? (timeMode === 'colorado' ? ' (CO Live)' : ' (Live)') : '';
      timeDisplay.textContent = `${timeStr} ${tzLabel}${liveSuffix}`;
      phaseBadge.textContent = solar.phaseLabel;
      phaseBadge.className = `solar-phase-badge phase-${solar.phase}`;

      headerKicker.textContent = timeMode === 'colorado' 
        ? 'Solar Lighting Study · Boulder, CO' 
        : `Solar Lighting Study · Local Time (${tzLabel})`;

      metricAlt.textContent = `${solar.altitude.toFixed(1)}°`;
      metricAz.textContent = `${solar.azimuth.toFixed(0)}°`;

      if (tickSunrise) {
        tickSunrise.textContent = `Rise ${formatTime(solar.sunriseHour).replace(' ', '')}`;
      }
      if (tickSunset) {
        tickSunset.textContent = `Set ${formatTime(solar.sunsetHour).replace(' ', '')}`;
      }

      if (isLive) {
        rangeInput.value = solar.decimalHour;
        if (timeMode === 'local') {
          liveToggle.classList.add('is-live');
          coToggle.classList.remove('is-active');
        } else {
          liveToggle.classList.remove('is-live');
          coToggle.classList.add('is-active');
        }
      } else {
        liveToggle.classList.remove('is-live');
        coToggle.classList.remove('is-active');
      }

      // 1. Shading on Top Navigation Bar (Shared across all pages)
      applyNavShading(solar.daylightFactor);

      // 2. Canvas Dimming on first page
      applyCanvasDimming(solar.daylightFactor);

      // 3. Dynamic Shadow & Night Glow on #hero-title
      applyHeroLighting(solar, solar.daylightFactor);
    }

    function syncLive() {
      if (!isLive) return;
      const liveDate = getLiveDate(timeMode);
      const decimalHour = liveDate.getHours() + liveDate.getMinutes() / 60 + liveDate.getSeconds() / 3600;
      currentDecimalHour = decimalHour;
      const solar = computeSolar(liveDate, currentDecimalHour, timeMode === 'colorado');
      updateWidget(solar);
    }

    function onManualScrub(hour) {
      isLive = false;
      currentDecimalHour = parseFloat(hour);
      rangeInput.value = currentDecimalHour;
      const liveDate = getLiveDate(timeMode);
      const solar = computeSolar(liveDate, currentDecimalHour, timeMode === 'colorado');
      updateWidget(solar);
    }

    rangeInput.addEventListener('input', (e) => {
      onManualScrub(e.target.value);
    });

    widget.querySelectorAll('.solar-quick-btn:not(.solar-co-toggle)').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetHour = parseFloat(btn.dataset.hour);
        onManualScrub(targetHour);
      });
    });

    liveToggle.addEventListener('click', () => {
      timeMode = 'local';
      isLive = true;
      syncLive();
    });

    coToggle.addEventListener('click', () => {
      timeMode = 'colorado';
      isLive = true;
      syncLive();
    });

    minimizeBtn.addEventListener('click', () => {
      isCollapsed = true;
      widget.classList.add('is-collapsed');
    });

    collapsedPill.addEventListener('click', () => {
      isCollapsed = false;
      widget.classList.remove('is-collapsed');
    });

    syncLive();
    setInterval(syncLive, 10000);
  }


  // ==========================================================================
  // 7. Global Navigation Shading on Non-Hero Pages
  // ==========================================================================
  function initGlobalNavShading() {
    // If not on hero page, still compute and apply live solar nav shading
    if (document.querySelector('.intro')) return; // Handled by widget

    function syncNonHeroNav() {
      const liveDate = getLiveDate('local');
      const decimalHour = liveDate.getHours() + liveDate.getMinutes() / 60 + liveDate.getSeconds() / 3600;
      const solar = computeSolar(liveDate, decimalHour, false);
      applyNavShading(solar.daylightFactor);
    }

    syncNonHeroNav();
    setInterval(syncNonHeroNav, 10000);
  }


  // ==========================================================================
  // 8. Lifecycle Initialization
  // ==========================================================================
  function init() {
    initAmbientSpotlight();
    initGlobalNavShading();
    initSolarWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
