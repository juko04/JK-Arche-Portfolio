/**
 * Julian Kotara — Portfolio Interactive Visual Customizer & Pro Editor
 * Fully Scoped per Page, Zero-Jitter Alignment Snapping, Shape Engine,
 * Dedicated Shape/Text Inspectors, Universal Element Dragging, & Landscape PDF Export.
 */

(function () {
  const STORAGE_KEY = 'jk_portfolio_customizer_v3';

  // Preset Color Palettes (Preserves exact lightness & contrast)
  const COLOR_PRESETS = [
    { name: 'Sage Green', hue: 75, sat: '26%', color: '#b7bd91' },
    { name: 'Terracotta Red', hue: 15, sat: '26%', color: '#bd9591' },
    { name: 'Sand Ochre', hue: 42, sat: '24%', color: '#bda891' },
    { name: 'Blueprint Blue', hue: 215, sat: '24%', color: '#91a9bd' },
    { name: 'Forest Green', hue: 125, sat: '24%', color: '#91bd9d' },
    { name: 'Slate Greige', hue: 75, sat: '4%', color: '#a6a7a3' },
  ];

  // Robust Page Key Normalization (Handles file://, localhost, gh-pages, trailing slashes)
  function getPageKey() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('work')) return 'work.html';
    if (path.includes('photo')) return 'photography.html';
    if (path.includes('about')) return 'about.html';
    if (path.includes('mountain')) return 'project-mountain.html';
    if (path.includes('museum')) return 'project-museum.html';
    if (path.includes('lobby')) return 'project-lobby.html';
    if (path.includes('bench')) return 'project-bench.html';
    return 'index.html';
  }

  let state = {
    globalTheme: { hue: 75, sat: '26%' },
    pages: {} // Scoped per page: { positions: {}, shapes: [], texts: {}, styles: {}, deleted: [], added: [] }
  };

  let isEditing = false;
  let activeElement = null;
  let inspectorEl = null;
  let snapGuideX = null;
  let snapGuideY = null;

  function getPageData() {
    const key = getPageKey();
    if (!state.pages[key]) {
      state.pages[key] = {
        positions: {},
        shapes: [],
        texts: {},
        styles: {},
        deleted: [],
        added: [],
      };
    }
    return state.pages[key];
  }

  // Load from localStorage (with backwards compatibility)
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('jk_portfolio_customizer_v2') || localStorage.getItem('jk_portfolio_customizer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Handle migration if needed
        if (parsed.pages) {
          state = { ...state, ...parsed };
        } else if (parsed.positions || parsed.shapes || parsed.texts) {
          state.pages['index.html'] = {
            positions: parsed.positions || {},
            shapes: parsed.shapes || [],
            texts: parsed.texts || {},
            styles: parsed.styles || {},
            deleted: parsed.deletedElements || [],
            added: parsed.addedElements || [],
          };
          if (parsed.themeHue !== undefined) {
            state.globalTheme = { hue: parsed.themeHue, sat: parsed.themeSat || '26%' };
          }
        }
      }
    } catch (e) {
      console.warn('Could not load customizer state:', e);
    }
  }

  // Save to localStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showToast();
    } catch (e) {
      console.warn('Could not save customizer state:', e);
    }
  }

  function showToast() {
    const toast = document.querySelector('#saved-toast');
    if (toast) {
      toast.classList.add('show');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => toast.classList.remove('show'), 1200);
    }
  }

  // Global Theme Application
  function applyTheme(hue, sat = '26%') {
    state.globalTheme = { hue, sat };
    document.documentElement.style.setProperty('--theme-hue', hue);
    document.documentElement.style.setProperty('--theme-sat', sat);
  }

  function getElementKey(el) {
    if (!el) return '';
    return el.id || el.dataset.customId || el.dataset.editKey || `${el.tagName.toLowerCase()}-${(el.className || '').replace(/\s+/g, '-')}`;
  }

  // --------------------------------------------------------------------------
  // Restore State to DOM (Scoped to current page)
  // --------------------------------------------------------------------------
  function restoreDOM() {
    // 1. Theme
    if (state.globalTheme?.hue !== undefined) {
      applyTheme(state.globalTheme.hue, state.globalTheme.sat || '26%');
    }

    const page = getPageData();

    // 2. Remove Deleted Elements
    (page.deleted || []).forEach((key) => {
      const el = document.getElementById(key) || document.querySelector(`[data-custom-id="${key}"]`) || document.querySelector(`[data-edit-key="${key}"]`);
      if (el) el.remove();
    });

    // 3. Restore Text Content
    Object.keys(page.texts || {}).forEach((key) => {
      const el = document.getElementById(key) || document.querySelector(`[data-custom-id="${key}"]`) || document.querySelector(`[data-edit-key="${key}"]`) || document.querySelector(key);
      if (el) el.innerHTML = page.texts[key];
    });

    // 4. Restore Custom Shapes for this page
    (page.shapes || []).forEach((shapeData) => {
      if (!document.getElementById(shapeData.id)) {
        createShapeDOM(shapeData);
      }
    });

    // 5. Restore Added Paragraphs
    (page.added || []).forEach((item) => {
      const parent = document.querySelector(item.parentSelector) || document.querySelector('main') || document.body;
      if (parent && !document.getElementById(item.id)) {
        const p = document.createElement('p');
        p.id = item.id;
        p.dataset.customId = item.id;
        p.className = 'editable draggable-item custom-added-text';
        p.innerHTML = item.html;
        if (item.style) Object.assign(p.style, item.style);
        parent.appendChild(p);
        initDragAndSelect(p, item.id);
      }
    });

    // 6. Restore Styles (Font, Size, Color)
    Object.keys(page.styles || {}).forEach((key) => {
      const el = document.getElementById(key) || document.querySelector(`[data-custom-id="${key}"]`) || document.querySelector(`[data-edit-key="${key}"]`) || document.querySelector(key);
      if (el && page.styles[key]) {
        Object.assign(el.style, page.styles[key]);
      }
    });

    // 7. Restore Positions
    Object.keys(page.positions || {}).forEach((id) => {
      const el = document.getElementById(id) || document.querySelector(`[data-custom-id="${id}"]`) || document.querySelector(id);
      if (el && page.positions[id]) {
        const { x, y } = page.positions[id];
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.dataset.dragX = x;
        el.dataset.dragY = y;
      }
    });
  }

  // --------------------------------------------------------------------------
  // Smart Snapping Guides (Butter-Smooth, Zero Jitter)
  // --------------------------------------------------------------------------
  function createSnapGuides() {
    if (!snapGuideX) {
      snapGuideX = document.createElement('div');
      snapGuideX.className = 'snap-guide-x';
      snapGuideX.style.display = 'none';
      document.body.appendChild(snapGuideX);
    }
    if (!snapGuideY) {
      snapGuideY = document.createElement('div');
      snapGuideY.className = 'snap-guide-y';
      snapGuideY.style.display = 'none';
      document.body.appendChild(snapGuideY);
    }
  }

  function hideSnapGuides() {
    if (snapGuideX) snapGuideX.style.display = 'none';
    if (snapGuideY) snapGuideY.style.display = 'none';
  }

  // --------------------------------------------------------------------------
  // Universal Drag & Selection Controller
  // --------------------------------------------------------------------------
  function initDragAndSelect(element, customId) {
    if (!element) return;
    element.classList.add('draggable-item');
    const id = customId || element.id || getElementKey(element) || `drag-${Math.random().toString(36).substr(2, 6)}`;
    element.dataset.customId = id;

    let startMouseX = 0, startMouseY = 0;
    let initialTranslateX = 0, initialTranslateY = 0;
    let initialRect = null;
    let cachedTargets = [];
    let isDragging = false;

    function onMouseDown(e) {
      if (!isEditing) return;
      if (e.target.closest('.element-inspector') || e.target.closest('.editor-toolbar')) return;

      selectElement(element);

      // If user is editing text without holding Alt, let them select text
      if (e.target.isContentEditable && !e.altKey && e.target !== element) {
        return;
      }

      isDragging = true;
      startMouseX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      startMouseY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      initialTranslateX = parseFloat(element.dataset.dragX) || 0;
      initialTranslateY = parseFloat(element.dataset.dragY) || 0;

      initialRect = element.getBoundingClientRect();

      // Pre-cache static bounding boxes of all other elements at dragstart
      cachedTargets = [];
      const candidateElements = document.querySelectorAll(
        '.draggable-item, .geo-circle, .custom-shape, h1, h2, h3, p, .kicker, .role, .project-card, .work-list-item, .about-content'
      );

      candidateElements.forEach((target) => {
        if (target === element || element.contains(target) || target.contains(element)) return;
        const r = target.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          cachedTargets.push({
            left: r.left,
            centerX: r.left + r.width / 2,
            right: r.right,
            top: r.top,
            centerY: r.top + r.height / 2,
            bottom: r.bottom,
          });
        }
      });

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onMouseMove, { passive: false });
      document.addEventListener('touchend', onMouseUp);
    }

    function onMouseMove(e) {
      if (!isDragging || !isEditing) return;

      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const rawDeltaX = clientX - startMouseX;
      const rawDeltaY = clientY - startMouseY;

      let candidateX = initialTranslateX + rawDeltaX;
      let candidateY = initialTranslateY + rawDeltaY;

      const currentBoxLeft = initialRect.left + (candidateX - initialTranslateX);
      const currentBoxTop = initialRect.top + (candidateY - initialTranslateY);
      const width = initialRect.width;
      const height = initialRect.height;

      const currentEdges = {
        left: currentBoxLeft,
        centerX: currentBoxLeft + width / 2,
        right: currentBoxLeft + width,
        top: currentBoxTop,
        centerY: currentBoxTop + height / 2,
        bottom: currentBoxTop + height,
      };

      const SNAP_THRESHOLD = 8;
      let snapOffsetX = 0;
      let snapOffsetY = 0;
      let snapLineX = null;
      let snapLineY = null;

      // Check X-axis snapping
      for (const t of cachedTargets) {
        for (const dKey of ['left', 'centerX', 'right']) {
          for (const tKey of ['left', 'centerX', 'right']) {
            const diff = Math.abs(currentEdges[dKey] - t[tKey]);
            if (diff <= SNAP_THRESHOLD) {
              snapOffsetX = t[tKey] - currentEdges[dKey];
              snapLineY = t[tKey];
              break;
            }
          }
          if (snapLineY !== null) break;
        }
        if (snapLineY !== null) break;
      }

      // Check Y-axis snapping
      for (const t of cachedTargets) {
        for (const dKey of ['top', 'centerY', 'bottom']) {
          for (const tKey of ['top', 'centerY', 'bottom']) {
            const diff = Math.abs(currentEdges[dKey] - t[tKey]);
            if (diff <= SNAP_THRESHOLD) {
              snapOffsetY = t[tKey] - currentEdges[dKey];
              snapLineX = t[tKey];
              break;
            }
          }
          if (snapLineX !== null) break;
        }
        if (snapLineX !== null) break;
      }

      const finalTranslateX = candidateX + snapOffsetX;
      const finalTranslateY = candidateY + snapOffsetY;

      element.style.transform = `translate3d(${finalTranslateX}px, ${finalTranslateY}px, 0)`;
      element.dataset.tempX = finalTranslateX;
      element.dataset.tempY = finalTranslateY;

      // Render Snap Visual Guides
      if (snapLineX !== null && snapGuideX) {
        snapGuideX.style.top = `${snapLineX}px`;
        snapGuideX.style.display = 'block';
      } else if (snapGuideX) {
        snapGuideX.style.display = 'none';
      }

      if (snapLineY !== null && snapGuideY) {
        snapGuideY.style.left = `${snapLineY}px`;
        snapGuideY.style.display = 'block';
      } else if (snapGuideY) {
        snapGuideY.style.display = 'none';
      }

      positionInspector();
      if (e.type === 'touchmove') e.preventDefault();
    }

    function onMouseUp() {
      if (!isDragging) return;
      isDragging = false;
      hideSnapGuides();

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);

      const finalX = parseFloat(element.dataset.tempX) || initialTranslateX;
      const finalY = parseFloat(element.dataset.tempY) || initialTranslateY;

      element.dataset.dragX = finalX;
      element.dataset.dragY = finalY;

      const page = getPageData();
      page.positions[id] = { x: finalX, y: finalY };
      saveState();
      positionInspector();
    }

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('touchstart', onMouseDown, { passive: true });
  }

  // --------------------------------------------------------------------------
  // Selection & Contextual Property Inspector Bar
  // --------------------------------------------------------------------------
  function selectElement(el) {
    if (activeElement === el) return;
    if (activeElement) activeElement.classList.remove('active-selected');

    activeElement = el;
    if (activeElement && isEditing) {
      activeElement.classList.add('active-selected');
      renderInspector(activeElement);
    } else {
      hideInspector();
    }
  }

  function hideInspector() {
    if (inspectorEl) {
      inspectorEl.remove();
      inspectorEl = null;
    }
  }

  function positionInspector() {
    if (!inspectorEl || !activeElement) return;
    const rect = activeElement.getBoundingClientRect();
    const topPos = Math.max(12, rect.top - 48);
    const leftPos = Math.min(Math.max(140, rect.left + rect.width / 2), window.innerWidth - 140);

    inspectorEl.style.top = `${topPos}px`;
    inspectorEl.style.left = `${leftPos}px`;
  }

  function renderInspector(el) {
    hideInspector();
    if (!isEditing || !el) return;

    inspectorEl = document.createElement('div');
    inspectorEl.className = 'element-inspector';

    const isShape = el.classList.contains('custom-shape') || el.classList.contains('geo-circle');
    const isText = !isShape && (
      el.isContentEditable ||
      ['H1', 'H2', 'H3', 'H4', 'P', 'SPAN', 'FIGCAPTION', 'A', 'LI', 'SMALL', 'STRONG'].includes(el.tagName) ||
      el.classList.contains('editable') ||
      el.classList.contains('role') ||
      el.classList.contains('intro-copy') ||
      el.classList.contains('kicker')
    );

    const key = getElementKey(el);
    const page = getPageData();
    const currentStyle = (page.styles && page.styles[key]) || {};

    let html = '';

    if (isShape) {
      // SHAPES ONLY: Size, Colors, Delete
      html += `
        <div class="inspector-group">
          <span style="font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.7);">Width</span>
          <button class="inspector-btn" id="insp-w-down" title="Decrease Width">-</button>
          <button class="inspector-btn" id="insp-w-up" title="Increase Width">+</button>
        </div>

        <div class="inspector-group">
          <span style="font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.7);">Height</span>
          <button class="inspector-btn" id="insp-h-down" title="Decrease Height">-</button>
          <button class="inspector-btn" id="insp-h-up" title="Increase Height">+</button>
        </div>

        <div class="inspector-group">
          <label style="font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.7);">Color</label>
          <input type="color" class="inspector-color-input" id="insp-shape-color" title="Shape Color" value="${rgbToHex(window.getComputedStyle(el).backgroundColor) || '#b7bd91'}">
        </div>
      `;
    } else if (isText) {
      // TEXT ONLY: Font Family, Size, Bold, Italic, Color, Delete
      html += `
        <div class="inspector-group">
          <select class="inspector-select" id="insp-font-family" title="Font Family">
            <option value="var(--sans)" ${currentStyle.fontFamily?.includes('sans') ? 'selected' : ''}>Sans</option>
            <option value="var(--serif)" ${currentStyle.fontFamily?.includes('serif') ? 'selected' : ''}>Serif</option>
            <option value="var(--mono)" ${currentStyle.fontFamily?.includes('mono') ? 'selected' : ''}>Mono</option>
          </select>
        </div>

        <div class="inspector-group">
          <button class="inspector-btn" id="insp-size-down" title="Decrease Font Size">A-</button>
          <button class="inspector-btn" id="insp-size-up" title="Increase Font Size">A+</button>
        </div>

        <div class="inspector-group">
          <button class="inspector-btn ${currentStyle.fontWeight === 'bold' || currentStyle.fontWeight === '700' ? 'active' : ''}" id="insp-bold" title="Toggle Bold"><strong>B</strong></button>
          <button class="inspector-btn ${currentStyle.fontStyle === 'italic' ? 'active' : ''}" id="insp-italic" title="Toggle Italic"><em>I</em></button>
        </div>

        <div class="inspector-group">
          <input type="color" class="inspector-color-input" id="insp-color" title="Text Color" value="${rgbToHex(window.getComputedStyle(el).color) || '#1f231b'}">
        </div>
      `;
    }

    // Universal Delete
    html += `
      <div class="inspector-group">
        <button class="inspector-btn danger" id="insp-delete" title="Delete this element">🗑️ Delete</button>
      </div>
    `;

    inspectorEl.innerHTML = html;
    document.body.appendChild(inspectorEl);
    positionInspector();

    // Hook Inspector Events
    if (isShape) {
      inspectorEl.querySelector('#insp-w-up')?.addEventListener('click', () => {
        const w = parseFloat(window.getComputedStyle(el).width) || 100;
        applyElementStyle(el, 'width', `${Math.round(w * 1.15)}px`);
        positionInspector();
      });
      inspectorEl.querySelector('#insp-w-down')?.addEventListener('click', () => {
        const w = parseFloat(window.getComputedStyle(el).width) || 100;
        applyElementStyle(el, 'width', `${Math.max(10, Math.round(w * 0.85))}px`);
        positionInspector();
      });

      inspectorEl.querySelector('#insp-h-up')?.addEventListener('click', () => {
        const h = parseFloat(window.getComputedStyle(el).height) || 100;
        applyElementStyle(el, 'height', `${Math.round(h * 1.15)}px`);
        positionInspector();
      });
      inspectorEl.querySelector('#insp-h-down')?.addEventListener('click', () => {
        const h = parseFloat(window.getComputedStyle(el).height) || 100;
        applyElementStyle(el, 'height', `${Math.max(2, Math.round(h * 0.85))}px`);
        positionInspector();
      });

      inspectorEl.querySelector('#insp-shape-color')?.addEventListener('input', (e) => {
        if (el.classList.contains('shape-line')) {
          applyElementStyle(el, 'backgroundColor', e.target.value);
        } else {
          applyElementStyle(el, 'backgroundColor', e.target.value);
          applyElementStyle(el, 'borderColor', e.target.value);
        }
      });
    }

    if (isText) {
      inspectorEl.querySelector('#insp-font-family')?.addEventListener('change', (e) => {
        applyElementStyle(el, 'fontFamily', e.target.value);
      });

      inspectorEl.querySelector('#insp-size-up')?.addEventListener('click', () => {
        const curr = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        applyElementStyle(el, 'fontSize', `${curr + 2}px`);
      });
      inspectorEl.querySelector('#insp-size-down')?.addEventListener('click', () => {
        const curr = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        applyElementStyle(el, 'fontSize', `${Math.max(10, curr - 2)}px`);
      });

      inspectorEl.querySelector('#insp-bold')?.addEventListener('click', (e) => {
        const isBold = el.style.fontWeight === 'bold' || window.getComputedStyle(el).fontWeight >= 600;
        applyElementStyle(el, 'fontWeight', isBold ? '400' : '700');
        e.currentTarget.classList.toggle('active', !isBold);
      });

      inspectorEl.querySelector('#insp-italic')?.addEventListener('click', (e) => {
        const isItalic = el.style.fontStyle === 'italic';
        applyElementStyle(el, 'fontStyle', isItalic ? 'normal' : 'italic');
        e.currentTarget.classList.toggle('active', !isItalic);
      });

      inspectorEl.querySelector('#insp-color')?.addEventListener('input', (e) => {
        applyElementStyle(el, 'color', e.target.value);
      });
    }

    // Delete
    inspectorEl.querySelector('#insp-delete')?.addEventListener('click', () => {
      deleteElement(el);
    });
  }

  function applyElementStyle(el, prop, val) {
    el.style[prop] = val;
    const key = getElementKey(el);
    const page = getPageData();
    if (!page.styles) page.styles = {};
    if (!page.styles[key]) page.styles[key] = {};
    page.styles[key][prop] = val;
    saveState();
  }

  function deleteElement(el) {
    if (!el) return;
    const key = getElementKey(el);
    const page = getPageData();
    if (!page.deleted) page.deleted = [];
    if (!page.deleted.includes(key)) {
      page.deleted.push(key);
    }

    if (page.shapes) {
      page.shapes = page.shapes.filter(s => s.id !== el.id && s.id !== key);
    }

    el.remove();
    hideInspector();
    activeElement = null;
    saveState();
  }

  function rgbToHex(rgb) {
    if (!rgb || !rgb.startsWith('rgb')) return '#1f231b';
    const nums = rgb.match(/\d+/g);
    if (!nums || nums.length < 3) return '#1f231b';
    return `#${((1 << 24) + (parseInt(nums[0]) << 16) + (parseInt(nums[1]) << 8) + parseInt(nums[2])).toString(16).slice(1)}`;
  }

  // --------------------------------------------------------------------------
  // Basic Shapes Creation (Scoped to Current Page & Centered in Viewport)
  // --------------------------------------------------------------------------
  function createShapeDOM(shapeData) {
    const parent = document.querySelector('.intro') || document.querySelector('.project-detail') || document.querySelector('.sub-hero') || document.querySelector('main') || document.body;
    if (!parent) return;

    const shape = document.createElement('div');
    shape.id = shapeData.id;
    shape.dataset.customId = shapeData.id;
    shape.className = `custom-shape shape-${shapeData.type} ${shapeData.filled ? 'filled' : ''} draggable-item`;

    shape.style.width = shapeData.width || '140px';
    shape.style.height = shapeData.height || '140px';
    shape.style.left = shapeData.left || '40vw';
    shape.style.top = shapeData.top || '30vh';
    shape.style.position = 'absolute';
    shape.style.zIndex = '10';

    if (shapeData.style) {
      Object.assign(shape.style, shapeData.style);
    }

    parent.appendChild(shape);
    initDragAndSelect(shape, shapeData.id);
    return shape;
  }

  function addNewShape(type) {
    const id = `custom-shape-${type}-${Date.now()}`;
    const parent = document.querySelector('.intro') || document.querySelector('.project-detail') || document.querySelector('.sub-hero') || document.querySelector('main') || document.body;
    const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };

    // Calculate position directly in the center of the user's current scroll viewport
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight * 0.4;
    const spawnLeft = Math.max(20, viewportCenterX - parentRect.left - 70);
    const spawnTop = Math.max(20, viewportCenterY - parentRect.top - 70);

    const shapeData = {
      id,
      type,
      width: type === 'line' ? '220px' : type === 'pill' ? '140px' : '130px',
      height: type === 'line' ? '2px' : type === 'pill' ? '44px' : '130px',
      filled: type === 'circle' || type === 'pill',
      left: `${spawnLeft}px`,
      top: `${spawnTop}px`,
      style: {
        backgroundColor: type === 'line' ? 'var(--line-strong)' : 'rgba(255, 255, 255, 0.35)',
        borderColor: 'var(--line-strong)'
      }
    };

    const page = getPageData();
    if (!page.shapes) page.shapes = [];
    page.shapes.push(shapeData);
    saveState();

    const shapeEl = createShapeDOM(shapeData);
    if (shapeEl) {
      selectElement(shapeEl);
    }
  }

  // --------------------------------------------------------------------------
  // Add Paragraph Helper (Scoped to Current Page)
  // --------------------------------------------------------------------------
  function addNewParagraph() {
    const activeContainer = document.querySelector('.intro-body') || document.querySelector('.story-paragraphs') || document.querySelector('.about-narrative') || document.querySelector('main');
    if (!activeContainer) return;

    const newId = `custom-text-${Date.now()}`;
    const p = document.createElement('p');
    p.id = newId;
    p.dataset.customId = newId;
    p.className = 'editable draggable-item custom-added-text';
    p.contentEditable = 'true';
    p.innerHTML = 'Click to edit text. Drag to position anywhere with smart alignment.';
    p.style.margin = '16px 0';

    activeContainer.appendChild(p);
    initDragAndSelect(p, newId);

    const page = getPageData();
    if (!page.added) page.added = [];
    page.added.push({
      id: newId,
      parentSelector: activeContainer.className ? `.${activeContainer.className.split(' ')[0]}` : 'main',
      html: p.innerHTML,
    });

    p.addEventListener('input', () => {
      const item = page.added.find(x => x.id === newId);
      if (item) item.html = p.innerHTML;
      saveState();
    });

    saveState();
    selectElement(p);
    p.focus();
  }

  // --------------------------------------------------------------------------
  // Floating Customizer Toolbar UI
  // --------------------------------------------------------------------------
  function createEditorToolbar() {
    if (document.querySelector('.editor-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.id = 'editor-toolbar';

    const currentHue = state.globalTheme?.hue || 75;

    const swatchesHTML = COLOR_PRESETS.map(p => `
      <button class="color-swatch-btn ${p.hue === currentHue ? 'active' : ''}" 
              data-hue="${p.hue}" 
              data-sat="${p.sat}" 
              title="${p.name}" 
              style="background: ${p.color};" 
              type="button"></button>
    `).join('');

    toolbar.innerHTML = `
      <button class="editor-toggle-btn" id="editor-mode-toggle" type="button">
        <span id="editor-toggle-icon">✏️</span>
        <span id="editor-toggle-label">Edit Mode</span>
      </button>

      <div class="editor-controls-group">
        <div class="editor-divider"></div>

        <!-- Color Palette -->
        <div class="color-swatches" title="Smart Color Themes">
          ${swatchesHTML}
        </div>

        <!-- Hue Slider -->
        <div class="hue-slider-wrap">
          <label for="hue-range">Hue</label>
          <input type="range" class="hue-slider" id="hue-range" min="0" max="360" value="${currentHue}" title="Fine-tune theme hue">
        </div>

        <div class="editor-divider"></div>

        <!-- Add Text Button -->
        <button class="editor-btn" id="editor-add-text" type="button">+ Text</button>

        <!-- Add Shape Dropdown -->
        <div class="shape-menu-wrap">
          <button class="editor-btn" id="editor-add-shape-btn" type="button">+ Shape ▾</button>
          <div class="shape-dropdown-menu" id="shape-dropdown-menu" style="display: none;">
            <button class="shape-option-btn" data-shape="circle">⚪ Circle</button>
            <button class="shape-option-btn" data-shape="rect">◻️ Square / Box</button>
            <button class="shape-option-btn" data-shape="line">➖ Line / Divider</button>
            <button class="shape-option-btn" data-shape="pill">💊 Pill / Chip</button>
          </div>
        </div>

        <!-- Landscape PDF Booklet Export Button -->
        <button class="editor-btn" id="editor-export-pdf" type="button" title="Print Landscape Architectural Portfolio PDF">📄 PDF</button>

        <button class="editor-btn" id="editor-reset" type="button" title="Reset all custom edits to default">↺ Reset</button>
        
        <!-- Saved Toast -->
        <span class="saved-toast" id="saved-toast">✓ Saved</span>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Toggle Edit Mode
    const toggleBtn = toolbar.querySelector('#editor-mode-toggle');
    const label = toolbar.querySelector('#editor-toggle-label');

    function setEditMode(on) {
      isEditing = on;
      document.body.classList.toggle('is-editing', on);
      toggleBtn.classList.toggle('active', on);
      label.textContent = on ? 'Done Editing' : 'Edit Mode';

      document.querySelectorAll('.editable').forEach((el) => {
        el.contentEditable = on ? 'true' : 'false';
      });

      if (!on) {
        selectElement(null);
        hideSnapGuides();
        // Re-apply restoreDOM to guarantee 100% position parity in normal mode
        restoreDOM();
      }
    }

    toggleBtn.addEventListener('click', () => setEditMode(!isEditing));

    // Color Swatches
    toolbar.querySelectorAll('.color-swatch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        toolbar.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const hue = parseInt(btn.dataset.hue, 10);
        const sat = btn.dataset.sat;
        toolbar.querySelector('#hue-range').value = hue;
        applyTheme(hue, sat);
        saveState();
      });
    });

    // Hue Slider
    const hueSlider = toolbar.querySelector('#hue-range');
    hueSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      toolbar.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
      applyTheme(val, '26%');
      saveState();
    });

    // Add Text
    toolbar.querySelector('#editor-add-text').addEventListener('click', addNewParagraph);

    // Shape Dropdown Menu Toggle
    const shapeBtn = toolbar.querySelector('#editor-add-shape-btn');
    const shapeMenu = toolbar.querySelector('#shape-dropdown-menu');

    shapeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = shapeMenu.style.display === 'block';
      shapeMenu.style.display = open ? 'none' : 'block';
    });

    shapeMenu.querySelectorAll('.shape-option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        addNewShape(btn.dataset.shape);
        shapeMenu.style.display = 'none';
      });
    });

    document.addEventListener('click', () => {
      if (shapeMenu) shapeMenu.style.display = 'none';
    });

    // Landscape PDF Export
    toolbar.querySelector('#editor-export-pdf').addEventListener('click', () => {
      ensurePrintBookletInDOM();
      window.print();
    });

    // Reset All
    toolbar.querySelector('#editor-reset').addEventListener('click', () => {
      if (confirm('Reset all custom text, added shapes, positions, and color edits back to defaults?')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('jk_portfolio_customizer_v2');
        localStorage.removeItem('jk_portfolio_customizer_state');
        location.reload();
      }
    });

    // Global Keyboard: Delete key & 'e' toggle
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'e' && !e.target.isContentEditable && e.target.tagName !== 'INPUT') {
        setEditMode(!isEditing);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && activeElement && !e.target.isContentEditable && e.target.tagName !== 'INPUT') {
        deleteElement(activeElement);
      }
    });

    // Deselect on backdrop click
    document.addEventListener('mousedown', (e) => {
      if (!isEditing) return;
      if (e.target.closest('.editor-toolbar') || e.target.closest('.element-inspector') || e.target.closest('.draggable-item')) return;
      selectElement(null);
    });
  }

  // Ensure Print Booklet exists dynamically on any page when printing
  function ensurePrintBookletInDOM() {
    if (document.querySelector('#print-portfolio-booklet')) return;

    const booklet = document.createElement('div');
    booklet.className = 'print-portfolio-booklet';
    booklet.id = 'print-portfolio-booklet';
    booklet.setAttribute('aria-hidden', 'true');

    booklet.innerHTML = `
      <div class="print-sheet"><img class="sheet-full-img" src="assets/page-2.jpg" alt="Design Portfolio - Julian Kotara Cover"></div>
      <div class="print-sheet"><img class="sheet-full-img" src="assets/page-3.jpg" alt="Children's Museum Architectural Design Sheet"></div>
      <div class="print-sheet"><img class="sheet-full-img" src="assets/page-4.jpg" alt="University Central Lobby Architectural Lighting Sheet"></div>
      <div class="print-sheet"><img class="sheet-full-img" src="assets/page-5.jpg" alt="Exterior Bench Lighting Study Sheet"></div>
      <div class="print-sheet"><img class="sheet-full-img" src="assets/page-6.jpg" alt="Mountain Residential Home Design Sheet"></div>
      <div class="print-sheet"><img class="sheet-full-img" src="assets/page-7.jpg" alt="Photography & Visual Light Studies Sheet"></div>
    `;

    document.body.appendChild(booklet);
  }

  // --------------------------------------------------------------------------
  // Setup Editable Text & Images
  // --------------------------------------------------------------------------
  function setupEditableElements() {
    const editableTargets = document.querySelectorAll(
      'h1, h2, h3, h4, p, .kicker, .role, .intro-copy, .story-lead, .fact-value, figcaption, .slide-title, .slide-meta, .work-list-item strong, .about-statement, .about-narrative p, .contact-link'
    );

    editableTargets.forEach((el, index) => {
      if (el.closest('.editor-toolbar') || el.closest('.glass-nav') || el.closest('.print-portfolio-booklet')) return;

      el.classList.add('editable');
      const key = el.id ? el.id : `edit-${index}-${el.tagName.toLowerCase()}`;
      el.dataset.editKey = key;

      el.addEventListener('input', () => {
        const page = getPageData();
        if (!page.texts) page.texts = {};
        page.texts[key] = el.innerHTML;
        saveState();
      });
    });

    // Image replacement
    const images = document.querySelectorAll('main img, .project-hero-media img, .carousel-slide img');
    images.forEach((img, idx) => {
      if (img.closest('.print-portfolio-booklet')) return;
      const imgKey = img.id ? img.id : `img-${idx}`;
      img.dataset.imgKey = imgKey;

      img.addEventListener('click', (e) => {
        if (!isEditing) return;
        e.preventDefault();
        e.stopPropagation();

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            img.src = evt.target.result;
            const page = getPageData();
            if (!page.images) page.images = {};
            page.images[imgKey] = evt.target.result;
            saveState();
          };
          reader.readAsDataURL(file);
        };
        input.click();
      });
    });
  }

  // --------------------------------------------------------------------------
  // Main Initialization
  // --------------------------------------------------------------------------
  function init() {
    loadState();
    createSnapGuides();
    ensurePrintBookletInDOM();

    // Universal Draggable Selectors (Setup IDs FIRST so restoreDOM finds them reliably!)
    const draggableSelectors = [
      '.geo-circle-1',
      '.geo-circle-2',
      '#hero-kicker',
      '#hero-title',
      '#hero-role',
      '#hero-copy',
      '.role',
      '.intro-copy',
      '.intro h1',
      '.work-head-text',
      '.project-card',
      '.about h2',
      '.about-content',
      '.about-sticky',
      '.about-statement',
      '.about-narrative',
      '.work-group-title',
      '.work-list-item',
      '.story-lead',
      '.story-sidebar',
      '.figure-item',
      '.custom-shape'
    ];

    draggableSelectors.forEach((sel) => {
      const els = document.querySelectorAll(sel);
      els.forEach((el, i) => {
        const id = el.id || el.dataset.customId || `${sel.replace(/[^a-zA-Z0-9]/g, '_')}-${i}`;
        initDragAndSelect(el, id);
      });
    });

    // Restore saved transforms, styles, texts, and shapes
    restoreDOM();
    setupEditableElements();
    createEditorToolbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
