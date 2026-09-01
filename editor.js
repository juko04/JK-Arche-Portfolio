/**
 * Julian Kotara — Portfolio Interactive Visual Customizer & Pro Editor
 * Features:
 * - Smart Snapping with visual alignment guides (Horizontal & Vertical)
 * - Move, drag, & reposition elements & linework
 * - Delete shapes, text boxes, and elements (with persistence)
 * - Add basic shapes (Circle, Square/Rect, Line, Pill)
 * - Change font family (Sans / Serif / Mono), font size, bold, italic, and color
 * - Change shape dimensions, fill, and border styles
 * - Smart HSL color theme engine
 * - Full localStorage persistence across reloads
 */

(function () {
  const STORAGE_KEY = 'jk_portfolio_customizer_state';

  const COLOR_PRESETS = [
    { name: 'Sage Green', hue: 75, sat: '26%', color: '#b7bd91' },
    { name: 'Terracotta Red', hue: 15, sat: '26%', color: '#bd9591' },
    { name: 'Sand Ochre', hue: 42, sat: '24%', color: '#bda891' },
    { name: 'Blueprint Blue', hue: 215, sat: '24%', color: '#91a9bd' },
    { name: 'Forest Green', hue: 125, sat: '24%', color: '#91bd9d' },
    { name: 'Slate Greige', hue: 75, sat: '4%', color: '#a6a7a3' },
  ];

  let state = {
    isEditing: false,
    themeHue: 75,
    themeSat: '26%',
    texts: {},
    images: {},
    positions: {},
    styles: {},
    shapes: [],
    addedElements: [],
    deletedElements: [],
  };

  let activeElement = null;
  let inspectorEl = null;
  let snapGuideX = null;
  let snapGuideY = null;

  // Load from localStorage
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = { ...state, ...JSON.parse(saved) };
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
      toast._timer = setTimeout(() => toast.classList.remove('show'), 1400);
    }
  }

  // Theme application
  function applyTheme(hue, sat = '26%') {
    state.themeHue = hue;
    state.themeSat = sat;
    document.documentElement.style.setProperty('--theme-hue', hue);
    document.documentElement.style.setProperty('--theme-sat', sat);
  }

  // Generate unique element key
  function getElementKey(el) {
    if (!el) return '';
    return el.dataset.customId || el.id || el.dataset.editKey || `${el.tagName.toLowerCase()}-${el.className.replace(/\s+/g, '-')}`;
  }

  // --------------------------------------------------------------------------
  // Restore State to DOM
  // --------------------------------------------------------------------------
  function restoreDOM() {
    // 1. Theme Color
    if (state.themeHue !== undefined) {
      applyTheme(state.themeHue, state.themeSat || '26%');
    }

    // 2. Remove Deleted Elements
    (state.deletedElements || []).forEach((key) => {
      const el = document.querySelector(`[data-custom-id="${key}"]`) || document.getElementById(key) || document.querySelector(`[data-edit-key="${key}"]`);
      if (el) el.remove();
    });

    // 3. Restore Text Overrides
    Object.keys(state.texts || {}).forEach((key) => {
      const el = document.querySelector(`[data-custom-id="${key}"]`) || document.getElementById(key) || document.querySelector(`[data-edit-key="${key}"]`) || document.querySelector(key);
      if (el) el.innerHTML = state.texts[key];
    });

    // 4. Restore Images
    Object.keys(state.images || {}).forEach((key) => {
      const img = document.querySelector(`[data-img-key="${key}"]`) || document.getElementById(key) || document.querySelector(key);
      if (img) img.src = state.images[key];
    });

    // 5. Restore Style Overrides (Fonts, Sizes, Colors)
    Object.keys(state.styles || {}).forEach((key) => {
      const el = document.querySelector(`[data-custom-id="${key}"]`) || document.getElementById(key) || document.querySelector(`[data-edit-key="${key}"]`) || document.querySelector(key);
      if (el && state.styles[key]) {
        Object.assign(el.style, state.styles[key]);
      }
    });

    // 6. Restore Custom Shapes
    (state.shapes || []).forEach((shapeData) => {
      if (!document.getElementById(shapeData.id)) {
        createShapeElement(shapeData);
      }
    });

    // 7. Restore Added Text Paragraphs
    (state.addedElements || []).forEach((item) => {
      const parent = document.querySelector(item.parentSelector) || document.querySelector('main');
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

    // 8. Restore Positions
    Object.keys(state.positions || {}).forEach((id) => {
      const el = document.querySelector(`[data-custom-id="${id}"]`) || document.getElementById(id) || document.querySelector(id);
      if (el && state.positions[id]) {
        const { x, y } = state.positions[id];
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.dataset.dragX = x;
        el.dataset.dragY = y;
      }
    });
  }

  // --------------------------------------------------------------------------
  // Smart Alignment Snapping Engine
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

  function calculateSnap(draggedEl, currentLeft, currentTop) {
    const SNAP_THRESHOLD = 7; // pixels
    const draggedRect = draggedEl.getBoundingClientRect();
    const width = draggedRect.width;
    const height = draggedRect.height;

    const draggedEdges = {
      left: currentLeft,
      centerX: currentLeft + width / 2,
      right: currentLeft + width,
      top: currentTop,
      centerY: currentTop + height / 2,
      bottom: currentTop + height,
    };

    let snappedX = currentLeft;
    let snappedY = currentTop;
    let matchedGuideX = null;
    let matchedGuideY = null;

    // Collect all candidate target elements
    const targets = document.querySelectorAll('.draggable-item, .geo-circle, .custom-shape, h1, h2, h3, p, .project-card, .project-facts-bar');
    targets.forEach((target) => {
      if (target === draggedEl || target.contains(draggedEl) || draggedEl.contains(target)) return;

      const r = target.getBoundingClientRect();
      const targetEdges = {
        left: r.left,
        centerX: r.left + r.width / 2,
        right: r.right,
        top: r.top,
        centerY: r.top + r.height / 2,
        bottom: r.bottom,
      };

      // X-Axis Snapping
      if (matchedGuideY === null) {
        ['left', 'centerX', 'right'].forEach((dKey) => {
          ['left', 'centerX', 'right'].forEach((tKey) => {
            const diff = Math.abs(draggedEdges[dKey] - targetEdges[tKey]);
            if (diff < SNAP_THRESHOLD) {
              const offset = targetEdges[tKey] - draggedEdges[dKey];
              snappedX = currentLeft + offset;
              matchedGuideY = targetEdges[tKey];
            }
          });
        });
      }

      // Y-Axis Snapping
      if (matchedGuideX === null) {
        ['top', 'centerY', 'bottom'].forEach((dKey) => {
          ['top', 'centerY', 'bottom'].forEach((tKey) => {
            const diff = Math.abs(draggedEdges[dKey] - targetEdges[tKey]);
            if (diff < SNAP_THRESHOLD) {
              const offset = targetEdges[tKey] - draggedEdges[dKey];
              snappedY = currentTop + offset;
              matchedGuideX = targetEdges[tKey];
            }
          });
        });
      }
    });

    // Render snap guide lines
    if (matchedGuideX !== null && snapGuideX) {
      snapGuideX.style.top = `${matchedGuideX}px`;
      snapGuideX.style.display = 'block';
    } else if (snapGuideX) {
      snapGuideX.style.display = 'none';
    }

    if (matchedGuideY !== null && snapGuideY) {
      snapGuideY.style.left = `${matchedGuideY}px`;
      snapGuideY.style.display = 'block';
    } else if (snapGuideY) {
      snapGuideY.style.display = 'none';
    }

    return { x: snappedX, y: snappedY };
  }

  // --------------------------------------------------------------------------
  // Drag & Selection Controller
  // --------------------------------------------------------------------------
  function initDragAndSelect(element, customId) {
    if (!element) return;
    element.classList.add('draggable-item');
    const id = customId || element.id || getElementKey(element) || `drag-${Math.random().toString(36).substr(2, 6)}`;
    element.dataset.customId = id;

    let startMouseX = 0, startMouseY = 0;
    let initialTranslateX = 0, initialTranslateY = 0;
    let isDragging = false;

    function onMouseDown(e) {
      if (!document.body.classList.contains('is-editing')) return;
      if (e.target.closest('.element-inspector') || e.target.closest('.editor-toolbar')) return;

      selectElement(element);

      // If user is editing text without holding Alt, don't drag so text can be highlighted
      if (e.target.isContentEditable && !e.altKey && e.target !== element) {
        return;
      }

      isDragging = true;
      startMouseX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      startMouseY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      initialTranslateX = parseFloat(element.dataset.dragX) || 0;
      initialTranslateY = parseFloat(element.dataset.dragY) || 0;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onMouseMove, { passive: false });
      document.addEventListener('touchend', onMouseUp);
    }

    function onMouseMove(e) {
      if (!isDragging || !document.body.classList.contains('is-editing')) return;

      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const rawDeltaX = clientX - startMouseX;
      const rawDeltaY = clientY - startMouseY;

      const candidateX = initialTranslateX + rawDeltaX;
      const candidateY = initialTranslateY + rawDeltaY;

      // Smart alignment calculation
      const initialRect = element.getBoundingClientRect();
      const snapped = calculateSnap(element, initialRect.left + rawDeltaX, initialRect.top + rawDeltaY);
      const finalDeltaX = candidateX + (snapped.x - (initialRect.left + rawDeltaX));
      const finalDeltaY = candidateY + (snapped.y - (initialRect.top + rawDeltaY));

      element.style.transform = `translate3d(${finalDeltaX}px, ${finalDeltaY}px, 0)`;
      element.dataset.tempX = finalDeltaX;
      element.dataset.tempY = finalDeltaY;

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

      if (!state.positions) state.positions = {};
      state.positions[id] = { x: finalX, y: finalY };
      saveState();
      positionInspector();
    }

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('touchstart', onMouseDown, { passive: true });
  }

  // --------------------------------------------------------------------------
  // Selection & Contextual Inspector Toolbar
  // --------------------------------------------------------------------------
  function selectElement(el) {
    if (activeElement === el) return;
    if (activeElement) activeElement.classList.remove('active-selected');

    activeElement = el;
    if (activeElement) {
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
    const topPos = Math.max(12, rect.top - 46);
    const leftPos = Math.min(Math.max(120, rect.left + rect.width / 2), window.innerWidth - 120);

    inspectorEl.style.top = `${topPos}px`;
    inspectorEl.style.left = `${leftPos}px`;
  }

  function renderInspector(el) {
    hideInspector();
    if (!document.body.classList.contains('is-editing')) return;

    inspectorEl = document.createElement('div');
    inspectorEl.className = 'element-inspector';

    const isText = el.isContentEditable || ['H1', 'H2', 'H3', 'H4', 'P', 'SPAN', 'FIGCAPTION', 'DIV'].includes(el.tagName);
    const isShape = el.classList.contains('custom-shape') || el.classList.contains('geo-circle');

    const key = getElementKey(el);
    const currentStyle = state.styles[key] || {};

    let html = '';

    if (isText) {
      html += `
        <!-- Font Family -->
        <div class="inspector-group">
          <select class="inspector-select" id="insp-font-family" title="Font Family">
            <option value="var(--sans)" ${currentStyle.fontFamily?.includes('sans') ? 'selected' : ''}>Sans</option>
            <option value="var(--serif)" ${currentStyle.fontFamily?.includes('serif') ? 'selected' : ''}>Serif</option>
            <option value="var(--mono)" ${currentStyle.fontFamily?.includes('mono') ? 'selected' : ''}>Mono</option>
          </select>
        </div>

        <!-- Font Size -->
        <div class="inspector-group">
          <button class="inspector-btn" id="insp-size-down" title="Decrease Size">A-</button>
          <button class="inspector-btn" id="insp-size-up" title="Increase Size">A+</button>
        </div>

        <!-- Font Styles -->
        <div class="inspector-group">
          <button class="inspector-btn ${currentStyle.fontWeight === 'bold' || currentStyle.fontWeight === '700' ? 'active' : ''}" id="insp-bold" title="Bold"><strong>B</strong></button>
          <button class="inspector-btn ${currentStyle.fontStyle === 'italic' ? 'active' : ''}" id="insp-italic" title="Italic"><em>I</em></button>
        </div>

        <!-- Text Color -->
        <div class="inspector-group">
          <input type="color" class="inspector-color-input" id="insp-color" title="Text Color" value="${rgbToHex(window.getComputedStyle(el).color) || '#1f231b'}">
        </div>
      `;
    }

    if (isShape) {
      html += `
        <!-- Shape Size -->
        <div class="inspector-group">
          <span style="font-family: var(--mono); font-size: 10px;">Size</span>
          <button class="inspector-btn" id="insp-shape-down" title="Smaller">-</button>
          <button class="inspector-btn" id="insp-shape-up" title="Larger">+</button>
        </div>

        <!-- Shape Fill / Stroke Color -->
        <div class="inspector-group">
          <input type="color" class="inspector-color-input" id="insp-shape-color" title="Shape Color" value="${rgbToHex(window.getComputedStyle(el).backgroundColor) || '#b7bd91'}">
        </div>
      `;
    }

    // Delete Button
    html += `
      <div class="inspector-group">
        <button class="inspector-btn danger" id="insp-delete" title="Delete Element">🗑️ Delete</button>
      </div>
    `;

    inspectorEl.innerHTML = html;
    document.body.appendChild(inspectorEl);
    positionInspector();

    // Hook Inspector Events
    if (isText) {
      // Font Family
      inspectorEl.querySelector('#insp-font-family')?.addEventListener('change', (e) => {
        applyElementStyle(el, 'fontFamily', e.target.value);
      });

      // Font Size Up / Down
      inspectorEl.querySelector('#insp-size-up')?.addEventListener('click', () => {
        const currSize = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        applyElementStyle(el, 'fontSize', `${currSize + 2}px`);
      });

      inspectorEl.querySelector('#insp-size-down')?.addEventListener('click', () => {
        const currSize = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        applyElementStyle(el, 'fontSize', `${Math.max(10, currSize - 2)}px`);
      });

      // Bold Toggle
      inspectorEl.querySelector('#insp-bold')?.addEventListener('click', (e) => {
        const isBold = el.style.fontWeight === 'bold' || window.getComputedStyle(el).fontWeight >= 600;
        applyElementStyle(el, 'fontWeight', isBold ? '400' : '700');
        e.currentTarget.classList.toggle('active', !isBold);
      });

      // Italic Toggle
      inspectorEl.querySelector('#insp-italic')?.addEventListener('click', (e) => {
        const isItalic = el.style.fontStyle === 'italic';
        applyElementStyle(el, 'fontStyle', isItalic ? 'normal' : 'italic');
        e.currentTarget.classList.toggle('active', !isItalic);
      });

      // Text Color
      inspectorEl.querySelector('#insp-color')?.addEventListener('input', (e) => {
        applyElementStyle(el, 'color', e.target.value);
      });
    }

    if (isShape) {
      // Shape Size
      inspectorEl.querySelector('#insp-shape-up')?.addEventListener('click', () => {
        const w = parseFloat(window.getComputedStyle(el).width) || 100;
        const h = parseFloat(window.getComputedStyle(el).height) || 100;
        applyElementStyle(el, 'width', `${w * 1.15}px`);
        applyElementStyle(el, 'height', `${h * 1.15}px`);
        positionInspector();
      });

      inspectorEl.querySelector('#insp-shape-down')?.addEventListener('click', () => {
        const w = parseFloat(window.getComputedStyle(el).width) || 100;
        const h = parseFloat(window.getComputedStyle(el).height) || 100;
        applyElementStyle(el, 'width', `${Math.max(20, w * 0.85)}px`);
        applyElementStyle(el, 'height', `${Math.max(2, h * 0.85)}px`);
        positionInspector();
      });

      // Shape Color
      inspectorEl.querySelector('#insp-shape-color')?.addEventListener('input', (e) => {
        if (el.classList.contains('shape-line')) {
          applyElementStyle(el, 'backgroundColor', e.target.value);
        } else if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent') {
          applyElementStyle(el, 'backgroundColor', e.target.value);
        } else {
          applyElementStyle(el, 'borderColor', e.target.value);
        }
      });
    }

    // Delete Button
    inspectorEl.querySelector('#insp-delete')?.addEventListener('click', () => {
      deleteElement(el);
    });
  }

  function applyElementStyle(el, prop, val) {
    el.style[prop] = val;
    const key = getElementKey(el);
    if (!state.styles) state.styles = {};
    if (!state.styles[key]) state.styles[key] = {};
    state.styles[key][prop] = val;
    saveState();
  }

  function deleteElement(el) {
    if (!el) return;
    const key = getElementKey(el);
    if (!state.deletedElements) state.deletedElements = [];
    if (!state.deletedElements.includes(key)) {
      state.deletedElements.push(key);
    }

    // If it's a custom shape, remove from shapes list
    if (state.shapes) {
      state.shapes = state.shapes.filter(s => s.id !== el.id);
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
  // Basic Shapes Creation
  // --------------------------------------------------------------------------
  function createShapeElement(shapeData) {
    const parent = document.querySelector('.intro') || document.querySelector('main') || document.body;
    if (!parent) return;

    const shape = document.createElement('div');
    shape.id = shapeData.id;
    shape.dataset.customId = shapeData.id;
    shape.className = `custom-shape shape-${shapeData.type} ${shapeData.filled ? 'filled' : ''} draggable-item`;

    shape.style.width = shapeData.width || '140px';
    shape.style.height = shapeData.height || '140px';
    shape.style.left = shapeData.left || '40vw';
    shape.style.top = shapeData.top || '30vh';

    parent.appendChild(shape);
    initDragAndSelect(shape, shapeData.id);
    return shape;
  }

  function addNewShape(type) {
    const id = `custom-shape-${type}-${Date.now()}`;
    const shapeData = {
      id,
      type,
      width: type === 'line' ? '220px' : type === 'pill' ? '150px' : '130px',
      height: type === 'line' ? '2px' : type === 'pill' ? '46px' : '130px',
      filled: type === 'circle' || type === 'pill',
      left: '35vw',
      top: '25vh',
    };

    if (!state.shapes) state.shapes = [];
    state.shapes.push(shapeData);
    saveState();

    const shapeEl = createShapeElement(shapeData);
    if (shapeEl) selectElement(shapeEl);
  }

  // --------------------------------------------------------------------------
  // Add Paragraph Helper
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

    if (!state.addedElements) state.addedElements = [];
    state.addedElements.push({
      id: newId,
      parentSelector: activeContainer.className ? `.${activeContainer.className.split(' ')[0]}` : 'main',
      html: p.innerHTML,
    });

    p.addEventListener('input', () => {
      const item = state.addedElements.find(x => x.id === newId);
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

    const swatchesHTML = COLOR_PRESETS.map(p => `
      <button class="color-swatch-btn ${p.hue === state.themeHue ? 'active' : ''}" 
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
          <input type="range" class="hue-slider" id="hue-range" min="0" max="360" value="${state.themeHue || 75}" title="Fine-tune theme hue">
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

        <button class="editor-btn" id="editor-reset" type="button" title="Reset all custom edits to default">↺ Reset</button>
        
        <!-- Saved Badge -->
        <span class="saved-toast" id="saved-toast">✓ Saved</span>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Toggle Edit Mode
    const toggleBtn = toolbar.querySelector('#editor-mode-toggle');
    const label = toolbar.querySelector('#editor-toggle-label');

    function setEditMode(on) {
      state.isEditing = on;
      document.body.classList.toggle('is-editing', on);
      toggleBtn.classList.toggle('active', on);
      label.textContent = on ? 'Done Editing' : 'Edit Mode';

      document.querySelectorAll('.editable').forEach((el) => {
        el.contentEditable = on ? 'true' : 'false';
      });

      if (!on) {
        selectElement(null);
        hideSnapGuides();
      }
    }

    toggleBtn.addEventListener('click', () => setEditMode(!state.isEditing));

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

    // Reset All
    toolbar.querySelector('#editor-reset').addEventListener('click', () => {
      if (confirm('Reset all custom text, added shapes, positions, and color edits back to defaults?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });

    // Global Key Handlers: Delete key & E toggle
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'e' && !e.target.isContentEditable && e.target.tagName !== 'INPUT') {
        setEditMode(!state.isEditing);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && activeElement && !e.target.isContentEditable && e.target.tagName !== 'INPUT') {
        deleteElement(activeElement);
      }
    });

    // Deselect when clicking empty background
    document.addEventListener('mousedown', (e) => {
      if (!document.body.classList.contains('is-editing')) return;
      if (e.target.closest('.editor-toolbar') || e.target.closest('.element-inspector') || e.target.closest('.draggable-item')) return;
      selectElement(null);
    });
  }

  // --------------------------------------------------------------------------
  // Setup Editable Text & Images
  // --------------------------------------------------------------------------
  function setupEditableElements() {
    const editableTargets = document.querySelectorAll(
      'h1, h2, h3, h4, p, .kicker, .role, .intro-copy, .story-lead, .fact-value, figcaption, .slide-title, .slide-meta'
    );

    editableTargets.forEach((el, index) => {
      if (el.closest('.editor-toolbar') || el.closest('.glass-nav')) return;

      el.classList.add('editable');
      const key = el.id ? el.id : `edit-${index}-${el.tagName.toLowerCase()}`;
      el.dataset.editKey = key;

      el.addEventListener('input', () => {
        if (!state.texts) state.texts = {};
        state.texts[key] = el.innerHTML;
        saveState();
      });
    });

    // Image replacement
    const images = document.querySelectorAll('main img, .project-hero-media img, .carousel-slide img');
    images.forEach((img, idx) => {
      const imgKey = img.id ? img.id : `img-${idx}`;
      img.dataset.imgKey = imgKey;

      img.addEventListener('click', (e) => {
        if (!document.body.classList.contains('is-editing')) return;
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
            if (!state.images) state.images = {};
            state.images[imgKey] = evt.target.result;
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
    restoreDOM();
    setupEditableElements();

    // Make core elements draggable & selectable with snapping
    const draggableSelectors = [
      '.geo-circle-1',
      '.geo-circle-2',
      '.role',
      '.intro-copy',
      '.intro h1',
      '.intro-top',
      '.work-head-text',
      '.about-sticky',
      '.story-lead',
      '.custom-shape'
    ];

    draggableSelectors.forEach((sel) => {
      const els = document.querySelectorAll(sel);
      els.forEach((el, i) => initDragAndSelect(el, `${sel.replace(/[^a-zA-Z0-9]/g, '_')}-${i}`));
    });

    createEditorToolbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
