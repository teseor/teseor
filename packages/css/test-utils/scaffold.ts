export const scaffoldCss = `
  html {
    font-size: 16px;
  }
  body {
    background-image:
      linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 12px 12px;
    background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
    background-color: #fafafa;
  }
  .test-container {
    padding: 1.5rem;
  }
  .test-title {
    font-family: var(--ui-font-sans, system-ui, sans-serif);
    font-size: 1.5rem;
    font-weight: 600;
    margin-block-end: 1.5rem;
  }
  .test-section {
    margin-block-end: 1.5rem;
  }
  .test-section-title {
    font-family: var(--ui-font-sans, system-ui, sans-serif);
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-block-end: 0.5rem;
  }
  .test-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, max-content));
    gap: 1rem;
    align-items: start;
  }
  .test-element--block {
    width: 200px;
  }
`;
