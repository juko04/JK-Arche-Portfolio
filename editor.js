/**
 * Julian Kotara — Portfolio Interactive Visual Customizer & Pro Editor
 * Fully Scoped per Page, Layer Ordering (Z-Index), Dynamic Landscape PDF Booklet,
 * Zero-Jitter Alignment Snapping, Shape Engine, Dedicated Inspectors, & Universal Dragging.
 */

(function () {
  const STORAGE_KEY = 'jk_portfolio_customizer_v8';

  // Preset Color Palettes (Preserves exact lightness & contrast)
  const COLOR_PRESETS = [
    { name: 'Sage Green', hue: 75, sat: '26%', color: '#b7bd91' },
    { name: 'Terracotta Red', hue: 15, sat: '26%', color: '#bd9591' },
    { name: 'Sand Ochre', hue: 42, sat: '24%', color: '#bda891' },
    { name: 'Blueprint Blue', hue: 215, sat: '24%', color: '#91a9bd' },
    { name: 'Forest Green', hue: 125, sat: '24%', color: '#91bd9d' },
    { name: 'Slate Greige', hue: 75, sat: '4%', color: '#a6a7a3' },
  ];

  // Normalized Page Key
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

  const MAX_HISTORY = 60;
  let historyStack = [];
  let historyIndex = -1;
  let isApplyingHistory = false;
  let textDebounceTimer = null;

  let isEditing = false;
  let activeElement = null;
  let inspectorEl = null;
  let transformBox = null;
  let isTransforming = false;
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

  // Load from localStorage (with backward compatibility)
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
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
  function saveState(triggerToast = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (triggerToast) showToast('✓ Saved');
    } catch (e) {
      console.warn('Could not save customizer state:', e);
    }
  }

  function showToast(msg = '✓ Saved') {
    const toast = document.querySelector('#saved-toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => toast.classList.remove('show'), 1200);
    }
  }

  // --------------------------------------------------------------------------
  // Undo & Redo History Engine
  // --------------------------------------------------------------------------
  function pushHistory(actionName) {
    if (isApplyingHistory) return;

    // Make sure latest live text from DOM is synced before snapshotting
    syncAllTexts();

    const snapshot = JSON.stringify(state);

    // Skip duplicate if identical to current top
    if (historyIndex >= 0 && historyStack[historyIndex] === snapshot) {
      return;
    }

    // Truncate any redo branch ahead
    if (historyIndex < historyStack.length - 1) {
      historyStack = historyStack.slice(0, historyIndex + 1);
    }

    historyStack.push(snapshot);
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
    }
    historyIndex = historyStack.length - 1;

    updateUndoRedoUI();
  }

  function undo() {
    // Flush any pending text debounce
    if (textDebounceTimer) {
      clearTimeout(textDebounceTimer);
      textDebounceTimer = null;
      syncAllTexts();
      const snap = JSON.stringify(state);
      if (historyIndex >= 0 && historyStack[historyIndex] !== snap) {
        pushHistory('Text Edit');
      }
    }

    if (historyIndex <= 0) {
      showToast('Nothing to undo');
      return;
    }

    historyIndex--;
    applyHistorySnapshot(historyStack[historyIndex]);
    showToast('↺ Undo');
  }

  function redo() {
    if (historyIndex >= historyStack.length - 1) {
      showToast('Nothing to redo');
      return;
    }

    historyIndex++;
    applyHistorySnapshot(historyStack[historyIndex]);
    showToast('↻ Redo');
  }

  function applyHistorySnapshot(snapshotString) {
    isApplyingHistory = true;
    try {
      state = JSON.parse(snapshotString);
      saveState(false);
      applyFullStateToDOM();
      updateUndoRedoUI();
    } catch (e) {
      console.warn('Error applying history snapshot:', e);
    } finally {
      isApplyingHistory = false;
    }
  }

  function updateUndoRedoUI() {
    const undoBtn = document.querySelector('#editor-undo');
    const redoBtn = document.querySelector('#editor-redo');
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < historyStack.length - 1;

    if (undoBtn) {
      undoBtn.disabled = !canUndo;
    }
    if (redoBtn) {
      redoBtn.disabled = !canRedo;
    }
  }

  // Theme Application
  function applyTheme(hue, sat = '26%') {
    state.globalTheme = { hue, sat };
    document.documentElement.style.setProperty('--theme-hue', hue);
    document.documentElement.style.setProperty('--theme-sat', sat);
  }

  function generateSemanticEditKey(el, fallbackIndex) {
    if (!el) return '';
    if (el.id) return el.id;
    if (el.dataset.customId) return el.dataset.customId;
    if (el.dataset.editKey) return el.dataset.editKey;

    const anchor = el.closest('[id], [data-project], [data-custom-id], .skills-grid, .skill-col, .about-right, .about-sticky, section, main, header, footer');
    let prefix = 'page';
    if (anchor) {
      if (anchor.id) prefix = anchor.id;
      else if (anchor.dataset.project) prefix = `proj-${anchor.dataset.project}`;
      else if (anchor.dataset.customId) prefix = anchor.dataset.customId;
      else if (anchor.className) prefix = anchor.className.trim().split(/\s+/)[0];
    }

    const cleanClasses = Array.from(el.classList).filter(c => !['editable', 'draggable-item', 'active-selected', 'is-dragging'].includes(c));
    const tagOrClass = cleanClasses.length > 0 ? cleanClasses[0] : el.tagName.toLowerCase();

    let idx = '';
    const sameTagInAnchor = anchor ? Array.from(anchor.querySelectorAll(el.tagName.toLowerCase())) : [];
    if (sameTagInAnchor.length > 1) {
      const pos = sameTagInAnchor.indexOf(el);
      idx = `-${pos >= 0 ? pos : (fallbackIndex ?? 0)}`;
    } else if (sameTagInAnchor.length === 0 && fallbackIndex !== undefined) {
      idx = `-${fallbackIndex}`;
    }

    return `${prefix}-${tagOrClass}${idx}`.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');
  }

  function getElementKey(el) {
    if (!el) return '';
    return el.id || el.dataset.customId || el.dataset.editKey || generateSemanticEditKey(el);
  }

  function findTargetElement(key) {
    if (!key || typeof key !== 'string') return null;

    // Fast path: direct ID lookup
    const byId = document.getElementById(key);
    if (byId) return byId;

    // Safe escaped attribute lookups
    try {
      const escaped = (typeof CSS !== 'undefined' && CSS.escape)
        ? CSS.escape(key)
        : key.replace(/["\\]/g, '\\$&');

      const byCustomId = document.querySelector(`[data-custom-id="${escaped}"]`);
      if (byCustomId) return byCustomId;

      const byEditKey = document.querySelector(`[data-edit-key="${escaped}"]`);
      if (byEditKey) return byEditKey;
    } catch (e) {
      // Ignore invalid attribute escape errors
    }

    // Direct CSS selector lookup (safe try/catch prevents DOMException)
    try {
      return document.querySelector(key);
    } catch (e) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Unified DOM State Reconciler & State Restoration
  // --------------------------------------------------------------------------
  function applyFullStateToDOM() {
    try {
      // 1. Theme
      if (state.globalTheme?.hue !== undefined) {
        applyTheme(state.globalTheme.hue, state.globalTheme.sat || '26%');
        const hueSlider = document.querySelector('#hue-range');
        if (hueSlider) hueSlider.value = state.globalTheme.hue;
        const swatches = document.querySelectorAll('.color-swatch-btn');
        swatches.forEach(b => {
          b.classList.toggle('active', parseInt(b.dataset.hue, 10) === state.globalTheme.hue);
        });
      }

      const page = getPageData();
      if (!page) return;

      // 2. Deleted Elements Reversal & Application
      const deletedList = Array.isArray(page.deleted) ? page.deleted : [];
      deletedList.forEach((key) => {
        try {
          const el = findTargetElement(key);
          if (el) {
            el.style.display = 'none';
            el.dataset.editorDeleted = 'true';
          }
        } catch (e) {
          console.warn('Error hiding deleted element:', key, e);
        }
      });
      document.querySelectorAll('[data-editor-deleted="true"]').forEach((el) => {
        const key = getElementKey(el);
        if (!deletedList.includes(key)) {
          el.style.display = '';
          delete el.dataset.editorDeleted;
        }
      });

      // 3. Custom Shapes (Recreate missing, Remove pruned, Update styles)
      const targetShapes = Array.isArray(page.shapes) ? page.shapes : [];
      const targetShapeIds = new Set(targetShapes.map(s => s.id));
      document.querySelectorAll('.custom-shape').forEach((el) => {
        if (!targetShapeIds.has(el.id)) {
          el.remove();
        }
      });
      targetShapes.forEach((shapeData) => {
        try {
          let el = document.getElementById(shapeData.id);
          if (!el) {
            el = createShapeDOM(shapeData);
          }
          if (el && shapeData.style) {
            Object.assign(el.style, shapeData.style);
          }
        } catch (e) {
          console.warn('Error restoring shape:', shapeData, e);
        }
      });

      // 4. Added Paragraphs (Recreate missing, Remove pruned, Update content)
      const targetAdded = Array.isArray(page.added) ? page.added : [];
      const targetAddedIds = new Set(targetAdded.map(a => a.id));
      document.querySelectorAll('.custom-added-text').forEach((el) => {
        if (!targetAddedIds.has(el.id)) {
          el.remove();
        }
      });
      targetAdded.forEach((item) => {
        try {
          if (!item || !item.id) return;
          let el = document.getElementById(item.id);
          if (!el) {
            const parent = document.querySelector(item.parentSelector) || document.querySelector('main') || document.body;
            if (parent) {
              el = document.createElement('p');
              el.id = item.id;
              el.dataset.customId = item.id;
              el.dataset.editKey = item.id;
              el.className = 'editable draggable-item custom-added-text';
              if (isEditing) el.contentEditable = 'true';
              if (item.style) Object.assign(el.style, item.style);
              parent.appendChild(el);
              initDragAndSelect(el, item.id);
            }
          }
          if (el) {
            el.innerHTML = (page.texts && page.texts[item.id]) ? page.texts[item.id] : (item.html || '');
          }
        } catch (e) {
          console.warn('Error restoring added paragraph:', item, e);
        }
      });

      // 5. Restore Text Content
      const editableTargets = document.querySelectorAll('.editable');
      editableTargets.forEach((el) => {
        if (el.closest('.editor-toolbar') || el.closest('.glass-nav') || el.closest('.print-portfolio-booklet') || el.closest('.transform-bounding-box') || el.closest('.code-export-backdrop')) return;
        const key = el.dataset.editKey || getElementKey(el);
        if (key) {
          if (page.texts && typeof page.texts[key] === 'string') {
            el.innerHTML = page.texts[key];
          } else if (el.dataset.initialHtml) {
            el.innerHTML = el.dataset.initialHtml;
          }
        }
      });

      // 6. Restore Styles (Font, Size, Color, Layer Z-Index)
      const allElements = document.querySelectorAll('.editable, .draggable-item');
      allElements.forEach((el) => {
        const key = getElementKey(el);
        const st = (page.styles && typeof page.styles === 'object') ? page.styles[key] : null;
        if (st && typeof st === 'object') {
          if (st.color) el.style.color = st.color; else el.style.color = '';
          if (st.fontFamily) el.style.fontFamily = st.fontFamily; else el.style.fontFamily = '';
          if (st.fontSize) el.style.fontSize = st.fontSize; else el.style.fontSize = '';
          if (st.fontWeight) el.style.fontWeight = st.fontWeight; else el.style.fontWeight = '';
          if (st.fontStyle) el.style.fontStyle = st.fontStyle; else el.style.fontStyle = '';
          if (st.zIndex) el.style.zIndex = st.zIndex; else el.style.zIndex = '';
          if (st.backgroundColor) el.style.backgroundColor = st.backgroundColor;
        } else if (!el.classList.contains('custom-shape')) {
          el.style.color = '';
          el.style.fontFamily = '';
          el.style.fontSize = '';
          el.style.fontWeight = '';
          el.style.fontStyle = '';
          el.style.zIndex = '';
        }
      });

      // 7. Restore Positions, Dimensions & Rotations
      const isMobile = window.innerWidth <= 768;
      const positionedElements = document.querySelectorAll('.draggable-item, [data-drag-x], [data-drag-y], [data-rotate]');
      positionedElements.forEach((el) => {
        const id = el.id || el.dataset.customId || el.dataset.editKey || getElementKey(el);
        const pos = (page.positions && typeof page.positions === 'object') ? page.positions[id] : null;
        if (pos) {
          if (isMobile && (el.classList.contains('hero-title') || el.classList.contains('hero-kicker') || el.classList.contains('intro-body'))) {
            return;
          }
          const { x, y, width, height, rotate } = pos;
          if (el.classList.contains('custom-shape') || el.classList.contains('geo-circle')) {
            if (width && !isMobile) el.style.width = width;
            if (height && !isMobile) el.style.height = height;
          }
          const rot = rotate || 0;
          el.style.transform = (x || y || rot) ? `translate3d(${x || 0}px, ${y || 0}px, 0) rotate(${rot}deg)` : '';
          el.dataset.dragX = x || 0;
          el.dataset.dragY = y || 0;
          el.dataset.rotate = rot;
        } else {
          el.style.transform = '';
          el.dataset.dragX = 0;
          el.dataset.dragY = 0;
          el.dataset.rotate = 0;
        }
      });

      // 8. Active Selection & Inspector Sync
      if (activeElement) {
        if (!document.body.contains(activeElement) || activeElement.style.display === 'none') {
          selectElement(null);
        } else {
          updateTransformBox();
          positionInspector();
          renderInspector(activeElement);
        }
      }
    } catch (e) {
      console.warn('Could not complete applyFullStateToDOM:', e);
    }
  }

  function restoreDOM() {
    applyFullStateToDOM();
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
  // Transform Handles & Rotation (Photoshop / InDesign Grips)
  // --------------------------------------------------------------------------
  function createTransformBox() {
    if (transformBox) return;
    transformBox = document.createElement('div');
    transformBox.className = 'transform-bounding-box';
    transformBox.id = 'transform-bounding-box';
    transformBox.style.display = 'none';

    transformBox.innerHTML = `
      <div class="handle-rot-stem"></div>
      <div class="handle-rot" data-handle="rot" title="Drag to Rotate (Hold Shift for 15° snap)"></div>
      <div class="transform-handle handle-nw" data-handle="nw" title="Resize Top-Left"></div>
      <div class="transform-handle handle-n" data-handle="n" title="Resize Top"></div>
      <div class="transform-handle handle-ne" data-handle="ne" title="Resize Top-Right"></div>
      <div class="transform-handle handle-e" data-handle="e" title="Resize Right"></div>
      <div class="transform-handle handle-se" data-handle="se" title="Resize Bottom-Right"></div>
      <div class="transform-handle handle-s" data-handle="s" title="Resize Bottom"></div>
      <div class="transform-handle handle-sw" data-handle="sw" title="Resize Bottom-Left"></div>
      <div class="transform-handle handle-w" data-handle="w" title="Resize Left"></div>
    `;

    document.body.appendChild(transformBox);

    // Handle Pointer Down
    transformBox.querySelectorAll('[data-handle]').forEach((h) => {
      h.addEventListener('mousedown', onHandleMouseDown);
      h.addEventListener('touchstart', onHandleMouseDown, { passive: false });
    });
  }

  function updateTransformBox() {
    if (!transformBox) createTransformBox();
    if (!activeElement || !isEditing) {
      if (transformBox) transformBox.style.display = 'none';
      return;
    }

    const rect = activeElement.getBoundingClientRect();
    transformBox.style.display = 'block';
    transformBox.style.width = `${rect.width}px`;
    transformBox.style.height = `${rect.height}px`;
    transformBox.style.left = `${rect.left}px`;
    transformBox.style.top = `${rect.top}px`;
    const rot = parseFloat(activeElement.dataset.rotate) || 0;
    transformBox.style.transform = `rotate(${rot}deg)`;
  }

  function onHandleMouseDown(e) {
    if (!activeElement || !isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    document.body.classList.add('is-transforming');

    isTransforming = true;
    const handleType = e.currentTarget.dataset.handle;
    const isTouch = e.type === 'touchstart';
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;

    const initialWidth = activeElement.offsetWidth;
    const initialHeight = activeElement.offsetHeight;
    const initialDragX = parseFloat(activeElement.dataset.dragX) || 0;
    const initialDragY = parseFloat(activeElement.dataset.dragY) || 0;
    const initialRotate = parseFloat(activeElement.dataset.rotate) || 0;

    const rect = activeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    function onMove(evt) {
      if (!isTransforming) return;
      const clientX = evt.type === 'touchmove' ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.type === 'touchmove' ? evt.touches[0].clientY : evt.clientY;

      if (handleType === 'rot') {
        const rad = Math.atan2(clientY - centerY, clientX - centerX);
        let deg = Math.round((rad * (180 / Math.PI)) + 90);
        if (evt.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }
        deg = (deg % 360 + 360) % 360;

        activeElement.dataset.rotate = deg;
        activeElement.style.transform = `translate3d(${initialDragX}px, ${initialDragY}px, 0) rotate(${deg}deg)`;
      } else {
        let deltaX = clientX - startX;
        let deltaY = clientY - startY;

        if (initialRotate !== 0) {
          const rad = -initialRotate * (Math.PI / 180);
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const rotDeltaX = deltaX * cos - deltaY * sin;
          const rotDeltaY = deltaX * sin + deltaY * cos;
          deltaX = rotDeltaX;
          deltaY = rotDeltaY;
        }

        let newW = initialWidth;
        let newH = initialHeight;

        if (handleType.includes('e')) newW = Math.max(15, initialWidth + deltaX);
        if (handleType.includes('w')) newW = Math.max(15, initialWidth - deltaX);
        if (handleType.includes('s')) newH = Math.max(10, initialHeight + deltaY);
        if (handleType.includes('n')) newH = Math.max(10, initialHeight - deltaY);

        activeElement.style.width = `${Math.round(newW)}px`;
        activeElement.style.height = `${Math.round(newH)}px`;
      }

      updateTransformBox();
      positionInspector();
      if (evt.type === 'touchmove') evt.preventDefault();
    }

    function onUp() {
      if (!isTransforming) return;
      isTransforming = false;
      document.body.classList.remove('is-transforming');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);

      const id = getElementKey(activeElement);
      const page = getPageData();
      if (!page.positions) page.positions = {};
      const rot = parseFloat(activeElement.dataset.rotate) || 0;
      page.positions[id] = {
        x: parseFloat(activeElement.dataset.dragX) || 0,
        y: parseFloat(activeElement.dataset.dragY) || 0,
        width: activeElement.style.width || `${activeElement.offsetWidth}px`,
        height: activeElement.style.height || `${activeElement.offsetHeight}px`,
        rotate: rot
      };
      saveState();
      updateTransformBox();
      positionInspector();
      pushHistory('Transform Shape');
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
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
      if (e.target.closest('.element-inspector') || e.target.closest('.editor-toolbar') || e.target.closest('.transform-bounding-box')) return;

      selectElement(element);

      // If user is editing text without holding Alt, let them select and edit text freely
      if (e.target.isContentEditable && !e.altKey) {
        return;
      }

      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      document.body.classList.add('is-dragging');

      isDragging = true;
      startMouseX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      startMouseY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      initialTranslateX = parseFloat(element.dataset.dragX) || 0;
      initialTranslateY = parseFloat(element.dataset.dragY) || 0;

      initialRect = element.getBoundingClientRect();

      // Pre-cache static bounding boxes of other elements at dragstart (prevents delta feedback jitter)
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

      const clientX = e.type === 'touchmove' ? evtClientX(e) : e.clientX;
      const clientY = e.type === 'touchmove' ? evtClientY(e) : e.clientY;

      function evtClientX(evt) { return evt.touches && evt.touches[0] ? evt.touches[0].clientX : evt.clientX; }
      function evtClientY(evt) { return evt.touches && evt.touches[0] ? evt.touches[0].clientY : evt.clientY; }

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

      const SNAP_THRESHOLD = 6;
      let snapOffsetX = 0;
      let snapOffsetY = 0;
      let snapLineX = null;
      let snapLineY = null;

      // Smart X-axis snapping
      for (let i = 0; i < cachedTargets.length; i++) {
        const t = cachedTargets[i];
        const deltas = [
          { dist: t.left - currentEdges.left, guide: t.left },
          { dist: t.right - currentEdges.right, guide: t.right },
          { dist: t.centerX - currentEdges.centerX, guide: t.centerX },
          { dist: t.right - currentEdges.left, guide: t.right },
          { dist: t.left - currentEdges.right, guide: t.left }
        ];

        for (let d of deltas) {
          if (Math.abs(d.dist) < SNAP_THRESHOLD) {
            snapOffsetX = d.dist;
            snapLineY = d.guide;
            break;
          }
        }
        if (snapLineY !== null) break;
      }

      // Smart Y-axis snapping
      for (let i = 0; i < cachedTargets.length; i++) {
        const t = cachedTargets[i];
        const deltas = [
          { dist: t.top - currentEdges.top, guide: t.top },
          { dist: t.bottom - currentEdges.bottom, guide: t.bottom },
          { dist: t.centerY - currentEdges.centerY, guide: t.centerY },
          { dist: t.bottom - currentEdges.top, guide: t.bottom },
          { dist: t.top - currentEdges.bottom, guide: t.top }
        ];

        for (let d of deltas) {
          if (Math.abs(d.dist) < SNAP_THRESHOLD) {
            snapOffsetY = d.dist;
            snapLineX = d.guide;
            break;
          }
        }
        if (snapLineX !== null) break;
      }

      const finalTranslateX = candidateX + snapOffsetX;
      const finalTranslateY = candidateY + snapOffsetY;
      const rot = parseFloat(element.dataset.rotate) || 0;

      element.style.transform = `translate3d(${finalTranslateX}px, ${finalTranslateY}px, 0) rotate(${rot}deg)`;
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

      updateTransformBox();
      positionInspector();
      if (e.type === 'touchmove') e.preventDefault();
    }

    function onMouseUp() {
      if (!isDragging) return;
      isDragging = false;
      hideSnapGuides();
      document.body.classList.remove('is-dragging');

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);

      const finalX = parseFloat(element.dataset.tempX) || initialTranslateX;
      const finalY = parseFloat(element.dataset.tempY) || initialTranslateY;

      element.dataset.dragX = finalX;
      element.dataset.dragY = finalY;

      const page = getPageData();
      const rot = parseFloat(element.dataset.rotate) || 0;
      page.positions[id] = {
        x: finalX,
        y: finalY,
        rotate: rot
      };
      if (element.classList.contains('custom-shape')) {
        page.positions[id].width = element.style.width || `${element.offsetWidth}px`;
        page.positions[id].height = element.style.height || `${element.offsetHeight}px`;
      }
      saveState();
      updateTransformBox();
      positionInspector();

      if (finalX !== initialTranslateX || finalY !== initialTranslateY) {
        pushHistory('Move Element');
      }
    }

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('touchstart', onMouseDown, { passive: true });
  }

  // --------------------------------------------------------------------------
  // Selection & Contextual Property Inspector Bar (With Layer Ordering)
  // --------------------------------------------------------------------------
  function selectElement(el) {
    if (activeElement === el) return;
    if (activeElement) activeElement.classList.remove('active-selected');

    activeElement = el;
    if (activeElement && isEditing) {
      activeElement.classList.add('active-selected');
      renderInspector(activeElement);
      updateTransformBox();
    } else {
      hideInspector();
      if (transformBox) transformBox.style.display = 'none';
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
    if (window.innerWidth <= 768) {
      inspectorEl.style.top = 'auto';
      inspectorEl.style.bottom = '68px';
      inspectorEl.style.left = '50%';
      inspectorEl.style.transform = 'translateX(-50%)';
      return;
    }
    const rect = activeElement.getBoundingClientRect();
    const topPos = Math.max(12, rect.top - 48);
    const leftPos = Math.min(Math.max(160, rect.left + rect.width / 2), window.innerWidth - 160);

    inspectorEl.style.top = `${topPos}px`;
    inspectorEl.style.left = `${leftPos}px`;
    inspectorEl.style.bottom = 'auto';
    inspectorEl.style.transform = 'translateX(-50%)';
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
      // SHAPES ONLY: Color Picker (Size & rotation handled via visual corner/edge handles)
      html += `
        <div class="inspector-group">
          <label style="font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.7);">Color</label>
          <input type="color" class="inspector-color-input" id="insp-shape-color" title="Shape Color" value="${rgbToHex(window.getComputedStyle(el).backgroundColor) || '#b7bd91'}">
        </div>
      `;
    } else if (isText) {
      // TEXT ONLY: Font Family, Size, Bold, Italic, Color, Layer, Delete
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

    // LAYER ORDERING CONTROLS (Z-Index)
    html += `
      <div class="inspector-group" title="Layer Stacking Order">
        <span style="font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.7);">Layer</span>
        <button class="inspector-btn" id="insp-layer-down" title="Send Backward (Behind other elements)">▼</button>
        <button class="inspector-btn" id="insp-layer-up" title="Bring Forward (In front of other elements)">▲</button>
      </div>

      <!-- Universal Delete -->
      <div class="inspector-group">
        <button class="inspector-btn danger" id="insp-delete" title="Delete this element">🗑️ Delete</button>
      </div>
    `;

    inspectorEl.innerHTML = html;
    document.body.appendChild(inspectorEl);
    positionInspector();

    // Hook Layer Ordering Events
    inspectorEl.querySelector('#insp-layer-up')?.addEventListener('click', () => {
      const currentZ = parseInt(window.getComputedStyle(el).zIndex, 10) || (el.classList.contains('geo-circle') ? 1 : 2);
      const newZ = Math.min(100, currentZ + 2);
      applyElementStyle(el, 'zIndex', newZ.toString(), true);
    });

    inspectorEl.querySelector('#insp-layer-down')?.addEventListener('click', () => {
      const currentZ = parseInt(window.getComputedStyle(el).zIndex, 10) || (el.classList.contains('geo-circle') ? 1 : 2);
      const newZ = Math.max(0, currentZ - 2);
      applyElementStyle(el, 'zIndex', newZ.toString(), true);
    });

    // Hook Inspector Events
    if (isShape) {
      const shapeColorInput = inspectorEl.querySelector('#insp-shape-color');
      shapeColorInput?.addEventListener('input', (e) => {
        applyElementStyle(el, 'backgroundColor', e.target.value, false);
        if (!el.classList.contains('shape-line')) {
          applyElementStyle(el, 'borderColor', e.target.value, false);
        }
      });
      shapeColorInput?.addEventListener('change', (e) => {
        applyElementStyle(el, 'backgroundColor', e.target.value, true);
        if (!el.classList.contains('shape-line')) {
          applyElementStyle(el, 'borderColor', e.target.value, true);
        }
      });
    }

    if (isText) {
      inspectorEl.querySelector('#insp-font-family')?.addEventListener('change', (e) => {
        applyElementStyle(el, 'fontFamily', e.target.value, true);
        updateTransformBox();
      });

      inspectorEl.querySelector('#insp-size-up')?.addEventListener('click', () => {
        const curr = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        applyElementStyle(el, 'fontSize', `${curr + 2}px`, true);
        updateTransformBox();
      });
      inspectorEl.querySelector('#insp-size-down')?.addEventListener('click', () => {
        const curr = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        applyElementStyle(el, 'fontSize', `${Math.max(10, curr - 2)}px`, true);
        updateTransformBox();
      });

      const boldBtn = inspectorEl.querySelector('#insp-bold');
      const italicBtn = inspectorEl.querySelector('#insp-italic');

      // CRITICAL: Prevent losing text selection in contentEditable when clicking bold/italic buttons
      [boldBtn, italicBtn].forEach(btn => {
        btn?.addEventListener('mousedown', (e) => {
          e.preventDefault();
        });
      });

      boldBtn?.addEventListener('click', (e) => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && el.contains(sel.anchorNode)) {
          // Format selected text exclusively!
          document.execCommand('bold', false, null);
          const page = getPageData();
          if (!page.texts) page.texts = {};
          const k = el.dataset.editKey || getElementKey(el);
          page.texts[k] = el.innerHTML.trim();
          saveState(false);
          pushHistory('Bold Selection');
          updateTransformBox();
        } else {
          // Fallback: Toggle entire element
          const isBold = el.style.fontWeight === 'bold' || window.getComputedStyle(el).fontWeight >= 600;
          applyElementStyle(el, 'fontWeight', isBold ? '400' : '700', true);
          e.currentTarget.classList.toggle('active', !isBold);
          updateTransformBox();
        }
      });

      italicBtn?.addEventListener('click', (e) => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && el.contains(sel.anchorNode)) {
          // Format selected text exclusively!
          document.execCommand('italic', false, null);
          const page = getPageData();
          if (!page.texts) page.texts = {};
          const k = el.dataset.editKey || getElementKey(el);
          page.texts[k] = el.innerHTML.trim();
          saveState(false);
          pushHistory('Italic Selection');
          updateTransformBox();
        } else {
          // Fallback: Toggle entire element
          const isItalic = el.style.fontStyle === 'italic';
          applyElementStyle(el, 'fontStyle', isItalic ? 'normal' : 'italic', true);
          e.currentTarget.classList.toggle('active', !isItalic);
          updateTransformBox();
        }
      });

      const textColorInput = inspectorEl.querySelector('#insp-color');
      textColorInput?.addEventListener('input', (e) => {
        applyElementStyle(el, 'color', e.target.value, false);
      });
      textColorInput?.addEventListener('change', (e) => {
        applyElementStyle(el, 'color', e.target.value, true);
      });
    }

    // Delete
    inspectorEl.querySelector('#insp-delete')?.addEventListener('click', () => {
      deleteElement(el);
    });
  }

  function applyElementStyle(el, prop, val, recordHistory = true) {
    el.style[prop] = val;
    const key = getElementKey(el);
    const page = getPageData();
    if (!page.styles) page.styles = {};
    if (!page.styles[key]) page.styles[key] = {};
    page.styles[key][prop] = val;
    saveState(false);
    if (recordHistory) {
      pushHistory(`Style ${prop}`);
    }
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

    el.dataset.editorDeleted = 'true';
    el.style.display = 'none';
    hideInspector();
    if (transformBox) transformBox.style.display = 'none';
    activeElement = null;
    saveState();
    pushHistory('Delete Element');
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
    pushHistory('Add Shape');
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
    p.dataset.editKey = newId;
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
    if (!page.texts) page.texts = {};
    page.texts[newId] = p.innerHTML.trim();

    const onAddedTextChange = () => {
      const item = page.added.find(x => x.id === newId);
      if (item) item.html = p.innerHTML;
      if (!page.texts) page.texts = {};
      page.texts[newId] = p.innerHTML.trim();
      saveState(false);
      clearTimeout(textDebounceTimer);
      textDebounceTimer = setTimeout(() => {
        pushHistory('Edit Added Text');
      }, 350);
    };

    p.addEventListener('input', onAddedTextChange);
    p.addEventListener('blur', () => {
      clearTimeout(textDebounceTimer);
      syncAllTexts();
      pushHistory('Edit Added Text');
    });
    p.addEventListener('keyup', onAddedTextChange);

    saveState(false);
    selectElement(p);
    p.focus();
    pushHistory('Add Text');
  }

  // --------------------------------------------------------------------------
  // Dynamic Live Landscape Architectural PDF Booklet Engine
  // --------------------------------------------------------------------------
  function buildDynamicLandscapeBooklet() {
    let booklet = document.querySelector('#print-portfolio-booklet');
    if (!booklet) {
      booklet = document.createElement('div');
      booklet.className = 'print-portfolio-booklet';
      booklet.id = 'print-portfolio-booklet';
      booklet.setAttribute('aria-hidden', 'true');
      document.body.appendChild(booklet);
    }

    // Pull live customized content from DOM / localStorage
    const heroTitle = document.querySelector('#hero-title')?.innerHTML.replace(/<br>/gi, ' ') || 'Julian Kotara';
    const heroKicker = document.querySelector('#hero-kicker')?.innerText || 'Architectural Engineering · Lighting Design';
    const heroRole = document.querySelector('#hero-role')?.innerText || 'Designing for the dialogue between light, form, and spatial atmosphere.';
    const heroCopy = document.querySelector('#hero-copy')?.innerText || 'From daylighting studies and photometric concepts to architectural massing and material texture, I explore how light shapes human experience in the built environment.';

    // Signature Architectural Circles on Cover (or live custom shapes if created by user)
    const indexShapes = (state.pages && state.pages['index.html'] && Array.isArray(state.pages['index.html'].shapes)) 
      ? state.pages['index.html'].shapes 
      : [];
    
    let coverGeometryHtml = '';
    if (indexShapes.length > 0) {
      coverGeometryHtml = indexShapes.map(s => {
        const bg = s.style?.backgroundColor || (s.filled ? 'var(--field-light)' : 'transparent');
        const border = s.style?.borderColor || 'var(--line-strong)';
        const radius = s.type === 'circle' ? '50%' : s.type === 'pill' ? '999px' : '0px';
        const w = s.width || '140px';
        const h = s.height || '140px';
        const l = s.left || '50vw';
        const t = s.top || '30vh';
        return `<div class="print-custom-shape" style="position:absolute; left:${l}; top:${t}; width:${w}; height:${h}; background:${bg}; border:1.5px solid ${border}; border-radius:${radius}; pointer-events:none;"></div>`;
      }).join('');
    } else {
      coverGeometryHtml = `
        <div class="print-circle print-circle-1"></div>
        <div class="print-circle print-circle-2"></div>
        <div class="print-circle print-circle-3"></div>
      `;
    }

    // Dynamic Live Landscape Sheets
    booklet.innerHTML = `
      <!-- Sheet 1: Cover Sheet -->
      <div class="print-sheet print-cover-sheet">
        <div class="print-cover-circles" aria-hidden="true">
          ${coverGeometryHtml}
        </div>
        <div class="print-cover-top">
          <p class="print-kicker">${heroKicker}</p>
          <h1>Design Portfolio</h1>
          <h2>${heroTitle}</h2>
        </div>
        <div class="print-cover-middle">
          <p>${heroRole}</p>
          <p style="font-size: 1.15vw; margin-top: 1vw; opacity: 0.88; font-weight: 400;">${heroCopy}</p>
        </div>
        <div class="print-cover-bottom">
          <div>
            <h3>Architectural Engineering</h3>
            <p>University of Colorado Boulder · 2026</p>
          </div>
        </div>
      </div>

      <!-- Sheet 2: Children's Museum -->
      <div class="print-sheet">
        <div class="print-project-header">
          <div>
            <h2>Children’s Museum</h2>
            <p style="font-size: 1.1vw; font-weight: 500; margin: 0.3vw 0 0; color: var(--ink); opacity: 0.85;">Cultural &amp; Community Architecture</p>
          </div>
          <p class="print-meta">Pearl Street Mall · Boulder, Colorado<br>Revit · Rhino · Enscape · Daylighting</p>
        </div>
        <div class="print-project-grid">
          <div class="print-media-col">
            <img src="assets/projects/childrens-museum.jpg" alt="Children's Museum Exterior Perspective" loading="eager" decoding="sync">
          </div>
          <div class="print-narrative-col">
            <div>
              <p class="print-narrative-lead">"A dynamic cultural anchor on Boulder’s historic Pearl Street Mall, designed with interlocking geometric volumes that invite curiosity and civic engagement."</p>
              <p class="print-narrative-text">The Children’s Museum on Pearl Street Pedestrian Mall provides a third space for families to enjoy together, as well as supporting office spaces. Interlocking forms and large window facades deviate from the surrounding architecture to create a community hub in central Boulder.</p>
            </div>
            <div class="print-highlights-box">
              <h4>Design &amp; Daylighting Highlights</h4>
              <ul>
                <li>Pedestrian-activated ground floor porosity and civic connectivity</li>
                <li>Generous north-facing clerestory daylighting for interactive exhibition halls</li>
                <li>Interlocking massing creating indoor-outdoor third spaces</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="print-sheet-footer">
          <span>Julian Kotara · Architectural &amp; Lighting Portfolio</span>
          <span>Page 02</span>
        </div>
      </div>

      <!-- Sheet 3: University Central Lobby -->
      <div class="print-sheet">
        <div class="print-project-header">
          <div>
            <h2>University Central Lobby</h2>
            <p style="font-size: 1.1vw; font-weight: 500; margin: 0.3vw 0 0; color: var(--ink); opacity: 0.85;">Architectural Lighting Design</p>
          </div>
          <p class="print-meta">Higher Education Campus<br>AGi32 · Revit · Photometric Analysis</p>
        </div>
        <div class="print-project-grid">
          <div class="print-media-col">
            <img src="assets/projects/central-lobby.jpg" alt="University Central Lobby Lighting Render" loading="eager" decoding="sync">
          </div>
          <div class="print-narrative-col">
            <div>
              <p class="print-narrative-lead">"An illuminated five-story vertical commons unifying multi-disciplinary students, designed to serve as both an interior beacon and an urban lantern."</p>
              <p class="print-narrative-text">Serving as the primary circulation spine across five academic floors, the lighting scheme focuses on dual perception: a vibrant, human-scale daytime gathering space, transitioning into a luminous evening beacon visible from the campus quad.</p>
            </div>
            <div class="print-highlights-box">
              <h4>Lighting Strategy</h4>
              <ul>
                <li>Layered vertical illuminance to emphasize five-story volume</li>
                <li>Integrated linear facade grazers for nighttime campus presence</li>
                <li>Circadian-aware color temperature tuning (3000K–4000K)</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="print-sheet-footer">
          <span>Julian Kotara · Architectural &amp; Lighting Portfolio</span>
          <span>Page 03</span>
        </div>
      </div>

      <!-- Sheet 4: Exterior Bench Lighting Study -->
      <div class="print-sheet">
        <div class="print-project-header">
          <div>
            <h2>Exterior Bench Lighting Study</h2>
            <p style="font-size: 1.1vw; font-weight: 500; margin: 0.3vw 0 0; color: var(--ink); opacity: 0.85;">Research &amp; Optical Mockups</p>
          </div>
          <p class="print-meta">Pedestrian Luminaire Design<br>Optics · CNC Fabrication · Testing</p>
        </div>
        <div class="print-project-grid">
          <div class="print-media-col">
            <img src="assets/projects/bench-study.jpg" alt="Exterior Bench Mockup &amp; Grazing Light" loading="eager" decoding="sync">
          </div>
          <div class="print-narrative-col">
            <div>
              <p class="print-narrative-lead">"Investigating low-glare grazing optics and material reflectance to redefine human-scale nighttime seating in civic landscapes."</p>
              <p class="print-narrative-text">Through physical 1:1 scale mockups and custom photometric testing, this study analyzed how grazing light interactively accentuates wooden slats and concrete plinths without creating direct visual glare for seated pedestrians.</p>
            </div>
            <div class="print-highlights-box">
              <h4>Research Highlights</h4>
              <ul>
                <li>Concealed linear asymmetric optical distribution</li>
                <li>Elimination of direct line-of-sight glare at seated eye level</li>
                <li>Durable thermal and weatherproofing detail integration</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="print-sheet-footer">
          <span>Julian Kotara · Architectural &amp; Lighting Portfolio</span>
          <span>Page 04</span>
        </div>
      </div>

      <!-- Sheet 5: Luxury Mountain Home -->
      <div class="print-sheet">
        <div class="print-project-header">
          <div>
            <h2>Luxury Mountain Home</h2>
            <p style="font-size: 1.1vw; font-weight: 500; margin: 0.3vw 0 0; color: var(--ink); opacity: 0.85;">Custom Residential Architecture</p>
          </div>
          <p class="print-meta">Western North Carolina<br>Rhino · V-Ray · Solar Massing Analysis</p>
        </div>
        <div class="print-project-grid">
          <div class="print-media-col">
            <img src="assets/projects/mountain-home.jpg" alt="Mountain Home Exterior Perspective" loading="eager" decoding="sync">
          </div>
          <div class="print-narrative-col">
            <div>
              <p class="print-narrative-lead">"Sculpted to echo the rolling contours of the Blue Ridge Mountains, integrating stepped outdoor terraces and calculated daylight apertures."</p>
              <p class="print-narrative-text">Nestled into a sloping ridgeline, custom angular glazing mirrors the mountain silhouette, pulling natural southern daylight deep into the main living volumes while framing expansive panoramic views.</p>
            </div>
            <div class="print-highlights-box">
              <h4>Design Highlights</h4>
              <ul>
                <li>Daylight-optimized solar orientation and deep overhangs</li>
                <li>Stepped massing following natural mountain topography</li>
                <li>Curated sightlines connecting interior to ridge vista</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="print-sheet-footer">
          <span>Julian Kotara · Architectural &amp; Lighting Portfolio</span>
          <span>Page 05</span>
        </div>
      </div>

      <!-- Sheet 6: Photography · Light & Atmosphere Studies (5 Images + Narrative Space) -->
      <div class="print-sheet">
        <div class="print-project-header">
          <div>
            <h2>Photography · Light &amp; Atmosphere</h2>
            <p style="font-size: 1.1vw; font-weight: 500; margin: 0.3vw 0 0; color: var(--ink); opacity: 0.85;">Optical Studies, Grazing Angles &amp; Night Luminous Ambient Gradients</p>
          </div>
          <p class="print-meta">Visual Studies · Series 01<br>Natural &amp; Artificial Illumination</p>
        </div>
        <div class="print-photo-sheet-layout">
          <div class="print-photo-text-col">
            <div>
              <p class="print-narrative-lead">"Exploring the gradients between direct luminaire output, surface reflectivity, and nighttime ambient presence."</p>
              <p class="print-narrative-text">A visual laboratory investigating how light sculpts volume, reveals material micro-texture, and transforms spatial perception. From high-contrast grazing angles to quiet horizon transitions, these photographic studies directly inform fixture placement and photometric distributions in my architectural work.</p>
            </div>
            <div class="print-highlights-box">
              <h4>Series Focus Areas</h4>
              <ul>
                <li>Optical grazing and specular surface reflectance</li>
                <li>Low-light color temperature transitions</li>
                <li>Interior natural daylighting and shadow boundaries</li>
              </ul>
            </div>
          </div>
          <div class="print-photo-5mosaic">
            <img class="mosaic-lead" src="assets/photography/light/IMG_6082.JPG" alt="Atmospheric Night Light &amp; Horizon Study" loading="eager" decoding="sync">
            <img src="assets/photography/light/IMG_1770.JPG" alt="Vertical Luminaire Grazing Study" loading="eager" decoding="sync">
            <img src="assets/photography/light/IMG_0251.JPG" alt="Interior Daylight Atmosphere" loading="eager" decoding="sync">
            <img src="assets/photography/light/IMG_2694%202.JPG" alt="Reflected Glazing Surface" loading="eager" decoding="sync">
            <img src="assets/photography/light/IMG_2556.JPG" alt="Ambient Warmth Tone" loading="eager" decoding="sync">
          </div>
        </div>
        <div class="print-sheet-footer">
          <span>Julian Kotara · Light Studies</span>
          <span>Page 06</span>
        </div>
      </div>

      <!-- Sheet 7: Photography · Architecture & Spatial Form (5 Images + Narrative Space) -->
      <div class="print-sheet">
        <div class="print-project-header">
          <div>
            <h2>Photography · Architecture &amp; Form</h2>
            <p style="font-size: 1.1vw; font-weight: 500; margin: 0.3vw 0 0; color: var(--ink); opacity: 0.85;">Structural Rhythm, Monolithic Massing &amp; 35mm Analog Observations</p>
          </div>
          <p class="print-meta">Visual Studies · Series 02<br>Built Form &amp; Analog Mediums</p>
        </div>
        <div class="print-photo-sheet-layout">
          <div class="print-photo-text-col">
            <div>
              <p class="print-narrative-lead">"Examining structural rhythm, monolithic massing, spatial voids, and 35mm analog film observations of the built environment."</p>
              <p class="print-narrative-text">Documenting urban massing and repetitive architectural envelopes through analog and digital mediums. These compositions study the tectonic relationship between primary structural framing, glass mullion rhythms, and sky voids across diverse built typologies.</p>
            </div>
            <div class="print-highlights-box">
              <h4>Series Focus Areas</h4>
              <ul>
                <li>Monolithic vertical massing and elevation framing</li>
                <li>35mm analog emulsion studies and natural tone depth</li>
                <li>Facade rhythmic structural repetition</li>
              </ul>
            </div>
          </div>
          <div class="print-photo-5mosaic">
            <img class="mosaic-lead" src="assets/photography/arch/IMG_6268%202.jpeg" alt="Vertical Architectural Massing Monolith" loading="eager" decoding="sync">
            <img src="assets/photography/arch/IMG_6335.jpeg" alt="Structural Facade Alignment" loading="eager" decoding="sync">
            <img src="assets/photography/arch/kotara004502-R1-026-11A.jpg" alt="35mm Film Study 11A" loading="eager" decoding="sync">
            <img src="assets/photography/arch/kotara004502-R1-052-24A.jpg" alt="35mm Film Study 24A" loading="eager" decoding="sync">
            <img src="assets/photography/arch/073330D1-6DA4-4260-8F37-C975744056BB_1_105_c.jpeg" alt="Spatial Perspective Monochromes" loading="eager" decoding="sync">
          </div>
        </div>
        <div class="print-sheet-footer">
          <span>Julian Kotara · Architecture Studies</span>
          <span>Page 07</span>
        </div>
      </div>


    `;
  }

  // --------------------------------------------------------------------------
  // Layout Code Exporter (Export HTML & CSS for Permanent GitHub Sync)
  // --------------------------------------------------------------------------
  function formatCssColor(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
      return 'transparent';
    }
    if (color.startsWith('#') || color.startsWith('hsl') || color.startsWith('var(')) {
      return color;
    }
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
        if (a < 1) {
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
    }
    return color;
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch (e) {}
      document.body.removeChild(ta);
      return Promise.resolve();
    }
  }

  function openCodeExportModal() {
    syncAllTexts();
    const page = getPageData();
    const pageKey = getPageKey();

    // 1. Background & Global Theme Palette
    const bodyCS = window.getComputedStyle(document.body);
    const bodyBgColor = formatCssColor(document.body.style.backgroundColor || bodyCS.backgroundColor);
    const bodyTextColor = formatCssColor(document.body.style.color || bodyCS.color);
    const currentHue = state.globalTheme?.hue ?? 75;
    const currentSat = state.globalTheme?.sat ?? '26%';

    let cssSnippet = `/* ==========================================================================\n   JK Portfolio — Live Layout & Color Export\n   Page: ${pageKey} | Saved: ${new Date().toLocaleDateString()}\n   ========================================================================== */\n\n`;

    cssSnippet += `/* --------------------------------------------------------------------------\n   1. Background & Theme Palette\n   -------------------------------------------------------------------------- */\n`;
    cssSnippet += `:root {\n`;
    cssSnippet += `  --theme-hue: ${currentHue};\n`;
    cssSnippet += `  --theme-sat: ${currentSat};\n`;
    cssSnippet += `}\n\n`;
    cssSnippet += `body {\n`;
    cssSnippet += `  background-color: ${bodyBgColor}; /* Active canvas background */\n`;
    cssSnippet += `  color: ${bodyTextColor}; /* Primary body text color */\n`;
    cssSnippet += `}\n\n`;

    // 2. Background Shapes & Geometry (Colors, Dimensions, Positions)
    cssSnippet += `/* --------------------------------------------------------------------------\n   2. Background Shapes & Geometry (Colors & Coordinates)\n   -------------------------------------------------------------------------- */\n`;
    const shapes = document.querySelectorAll('.geo-circle, .custom-shape');
    const shapesSnapshot = [];

    if (shapes.length === 0) {
      cssSnippet += `/* No background shapes active on this page (clean layout) */\n\n`;
    } else {
      shapes.forEach((el) => {
        const id = el.id || el.dataset.customId;
        const cs = window.getComputedStyle(el);
        const w = el.style.width || cs.width;
        const h = el.style.height || cs.height;
        const bg = formatCssColor(el.style.backgroundColor || cs.backgroundColor);
        const borderColor = formatCssColor(el.style.borderColor || cs.borderColor);
        const borderWidth = el.style.borderWidth || cs.borderWidth;
        const borderRadius = el.style.borderRadius || cs.borderRadius;
        const opacity = el.style.opacity || cs.opacity;
        const rot = el.dataset.rotate || 0;
        const x = el.dataset.dragX || 0;
        const y = el.dataset.dragY || 0;
        const zIndex = el.style.zIndex || cs.zIndex;

        let selector = '';
        if (id && id.startsWith('geo-circle')) {
          selector = `.${id}`;
        } else if (id) {
          selector = `#${id}.custom-shape`;
        } else if (el.className) {
          selector = `.${el.className.split(' ').filter(c => c.startsWith('geo-circle') || c.startsWith('custom-shape'))[0] || 'shape'}`;
        } else {
          return;
        }

        cssSnippet += `${selector} {\n`;
        cssSnippet += `  width: ${w};\n`;
        cssSnippet += `  height: ${h};\n`;
        if (bg && bg !== 'transparent') {
          cssSnippet += `  background-color: ${bg};\n`;
        }
        if (borderColor && borderColor !== 'transparent' && borderWidth && borderWidth !== '0px') {
          cssSnippet += `  border: ${borderWidth} solid ${borderColor};\n`;
        }
        if (borderRadius && borderRadius !== '0px') {
          cssSnippet += `  border-radius: ${borderRadius};\n`;
        }
        if (opacity && parseFloat(opacity) < 1) {
          cssSnippet += `  opacity: ${opacity};\n`;
        }
        if (x != 0 || y != 0 || rot != 0) {
          cssSnippet += `  transform: translate3d(${x}px, ${y}px, 0) rotate(${rot}deg);\n`;
        }
        if (zIndex && zIndex !== 'auto') {
          cssSnippet += `  z-index: ${zIndex};\n`;
        }
        cssSnippet += `}\n\n`;

        shapesSnapshot.push({
          id: id || selector,
          backgroundColor: bg,
          borderColor: borderColor,
          borderWidth: borderWidth,
          width: w,
          height: h,
          x,
          y,
          rotation: rot,
          zIndex
        });
      });
    }

    // 3. Typography & Text Colors
    cssSnippet += `/* --------------------------------------------------------------------------\n   3. Typography & Text Colors\n   -------------------------------------------------------------------------- */\n`;

    const processedElements = new Set();
    const textRules = [];
    const textSnapshot = [];

    function getCleanSelector(el) {
      if (el.id) return `#${el.id}`;
      if (el.dataset.customId) return `[data-custom-id="${el.dataset.customId}"]`;
      if (el.dataset.editKey) return `[data-edit-key="${el.dataset.editKey}"]`;
      if (el.className) {
        const validClass = el.className.trim().split(/\s+/).find(c => !['editable', 'draggable-item', 'active-selected', 'is-dragging'].includes(c));
        if (validClass) return `.${validClass}`;
      }
      return el.tagName.toLowerCase();
    }

    // A) Elements explicitly modified in page.styles
    if (page.styles && typeof page.styles === 'object') {
      Object.keys(page.styles).forEach((key) => {
        const st = page.styles[key];
        if (!st || typeof st !== 'object') return;
        const el = findTargetElement(key);
        if (!el || el.classList.contains('geo-circle') || el.classList.contains('custom-shape')) return;

        processedElements.add(el);
        const sel = getCleanSelector(el);
        const cs = window.getComputedStyle(el);
        const color = formatCssColor(st.color || el.style.color || cs.color);
        const rot = el.dataset.rotate || 0;
        const x = el.dataset.dragX || 0;
        const y = el.dataset.dragY || 0;

        let rule = `${sel} {\n`;
        if (color) rule += `  color: ${color};\n`;
        if (st.fontFamily) rule += `  font-family: ${st.fontFamily};\n`;
        if (st.fontSize) rule += `  font-size: ${st.fontSize};\n`;
        if (st.fontWeight) rule += `  font-weight: ${st.fontWeight};\n`;
        if (st.fontStyle) rule += `  font-style: ${st.fontStyle};\n`;
        if (x != 0 || y != 0 || rot != 0) {
          rule += `  transform: translate3d(${x}px, ${y}px, 0) rotate(${rot}deg);\n`;
        }
        if (st.zIndex || (el.style.zIndex && el.style.zIndex !== 'auto')) {
          rule += `  z-index: ${st.zIndex || el.style.zIndex};\n`;
        }
        rule += `}\n`;
        textRules.push(rule);

        textSnapshot.push({
          selector: sel,
          color,
          fontFamily: st.fontFamily || el.style.fontFamily || cs.fontFamily,
          fontSize: st.fontSize || el.style.fontSize || cs.fontSize,
          fontWeight: st.fontWeight || el.style.fontWeight || cs.fontWeight,
          x,
          y,
          text: (el.textContent || '').trim().slice(0, 45)
        });
      });
    }

    // B) Custom added text elements (.custom-added-text)
    document.querySelectorAll('.custom-added-text').forEach((el) => {
      if (processedElements.has(el)) return;
      processedElements.add(el);
      const sel = getCleanSelector(el);
      const cs = window.getComputedStyle(el);
      const color = formatCssColor(el.style.color || cs.color);
      const rot = el.dataset.rotate || 0;
      const x = el.dataset.dragX || 0;
      const y = el.dataset.dragY || 0;

      let rule = `${sel} {\n`;
      if (color) rule += `  color: ${color};\n`;
      if (el.style.fontFamily) rule += `  font-family: ${el.style.fontFamily};\n`;
      if (el.style.fontSize) rule += `  font-size: ${el.style.fontSize};\n`;
      if (el.style.fontWeight) rule += `  font-weight: ${el.style.fontWeight};\n`;
      if (el.style.fontStyle) rule += `  font-style: ${el.style.fontStyle};\n`;
      if (x != 0 || y != 0 || rot != 0) {
        rule += `  transform: translate3d(${x}px, ${y}px, 0) rotate(${rot}deg);\n`;
      }
      rule += `}\n`;
      textRules.push(rule);

      textSnapshot.push({
        selector: sel,
        color,
        fontFamily: el.style.fontFamily || cs.fontFamily,
        fontSize: el.style.fontSize || cs.fontSize,
        fontWeight: el.style.fontWeight || cs.fontWeight,
        x,
        y,
        text: (el.textContent || '').trim().slice(0, 45)
      });
    });

    // C) Major typographic anchors on page
    const majorTextSelectors = [
      '#hero-title',
      '#hero-kicker',
      '#hero-role',
      '#hero-copy',
      '.intro h1',
      '.hero-title',
      '.hero-kicker',
      '.intro-body .role',
      '.intro-body .intro-copy',
      '.about-statement'
    ];

    majorTextSelectors.forEach((selQuery) => {
      document.querySelectorAll(selQuery).forEach((el) => {
        if (processedElements.has(el)) return;
        processedElements.add(el);
        const sel = getCleanSelector(el);
        const cs = window.getComputedStyle(el);
        const color = formatCssColor(el.style.color || cs.color);
        const rot = el.dataset.rotate || 0;
        const x = el.dataset.dragX || 0;
        const y = el.dataset.dragY || 0;

        let rule = `${sel} {\n`;
        rule += `  color: ${color};\n`;
        if (x != 0 || y != 0 || rot != 0) {
          rule += `  transform: translate3d(${x}px, ${y}px, 0) rotate(${rot}deg);\n`;
        }
        rule += `}\n`;
        textRules.push(rule);

        textSnapshot.push({
          selector: sel,
          color,
          x,
          y,
          text: (el.textContent || '').trim().slice(0, 45)
        });
      });
    });

    if (textRules.length > 0) {
      cssSnippet += textRules.join('\n') + '\n';
    } else {
      cssSnippet += `/* Standard typography colors active: var(--ink) */\n\n`;
    }

    // 4. Updated Page Text Content (HTML Markup)
    cssSnippet += `/* --------------------------------------------------------------------------\n   4. Updated Page Text Content (HTML Markup)\n   -------------------------------------------------------------------------- */\n`;
    const textEntries = Object.entries(page.texts || {}).filter(([k, v]) => typeof v === 'string' && v.trim().length > 0);
    if (textEntries.length === 0) {
      cssSnippet += `/* No custom text modifications made on this page */\n\n`;
    } else {
      textEntries.forEach(([key, html]) => {
        const el = findTargetElement(key);
        const sel = el ? getCleanSelector(el) : key;
        const tag = el ? el.tagName.toLowerCase() : 'element';
        const parentTag = el && el.parentElement ? el.parentElement.tagName.toLowerCase() : '';
        cssSnippet += `/* Target: ${sel} (${tag}${parentTag ? ' in <' + parentTag + '>' : ''}) */\n`;
        cssSnippet += `${html}\n\n`;
      });
    }

    // 5. Added Markup (if any)
    const addedItems = [];
    if (page.added && page.added.length > 0) {
      page.added.forEach(item => {
        addedItems.push(`<!-- Added Text in ${item.parentSelector || 'body'} -->\n<p id="${item.id}" class="custom-added-text">${item.html}</p>`);
      });
    }
    if (page.shapes && page.shapes.length > 0) {
      page.shapes.forEach(shape => {
        addedItems.push(`<!-- Added Custom Shape -->\n<div id="${shape.id}" class="custom-shape shape-${shape.type}"></div>`);
      });
    }
    if (addedItems.length > 0) {
      cssSnippet += `/* --------------------------------------------------------------------------\n   5. Added HTML Markup Elements\n   --------------------------------------------------------------------------\n${addedItems.join('\n\n')}\n*/\n\n`;
    }

    // 6. Full JSON State for Antigravity AI
    const exportData = {
      page: pageKey,
      theme: {
        hue: currentHue,
        sat: currentSat,
        backgroundColor: bodyBgColor,
        textColor: bodyTextColor
      },
      background: {
        color: bodyBgColor,
        computed: bodyCS.backgroundColor
      },
      shapes: shapesSnapshot,
      text: textSnapshot,
      texts: page.texts || {},
      positions: page.positions || {},
      shapesState: page.shapes || [],
      styles: page.styles || {},
      added: page.added || [],
      timestamp: new Date().toISOString()
    };

    const jsonSnippet = JSON.stringify(exportData, null, 2);

    const fullExportText = `/* ==========================================\n   JK Portfolio — Live Layout & Color Export\n   Paste this into chat with Antigravity to\n   permanently commit your changes to GitHub!\n   ========================================== */\n\n${cssSnippet}/* Layout JSON Data:\n${jsonSnippet}\n*/`;

    // Automatically copy to clipboard immediately
    copyTextToClipboard(fullExportText);

    // Render modal
    let modalEl = document.querySelector('.code-export-backdrop');
    if (modalEl) modalEl.remove();

    modalEl = document.createElement('div');
    modalEl.className = 'code-export-backdrop';
    modalEl.innerHTML = `
      <div class="code-export-modal" role="dialog" aria-modal="true">
        <div class="code-export-header">
          <h3>💾 Save &amp; Export Layout &amp; Colors</h3>
          <button class="code-export-close" id="code-export-close" type="button" aria-label="Close">✕</button>
        </div>
        <div class="code-export-body">
          <p>
            <strong style="color: #79d78e;">✓ Copied to clipboard!</strong>
            Includes all current <strong>text edits</strong>, <strong>typography styles</strong>, <strong>background</strong>, and <strong>shapes</strong>, along with layout coordinates. To make your edits permanent across all devices, <strong>paste this into chat with Antigravity</strong> and I will bake it directly into GitHub.
          </p>
          <pre class="code-export-box" id="code-export-box">${fullExportText}</pre>
        </div>
        <div class="code-export-footer">
          <button class="code-export-btn" id="code-export-copy-btn" type="button">📋 Copy Again</button>
          <button class="code-export-btn primary" id="code-export-done" type="button">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeBtn = modalEl.querySelector('#code-export-close');
    const doneBtn = modalEl.querySelector('#code-export-done');
    const copyBtn = modalEl.querySelector('#code-export-copy-btn');

    function closeModal() {
      modalEl.remove();
      document.removeEventListener('keydown', onEsc);
    }

    closeBtn.addEventListener('click', closeModal);
    doneBtn.addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    copyBtn.addEventListener('click', () => {
      copyTextToClipboard(fullExportText).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy Again'; }, 2000);
      });
    });

    // Close on Escape key
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', onEsc);
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

        <div class="editor-divider"></div>

        <!-- Undo & Redo Buttons -->
        <button class="editor-btn" id="editor-undo" type="button" title="Undo (Cmd+Z)" disabled>↺ Undo</button>
        <button class="editor-btn" id="editor-redo" type="button" title="Redo (Cmd+Y / Cmd+Shift+Z)" disabled>↻ Redo</button>

        <div class="editor-divider"></div>

        <!-- Dynamic Landscape PDF Booklet Export Button -->
        <button class="editor-btn" id="editor-export-pdf" type="button" title="Generate & Print Landscape Portfolio PDF">📄 PDF</button>

        <!-- Save & Export Code Button -->
        <button class="editor-btn" id="editor-export-code" type="button" title="Export HTML & CSS Layout to permanently save to GitHub">💾 Save Code</button>

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
        syncAllTexts();
        selectElement(null);
        hideSnapGuides();
        if (transformBox) transformBox.style.display = 'none';
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      }
    }

    // Intercept and prevent accidental link navigation while in Edit Mode
    document.addEventListener('click', (e) => {
      if (!isEditing) return;
      const link = e.target.closest('a');
      if (link && !link.closest('.editor-toolbar') && !link.closest('.code-export-backdrop')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

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
        pushHistory('Theme Swatch');
      });
    });

    // Hue Slider
    const hueSlider = toolbar.querySelector('#hue-range');
    hueSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      toolbar.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
      applyTheme(val, '26%');
      saveState(false);
    });
    hueSlider.addEventListener('change', () => {
      pushHistory('Theme Hue');
    });

    // Add Text
    toolbar.querySelector('#editor-add-text').addEventListener('click', addNewParagraph);

    // Undo & Redo Click Handlers
    toolbar.querySelector('#editor-undo').addEventListener('click', undo);
    toolbar.querySelector('#editor-redo').addEventListener('click', redo);

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
        const type = btn.dataset.shape;
        addNewShape(type);
        shapeMenu.style.display = 'none';
      });
    });

    document.addEventListener('click', () => {
      if (shapeMenu) shapeMenu.style.display = 'none';
    });

    // Reset All
    toolbar.querySelector('#editor-reset').addEventListener('click', () => {
      if (confirm('Reset all custom text, added shapes, positions, sizes, rotations, and color edits back to defaults?')) {
        [
          'jk_portfolio_customizer_v8',
          'jk_portfolio_customizer_v7',
          'jk_portfolio_customizer_v6',
          'jk_portfolio_customizer_v5',
          'jk_portfolio_customizer_v4',
          'jk_portfolio_customizer_v3',
          'jk_portfolio_customizer_v2',
          'jk_portfolio_customizer_state'
        ].forEach(k => localStorage.removeItem(k));
        location.reload();
      }
    });

    // Generate & Print Landscape PDF
    toolbar.querySelector('#editor-export-pdf').addEventListener('click', async () => {
      showToast('Rendering PDF...');
      buildDynamicLandscapeBooklet();
      const booklet = document.querySelector('#print-portfolio-booklet');
      if (!booklet) return;

      const imgs = Array.from(booklet.querySelectorAll('img'));
      await Promise.all(imgs.map((img) => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            if (img.decode) {
              img.decode().then(resolve).catch(resolve);
            } else {
              resolve();
            }
          } else {
            img.onload = () => {
              if (img.decode) {
                img.decode().then(resolve).catch(resolve);
              } else {
                resolve();
              }
            };
            img.onerror = resolve;
          }
        });
      }));

      requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
        }, 150);
      });
    });

    window.addEventListener('beforeprint', () => {
      buildDynamicLandscapeBooklet();
    });

    // Save & Export Code Modal
    toolbar.querySelector('#editor-export-code').addEventListener('click', openCodeExportModal);

    // Global Keyboard: Undo (Cmd+Z), Redo (Cmd+Y / Cmd+Shift+Z), Word Bold (Cmd+B), Word Italic (Cmd+I), Delete & 'e' toggle
    document.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Undo: Cmd+Z (without Shift)
      if (isCmdOrCtrl && key === 'z' && !e.shiftKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          undo();
          return;
        }
      }

      // Redo: Cmd+Y OR Cmd+Shift+Z
      if ((isCmdOrCtrl && key === 'y') || (isCmdOrCtrl && key === 'z' && e.shiftKey)) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          redo();
          return;
        }
      }

      // Inline Word Bold (Cmd+B)
      if (isCmdOrCtrl && key === 'b' && e.target.isContentEditable) {
        setTimeout(() => {
          syncAllTexts();
          pushHistory('Bold Selection');
          updateTransformBox();
        }, 0);
        return;
      }

      // Inline Word Italic (Cmd+I)
      if (isCmdOrCtrl && key === 'i' && e.target.isContentEditable) {
        setTimeout(() => {
          syncAllTexts();
          pushHistory('Italic Selection');
          updateTransformBox();
        }, 0);
        return;
      }

      if (key === 'e' && !e.target.isContentEditable && e.target.tagName !== 'INPUT' && !isCmdOrCtrl) {
        setEditMode(!isEditing);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && activeElement && !e.target.isContentEditable && e.target.tagName !== 'INPUT') {
        deleteElement(activeElement);
      }
    });

    // Deselect on backdrop click
    document.addEventListener('mousedown', (e) => {
      if (!isEditing) return;
      if (e.target.closest('.editor-toolbar') || e.target.closest('.element-inspector') || e.target.closest('.draggable-item') || e.target.closest('.transform-bounding-box')) return;
      selectElement(null);
    });

    // Keep transform box synced with window scroll and resize
    window.addEventListener('scroll', () => {
      if (activeElement && isEditing) {
        updateTransformBox();
        positionInspector();
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (activeElement && isEditing) {
        updateTransformBox();
        positionInspector();
      }
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // Setup Editable Text & Images
  // --------------------------------------------------------------------------
  function setupEditableElements() {
    const editableTargets = document.querySelectorAll(
      'h1, h2, h3, h4, p, li, .kicker, .role, .intro-copy, .story-lead, .fact-value, figcaption, .work-list-item strong, .about-statement, .about-narrative p, .contact-link, .skills-grid h4, .skills-grid li, .skill-col h4, .skill-col li'
    );

    editableTargets.forEach((el, index) => {
      if (el.closest('.editor-toolbar') || el.closest('.glass-nav') || el.closest('.print-portfolio-booklet') || el.closest('.transform-bounding-box') || el.closest('.code-export-backdrop')) return;

      el.classList.add('editable');
      const key = generateSemanticEditKey(el, index);
      el.dataset.editKey = key;

      if (!el.dataset.initialHtml) {
        el.dataset.initialHtml = el.innerHTML.trim();
      }

      const onContentChange = () => {
        const page = getPageData();
        if (!page.texts) page.texts = {};
        page.texts[key] = el.innerHTML.trim();
        saveState(false);
        clearTimeout(textDebounceTimer);
        textDebounceTimer = setTimeout(() => {
          pushHistory('Edit Text');
        }, 350);
      };

      el.addEventListener('input', onContentChange);
      el.addEventListener('blur', () => {
        clearTimeout(textDebounceTimer);
        syncAllTexts();
        pushHistory('Edit Text');
      });
      el.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.key === 'Backspace') {
          clearTimeout(textDebounceTimer);
          textDebounceTimer = setTimeout(() => {
            pushHistory('Edit Text');
          }, 200);
        }
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
            pushHistory('Replace Image');
          };
          reader.readAsDataURL(file);
        };
        input.click();
      });
    });
  }

  function syncAllTexts() {
    const page = getPageData();
    if (!page.texts) page.texts = {};
    const editableTargets = document.querySelectorAll('.editable');
    editableTargets.forEach((el) => {
      if (el.closest('.editor-toolbar') || el.closest('.glass-nav') || el.closest('.print-portfolio-booklet') || el.closest('.transform-bounding-box') || el.closest('.code-export-backdrop')) return;
      const key = el.dataset.editKey || getElementKey(el);
      if (key) {
        const currentHtml = el.innerHTML.trim();
        if (page.texts[key] !== undefined || (el.dataset.initialHtml && currentHtml !== el.dataset.initialHtml)) {
          page.texts[key] = currentHtml;
        }
      }
    });
    saveState(false);
  }

  // --------------------------------------------------------------------------
  // Main Initialization
  // --------------------------------------------------------------------------
  function init() {
    loadState();
    createSnapGuides();
    createTransformBox();

    // Universal Draggable Selectors (Setup IDs FIRST so restoreDOM finds them reliably!)
    const draggableSelectors = [
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
      '#skills-grid',
      '.skills-grid',
      '.skill-col',
      '.skill-col h4',
      '.skill-col li',
      '.work-group-title',
      '.work-list-item',
      '.story-lead',
      '.story-sidebar',
      '.figure-item',
      '.custom-shape',
      '.geo-circle'
    ];

    draggableSelectors.forEach((sel) => {
      const els = document.querySelectorAll(sel);
      els.forEach((el, i) => {
        const id = el.id || el.dataset.customId || `${sel.replace(/[^a-zA-Z0-9]/g, '_')}-${i}`;
        initDragAndSelect(el, id);
      });
    });

    setupEditableElements();
    restoreDOM();
    createEditorToolbar();
    pushHistory('Initial Baseline');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
