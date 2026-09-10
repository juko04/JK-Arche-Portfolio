/**
 * Julian Kotara — Architectural & Lighting Design Portfolio
 * lighting-fx.js: Ambient Spotlight Cursor & Colorado Solar Time-of-Day Lighting Simulator
 * 
 * Features:
 * 1. Site-wide subtle spotlight cursor (60fps rAF with smooth organic easing).
 * 2. Colorado Solar Time-of-Day Engine (Boulder/Denver 40.0° N) calculating
 *    real-time solar altitude, azimuth, sunrise, sunset, and solar shadow on the hero title.
 * 3. Nighttime Architectural Illumination (luminous backlit glow after dusk).
 * 4. Interactive Time Scrubber allowing manual scrubbing through all 24 hours or live Colorado clock sync.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Site-Wide Ambient Spotlight Cursor (Subtle, Organic Architectural Beam)
  // ==========================================================================
  function initAmbientSpotlight() {
    // Only run on devices with fine pointer hover
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

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isMoving = false;
    let isVisible = false;
    let fadeTimeout = null;
    let animId = null;

    function render() {
      // Smooth organic lerp easing (0.18)
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      spotlightLayer.style.setProperty('--spot-x', `${currentX.toFixed(1)}px`);
      spotlightLayer.style.setProperty('--spot-y', `${currentY.toFixed(1)}px`);

      // Continue animating while there is movement
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
      }, 2000);
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
  // 2. Solar Engine & Time-of-Day Lighting Simulator
  //    Adapts automatically to the visitor's local timezone (100% client-side,
  //    zero network calls, zero permissions, completely privacy-safe).
  // ==========================================================================
  const DEFAULT_LATITUDE = 40.015; // Boulder, CO reference latitude

  // Get current date & decimal hour (supports Local Time by default, or Colorado Time)
  function getLiveDate(mode = 'local') {
    if (mode === 'colorado') {
      try {
        const denverStr = new Date().toLocaleString('en-US', { timeZone: 'America/Denver' });
        return new Date(denverStr);
      } catch (e) {
        return new Date();
      }
    }
    // Pure client-side local browser/device clock
    return new Date();
  }

  // Get user-friendly timezone label (e.g. "MDT", "EDT", "PDT", "BST", "CET")
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

  // Calculate day of year (1-366)
  function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Compute Solar Position for a given date and decimal hour (0.00 - 24.00)
  function computeSolar(date, decimalHour, isColorado = false) {
    const N = getDayOfYear(date);
    const latRad = (DEFAULT_LATITUDE * Math.PI) / 180;

    // Solar Declination (degrees -> radians)
    const declinationDeg = 23.45 * Math.sin(((360 / 365) * (N - 81) * Math.PI) / 180);
    const declinationRad = (declinationDeg * Math.PI) / 180;

    // Sunrise & Sunset Hour Angle
    const cosH0 = -Math.tan(latRad) * Math.tan(declinationRad);
    // In local clock time worldwide, solar noon is naturally near 12.5 - 13.0
    const solarNoonClock = isColorado ? 13.02 : 12.8;
    let sunriseHour = 6.5;
    let sunsetHour = 19.5;

    if (cosH0 >= -1 && cosH0 <= 1) {
      const H0Deg = (Math.acos(cosH0) * 180) / Math.PI;
      sunriseHour = solarNoonClock - H0Deg / 15;
      sunsetHour = solarNoonClock + H0Deg / 15;
    }

    // Solar Hour Angle H
    const solarTime = decimalHour - (solarNoonClock - 12.0);
    const HRad = ((solarTime - 12) * 15 * Math.PI) / 180;

    // Solar Altitude (Elevation) alpha
    const sinAlpha = Math.sin(latRad) * Math.sin(declinationRad) + Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(HRad);
    const alphaRad = Math.asin(Math.max(-1, Math.min(1, sinAlpha)));
    const alphaDeg = (alphaRad * 180) / Math.PI;

    // Solar Azimuth theta (0 = North, 90 = East, 180 = South, 270 = West)
    const cosTheta = (Math.sin(declinationRad) - Math.sin(latRad) * Math.sin(alphaRad)) /
                     (Math.cos(latRad) * Math.cos(alphaRad) + 1e-6);
    const thetaClamped = Math.max(-1, Math.min(1, cosTheta));
    let thetaDeg = (Math.acos(thetaClamped) * 180) / Math.PI;

    if (HRad > 0) {
      thetaDeg = 360 - thetaDeg;
    }

    // Determine Lighting Phase
    let phase = 'day';
    let phaseLabel = 'Daylight';
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
    } else {
      phase = 'day';
      phaseLabel = 'Solar Daylight';
      icon = '☀️';
    }

    return {
      decimalHour,
      sunriseHour,
      sunsetHour,
      altitude: alphaDeg,
      azimuth: thetaDeg,
      phase,
      phaseLabel,
      icon
    };
  }

  // Format decimal hour to 12-hour clock (e.g. 7.25 -> "7:15 AM")
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
  // 3. Dynamic Text Shadow & Backlight Renderer on #hero-title
  // ==========================================================================
  let isSolarEffectEnabled = true;

  function applyHeroLighting(solar) {
    const heroTitle = document.querySelector('#hero-title');
    if (!heroTitle) return;

    if (!isSolarEffectEnabled) {
      heroTitle.style.textShadow = '';
      return;
    }

    const { altitude, azimuth } = solar;

    // --- NIGHT MODE: Architectural Backlit Glow ---
    if (altitude <= -6) {
      // Soft, luminous museum-grade backlit typography
      heroTitle.style.textShadow = [
        '0 0 16px rgba(255, 255, 255, 0.48)',
        '0 0 38px rgba(245, 240, 220, 0.28)',
        '0 0 70px rgba(185, 205, 160, 0.18)'
      ].join(', ');
      return;
    }

    // --- TWILIGHT TRANSITION (-6° to 0°): Blend shadow into night glow ---
    if (altitude <= 0) {
      const t = (altitude + 6) / 6; // 0 (night) to 1 (horizon)
      const glowOpacity = (1 - t) * 0.45;
      const shadowOpacity = t * 0.2;
      const angleRad = (azimuth * Math.PI) / 180;
      const dx = (-Math.sin(angleRad) * 24).toFixed(1);
      const dy = (Math.cos(angleRad) * 14).toFixed(1);

      heroTitle.style.textShadow = [
        `0 0 ${(24 * (1 - t)).toFixed(1)}px rgba(255, 255, 255, ${glowOpacity.toFixed(2)})`,
        `${dx}px ${dy}px 24px rgba(60, 45, 30, ${shadowOpacity.toFixed(2)})`
      ].join(', ');
      return;
    }

    // --- DAYTIME SOLAR CAST SHADOW (altitude > 0°) ---
    // Shadow direction is opposite to sun azimuth
    const shadowAngleRad = ((azimuth + 180) * Math.PI) / 180;

    // Shadow distance: inversely proportional to sun altitude (longer at sunrise/sunset, crisp and short at midday)
    const effectiveAlt = Math.max(altitude, 8);
    const cotAlt = 1 / Math.tan((effectiveAlt * Math.PI) / 180);
    const distance = Math.min(Math.max(cotAlt * 12, 5), 32);

    // Coordinate offsets (dy scaled by 0.72 for perspective)
    const dx = (Math.sin(shadowAngleRad) * distance).toFixed(1);
    const dy = (-Math.cos(shadowAngleRad) * distance * 0.72).toFixed(1);

    // Diffusion: Umbra (core) and Penumbra (scattering)
    const altRatio = Math.min(altitude / 60, 1);
    const umbraBlur = (3 + (1 - altRatio) * 6).toFixed(1);
    const penumbraBlur = (10 + (1 - altRatio) * 18).toFixed(1);

    // Warmth: Golden hour (altitude < 16°) has warm amber/terracotta tone; midday has crisp neutral tone
    let umbraColor = '';
    let penumbraColor = '';

    if (altitude < 16) {
      const warmth = (1 - altitude / 16);
      umbraColor = `rgba(${Math.round(45 + warmth * 40)}, ${Math.round(35 + warmth * 10)}, 25, 0.32)`;
      penumbraColor = `rgba(${Math.round(110 + warmth * 60)}, ${Math.round(75 + warmth * 25)}, 45, 0.18)`;
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
  // 4. Interactive Time Scrubber Widget (Discreet Architectural Study)
  // ==========================================================================
  function initSolarWidget() {
    const heroSection = document.querySelector('.intro');
    if (!heroSection) return; // Only active on pages with the hero

    // Create wrapper if not existing
    let widget = document.querySelector('#solar-time-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'solar-time-widget';
      widget.className = 'solar-time-widget';
      widget.setAttribute('role', 'region');
      widget.setAttribute('aria-label', 'Colorado Solar & Lighting Simulation');

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
            <button type="button" class="solar-live-toggle is-live" id="solar-live-toggle" title="Sync to your local device clock (100% private)">● Live Local</button>
            <button type="button" class="solar-quick-btn solar-co-toggle" id="solar-co-toggle" title="View Boulder, Colorado Time">CO Studio</button>
          </div>
        </div>
      `;

      heroSection.appendChild(widget);
    }

    // State Variables
    let timeMode = 'local'; // 'local' or 'colorado'
    let isLive = true;
    let isCollapsed = false;
    let currentDecimalHour = 13.0;

    // DOM References
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
      const isNight = solar.altitude <= -6;

      // Update Texts & Badges
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

      // Apply to #hero-title
      applyHeroLighting(solar);
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

    // Range Slider Scrubbing
    rangeInput.addEventListener('input', (e) => {
      onManualScrub(e.target.value);
    });

    // Quick Preset Buttons
    widget.querySelectorAll('.solar-quick-btn:not(.solar-co-toggle)').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetHour = parseFloat(btn.dataset.hour);
        onManualScrub(targetHour);
      });
    });

    // Live Local Button
    liveToggle.addEventListener('click', () => {
      timeMode = 'local';
      isLive = true;
      syncLive();
    });

    // Colorado Studio Toggle
    coToggle.addEventListener('click', () => {
      timeMode = 'colorado';
      isLive = true;
      syncLive();
    });

    // Collapse / Expand Toggles
    minimizeBtn.addEventListener('click', () => {
      isCollapsed = true;
      widget.classList.add('is-collapsed');
    });

    collapsedPill.addEventListener('click', () => {
      isCollapsed = false;
      widget.classList.remove('is-collapsed');
    });

    // Initial Live Sync and Interval
    syncLive();
    setInterval(syncLive, 10000); // Check live time every 10s
  }


  // ==========================================================================
  // 5. Lifecycle Initialization
  // ==========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAmbientSpotlight();
      initSolarWidget();
    });
  } else {
    initAmbientSpotlight();
    initSolarWidget();
  }
})();

