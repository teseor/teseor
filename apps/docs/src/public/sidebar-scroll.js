// Preserve sidebar scroll position across page navigations
(() => {
  const STORAGE_KEY = 'sidebar-scroll';
  const sidebar = document.querySelector('.ui-sidebar-nav__content');
  if (!sidebar) return;

  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) sidebar.scrollTop = Number.parseInt(saved, 10);

  for (const link of document.querySelectorAll('.ui-sidebar-nav a')) {
    link.addEventListener('click', () => {
      sessionStorage.setItem(STORAGE_KEY, sidebar.scrollTop);
    });
  }
})();
