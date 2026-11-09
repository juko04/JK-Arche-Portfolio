/**
 * Julian Kotara — The Interactive Drafting Desk Engine
 * Infinite spatial canvas panning, smooth zoom, draggable sheets & camera dock
 */

document.addEventListener('DOMContentLoaded', () => {
  initDraftingDesk();
});

function initDraftingDesk() {
  const viewport = document.getElementById('drafting-viewport');
  const surface = document.getElementById('drafting-surface');
  const dockItems = document.querySelectorAll('.dock-item');
  const sheets = document.querySelectorAll('.arch-sheet');
  const coordsDisplay = document.getElementById('hud-coords');

  if (!viewport || !surface) return;

  // Camera State
  let camera = {
    x: -1100, // Centers around sheet-hero-main initially
    y: -800,
    zoom: 0.85
  };

  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let highestZ = 20;

  function applyCamera(animate = false) {
    if (animate && typeof gsap !== 'undefined') {
      gsap.to(surface, {
        x: camera.x,
        y: camera.y,
        scale: camera.zoom,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto',
        onUpdate: updateCoordsDisplay
      });
    } else {
      surface.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
      updateCoordsDisplay();
    }
  }

  function updateCoordsDisplay() {
    if (coordsDisplay) {
      const focalX = Math.round(-camera.x + window.innerWidth / 2);
      const focalY = Math.round(-camera.y + window.innerHeight / 2);
      coordsDisplay.textContent = `CANVAS // X: ${focalX} · Y: ${focalY} · ${(camera.zoom * 100).toFixed(0)}%`;
    }
  }

  // Initial Center Call
  centerOnElement(document.getElementById('sheet-hero'), false);

  // ==========================================
  // VIEWPORT PANNING (Background Drag)
  // ==========================================
  viewport.addEventListener('pointerdown', (e) => {
    // Only pan if clicking the viewport/surface directly (not an arch-sheet or UI button)
    if (e.target.closest('.arch-sheet') || e.target.closest('.desk-hud-top') || e.target.closest('.camera-dock-wrap') || e.target.closest('.desk-zoom-hud') || e.target.closest('.sheet-modal')) {
      return;
    }

    isPanning = true;
    viewport.classList.add('is-panning');
    startX = e.clientX - camera.x;
    startY = e.clientY - camera.y;
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    camera.x = e.clientX - startX;
    camera.y = e.clientY - startY;
    applyCamera(false);
  });

  viewport.addEventListener('pointerup', (e) => {
    if (!isPanning) return;
    isPanning = false;
    viewport.classList.remove('is-panning');
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  viewport.addEventListener('pointercancel', () => {
    isPanning = false;
    viewport.classList.remove('is-panning');
  });

  // ==========================================
  // WHEEL ZOOM
  // ==========================================
  viewport.addEventListener('wheel', (e) => {
    if (e.target.closest('.sheet-modal')) return;
    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(1.3, Math.max(0.55, camera.zoom * zoomFactor));

    // Zoom centered towards mouse position
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const focalX = (mouseX - camera.x) / camera.zoom;
    const focalY = (mouseY - camera.y) / camera.zoom;

    camera.x = mouseX - focalX * newZoom;
    camera.y = mouseY - focalY * newZoom;
    camera.zoom = newZoom;

    applyCamera(false);
  }, { passive: false });

  // Zoom HUD Buttons
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      camera.zoom = Math.min(1.3, camera.zoom + 0.15);
      applyCamera(true);
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      camera.zoom = Math.max(0.55, camera.zoom - 0.15);
      applyCamera(true);
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      centerOnElement(document.getElementById('sheet-hero'), true);
    });
  }

  // ==========================================
  // DRAGGABLE SHEETS & Z-INDEX FOCUS
  // ==========================================
  sheets.forEach(sheet => {
    let isDraggingSheet = false;
    let sheetStartX = 0;
    let sheetStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    sheet.addEventListener('pointerdown', (e) => {
      // Don't drag if clicking interactive link/button inside sheet
      if (e.target.closest('a') || e.target.closest('button')) return;

      isDraggingSheet = true;
      highestZ += 1;
      sheet.style.zIndex = highestZ;

      sheetStartX = e.clientX;
      sheetStartY = e.clientY;
      initialLeft = parseFloat(sheet.style.left) || sheet.offsetLeft;
      initialTop = parseFloat(sheet.style.top) || sheet.offsetTop;

      sheet.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    sheet.addEventListener('pointermove', (e) => {
      if (!isDraggingSheet) return;
      const dx = (e.clientX - sheetStartX) / camera.zoom;
      const dy = (e.clientY - sheetStartY) / camera.zoom;

      sheet.style.left = `${initialLeft + dx}px`;
      sheet.style.top = `${initialTop + dy}px`;
    });

    sheet.addEventListener('pointerup', (e) => {
      if (!isDraggingSheet) return;
      isDraggingSheet = false;
      try { sheet.releasePointerCapture(e.pointerId); } catch (_) {}
      e.stopPropagation();
    });

    sheet.addEventListener('pointercancel', () => {
      isDraggingSheet = false;
    });

    // Bring sheet to top on click
    sheet.addEventListener('click', () => {
      highestZ += 1;
      sheet.style.zIndex = highestZ;
    });
  });

  // ==========================================
  // CAMERA DOCK FOCUS ENGINE
  // ==========================================
  function centerOnElement(el, animate = true) {
    if (!el) return;
    highestZ += 1;
    el.style.zIndex = highestZ;

    const elLeft = el.offsetLeft;
    const elTop = el.offsetTop;
    const elWidth = el.offsetWidth;
    const elHeight = el.offsetHeight;

    const targetZoom = el.id === 'sheet-hero' ? 0.85 : 0.95;
    camera.zoom = targetZoom;

    camera.x = window.innerWidth / 2 - (elLeft + elWidth / 2) * targetZoom;
    camera.y = window.innerHeight / 2 - (elTop + elHeight / 2) * targetZoom;

    applyCamera(animate);
  }

  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      if (!targetId) return;

      dockItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        centerOnElement(targetEl, true);
      }
    });
  });

  // ==========================================
  // SHEET INSPECTION MODAL
  // ==========================================
  const modal = document.getElementById('sheet-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalImage = document.getElementById('modal-image');
  const modalLink = document.getElementById('modal-link');
  const modalClose = document.getElementById('modal-close');

  const sheetData = {
    'sheet-lobby': {
      title: 'University Central Lobby',
      desc: 'Higher education multi-story atrium illuminated through suspended catenary luminaires and daylight harvesting photosensors. Calculated in AGi32 for comfortable circadian vertical illuminance.',
      img: 'assets/projects/central loby/suspended shapes1.jpg',
      url: 'project-lobby.html'
    },
    'sheet-museum': {
      title: "Children's Museum",
      desc: 'Stepped civic massing and dynamic solar envelopes simulated in ClimateStudio to maximize spatial daylight autonomy (sDA 78%) while eliminating annual solar exposure glare risks.',
      img: 'assets/projects/museum/museum-hero.png',
      url: 'project-museum.html'
    },
    'sheet-bench': {
      title: 'Exterior Bench Lighting Study',
      desc: '1:1 physical optical mockup evaluating custom pedestrian asymmetric grazing cutoffs and zero-uplight Dark Sky compliance (BUG B1-U0-G0).',
      img: 'assets/projects/bench study/bench-persp-style1.png',
      url: 'project-bench.html'
    },
    'sheet-mountain': {
      title: 'Luxury Mountain Home',
      desc: 'Alpine custom residence carved into a western North Carolina ridge, featuring passive solar overhang geometry calculated for 71° high-altitude summer cutoff.',
      img: 'assets/projects/mountain-home.jpg',
      url: 'project-mountain.html'
    },
    'sheet-sketches': {
      title: 'Lighting Sketches & Ideation',
      desc: '14 hand-drawn studies analyzing solar penetration paths, luminaire catenary arrays, and nocturnal light-to-shadow contrast.',
      img: 'assets/Light Sketches/Chicago Center ALD/Ald concept sketch.jpg',
      url: 'sketches.html'
    },
    'sheet-photo': {
      title: '35mm Film & Architectural Light',
      desc: '21 analog and digital photographic studies investigating razor-sharp shadow geometry, architectural texture, and fleeting daylight rakes.',
      img: 'assets/photography/arch/IMG_6268 2.jpeg',
      url: 'photography.html'
    }
  };

  document.querySelectorAll('.open-inspect-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sheet = btn.closest('.arch-sheet');
      if (!sheet || !modal) return;
      const data = sheetData[sheet.id];
      if (!data) return;

      modalTitle.textContent = data.title;
      modalDesc.textContent = data.desc;
      modalImage.src = data.img;
      modalLink.href = data.url;

      modal.classList.add('is-open');
      e.stopPropagation();
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('is-open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      modal.classList.remove('is-open');
    }
  });
}
