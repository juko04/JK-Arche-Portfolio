/**
 * Julian Kotara — The Interactive Drafting Desk Engine
 * Abstracted architectural workspace canvas:
 * - Inertial canvas panning & smooth mouse-centered zoom
 * - Draggable tactile vellum plates with elevation physics
 * - Camera glide dock powered by GSAP 3 with Emil Kowalski directional easing
 * - High-resolution architectural inspection modal with multi-view drawings & photometrics
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

  // ==========================================================================
  // 1. Architectural Project Dossier Database
  // ==========================================================================
  const sheetDossiers = {
    'sheet-hero': {
      index: 0,
      code: 'REF · 00 / PROLOGUE',
      title: 'Studio Ledger & Philosophy',
      subtitle: 'CU Boulder · Architectural Engineering M.S. · Lighting Design',
      category: 'Design Philosophy & Technical Background',
      lead: 'Light is an active architectural material bridging the quantitative physics of daylight harvesting with sensory spatial illumination.',
      desc: 'Julian Kotara is an architectural engineering graduate researcher specializing in the intersection of daylight harvesting, circadian metrics (mEDI), photometric radiosity (AGi32), and optical craft. Drawing from an observational foundation in 35mm architectural photography, his work treats illumination not as an afterthought, but as the primary sculptor of human experience in space.',
      images: [
        { src: 'assets/projects/central loby/suspended shapes1.jpg', caption: 'Atmospheric Luminous Volume · Suspended Catenary Rig' },
        { src: 'assets/projects/museum/museum-hero.png', caption: 'Solar Envelopes & Daylighting Massing' },
        { src: 'assets/photography/arch/IMG_6268 2.jpeg', caption: 'Observational Shadow Rakes & Structural Geometry' }
      ],
      specs: [
        { label: 'Degree Track', value: 'B.S. & M.S. Architectural Engineering' },
        { label: 'Institution', value: 'University of Colorado Boulder' },
        { label: 'Specialization', value: 'Daylighting & Electric Lighting Design' },
        { label: 'Core Tools', value: 'AGi32, ClimateStudio, Revit, Rhino' },
        { label: 'Studio Base', value: 'Boulder, Colorado (40.0076° N, 105.2659° W)' },
        { label: 'Interaction', value: 'Pan desk · Drag plates · Glide camera' }
      ],
      url: 'about.html',
      urlLabel: 'Read Full Biography ↗'
    },
    'sheet-lobby': {
      index: 1,
      code: 'REF · 01 / ARCH · LUM 01',
      title: 'University Central Lobby',
      subtitle: 'Higher Education Civic Atrium · Circadian Catenary Illumination',
      category: 'Lighting Design & Radiosity Analysis',
      lead: 'Suspended volumetric luminaires designed to visually anchor an expansive atrium volume while delivering circadian vertical illuminance.',
      desc: 'Higher education multi-story atrium illuminated through suspended catenary luminaires and daylight harvesting photosensors. Calculated in AGi32 for comfortable circadian vertical illuminance (250+ mEDI daytime target), avoiding specular glare on multi-level pedestrian walkways while establishing a warm, welcoming nighttime identity for students and faculty.',
      images: [
        { src: 'assets/projects/central loby/suspended shapes1.jpg', caption: 'Perspective View · Suspended Volumetric Catenary Array in Central Atrium' },
        { src: 'assets/projects/central loby/downlight2.jpg', caption: 'Photometric Radiosity Study · Vertical Illuminance & Circulation Grazing' },
        { src: 'assets/projects/central loby/linear ww opposite side.jpg', caption: 'Linear Wall-Wash Elevation · Continuous Perimeter Grazing' },
        { src: 'assets/projects/central loby/suspended shapes.jpg', caption: 'Catenary Geometry Iteration · Spatial Volumetric Distribution' }
      ],
      specs: [
        { label: 'Calculation Engine', value: 'AGi32 Full Radiosity' },
        { label: 'Circadian Target', value: '250+ mEDI Daytime' },
        { label: 'CCT Strategy', value: '3000K Warm Architectural White' },
        { label: 'Mounting System', value: 'Custom Catenary Pendant Rig' },
        { label: 'Energy Budget', value: '0.42 W/sq ft (ASHRAE 90.1 Compliant)' },
        { label: 'Daylight Control', value: 'Continuous 0-10V Photosensor Harvesting' }
      ],
      url: 'project-lobby.html',
      urlLabel: 'Open Project Dossier ↗'
    },
    'sheet-museum': {
      index: 2,
      code: 'REF · 02 / ELEV · DAYLIGHT',
      title: "Children's Museum",
      subtitle: 'Cultural & Civic Architecture · Pearl Street Pedestrian Mall',
      category: 'Daylighting Autonomy & Massing Evolution',
      lead: 'Stepped civic massing and dynamic solar envelopes simulated in ClimateStudio to maximize spatial daylight autonomy (sDA 78%).',
      desc: 'Located on the historic Pearl Street Pedestrian Mall in Boulder, the Children’s Museum creates an inclusive third space for families while integrating upper-level administrative and community workshop spaces. The architecture employs interlocking geometric masses and floor-to-ceiling transparent glazed facades, dissolving the threshold between the pedestrian street and hands-on exhibition galleries.',
      images: [
        { src: 'assets/projects/museum/museum-hero.png', caption: 'Physical Massing Model · Stepped Volumetric Terraces & Pearl Street Porosity' },
        { src: 'assets/projects/museum/massing-diagram.png', caption: 'Massing Evolution · Carved Solar Voids & North Clerestory Light Wells' },
        { src: 'assets/projects/museum/axonometric-model.png', caption: 'Axonometric Circulation Diagram · Vertical Atrium Voids & Daylit Galleries' },
        { src: 'assets/projects/museum/building-sections.png', caption: 'Building Section · Daylight Penetration & Passive Thermal Buffering' }
      ],
      specs: [
        { label: 'Typology', value: 'Cultural & Community Hub' },
        { label: 'Daylight Autonomy', value: 'sDA 78% (Target > 75%)' },
        { label: 'Solar Glare Mitigation', value: 'ASE 6.2% Annual Solar Exposure' },
        { label: 'BIM & Simulation', value: 'Revit, ClimateStudio, Twinmotion' },
        { label: 'Facade Strategy', value: 'Low-E High-VT Triple Glazing' },
        { label: 'Location', value: 'Boulder, Colorado' }
      ],
      url: 'project-museum.html',
      urlLabel: 'Open Project Dossier ↗'
    },
    'sheet-bench': {
      index: 3,
      code: 'REF · 03 / PHOTOMETRIC · 1:1',
      title: 'Exterior Bench Lighting Study',
      subtitle: 'Research & Full-Scale Mockup · Pedestrian Optical Grazing',
      category: 'Mockup Research & BUG Photometrics',
      lead: '1:1 scale physical optical mockup testing custom grazing angles, pedestrian cutoff distributions, and zero-uplight Dark Sky compliance.',
      desc: 'A full-scale research investigation evaluating how concealed linear optics integrated within landscape topography can illuminate pedestrian paths without visible glare sources or light pollution. Physical mockups examined custom asymmetric grazing angles, stone fissure cutoffs, and warm color temperatures (2700K) to safeguard wildlife and nocturnal Dark Sky integrity (BUG B1-U0-G0).',
      images: [
        { src: 'assets/projects/bench study/bench-persp-style1.png', caption: 'Style 1 Perspective · Submerged Rock Fissure Grazing & Ground Glow' },
        { src: 'assets/projects/bench study/bench-persp-style2.png', caption: 'Style 2 Perspective · Concealed Lip Grazing with Island Effect' },
        { src: 'assets/projects/bench study/501E5B77-E78B-42EB-AD4E-263A4B2C80BA_1_105_c.jpeg', caption: '1:1 Scale Physical Mockup · Warm Beam Projection from Concealed Fissure' },
        { src: 'assets/projects/bench study/bench-plan-style1.png', caption: 'Style 1 Park Plan · Light Emanating from Natural Stone Formations' }
      ],
      specs: [
        { label: 'Mockup Method', value: '1:1 Full-Scale Physical Optical Bench' },
        { label: 'BUG Rating', value: 'B1-U0-G0 (Zero Direct Uplight)' },
        { label: 'Ground Uniformity', value: '3:1 Average-to-Minimum Ratio' },
        { label: 'Color Temperature', value: '2700K Wildlife & Dark Sky Safe' },
        { label: 'Fixture Housing', value: 'Concealed Extruded Aluminum Grazers' },
        { label: 'Compliance', value: 'IDA Dark Sky Approved Standards' }
      ],
      url: 'project-bench.html',
      urlLabel: 'Open Project Dossier ↗'
    },
    'sheet-mountain': {
      index: 4,
      code: 'REF · 04 / SOLAR · RESIDENTIAL',
      title: 'Luxury Mountain Home',
      subtitle: 'Alpine Residential Architecture · Western North Carolina Ridge',
      category: 'Passive Solar & Daylight Glazing',
      lead: 'Stepped alpine massing utilizing deep southern eaves to invite winter solar heating while blocking high-altitude summer direct glare.',
      desc: 'Carved directly into a sloping ridgeline in western North Carolina at 3,800 feet elevation, this custom residence establishes a continuous dialogue between interior volume and the rugged mountain horizon. Angular south-facing clerestory glazing pulls daylight deep into the rock-hewn living core while calculated 71° overhangs prevent overheating during summer solar peaks.',
      images: [
        { src: 'assets/projects/mountain-home.jpg', caption: 'Exterior Perspective · Stepped Terraces & Mountain Horizon Glazing' },
        { src: 'assets/projects/mountain home/luxury home massing.png', caption: 'Solar Massing Diagram · Calculated Eaves & Daylight Penetration Angle' }
      ],
      specs: [
        { label: 'Solar Strategy', value: 'Calculated 71° Summer Cutoff Overhangs' },
        { label: 'Glazing Package', value: 'Low-E Triple-Pane Argon (SHGC 0.28)' },
        { label: 'Site Elevation', value: '3,800 ft Ridgeline Topography' },
        { label: 'Material Palette', value: 'Local Fieldstone, Douglas Fir, Slate' },
        { label: 'Thermal Envelope', value: 'High-R Continuous Insulation Assembly' },
        { label: 'Tools', value: 'Revit, Enscape, Illustrator' }
      ],
      url: 'project-mountain.html',
      urlLabel: 'Open Project Dossier ↗'
    },
    'sheet-sketches': {
      index: 5,
      code: 'REF · 05 / VELLUM · 14 STUDIES',
      title: 'Lighting Sketches & Ideation',
      subtitle: 'Hand-Drawn Vellum Studies · Photometric Diagrams & Solar Paths',
      category: 'Visual Ideation & Hand Craft',
      lead: '14 hand-drawn studies analyzing solar penetration paths, luminaire catenary arrays, and nocturnal light-to-shadow contrast.',
      desc: 'A collection of 14 analog drawings exploring vertical luminous transitions, architectural wayfinding, and reflected ceiling plan geometries. Hand sketching serves as an immediate visual laboratory to test how photons bounce off architectural planes before committing parameters to digital radiosity engines.',
      images: [
        { src: 'assets/Light Sketches/Chicago Center ALD/Ald concept sketch.jpg', caption: 'Chicago Center ALD · Vertical Atrium Luminous Transition' },
        { src: 'assets/Light Sketches/Chicago Center ALD/Ald 2nd floor stairs.jpg', caption: 'Stairwell Wayfinding · Concealed Linear Rake on Vertical Surface' },
        { src: 'assets/Light Sketches/Senior Design/Exterior.jpg', caption: 'Senior Design · Nocturnal Horizon & Exterior Contrast Study' },
        { src: 'assets/Light Sketches/Senior Design/2nd floor lobby.jpg', caption: '2nd Floor Lobby · Linear Array & Ground Grazing' }
      ],
      specs: [
        { label: 'Medium', value: 'Ink on Vellum, Graphite & Colored Pencil' },
        { label: 'Total Studies', value: '14 Cataloged Drawings' },
        { label: 'Focus Areas', value: 'Circulation, Atriums, Facade Grazing' },
        { label: 'Chapters', value: 'Chicago Center, Senior Design, Facades' },
        { label: 'Visual Method', value: 'Fast Radiosity & Contrast Notation' }
      ],
      url: 'sketches.html',
      urlLabel: 'Browse All 14 Studies ↗'
    },
    'sheet-photo': {
      index: 6,
      code: 'REF · 06 / OBSERVATIONAL · 21 WORKS',
      title: '35mm Film & Architectural Light',
      subtitle: 'Analog & Digital Visual Laboratory · Shadow Rakes & Materiality',
      category: 'Observational Photography & Light Studies',
      lead: '21 analog and digital photographic studies investigating razor-sharp shadow geometry, architectural texture, and fleeting daylight rakes.',
      desc: 'An ongoing observational laboratory capturing the tangible behavior of light in real-world architectural space. Using mechanical 35mm film and digital cameras, these studies observe how razor-sharp shadow lines reveal material textures, how specular glints transform structural glass, and how dusk transitions alter spatial scale.',
      images: [
        { src: 'assets/photography/arch/IMG_6268 2.jpeg', caption: 'Vertical Massing Study · Low-Angle Perspective & Structural Rhythm' },
        { src: 'assets/photography/light/IMG_2694 2.JPG', caption: 'Specular Glint · Afternoon Daylight Grazing Structural Glazing' },
        { src: 'assets/photography/arch/IMG_6335.jpeg', caption: 'Angular Facade Geometry · High-Contrast Geometric Shadow Fields' },
        { src: 'assets/photography/arch/kotara004502-R1-052-24A.jpg', caption: '35mm Analog Film Study · Silver Halide Architectural Grain' }
      ],
      specs: [
        { label: 'Mediums', value: '35mm Analog Film & High-Res Digital' },
        { label: 'Total Catalog', value: '21 Curated Studies' },
        { label: 'Key Themes', value: 'Shadow Rakes, Grazing Light, Textures' },
        { label: 'Taxonomy', value: '01 Light, 02 Architecture, 03 Analog Film' },
        { label: 'Equipment', value: '35mm SLR & Prime Lenses' }
      ],
      url: 'photography.html',
      urlLabel: 'Explore 21 Photographic Works ↗'
    }
  };

  const sheetKeys = Object.keys(sheetDossiers);

  // ==========================================================================
  // 2. Camera State & Physics
  // ==========================================================================
  const surfaceWidth = 3600;
  const surfaceHeight = 2800;

  let camera = {
    x: 0,
    y: 0,
    zoom: 0.85
  };

  let isPanning = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let cameraStartX = 0;
  let cameraStartY = 0;

  // Velocity tracking for inertial coast
  let lastMoveTime = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let velocityX = 0;
  let velocityY = 0;

  let highestZ = 30;
  let currentActiveSheetId = 'sheet-hero';

  function applyCamera(animate = false, duration = 0.85, ease = 'power3.out') {
    if (animate && typeof gsap !== 'undefined') {
      gsap.to(surface, {
        x: camera.x,
        y: camera.y,
        scale: camera.zoom,
        duration: duration,
        ease: ease,
        overwrite: 'auto',
        force3D: true,
        onUpdate: updateCoordsDisplay
      });
    } else {
      surface.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
      updateCoordsDisplay();
    }
  }

  function updateCoordsDisplay() {
    if (coordsDisplay) {
      const focalX = Math.round((-camera.x + window.innerWidth / 2) / camera.zoom);
      const focalY = Math.round((-camera.y + window.innerHeight / 2) / camera.zoom);
      const zoomPct = Math.round(camera.zoom * 100);
      coordsDisplay.textContent = `CANVAS // X: ${focalX} · Y: ${focalY} · ${zoomPct}% · NORTH ↑`;
    }
  }

  function centerOnElement(el, animate = true, overrideZoom = null) {
    if (!el) return;
    highestZ += 1;
    el.style.zIndex = highestZ;

    const elLeft = el.offsetLeft;
    const elTop = el.offsetTop;
    const elWidth = el.offsetWidth;
    const elHeight = el.offsetHeight;

    const targetZoom = overrideZoom !== null 
      ? overrideZoom 
      : (window.innerWidth < 768 ? 0.65 : (el.id === 'sheet-hero' ? 0.85 : 0.95));
      
    camera.zoom = targetZoom;
    camera.x = window.innerWidth / 2 - (elLeft + elWidth / 2) * targetZoom;
    camera.y = window.innerHeight / 2 - (elTop + elHeight / 2) * targetZoom;

    currentActiveSheetId = el.id;
    updateDockActive(el.id);
    applyCamera(animate, 0.85, 'power3.out');
  }

  function updateDockActive(targetId) {
    dockItems.forEach(item => {
      if (item.dataset.target === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // 3. Viewport Panning with Inertial Momentum Damping
  // ==========================================================================
  viewport.addEventListener('pointerdown', (e) => {
    // Only pan if clicking canvas background directly
    if (e.target.closest('.arch-sheet') || 
        e.target.closest('.desk-hud-top') || 
        e.target.closest('.camera-dock-wrap') || 
        e.target.closest('.desk-zoom-hud') || 
        e.target.closest('.sheet-modal')) {
      return;
    }

    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(surface);
    }

    isPanning = true;
    viewport.classList.add('is-panning');
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    cameraStartX = camera.x;
    cameraStartY = camera.y;

    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastMoveTime = performance.now();
    velocityX = 0;
    velocityY = 0;

    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isPanning) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastMoveTime);
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;

    // Rolling exponential average for velocity
    velocityX = 0.6 * velocityX + 0.4 * (dx / dt);
    velocityY = 0.6 * velocityY + 0.4 * (dy / dt);

    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastMoveTime = now;

    camera.x = cameraStartX + (e.clientX - startPointerX);
    camera.y = cameraStartY + (e.clientY - startPointerY);

    applyCamera(false);
  });

  function endPan(e) {
    if (!isPanning) return;
    isPanning = false;
    viewport.classList.remove('is-panning');
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}

    // Inertial coast on release if velocity is significant
    const speed = Math.hypot(velocityX, velocityY);
    if (speed > 0.12 && typeof gsap !== 'undefined') {
      const inertiaDistance = Math.min(600, speed * 220);
      const angle = Math.atan2(velocityY, velocityX);
      const targetX = camera.x + Math.cos(angle) * inertiaDistance;
      const targetY = camera.y + Math.sin(angle) * inertiaDistance;

      gsap.to(camera, {
        x: targetX,
        y: targetY,
        duration: 0.75,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => applyCamera(false)
      });
    }
  }

  viewport.addEventListener('pointerup', endPan);
  viewport.addEventListener('pointercancel', endPan);

  // ==========================================================================
  // 4. Smooth Mouse-Centered Wheel Zoom & Pinch-to-Zoom
  // ==========================================================================
  viewport.addEventListener('wheel', (e) => {
    if (e.target.closest('.sheet-modal')) return;
    e.preventDefault();

    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(surface);
    }

    const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91;
    const newZoom = Math.min(1.4, Math.max(0.48, camera.zoom * zoomFactor));

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

  // Touch Pinch Zoom Tracking
  let activeTouchCount = 0;
  let initialPinchDist = 0;
  let initialPinchZoom = 0;
  let initialPinchCenter = { x: 0, y: 0 };

  viewport.addEventListener('touchstart', (e) => {
    activeTouchCount = e.touches.length;
    if (activeTouchCount === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialPinchZoom = camera.zoom;
      initialPinchCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    }
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDist > 0) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = currentDist / initialPinchDist;
      const newZoom = Math.min(1.4, Math.max(0.48, initialPinchZoom * ratio));

      const focalX = (initialPinchCenter.x - camera.x) / camera.zoom;
      const focalY = (initialPinchCenter.y - camera.y) / camera.zoom;

      camera.x = initialPinchCenter.x - focalX * newZoom;
      camera.y = initialPinchCenter.y - focalY * newZoom;
      camera.zoom = newZoom;

      applyCamera(false);
    }
  }, { passive: false });

  viewport.addEventListener('touchend', (e) => {
    activeTouchCount = e.touches.length;
    if (activeTouchCount < 2) {
      initialPinchDist = 0;
    }
  });

  // HUD Zoom Buttons
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      camera.zoom = Math.min(1.4, camera.zoom + 0.18);
      applyCamera(true, 0.45, 'power2.out');
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      camera.zoom = Math.max(0.48, camera.zoom - 0.18);
      applyCamera(true, 0.45, 'power2.out');
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      centerOnElement(document.getElementById('sheet-hero'), true);
    });
  }

  // ==========================================================================
  // 5. Tactile Draggable Plates with Elevation Physics
  // ==========================================================================
  sheets.forEach(sheet => {
    let isDragging = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let totalMoved = 0;

    sheet.addEventListener('pointerdown', (e) => {
      // Don't drag if clicking interactive link/button inside sheet
      if (e.target.closest('a') || e.target.closest('button')) return;

      isDragging = true;
      totalMoved = 0;
      highestZ += 1;
      sheet.style.zIndex = highestZ;
      currentActiveSheetId = sheet.id;
      updateDockActive(sheet.id);

      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      initialLeft = parseFloat(sheet.style.left) || sheet.offsetLeft;
      initialTop = parseFloat(sheet.style.top) || sheet.offsetTop;

      // Tactile Elevation Feedback (Emil Kowalski micro-interaction physics)
      sheet.classList.add('is-dragging');
      if (typeof gsap !== 'undefined') {
        gsap.to(sheet, {
          scale: 1.025,
          duration: 0.12,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }

      sheet.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    sheet.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const deltaX = (e.clientX - pointerStartX) / camera.zoom;
      const deltaY = (e.clientY - pointerStartY) / camera.zoom;
      totalMoved += Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY);

      sheet.style.left = `${initialLeft + deltaX}px`;
      sheet.style.top = `${initialTop + deltaY}px`;
    });

    function endSheetDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      sheet.classList.remove('is-dragging');

      try { sheet.releasePointerCapture(e.pointerId); } catch (_) {}

      // Return to resting scale
      if (typeof gsap !== 'undefined') {
        gsap.to(sheet, {
          scale: 1.0,
          duration: 0.22,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      }

      // CLICK vs DRAG DETECTION:
      // If movement is under 6px, treat as an architectural inspection click!
      if (totalMoved < 6) {
        openInspectionModal(sheet.id);
      }

      e.stopPropagation();
    }

    sheet.addEventListener('pointerup', endSheetDrag);
    sheet.addEventListener('pointercancel', endSheetDrag);
  });

  // ==========================================================================
  // 6. Camera Glide Dock
  // ==========================================================================
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      if (!targetId) return;

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        centerOnElement(targetEl, true);
      }
    });
  });

  // ==========================================================================
  // 7. Architectural Inspection Modal with Image Sets & Photometrics
  // ==========================================================================
  const modal = document.getElementById('sheet-modal');
  const modalCode = document.getElementById('modal-code');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalLead = document.getElementById('modal-lead');
  const modalDesc = document.getElementById('modal-desc');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');
  const modalGalleryTabs = document.getElementById('modal-gallery-tabs');
  const modalSpecsGrid = document.getElementById('modal-specs-grid');
  const modalLink = document.getElementById('modal-link');
  const modalClose = document.getElementById('modal-close');
  const modalPrev = document.getElementById('modal-prev');
  const modalNext = document.getElementById('modal-next');

  let activeModalKey = 'sheet-hero';

  function openInspectionModal(sheetId) {
    const data = sheetDossiers[sheetId];
    if (!data || !modal) return;

    activeModalKey = sheetId;

    if (modalCode) modalCode.textContent = data.code;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalSubtitle) modalSubtitle.textContent = data.subtitle;
    if (modalLead) modalLead.textContent = `"${data.lead}"`;
    if (modalDesc) modalDesc.textContent = data.desc;
    if (modalLink) {
      modalLink.href = data.url;
      modalLink.textContent = data.urlLabel || 'Open Full Project Page ↗';
    }

    // Populate Main Image & Caption
    if (modalImage && data.images.length > 0) {
      modalImage.src = data.images[0].src;
      modalImage.alt = data.images[0].caption || data.title;
    }
    if (modalCaption && data.images.length > 0) {
      modalCaption.textContent = data.images[0].caption;
    }

    // Build Gallery Thumbnails
    if (modalGalleryTabs) {
      modalGalleryTabs.innerHTML = '';
      data.images.forEach((imgObj, idx) => {
        const thumbBtn = document.createElement('button');
        thumbBtn.className = `modal-thumb-btn ${idx === 0 ? 'active' : ''}`;
        thumbBtn.setAttribute('aria-label', `View drawing ${idx + 1}: ${imgObj.caption}`);
        thumbBtn.innerHTML = `
          <img src="${imgObj.src}" alt="${imgObj.caption}">
          <span class="thumb-idx">${String(idx + 1).padStart(2, '0')}</span>
        `;
        thumbBtn.addEventListener('click', () => {
          modalGalleryTabs.querySelectorAll('.modal-thumb-btn').forEach(b => b.classList.remove('active'));
          thumbBtn.classList.add('active');

          if (typeof gsap !== 'undefined') {
            gsap.fromTo(modalImage, 
              { autoAlpha: 0.3, scale: 0.985 }, 
              { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power2.out' }
            );
          }
          modalImage.src = imgObj.src;
          modalImage.alt = imgObj.caption;
          if (modalCaption) modalCaption.textContent = imgObj.caption;
        });
        modalGalleryTabs.appendChild(thumbBtn);
      });
    }

    // Build Technical Specs Grid
    if (modalSpecsGrid) {
      modalSpecsGrid.innerHTML = '';
      data.specs.forEach(spec => {
        const item = document.createElement('div');
        item.className = 'modal-spec-item';
        item.innerHTML = `
          <span class="spec-label">${spec.label}</span>
          <span class="spec-value">${spec.value}</span>
        `;
        modalSpecsGrid.appendChild(item);
      });
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    // Emil Kowalski entrance transition
    const dialog = modal.querySelector('.modal-dialog');
    if (dialog && typeof gsap !== 'undefined') {
      gsap.fromTo(dialog, 
        { y: 24, scale: 0.97, autoAlpha: 0 }, 
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.26, ease: 'power3.out' }
      );
    }
  }

  function closeInspectionModal() {
    if (!modal || !modal.classList.contains('is-open')) return;

    const dialog = modal.querySelector('.modal-dialog');
    if (dialog && typeof gsap !== 'undefined') {
      gsap.to(dialog, {
        y: 16,
        scale: 0.97,
        autoAlpha: 0,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }
      });
    } else {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function navigateModal(direction) {
    const currentIndex = sheetKeys.indexOf(activeModalKey);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = sheetKeys.length - 1;
    if (nextIndex >= sheetKeys.length) nextIndex = 0;

    const nextKey = sheetKeys[nextIndex];
    openInspectionModal(nextKey);
  }

  // Hook up inspect triggers
  document.querySelectorAll('.open-inspect-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sheet = btn.closest('.arch-sheet');
      if (sheet) {
        openInspectionModal(sheet.id);
      }
      e.stopPropagation();
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeInspectionModal);
  }
  if (modalPrev) {
    modalPrev.addEventListener('click', () => navigateModal(-1));
  }
  if (modalNext) {
    modalNext.addEventListener('click', () => navigateModal(1));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeInspectionModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeInspectionModal();
    } else if (e.key === 'ArrowLeft') {
      navigateModal(-1);
    } else if (e.key === 'ArrowRight') {
      navigateModal(1);
    }
  });

  // ==========================================================================
  // 8. Initial Desk Placement & Orientation
  // ==========================================================================
  // Smooth entrance center on sheet-hero
  centerOnElement(document.getElementById('sheet-hero'), false);

  window.addEventListener('resize', () => {
    const activeEl = document.getElementById(currentActiveSheetId) || document.getElementById('sheet-hero');
    if (activeEl) {
      centerOnElement(activeEl, false);
    }
  });
}
