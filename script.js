/**
 * Julian Kotara — Architectural & Lighting Portfolio
 * Homepage Horizontal Rail Navigation & Keyboard Accessibility
 */

document.addEventListener('DOMContentLoaded', () => {
  const rail = document.querySelector('#project-rail');
  const prevBtn = document.querySelector('#previous');
  const nextBtn = document.querySelector('#next');

  if (!rail) return;

  // Horizontal scroll buttons
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const scrollAmount = Math.min(rail.clientWidth * 0.75, 600);
      rail.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const scrollAmount = Math.min(rail.clientWidth * 0.75, 600);
      rail.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  // Keyboard accessibility
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      rail.scrollBy({ left: 350, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      rail.scrollBy({ left: -350, behavior: 'smooth' });
    }
  });
});
