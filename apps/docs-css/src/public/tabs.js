// Tabs interaction
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.ui-tabs__tab');
  if (!tab) return;

  const tabs = tab.closest('.ui-tabs');
  const tabList = tabs.querySelector('.ui-tabs__list');
  const panels = tabs.querySelectorAll('.ui-tabs__panel');
  const tabButtons = tabList.querySelectorAll('.ui-tabs__tab');

  const index = Array.from(tabButtons).indexOf(tab);

  // Update tabs
  tabButtons.forEach((t, i) => {
    t.classList.toggle('ui-tabs__tab--active', i === index);
  });

  // Update panels
  panels.forEach((p, i) => {
    p.classList.toggle('ui-tabs__panel--active', i === index);
  });
});
