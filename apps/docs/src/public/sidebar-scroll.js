// Preserve sidebar scroll position across page navigations
const STORAGE_KEY = 'sidebar-scroll';

function restoreScroll() {
  const sidebar = document.querySelector('.ui-sidebar-nav__content');
  if (!sidebar) return;

  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    sidebar.style.scrollBehavior = 'auto';
    sidebar.scrollTop = Number.parseInt(saved, 10);
    sidebar.style.scrollBehavior = '';
  }
}

function setupSaveOnClick() {
  const sidebar = document.querySelector('.ui-sidebar-nav__content');
  if (!sidebar) return;

  // Use event delegation on content area for all links
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      sessionStorage.setItem(STORAGE_KEY, sidebar.scrollTop);
    }
  });
}

// For view transitions: restore before page is revealed
if ('onpagereveal' in window) {
  window.addEventListener('pagereveal', restoreScroll);
} else {
  // Fallback for browsers without view transitions
  document.addEventListener('DOMContentLoaded', restoreScroll);
}

document.addEventListener('DOMContentLoaded', setupSaveOnClick);
