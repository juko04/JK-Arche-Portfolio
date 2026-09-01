/**
 * Julian Kotara — Architectural & Lighting Portfolio
 * Homepage Interaction & Rail Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  const rail = document.querySelector('#project-rail');
  const prevBtn = document.querySelector('#previous');
  const nextBtn = document.querySelector('#next');
  const cards = document.querySelectorAll('.project-card');

  // Horizontal rail controls
  if (rail) {
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

    // Keyboard accessibility on project rail
    rail.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        rail.scrollBy({ left: 350, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        rail.scrollBy({ left: -350, behavior: 'smooth' });
      }
    });
  }

  // Card navigation
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const projectId = card.dataset.project;
      if (projectId === 'photo') {
        window.location.href = 'photography.html';
      } else if (projectId) {
        window.location.href = `project-${projectId}.html`;
      }
    });
  });
});

