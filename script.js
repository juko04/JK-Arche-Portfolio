const KEY = 'julian-kotara-portfolio-v1';
const editable = [...document.querySelectorAll('.editable')];
const images = [...document.querySelectorAll('.image-editable')];
const editButton = document.querySelector('.edit-toggle');

function restore() {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  editable.forEach((el, i) => { if (saved.text?.[i]) el.innerHTML = saved.text[i]; });
  images.forEach(el => { const src = saved.images?.[el.dataset.imageKey]; if (src) el.querySelector('img').src = src; });
}
function save() {
  const data = { text: editable.map(el => el.innerHTML), images: {} };
  images.forEach(el => data.images[el.dataset.imageKey] = el.querySelector('img').src);
  localStorage.setItem(KEY, JSON.stringify(data));
}
function setEditing(on) {
  document.body.classList.toggle('is-editing', on);
  editButton.setAttribute('aria-pressed', on);
  editButton.innerHTML = on ? 'Done editing <span>×</span>' : 'Edit portfolio <span>↗</span>';
  editable.forEach(el => el.contentEditable = on ? 'true' : 'false');
  if (!on) save();
}
editButton.addEventListener('click', () => setEditing(!document.body.classList.contains('is-editing')));
editable.forEach(el => el.addEventListener('input', save));
images.forEach(el => el.addEventListener('click', () => {
  if (!document.body.classList.contains('is-editing')) return;
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
  input.onchange = () => { const file = input.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { el.querySelector('img').src = reader.result; save(); }; reader.readAsDataURL(file); };
  input.click();
}));
document.querySelector('#download').addEventListener('click', () => { save(); const file = new Blob([localStorage.getItem(KEY)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = 'portfolio-content.json'; a.click(); URL.revokeObjectURL(a.href); });
document.querySelector('#import').addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { localStorage.setItem(KEY, reader.result); location.reload(); } catch { alert('That file could not be imported.'); } }; reader.readAsText(file); });
document.querySelector('#reset').addEventListener('click', () => { if (confirm('Reset all edits and uploaded images?')) { localStorage.removeItem(KEY); location.reload(); } });
document.querySelector('#year').textContent = new Date().getFullYear();
restore();