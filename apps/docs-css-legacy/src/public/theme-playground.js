// Interactive theme playground — sliders + selects update core tokens in real time
(() => {
  const container = document.getElementById('theme-playground');
  if (!container) return;

  const sliders = container.querySelectorAll('input[type=range]');
  const selects = container.querySelectorAll('select[data-token]');
  const resetBtn = container.querySelector('[data-reset]');
  const randomBtn = container.querySelector('[data-random]');

  // Store defaults for reset
  const SLIDER_DEFAULTS = {};
  for (const s of sliders) {
    SLIDER_DEFAULTS[s.dataset.token + (s.dataset.param || '')] = s.defaultValue;
  }
  const SELECT_DEFAULTS = {};
  for (const s of selects) {
    SELECT_DEFAULTS[s.dataset.token] = s.value;
  }

  // Grouped sliders share a token — collect all param values to build one CSS value
  const getGroupValue = (token, template) => {
    const group = container.querySelectorAll(`input[data-token="${token}"]`);
    let result = template;
    for (const s of group) {
      const param = s.dataset.param;
      if (param) result = result.replace(`{${param}}`, s.value);
    }
    return result;
  };

  const updateFillPct = (slider) => {
    const min = Number.parseFloat(slider.min) || 0;
    const max = Number.parseFloat(slider.max) || 100;
    const val = Number.parseFloat(slider.value) || 0;
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--_fill-pct', `${pct}%`);
  };

  const updateSlider = (slider) => {
    const token = slider.dataset.token;
    const suffix = slider.dataset.suffix || '';
    const template = slider.dataset.template;
    const param = slider.dataset.param;

    let cssValue;
    if (param && template) {
      cssValue = getGroupValue(token, template);
    } else if (template) {
      cssValue = template.replace('{value}', slider.value);
    } else {
      cssValue = slider.value + suffix;
    }

    document.documentElement.style.setProperty(token, cssValue);
    updateFillPct(slider);

    // Update output label
    const output = slider.nextElementSibling;
    if (output && output.tagName === 'OUTPUT') {
      output.textContent = template ? `${slider.value}${suffix}` : cssValue;
    }
  };

  const updateSelect = (select) => {
    const token = select.dataset.token;
    document.documentElement.style.setProperty(token, select.value);
  };

  // Bind slider events
  for (const slider of sliders) {
    slider.addEventListener('input', (e) => updateSlider(e.currentTarget));
    updateFillPct(slider);
    const output = slider.nextElementSibling;
    if (output && output.tagName === 'OUTPUT') {
      const suffix = slider.dataset.suffix || '';
      output.textContent = slider.dataset.template
        ? `${slider.value}${suffix}`
        : slider.value + suffix;
    }
  }

  // Bind select events
  for (const select of selects) {
    select.addEventListener('change', (e) => updateSelect(e.currentTarget));
  }

  // Reset all controls to defaults
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      for (const slider of sliders) {
        const key = slider.dataset.token + (slider.dataset.param || '');
        slider.value = SLIDER_DEFAULTS[key];
        updateSlider(slider);
        document.documentElement.style.removeProperty(slider.dataset.token);
      }
      for (const select of selects) {
        select.value = SELECT_DEFAULTS[select.dataset.token];
        document.documentElement.style.removeProperty(select.dataset.token);
      }
    });
  }

  // Initialize fill percentage on ALL sliders in the playground (including preview)
  for (const slider of container.querySelectorAll('.ui-slider:not([data-token])')) {
    updateFillPct(slider);
    slider.addEventListener('input', (e) => updateFillPct(e.currentTarget));
  }

  // Randomize all controls with smooth transition
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      document.documentElement.classList.add('theme-transitioning');
      for (const slider of sliders) {
        const min = Number.parseFloat(slider.min);
        const max = Number.parseFloat(slider.max);
        const step = Number.parseFloat(slider.step) || 1;
        const steps = Math.floor((max - min) / step);
        const randomStep = Math.floor(Math.random() * (steps + 1));
        slider.value = (min + randomStep * step).toFixed(
          step < 1 ? String(step).split('.')[1].length : 0,
        );
        updateSlider(slider);
      }
      for (const select of selects) {
        const opts = select.options;
        select.selectedIndex = Math.floor(Math.random() * opts.length);
        updateSelect(select);
      }
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);
    });
  }
})();
