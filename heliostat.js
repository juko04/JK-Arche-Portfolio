/**
 * Julian Kotara — The Heliostat Sun-Clock & Ray Caster Engine
 * Interactive 360° Solar Compass, Trigonometric Ray Shadows & CCT Transitions
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeliostatEngine();
  initGSAPHeliostat();
});

function initHeliostatEngine() {
  const dialWrap = document.getElementById('compass-dial-wrap');
  const sunMarker = document.getElementById('compass-sun-marker');
  const rayVector = document.getElementById('compass-ray-vector');
  const readoutStatus = document.getElementById('solar-status-text');
  const readoutAzimuth = document.getElementById('val-azimuth');
  const readoutElevation = document.getElementById('val-elevation');
  const readoutCct = document.getElementById('val-cct');
  const ambientWash = document.getElementById('solar-ambient-wash');
  const presetButtons = document.querySelectorAll('.preset-btn');

  if (!dialWrap || !sunMarker) return;

  // State
  let azimuth = 180; // 180° = South (Noon)
  let elevation = 72; // High Noon elevation
  let isDraggingSun = false;
  const radius = 80; // Dial radius in px

  // Presets
  const presets = {
    morning: { azimuth: 105, elevation: 26, name: '08:00 AM · Morning Rake', cct: '4200K Morning Rake', tint: 'rgba(254, 243, 199, 0.22)' },
    noon: { azimuth: 180, elevation: 75, name: '12:00 PM · High Noon', cct: '6500K Clear Sky Noon', tint: 'rgba(224, 242, 254, 0.12)' },
    afternoon: { azimuth: 250, elevation: 32, name: '16:30 PM · Western Glare', cct: '3800K Afternoon Sun', tint: 'rgba(253, 230, 138, 0.28)' },
    dusk: { azimuth: 295, elevation: 8, name: '19:30 PM · Golden Twilight', cct: '2700K Low Horizon Dusk', tint: 'rgba(254, 215, 170, 0.38)' }
  };

  function updateRayPhysics(az, el, animate = false) {
    azimuth = az;
    elevation = Math.max(2, Math.min(88, el));

    // Convert Azimuth to Angle in radians
    // 0° = North (Up, -Y), 90° = East (+X), 180° = South (+Y), 270° = West (-X)
    const rad = (azimuth - 90) * (Math.PI / 180);

    // Marker position on the dial
    // Distance from center represents (90 - elevation)
    const normDist = ((90 - elevation) / 90) * radius;
    const markerX = 100 + Math.cos(rad) * normDist;
    const markerY = 100 + Math.sin(rad) * normDist;

    // Position Marker & Ray Vector
    sunMarker.style.left = `${markerX}px`;
    sunMarker.style.top = `${markerY}px`;

    if (rayVector) {
      const angleDeg = (rad * 180) / Math.PI;
      rayVector.style.width = `${normDist}px`;
      rayVector.style.transform = `rotate(${angleDeg}deg)`;
    }

    // Dynamic Cast Shadow Calculation
    // Light travels from sun position, so shadows are cast in opposite direction:
    // Shadow angle = azimuth + 180°
    const shadowRad = (azimuth + 90) * (Math.PI / 180);
    const shadowDistance = Math.max(6, ((90 - elevation) / 90) * 44);
    const shadowX = Math.cos(shadowRad) * shadowDistance;
    const shadowY = Math.sin(shadowRad) * shadowDistance;
    const shadowBlur = Math.max(14, shadowDistance * 1.35);
    const shadowOpacity = (0.07 + ((90 - elevation) / 90) * 0.08).toFixed(3);

    // CCT & Tint estimate
    let cctText = '5500K Architectural White';
    let washTint = 'transparent';

    if (elevation < 14) {
      cctText = '2700K Low Horizon Dusk';
      washTint = 'rgba(254, 215, 170, 0.38)';
    } else if (elevation < 35) {
      cctText = '3800K Warm Rake Angle';
      washTint = 'rgba(254, 243, 199, 0.22)';
    } else if (elevation < 60) {
      cctText = '5000K Direct Solar Beam';
      washTint = 'rgba(240, 249, 255, 0.1)';
    } else {
      cctText = '6500K Clear Sky Noon';
      washTint = 'rgba(224, 242, 254, 0.14)';
    }

    // Update Text Readouts
    if (readoutAzimuth) readoutAzimuth.textContent = `${Math.round(azimuth)}° Azimuth`;
    if (readoutElevation) readoutElevation.textContent = `${Math.round(elevation)}° Altitude`;
    if (readoutCct) readoutCct.textContent = cctText;
    if (readoutStatus) readoutStatus.textContent = `${Math.round(azimuth)}° / ${Math.round(elevation)}° Solar Beam`;
    if (ambientWash) ambientWash.style.background = washTint;

    // Update CSS custom variables on root
    const root = document.documentElement;
    if (animate && typeof gsap !== 'undefined') {
      const currentX = parseFloat(getComputedStyle(root).getPropertyValue('--ray-x')) || 0;
      const currentY = parseFloat(getComputedStyle(root).getPropertyValue('--ray-y')) || 12;
      const currentBlur = parseFloat(getComputedStyle(root).getPropertyValue('--ray-blur')) || 24;

      const proxy = { x: currentX, y: currentY, blur: currentBlur };
      gsap.to(proxy, {
        x: shadowX,
        y: shadowY,
        blur: shadowBlur,
        duration: 0.55,
        ease: 'power2.out',
        onUpdate: () => {
          root.style.setProperty('--ray-x', `${proxy.x}px`);
          root.style.setProperty('--ray-y', `${proxy.y}px`);
          root.style.setProperty('--ray-blur', `${proxy.blur}px`);
          root.style.setProperty('--ray-opacity', shadowOpacity);
        }
      });
    } else {
      root.style.setProperty('--ray-x', `${shadowX.toFixed(1)}px`);
      root.style.setProperty('--ray-y', `${shadowY.toFixed(1)}px`);
      root.style.setProperty('--ray-blur', `${shadowBlur.toFixed(1)}px`);
      root.style.setProperty('--ray-opacity', shadowOpacity);
    }
  }

  // Initial Calculation (Noon)
  updateRayPhysics(180, 75, false);

  // ==========================================
  // DRAGGING SUN MARKER ON COMPASS
  // ==========================================
  function handlePointerCoord(clientX, clientY) {
    const rect = dialWrap.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle in degrees (0° = North, 90° = East, 180° = South, 270° = West)
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = (angleRad * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    // Distance from center determines elevation
    const dist = Math.min(radius, Math.sqrt(dx * dx + dy * dy));
    const computedElevation = Math.max(5, 90 - (dist / radius) * 85);

    // Clear preset button active states when user drags manually
    presetButtons.forEach(b => b.classList.remove('active'));

    updateRayPhysics(angleDeg, computedElevation, false);
  }

  dialWrap.addEventListener('pointerdown', (e) => {
    isDraggingSun = true;
    dialWrap.setPointerCapture(e.pointerId);
    handlePointerCoord(e.clientX, e.clientY);
  });

  dialWrap.addEventListener('pointermove', (e) => {
    if (!isDraggingSun) return;
    handlePointerCoord(e.clientX, e.clientY);
  });

  dialWrap.addEventListener('pointerup', (e) => {
    if (!isDraggingSun) return;
    isDraggingSun = false;
    try { dialWrap.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  dialWrap.addEventListener('pointercancel', () => {
    isDraggingSun = false;
  });

  // ==========================================
  // PRESET BUTTONS
  // ==========================================
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.preset;
      const data = presets[mode];
      if (!data) return;

      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updateRayPhysics(data.azimuth, data.elevation, true);
    });
  });
}

function initGSAPHeliostat() {
  if (typeof gsap === 'undefined') return;

  const ctx = gsap.context(() => {
    gsap.from('.hero-datum-bar, .hero-headline, .hero-lead-text, .heliostat-instrument-box', {
      duration: 0.85,
      y: 20,
      autoAlpha: 0,
      stagger: 0.1,
      ease: 'power3.out',
      force3D: true
    });

    const cards = document.querySelectorAll('.study-card, .curatorial-card');
    cards.forEach(card => {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          duration: 0.75,
          y: 24,
          autoAlpha: 0,
          ease: 'power3.out',
          force3D: true
        });
      }
    });
  });
}
