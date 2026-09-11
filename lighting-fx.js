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

  // Remove any legacy spotlight element from DOM
  const existingSpot = document.querySelector('#ambient-spotlight-layer');
  if (existingSpot) existingSpot.remove();


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

    const maxNoonAlt = Math.max(5, Math.min(90, 90 - DEFAULT_LATITUDE + declinationDeg));

    return {
      decimalHour,
      sunriseHour,
      sunsetHour,
      altitude: alphaDeg,
      azimuth: thetaDeg,
      maxNoonAlt,
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
  // 5. Left-to-Right & Up-Down Solar Shadow Arc + Stood-off Night Backlight
  // ==========================================================================
  function applyHeroLighting(solar, S) {
    const heroTitle = document.querySelector('#hero-title');
    if (!heroTitle) return;

    const { altitude, azimuth, maxNoonAlt } = solar;

    // Front face is solid, dark architectural metal/charcoal
    document.documentElement.style.setProperty('--solar-title-color', '#1e2118');

    // Smooth continuous cross-fade parameters across dawn and dusk (eliminates any shadow bounce):
    // daylightT: 0 at deep night (<= -5°), ramp smoothly to 1.0 at daylight (>= +3°)
    const daylightT = Math.min(Math.max((altitude + 5) / 8, 0), 1);
    // glowT: 1.0 at deep night (<= -5°), dissolve smoothly to 0 at daylight (>= +3°)
    const glowT = Math.min(Math.max((-altitude + 3) / 8, 0), 1);

    const shadowLayers = [];

    // --- 1. Architectural Stood-Off Backlit Halo ---
    // Letters appear stood-off further from the wall: softer intensity, wider spread, deep atmospheric falloff
    if (glowT > 0.005) {
      const g1 = (0.60 * glowT).toFixed(2);
      const g2 = (0.38 * glowT).toFixed(2);
      const g3 = (0.22 * glowT).toFixed(2);
      const g4 = (0.09 * glowT).toFixed(2);

      shadowLayers.push(
        `0 0 10px rgba(255, 245, 215, ${g1})`,
        `0 0 24px rgba(250, 225, 160, ${g2})`,
        `0 0 48px rgba(230, 205, 140, ${g3})`,
        `0 0 78px rgba(200, 180, 120, ${g4})`
      );
    }

    // --- 2. Directional Solar Shadow (Continuous 2D Vector) ---
    // Single continuous vector function eliminating any bounce at sunrise / twilight:
    if (daylightT > 0.005) {
      const azRad = (azimuth * Math.PI) / 180;
      const effectiveAlt = Math.max(altitude, 0);
      const noonAlt = maxNoonAlt || 54.2;

      // Horizontal reach: reaches ~36px when sun is low at horizon, smoothly shrinks to 0 at solar noon
      const horizReach = 36 * Math.cos((effectiveAlt * Math.PI) / 180);
      const dx = (-Math.sin(azRad) * horizReach).toFixed(1);

      // Vertical reach: determined by solar noon altitude cotangent (reflecting latitude & season)
      const cotNoon = 1 / Math.tan((Math.min(noonAlt, 89.9) * Math.PI) / 180);
      const vertNoonReach = Math.max(0, Math.min(cotNoon * 22.0, 38.0));

      // Throughout the day, vertical offset tracks altitude elevation arc
      const sinNoon = Math.sin((noonAlt * Math.PI) / 180);
      const altRatio = Math.sin((effectiveAlt * Math.PI) / 180) / (sinNoon + 1e-6);
      const dy = (-vertNoonReach * Math.min(Math.max(altRatio, 0), 1.15)).toFixed(1);

      const normAlt = Math.min(effectiveAlt / noonAlt, 1);
      const umbraBlur = (2.5 + (1 - normAlt) * 5).toFixed(1);
      const penumbraBlur = (8 + (1 - normAlt) * 15).toFixed(1);

      const umbraAlpha = (0.35 * daylightT).toFixed(2);
      const penumbraAlpha = (0.20 * daylightT).toFixed(2);

      let umbraColor = '';
      let penumbraColor = '';
      if (altitude < 16) {
        const warmth = 1 - Math.max(altitude, 0) / 16;
        umbraColor = `rgba(${Math.round(45 + warmth * 40)}, ${Math.round(35 + warmth * 10)}, 25, ${umbraAlpha})`;
        penumbraColor = `rgba(${Math.round(110 + warmth * 60)}, ${Math.round(75 + warmth * 25)}, 45, ${penumbraAlpha})`;
      } else {
        umbraColor = `rgba(30, 32, 24, ${umbraAlpha})`;
        penumbraColor = `rgba(45, 48, 36, ${penumbraAlpha})`;
      }

      shadowLayers.push(
        `${(dx * 0.45).toFixed(1)}px ${(dy * 0.45).toFixed(1)}px ${umbraBlur}px ${umbraColor}`,
        `${dx}px ${dy}px ${penumbraBlur}px ${penumbraColor}`
      );
    }

    heroTitle.style.textShadow = shadowLayers.join(', ');
  }


  // ==========================================================================
  // 6. Interactive Time Scrubber Widget (Integrated directly below hero name)
  // ==========================================================================
  function initSolarWidget() {
    const heroSection = document.querySelector('.intro');
    const heroTitle = document.querySelector('#hero-title');
    if (!heroSection) return;

    let widget = document.querySelector('#solar-time-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'solar-time-widget';
      widget.className = 'solar-time-widget is-collapsed';
      widget.setAttribute('role', 'region');
      widget.setAttribute('aria-label', 'Solar & Lighting Simulation');

      widget.innerHTML = `
        <div class="solar-widget-collapsed-pill" id="solar-collapsed-pill" title="Click to adjust Solar Lighting Study">
          <span class="solar-icon" id="mini-solar-icon">☀️</span>
          <span class="solar-time-text" id="mini-solar-time">--:--</span>
          <span class="solar-pill-toggle" aria-hidden="true">▾</span>
        </div>

        <div class="solar-widget-panel" id="solar-widget-panel">
          <div class="solar-panel-header">
            <div class="solar-status-row">
              <span class="solar-icon-large" id="solar-icon-large">☀️</span>
              <span class="solar-time-display" id="solar-time-display">--:--</span>
            </div>
            <button type="button" class="solar-minimize-btn" id="solar-minimize-btn" aria-label="Minimize scrubber" title="Minimize">✕</button>
          </div>

          <div class="solar-metric-details" id="solar-metric-details">
            <span>Alt: <strong id="solar-metric-alt">--°</strong> · Az: <strong id="solar-metric-az">--°</strong></span>
            <span class="solar-phase-badge" id="solar-phase-badge">Daylight</span>
          </div>

          <div class="solar-slider-wrapper">
            <input type="range" class="solar-range-input" id="solar-range-input" min="0" max="24" step="0.25" value="13" aria-label="Simulate Time of Day">
            <div class="solar-slider-ticks">
              <span>12A</span>
              <span class="tick-sunrise" id="tick-sunrise">Rise</span>
              <span>12P</span>
              <span class="tick-sunset" id="tick-sunset">Set</span>
              <span>12A</span>
            </div>
          </div>

          <div class="solar-quick-bar">
            <button type="button" class="solar-quick-btn" data-hour="6.75">Rise</button>
            <button type="button" class="solar-quick-btn" data-hour="13">Noon</button>
            <button type="button" class="solar-quick-btn" data-hour="19.25">Set</button>
            <button type="button" class="solar-quick-btn" data-hour="22">Night</button>
            <button type="button" class="solar-live-toggle is-live" id="solar-live-toggle" title="Sync to device clock">● Live</button>
            <button type="button" class="solar-quick-btn solar-co-toggle" id="solar-co-toggle" title="Boulder, Colorado Time">CO</button>
          </div>
        </div>
      `;

      if (heroTitle && heroTitle.parentNode) {
        heroTitle.parentNode.insertBefore(widget, heroTitle.nextElementSibling);
      } else {
        heroSection.appendChild(widget);
      }
    } else if (heroTitle && widget.previousElementSibling !== heroTitle) {
      heroTitle.parentNode.insertBefore(widget, heroTitle.nextElementSibling);
    }

    let timeMode = 'local';
    let isLive = true;
    let isCollapsed = true;
    let currentDecimalHour = 13.0;

    const collapsedPill = widget.querySelector('#solar-collapsed-pill');
    const panel = widget.querySelector('#solar-widget-panel');
    const minimizeBtn = widget.querySelector('#solar-minimize-btn');
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

      const liveSuffix = isLive ? (timeMode === 'colorado' ? ' (CO)' : ' (Live)') : '';
      timeDisplay.textContent = `${timeStr} ${tzLabel}${liveSuffix}`;
      phaseBadge.textContent = solar.phaseLabel;
      phaseBadge.className = `solar-phase-badge phase-${solar.phase}`;

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
    initGlobalNavShading();
    initSolarWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
