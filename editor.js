/**
 * Julian Kotara — Portfolio Interactive Visual Customizer & Editor
 * Features: Text editing, element dragging/moving, smart hue shifting,
 * image replacement, and localStorage persistence.
 */

(function () {
  const STORAGE_KEY = 'jk_portfolio_customizer_state';

  // Default Preset Color Palettes (Preserving exact lightness)
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
    addedElements: [],
  };

  // Load state from localStorage
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

  // Save state to localStorage
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showToast();
    } catch (e) {
      console.warn('Could not save customizer state:', e);
    }
  }

  // Toast Notification
  function showToast() {
    const toast = document.querySelector('#saved-toast');
    if (toast) {
      toast.classList.add('show');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => toast.classList.remove('show'), 1500);
    }
  }

  // Apply Theme Colors to CSS Variables
  function applyTheme(hue, sat = '26%') {
    state.themeHue = hue;
    state.themeSat = sat;
    document.documentElement.style.setProperty('--theme-hue', hue);
    document.documentElement.style.setProperty('--theme-sat', sat);
  }

  // Restore everything to DOM
  function restoreDOM() {
    // 1. Restore Color Theme
    if (state.themeHue !== undefined) {
      applyTheme(state.themeHue, state.themeSat || '26%');
    }

    // 2. Restore Text Changes
    Object.keys(state.texts || {}).forEach((selector) => {
      const el = document.querySelector(selector);
      if (el) {
        el.innerHTML = state.texts[selector];
      }
    });

    // 3. Restore Image Sources
    Object.keys(state.images || {}).forEach((selector) => {
      const img = document.querySelector(selector);
      if (img) {
        img.src = state.images[selector];
      }
    });

    // 4. Restore Element Positions (Drag & Move)
    Object.keys(state.positions || {}).forEach((id) => {
      const el = document.getElementById(id) || document.querySelector(`[data-custom-id="${id}"]`) || document.querySelector(id);
      if (el && state.positions[id]) {
        const { x, y } = state.positions[id];
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.dataset.dragX = x;
        el.dataset.dragY = y;
      }
    });

    // 5. Restore Added Paragraphs
    (state.addedElements || []).forEach((item) => {
      const parent = document.querySelector(item.parentSelector);
      if (parent && !document.getElementById(item.id)) {
        const newEl = document.createElement('p');
        newEl.id = item.id;
        newEl.className = 'editable draggable-item custom-added-text';
        newEl.innerHTML = item.html;
        parent.appendChild(newEl);
      }
    });
  }

  // Initialize Draggable Elements
  function initDrag(element, customId) {
    if (!element) return;
    element.classList.add('draggable-item');
    if (!element.dataset.customId) {
      element.dataset.customId = customId || element.id || `drag-${Math.random().toString(36).substr(2, 6)}`;
    }

    let startX = 0, startY = 0, currentX = 0, currentY = 0;
    let initialX = parseFloat(element.dataset.dragX) || 0;
    let initialY = parseFloat(element.dataset.dragY) || 0;

    function onMouseDown(e) {
      if (!document.body.classList.contains('is-editing')) return;
      // If clicking inside contenteditable text, don't drag unless holding alt/option or on handle
      if (e.target.isContentEditable && e.altKey === false && e.target !== element) {
        return;
      }

      startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      initialX = parseFloat(element.dataset.dragX) || 0;
      initialY = parseFloat(element.dataset.dragY) || 0;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onMouseMove, { passive: false });
      document.addEventListener('touchend', onMouseUp);
    }

    function onMouseMove(e) {
      if (!document.body.classList.contains('is-editing')) return;
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      currentX = initialX + deltaX;
      currentY = initialY + deltaY;

      element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      if (e.type === 'touchmove') e.preventDefault();
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);

      element.dataset.dragX = currentX;
      element.dataset.dragY = currentY;

      const id = element.dataset.customId;
      state.positions[id] = { x: currentX, y: currentY };
      saveState();
    }

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('touchstart', onMouseDown, { passive: true });
  }

  // Setup ContentEditable and Image Replacement
  function setupEditableElements() {
    // Collect all editable text nodes
    const editableTargets = document.querySelectorAll(
      'h1, h2, h3, h4, p, .kicker, .role, .intro-copy, .story-lead, .fact-value, figcaption, .slide-title, .slide-meta'
    );

    editableTargets.forEach((el, index) => {
      if (el.closest('.editor-toolbar') || el.closest('.glass-nav')) return;

      el.classList.add('editable');
      const selectorKey = el.id ? `#${el.id}` : `editable-${index}-${el.tagName.toLowerCase()}`;
      el.dataset.editKey = selectorKey;

      el.addEventListener('input', () => {
        if (!state.texts) state.texts = {};
        state.texts[selectorKey] = el.innerHTML;
        saveState();
      });
    });

    // Image replacement
    const images = document.querySelectorAll('main img, .project-hero-media img, .carousel-slide img');
    images.forEach((img, idx) => {
      const imgKey = img.id ? `#${img.id}` : `img-${idx}`;
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

  // Add new Paragraph helper
  function addNewParagraph() {
    const activeContainer = document.querySelector('.intro-body') || document.querySelector('.story-paragraphs') || document.querySelector('.about-narrative') || document.querySelector('main');
    if (!activeContainer) return;

    const newId = `custom-text-${Date.now()}`;
    const p = document.createElement('p');
    p.id = newId;
    p.className = 'editable draggable-item custom-added-text';
    p.contentEditable = 'true';
    p.innerHTML = 'Click to edit this new text block. You can also drag it anywhere!';
    p.style.margin = '16px 0';

    activeContainer.appendChild(p);
    initDrag(p, newId);

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
    p.focus();
  }

  // Build the Floating Editor Toolbar
  function createEditorToolbar() {
    if (document.querySelector('.editor-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.id = 'editor-toolbar';

    // Swatches HTML
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

        <!-- Action Buttons -->
        <button class="editor-btn" id="editor-add-text" type="button">+ Text</button>
        <button class="editor-btn" id="editor-reset" type="button" title="Reset all custom edits to default">↺ Reset</button>
        
        <!-- Saved Badge -->
        <span class="saved-toast" id="saved-toast">✓ Saved</span>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Event: Toggle Edit Mode
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

      // Also update navbar Edit button if present
      const navEdit = document.querySelector('#nav-edit-btn');
      if (navEdit) {
        navEdit.textContent = on ? 'Done' : 'Edit';
        navEdit.classList.toggle('active', on);
      }
    }

    toggleBtn.addEventListener('click', () => setEditMode(!state.isEditing));

    // Event: Color Swatches
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

    // Event: Hue Slider
    const hueSlider = toolbar.querySelector('#hue-range');
    hueSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      toolbar.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
      applyTheme(val, '26%');
      saveState();
    });

    // Event: Add Text
    toolbar.querySelector('#editor-add-text').addEventListener('click', addNewParagraph);

    // Event: Reset
    toolbar.querySelector('#editor-reset').addEventListener('click', () => {
      if (confirm('Reset all text, positions, and color edits back to defaults?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });

    // Keyboard Shortcut: Press 'e' or 'E' (outside text input) to toggle
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'e' && !e.target.isContentEditable && e.target.tagName !== 'INPUT') {
        setEditMode(!state.isEditing);
      }
    });
  }

  // Initialize Everything on Load
  function init() {
    loadState();
    restoreDOM();
    setupEditableElements();

    // Make key elements draggable in Edit Mode
    const draggableSelectors = [
      '.geo-circle-1',
      '.geo-circle-2',
      '.role',
      '.intro-copy',
      '.intro h1',
      '.intro-top',
      '.work-head-text',
      '.about-sticky',
      '.story-lead'
    ];

    draggableSelectors.forEach((sel) => {
      const els = document.querySelectorAll(sel);
      els.forEach((el, i) => initDrag(el, `${sel.replace(/[^a-zA-Z0-9]/g, '_')}-${i}`));
    });

    createEditorToolbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

