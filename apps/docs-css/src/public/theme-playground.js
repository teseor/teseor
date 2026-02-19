// Interactive theme playground — sliders update core tokens in real time
(() => {
  const container = document.getElementById('theme-playground');
  if (!container) return;

  const sliders = container.querySelectorAll('input[type=range]');
  const resetBtn = container.querySelector('[data-reset]');

  const DEFAULTS = {};
  for (const slider of sliders) {
    DEFAULTS[slider.dataset.token] = slider.defaultValue;
  }

  function updateToken(slider) {
    const token = slider.dataset.token;
    const suffix = slider.dataset.suffix || '';
    const value = slider.value + suffix;
    document.documentElement.style.setProperty(token, value);
    const output = slider.nextElementSibling;
    if (output) output.textContent = value;
  }

  for (const slider of sliders) {
    slider.addEventListener('input', (e) => {
      updateToken(e.currentTarget);
    });
    const output = slider.nextElementSibling;
    if (output) output.textContent = slider.value + (slider.dataset.suffix || '');
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      for (const slider of sliders) {
        slider.value = DEFAULTS[slider.dataset.token];
        updateToken(slider);
        document.documentElement.style.removeProperty(slider.dataset.token);
      }
    });
  }
})();
