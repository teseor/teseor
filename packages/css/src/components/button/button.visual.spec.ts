import { expect, test } from '@playwright/test';

/**
 * Visual regression tests for button
 * Auto-generated from button.api.json and button.docs.json
 */

const tokensCss = `:root {
  --ui-hue-primary: 220;
  --ui-hue-success: 142;
  --ui-hue-warning: 38;
  --ui-hue-danger: 0;
  --ui-color-neutral-50: hsl(var(--ui-hue-primary) 10% 98%);
  --ui-color-neutral-100: hsl(var(--ui-hue-primary) 10% 96%);
  --ui-color-neutral-200: hsl(var(--ui-hue-primary) 10% 90%);
  --ui-color-neutral-300: hsl(var(--ui-hue-primary) 10% 80%);
  --ui-color-neutral-400: hsl(var(--ui-hue-primary) 10% 60%);
  --ui-color-neutral-500: hsl(var(--ui-hue-primary) 10% 45%);
  --ui-color-neutral-600: hsl(var(--ui-hue-primary) 10% 35%);
  --ui-color-neutral-700: hsl(var(--ui-hue-primary) 10% 25%);
  --ui-color-neutral-800: hsl(var(--ui-hue-primary) 10% 15%);
  --ui-color-neutral-900: hsl(var(--ui-hue-primary) 10% 10%);
  --ui-color-primary-light: hsl(var(--ui-hue-primary) 85% 65%);
  --ui-color-primary: hsl(var(--ui-hue-primary) 85% 50%);
  --ui-color-primary-dark: hsl(var(--ui-hue-primary) 85% 40%);
  --ui-color-success: hsl(var(--ui-hue-success) 70% 45%);
  --ui-color-warning: hsl(var(--ui-hue-warning) 90% 50%);
  --ui-color-danger: hsl(var(--ui-hue-danger) 70% 50%);
}

:root {
  --ui-space-1: var(--ui-unit);
  --ui-space-2: calc(var(--ui-unit) * 2);
  --ui-space-3: calc(var(--ui-unit) * 3);
  --ui-space-4: calc(var(--ui-unit) * 4);
  --ui-space-6: calc(var(--ui-unit) * 6);
  --ui-space-8: calc(var(--ui-unit) * 8);
}

:root {
  /* Noto Sans first for multilingual consistency, system fonts as fallback */
  --ui-font-sans: "Noto Sans", system-ui, -apple-system, sans-serif;
  --ui-font-mono: "Noto Sans Mono", ui-monospace, "Cascadia Code", monospace;
  /* Size scale: xs, sm, md, lg, xl, 2xl, 3xl - all derived from --unit */
  --ui-size-xs: calc(var(--ui-unit) * 1.5); /* 12px */
  --ui-size-sm: calc(var(--ui-unit) * 1.75); /* 14px */
  --ui-size-md: calc(var(--ui-unit) * 2); /* 16px */
  --ui-size-lg: calc(var(--ui-unit) * 2.25); /* 18px */
  --ui-size-xl: calc(var(--ui-unit) * 2.5); /* 20px */
  --ui-size-2xl: calc(var(--ui-unit) * 3); /* 24px */
  --ui-size-3xl: calc(var(--ui-unit) * 4); /* 32px */
  /* Line-heights snap to grid */
  --ui-leading-xs: var(--ui-row-1);
  --ui-leading-sm: var(--ui-row-1);
  --ui-leading-md: calc(var(--ui-unit) * 3);
  --ui-leading-lg: calc(var(--ui-unit) * 3);
  --ui-leading-xl: var(--ui-row-2);
  --ui-leading-2xl: var(--ui-row-2);
  --ui-leading-3xl: calc(var(--ui-unit) * 5);
  --ui-weight-normal: 400;
  --ui-weight-medium: 500;
  --ui-weight-bold: 700;
}

:root {
  --ui-unit: 0.5rem; /* 8px */
  --ui-row: calc(var(--ui-unit) * 2);
  --ui-row-1: var(--ui-row);
  --ui-row-2: calc(var(--ui-row) * 2);
  --ui-row-3: calc(var(--ui-row) * 3);
  --ui-row-4: calc(var(--ui-row) * 4);
  --ui-row-5: calc(var(--ui-row) * 5);
  --ui-row-6: calc(var(--ui-row) * 6);
}

:root {
  --ui-radius-sm: 0.25rem;
  --ui-radius-md: 0.5rem;
  --ui-radius-lg: 1rem;
  --ui-radius-full: 9999px;
}

:root {
  /* Border widths - derived from unit */
  --ui-border-width-sm: 1px;
  --ui-border-width-md: 2px;
  --ui-border-width-lg: calc(var(--ui-unit) * 0.5);
}

:root {
  --ui-shadow-sm: 0 1px 2px hsl(var(--ui-hue-primary) 10% 20% / 0.05);
  --ui-shadow-md: 0 4px 6px hsl(var(--ui-hue-primary) 10% 20% / 0.1);
  --ui-shadow-lg: 0 10px 15px hsl(var(--ui-hue-primary) 10% 20% / 0.15);
}

:root {
  --ui-color-text: var(--ui-color-neutral-900);
  --ui-color-text-muted: var(--ui-color-neutral-500);
  --ui-color-text-inverse: var(--ui-color-neutral-50);
  --ui-color-bg: var(--ui-color-neutral-50);
  --ui-color-bg-subtle: var(--ui-color-neutral-100);
  --ui-color-bg-muted: var(--ui-color-neutral-200);
  --ui-color-border: var(--ui-color-neutral-200);
  --ui-color-border-strong: var(--ui-color-neutral-300);
  --ui-color-interactive: var(--ui-color-primary);
  --ui-color-interactive-hover: var(--ui-color-primary-dark);
  --ui-color-focus: var(--ui-color-primary-light);
}

[data-theme=dark] {
  --ui-color-text: var(--ui-color-neutral-100);
  --ui-color-text-muted: var(--ui-color-neutral-400);
  --ui-color-text-inverse: var(--ui-color-neutral-900);
  --ui-color-bg: var(--ui-color-neutral-900);
  --ui-color-bg-subtle: var(--ui-color-neutral-800);
  --ui-color-bg-muted: var(--ui-color-neutral-700);
  --ui-color-border: var(--ui-color-neutral-700);
  --ui-color-border-strong: var(--ui-color-neutral-600);
}

:root {
  --ui-spacing-xs: var(--ui-space-1);
  --ui-spacing-sm: var(--ui-space-2);
  --ui-spacing-md: var(--ui-space-4);
  --ui-spacing-lg: var(--ui-space-6);
  --ui-spacing-xl: var(--ui-space-8);
  --ui-spacing-gutter: var(--ui-space-4);
  --ui-spacing-section: var(--ui-space-8);
}
`;
const componentCss = `
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Noto+Sans+Mono:wght@400;500&display=swap");
@layer reset, tokens, base, primitives, components, utilities, themes;
/**
 * CSS Library - Main Entry Point
 *
 * Import order matters due to CSS cascade and layer definitions.
 */
/* 1. Layer definitions (must be first for CSS) */
/* 9. Fonts (Google Fonts CDN) */
/* 2. Reset styles */
@layer reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  * {
    margin: 0;
  }
  html {
    font-size: 16px; /* Ensures 1rem = 16px, so --unit: 0.5rem = 8px exactly */
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }
  body {
    min-height: 100vh;
    line-height: var(--ui-leading-md);
    font-family: var(--ui-font-sans);
    font-size: var(--ui-size-md);
    color: var(--ui-color-text);
    background: var(--ui-color-bg);
  }
  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }
  input,
  button,
  textarea,
  select {
    font: inherit;
  }
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    overflow-wrap: break-word;
  }
  a {
    color: inherit;
    text-decoration: inherit;
  }
  button {
    background: none;
    border: none;
    cursor: pointer;
  }
}
/* 3. Base styles (typography, etc.) */
@layer base {
  h1 {
    font-size: var(--ui-size-3xl);
    line-height: var(--ui-leading-3xl);
    font-weight: var(--ui-weight-bold);
    margin-block-end: var(--ui-space-4);
  }
  h2 {
    font-size: var(--ui-size-2xl);
    line-height: var(--ui-leading-2xl);
    font-weight: var(--ui-weight-bold);
    margin-block-end: var(--ui-space-3);
  }
  h3 {
    font-size: var(--ui-size-xl);
    line-height: var(--ui-leading-xl);
    font-weight: var(--ui-weight-medium);
    margin-block-end: var(--ui-space-2);
  }
  h4 {
    font-size: var(--ui-size-lg);
    line-height: var(--ui-leading-lg);
    font-weight: var(--ui-weight-medium);
    margin-block-end: var(--ui-space-2);
  }
  h5,
  h6 {
    font-size: var(--ui-size-md);
    line-height: var(--ui-leading-md);
    font-weight: var(--ui-weight-medium);
    margin-block-end: var(--ui-space-1);
  }
  p {
    font-size: var(--ui-size-md);
    line-height: var(--ui-leading-md);
    margin-block-end: var(--ui-space-2);
  }
  p:last-child {
    margin-block-end: 0;
  }
  strong,
  b {
    font-weight: var(--ui-weight-bold);
    line-height: 0;
  }
  small {
    font-size: var(--ui-size-sm);
    line-height: 0;
  }
  code {
    font-family: var(--ui-font-mono);
    font-size: var(--ui-size-sm);
    line-height: 0;
    vertical-align: baseline;
    background: var(--ui-color-bg-muted);
    padding: 0 var(--ui-space-1);
    border-radius: var(--ui-radius-sm);
  }
  pre {
    font-family: var(--ui-font-mono);
    font-size: var(--ui-size-sm);
    line-height: var(--ui-leading-sm);
    background: var(--ui-color-bg-muted);
    padding: var(--ui-space-2);
    border-radius: var(--ui-radius-md);
    overflow-x: auto;
    margin-block-end: var(--ui-space-2);
  }
  pre code {
    background: none;
    padding: 0;
  }
}
/* 4. Layout primitives */
@layer primitives {
  .ui-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ui-stack-gap, var(--ui-space-2));
  }
  .ui-stack--xs {
    --ui-stack-gap: var(--ui-space-1);
  }
  .ui-stack--sm {
    --ui-stack-gap: var(--ui-space-2);
  }
  .ui-stack--md {
    --ui-stack-gap: var(--ui-space-4);
  }
  .ui-stack--lg {
    --ui-stack-gap: var(--ui-space-6);
  }
  .ui-stack--xl {
    --ui-stack-gap: var(--ui-space-8);
  }
}
@layer primitives {
  .ui-cluster {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ui-cluster-gap, var(--ui-space-2));
    align-items: center;
  }
  .ui-cluster--xs {
    --ui-cluster-gap: var(--ui-space-1);
  }
  .ui-cluster--sm {
    --ui-cluster-gap: var(--ui-space-2);
  }
  .ui-cluster--md {
    --ui-cluster-gap: var(--ui-space-4);
  }
  .ui-cluster--lg {
    --ui-cluster-gap: var(--ui-space-6);
  }
  .ui-cluster--start {
    justify-content: flex-start;
  }
  .ui-cluster--center {
    justify-content: center;
  }
  .ui-cluster--end {
    justify-content: flex-end;
  }
  .ui-cluster--between {
    justify-content: space-between;
  }
}
@layer primitives {
  .ui-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ui-center--column {
    flex-direction: column;
  }
}
@layer primitives {
  .ui-grid {
    display: grid;
    gap: var(--ui-grid-gap, var(--ui-space-4));
    grid-template-columns: repeat(var(--ui-grid-cols, 1), minmax(0, 1fr));
  }
  .ui-grid--2 {
    --ui-grid-cols: 2;
  }
  .ui-grid--3 {
    --ui-grid-cols: 3;
  }
  .ui-grid--4 {
    --ui-grid-cols: 4;
  }
  .ui-grid--auto {
    grid-template-columns: repeat(auto-fit, minmax(var(--ui-grid-min, 16rem), 1fr));
  }
}
@layer primitives {
  .ui-app-shell {
    min-block-size: 100vh;
  }
}
@layer primitives {
  .ui-sidebar {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: var(--ui-sidebar-width, calc(var(--ui-unit) * 30));
    block-size: 100vh;
    overflow-y: auto;
    background: var(--ui-color-bg-subtle);
    box-shadow: inset calc(var(--ui-border-width-sm) * -1) 0 0 0 var(--ui-color-border);
    display: flex;
    flex-direction: column;
    z-index: var(--ui-z-sticky);
  }
  /* Width modifiers */
  .ui-sidebar--sm {
    --ui-sidebar-width: calc(var(--ui-unit) * 24);
  }
  .ui-sidebar--md {
    --ui-sidebar-width: calc(var(--ui-unit) * 30);
  }
  .ui-sidebar--lg {
    --ui-sidebar-width: calc(var(--ui-unit) * 40);
  }
  /* Position modifier - sidebar on end (right in LTR) */
  .ui-sidebar--end {
    inset-inline-start: auto;
    inset-inline-end: 0;
    box-shadow: inset var(--ui-border-width-sm) 0 0 0 var(--ui-color-border);
  }
}
@layer primitives {
  .ui-main {
    margin-inline-start: var(--ui-sidebar-width, calc(var(--ui-unit) * 30));
  }
  /* When sidebar is on the end */
  .ui-main--sidebar-end {
    margin-inline-start: 0;
    margin-inline-end: var(--ui-sidebar-width, calc(var(--ui-unit) * 30));
  }
  /* No sidebar */
  .ui-main--full {
    margin-inline-start: 0;
    margin-inline-end: 0;
  }
}
@layer primitives {
  .ui-container {
    max-inline-size: var(--ui-container-width, calc(var(--ui-unit) * 120));
    padding-inline: var(--ui-space-4);
  }
  .ui-container--center {
    margin-inline: auto;
  }
  /* Size modifiers */
  .ui-container--sm {
    --ui-container-width: calc(var(--ui-unit) * 80);
  }
  .ui-container--md {
    --ui-container-width: calc(var(--ui-unit) * 100);
  }
  .ui-container--lg {
    --ui-container-width: calc(var(--ui-unit) * 120);
  }
  .ui-container--xl {
    --ui-container-width: calc(var(--ui-unit) * 160);
  }
  .ui-container--full {
    max-inline-size: none;
  }
}
/* 5. Component tokens */
:root {
  --ui-button-height-sm: var(--ui-space-3);
  --ui-button-height-md: var(--ui-row-2);
  --ui-button-height-lg: var(--ui-row-3);
  --ui-button-padding-x: var(--ui-space-2);
  --ui-button-padding-y: var(--ui-space-1);
  --ui-button-radius: var(--ui-radius-md);
  --ui-button-font-weight: var(--ui-weight-medium);
  --ui-button-bg: var(--ui-color-interactive);
  --ui-button-bg-hover: var(--ui-color-interactive-hover);
  --ui-button-text: var(--ui-color-text-inverse);
}
:root {
  --ui-input-height: var(--ui-row-2);
  --ui-input-padding-x: var(--ui-space-2);
  --ui-input-padding-y: var(--ui-space-1);
  --ui-input-radius: var(--ui-radius-md);
  --ui-input-border-width: var(--ui-border-width-sm);
  --ui-input-bg: var(--ui-color-bg);
  --ui-input-border: var(--ui-color-border);
  --ui-input-border-focus: var(--ui-color-interactive);
  --ui-input-text: var(--ui-color-text);
  --ui-input-placeholder: var(--ui-color-text-muted);
}
/* 6. Components */
/* Button component - heights align to grid rows */
@layer components {
  .ui-button {
    /* Layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ui-space-1);
    /* Size: default = 2 rows (32px) */
    block-size: var(--ui-row-2);
    padding-inline: var(--ui-space-2);
    /* Typography */
    font-family: var(--ui-font-sans);
    font-size: var(--ui-size-sm);
    font-weight: var(--ui-weight-medium);
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    /* Visual */
    background: var(--ui-color-primary);
    color: var(--ui-color-text-inverse);
    border: none;
    border-radius: var(--ui-radius-md);
    cursor: pointer;
    /* Transitions */
    transition: background-color 0.15s ease, transform 0.1s ease;
  }
  /* States */
  .ui-button:hover {
    background: var(--ui-color-primary-dark);
  }
  .ui-button:focus-visible {
    outline: var(--ui-border-width-md) solid var(--ui-color-focus);
    outline-offset: var(--ui-border-width-md);
  }
  .ui-button:active {
    transform: scale(0.98);
  }
  .ui-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ui-button:disabled:hover {
    background: var(--ui-color-primary);
    transform: none;
  }
  /* Size variants - all align to grid rows */
  .ui-button--sm {
    block-size: calc(var(--ui-row) * 1.5); /* 24px = 1.5 rows */
    padding-inline: var(--ui-space-2);
    font-size: var(--ui-size-xs);
  }
  .ui-button--lg {
    block-size: calc(var(--ui-row) * 2.5); /* 40px = 2.5 rows */
    padding-inline: var(--ui-space-3);
    font-size: var(--ui-size-md);
  }
  /* Style variants */
  .ui-button--secondary {
    background: var(--ui-color-bg-muted);
    color: var(--ui-color-text);
  }
  .ui-button--secondary:hover {
    background: var(--ui-color-border-strong);
  }
  .ui-button--secondary:disabled:hover {
    background: var(--ui-color-bg-muted);
  }
  .ui-button--ghost {
    background: transparent;
    color: var(--ui-color-primary);
  }
  .ui-button--ghost:hover {
    background: var(--ui-color-bg-subtle);
  }
  .ui-button--ghost:disabled:hover {
    background: transparent;
  }
  .ui-button--danger {
    background: var(--ui-color-danger);
  }
  .ui-button--danger:hover {
    background: hsl(var(--ui-hue-danger), 70%, 40%);
  }
  .ui-button--danger:disabled:hover {
    background: var(--ui-color-danger);
  }
  /* Icon-only button */
  .ui-button--icon {
    padding-inline: 0;
    inline-size: var(--ui-row-2);
  }
  .ui-button--icon.button--sm {
    inline-size: calc(var(--ui-row) * 1.5);
  }
  .ui-button--icon.button--lg {
    inline-size: calc(var(--ui-row) * 2.5);
  }
  /* Full width */
  .ui-button--block {
    inline-size: 100%;
  }
}
/* 7. Utilities (high specificity, load last) */
/* Spacing utilities - all values align to 8px grid */
/* Uses logical properties for international/RTL support */
@layer utilities {
  /* Margin utilities */
  .ui-m-0 {
    margin: 0;
  }
  .ui-m-1 {
    margin: var(--ui-space-1);
  }
  .ui-m-2 {
    margin: var(--ui-space-2);
  }
  .ui-m-3 {
    margin: var(--ui-space-3);
  }
  .ui-m-4 {
    margin: var(--ui-space-4);
  }
  .ui-m-6 {
    margin: var(--ui-space-6);
  }
  .ui-m-8 {
    margin: var(--ui-space-8);
  }
  .ui-mt-0 {
    margin-block-start: 0;
  }
  .ui-mt-1 {
    margin-block-start: var(--ui-space-1);
  }
  .ui-mt-2 {
    margin-block-start: var(--ui-space-2);
  }
  .ui-mt-3 {
    margin-block-start: var(--ui-space-3);
  }
  .ui-mt-4 {
    margin-block-start: var(--ui-space-4);
  }
  .ui-mt-6 {
    margin-block-start: var(--ui-space-6);
  }
  .ui-mt-8 {
    margin-block-start: var(--ui-space-8);
  }
  .ui-me-0 {
    margin-inline-end: 0;
  }
  .ui-me-1 {
    margin-inline-end: var(--ui-space-1);
  }
  .ui-me-2 {
    margin-inline-end: var(--ui-space-2);
  }
  .ui-me-3 {
    margin-inline-end: var(--ui-space-3);
  }
  .ui-me-4 {
    margin-inline-end: var(--ui-space-4);
  }
  .ui-me-6 {
    margin-inline-end: var(--ui-space-6);
  }
  .ui-me-8 {
    margin-inline-end: var(--ui-space-8);
  }
  .ui-mb-0 {
    margin-block-end: 0;
  }
  .ui-mb-1 {
    margin-block-end: var(--ui-space-1);
  }
  .ui-mb-2 {
    margin-block-end: var(--ui-space-2);
  }
  .ui-mb-3 {
    margin-block-end: var(--ui-space-3);
  }
  .ui-mb-4 {
    margin-block-end: var(--ui-space-4);
  }
  .ui-mb-6 {
    margin-block-end: var(--ui-space-6);
  }
  .ui-mb-8 {
    margin-block-end: var(--ui-space-8);
  }
  .ui-ms-0 {
    margin-inline-start: 0;
  }
  .ui-ms-1 {
    margin-inline-start: var(--ui-space-1);
  }
  .ui-ms-2 {
    margin-inline-start: var(--ui-space-2);
  }
  .ui-ms-3 {
    margin-inline-start: var(--ui-space-3);
  }
  .ui-ms-4 {
    margin-inline-start: var(--ui-space-4);
  }
  .ui-ms-6 {
    margin-inline-start: var(--ui-space-6);
  }
  .ui-ms-8 {
    margin-inline-start: var(--ui-space-8);
  }
  .ui-mx-0 {
    margin-inline: 0;
  }
  .ui-mx-1 {
    margin-inline: var(--ui-space-1);
  }
  .ui-mx-2 {
    margin-inline: var(--ui-space-2);
  }
  .ui-mx-3 {
    margin-inline: var(--ui-space-3);
  }
  .ui-mx-4 {
    margin-inline: var(--ui-space-4);
  }
  .ui-mx-auto {
    margin-inline: auto;
  }
  .ui-my-0 {
    margin-block: 0;
  }
  .ui-my-1 {
    margin-block: var(--ui-space-1);
  }
  .ui-my-2 {
    margin-block: var(--ui-space-2);
  }
  .ui-my-3 {
    margin-block: var(--ui-space-3);
  }
  .ui-my-4 {
    margin-block: var(--ui-space-4);
  }
  /* Padding utilities */
  .ui-p-0 {
    padding: 0;
  }
  .ui-p-1 {
    padding: var(--ui-space-1);
  }
  .ui-p-2 {
    padding: var(--ui-space-2);
  }
  .ui-p-3 {
    padding: var(--ui-space-3);
  }
  .ui-p-4 {
    padding: var(--ui-space-4);
  }
  .ui-p-6 {
    padding: var(--ui-space-6);
  }
  .ui-p-8 {
    padding: var(--ui-space-8);
  }
  .ui-pt-0 {
    padding-block-start: 0;
  }
  .ui-pt-1 {
    padding-block-start: var(--ui-space-1);
  }
  .ui-pt-2 {
    padding-block-start: var(--ui-space-2);
  }
  .ui-pt-3 {
    padding-block-start: var(--ui-space-3);
  }
  .ui-pt-4 {
    padding-block-start: var(--ui-space-4);
  }
  .ui-pt-6 {
    padding-block-start: var(--ui-space-6);
  }
  .ui-pt-8 {
    padding-block-start: var(--ui-space-8);
  }
  .ui-pe-0 {
    padding-inline-end: 0;
  }
  .ui-pe-1 {
    padding-inline-end: var(--ui-space-1);
  }
  .ui-pe-2 {
    padding-inline-end: var(--ui-space-2);
  }
  .ui-pe-3 {
    padding-inline-end: var(--ui-space-3);
  }
  .ui-pe-4 {
    padding-inline-end: var(--ui-space-4);
  }
  .ui-pe-6 {
    padding-inline-end: var(--ui-space-6);
  }
  .ui-pe-8 {
    padding-inline-end: var(--ui-space-8);
  }
  .ui-pb-0 {
    padding-block-end: 0;
  }
  .ui-pb-1 {
    padding-block-end: var(--ui-space-1);
  }
  .ui-pb-2 {
    padding-block-end: var(--ui-space-2);
  }
  .ui-pb-3 {
    padding-block-end: var(--ui-space-3);
  }
  .ui-pb-4 {
    padding-block-end: var(--ui-space-4);
  }
  .ui-pb-6 {
    padding-block-end: var(--ui-space-6);
  }
  .ui-pb-8 {
    padding-block-end: var(--ui-space-8);
  }
  .ui-ps-0 {
    padding-inline-start: 0;
  }
  .ui-ps-1 {
    padding-inline-start: var(--ui-space-1);
  }
  .ui-ps-2 {
    padding-inline-start: var(--ui-space-2);
  }
  .ui-ps-3 {
    padding-inline-start: var(--ui-space-3);
  }
  .ui-ps-4 {
    padding-inline-start: var(--ui-space-4);
  }
  .ui-ps-6 {
    padding-inline-start: var(--ui-space-6);
  }
  .ui-ps-8 {
    padding-inline-start: var(--ui-space-8);
  }
  .ui-px-0 {
    padding-inline: 0;
  }
  .ui-px-1 {
    padding-inline: var(--ui-space-1);
  }
  .ui-px-2 {
    padding-inline: var(--ui-space-2);
  }
  .ui-px-3 {
    padding-inline: var(--ui-space-3);
  }
  .ui-px-4 {
    padding-inline: var(--ui-space-4);
  }
  .ui-py-0 {
    padding-block: 0;
  }
  .ui-py-1 {
    padding-block: var(--ui-space-1);
  }
  .ui-py-2 {
    padding-block: var(--ui-space-2);
  }
  .ui-py-3 {
    padding-block: var(--ui-space-3);
  }
  .ui-py-4 {
    padding-block: var(--ui-space-4);
  }
  /* Gap utilities (for flex/grid) */
  .ui-gap-0 {
    gap: 0;
  }
  .ui-gap-1 {
    gap: var(--ui-space-1);
  }
  .ui-gap-2 {
    gap: var(--ui-space-2);
  }
  .ui-gap-3 {
    gap: var(--ui-space-3);
  }
  .ui-gap-4 {
    gap: var(--ui-space-4);
  }
  .ui-gap-6 {
    gap: var(--ui-space-6);
  }
  .ui-gap-8 {
    gap: var(--ui-space-8);
  }
}
/* Display and visibility utilities */
/* Uses logical properties for international/RTL support */
@layer utilities {
  /* Display */
  .ui-block {
    display: block;
  }
  .ui-inline-block {
    display: inline-block;
  }
  .ui-inline {
    display: inline;
  }
  .ui-flex {
    display: flex;
  }
  .ui-inline-flex {
    display: inline-flex;
  }
  .ui-grid {
    display: grid;
  }
  .ui-inline-grid {
    display: inline-grid;
  }
  .ui-hidden {
    display: none;
  }
  /* Flexbox direction */
  .ui-flex-row {
    flex-direction: row;
  }
  .ui-flex-row-reverse {
    flex-direction: row-reverse;
  }
  .ui-flex-col {
    flex-direction: column;
  }
  .ui-flex-col-reverse {
    flex-direction: column-reverse;
  }
  /* Flexbox wrap */
  .ui-flex-wrap {
    flex-wrap: wrap;
  }
  .ui-flex-nowrap {
    flex-wrap: nowrap;
  }
  .ui-flex-wrap-reverse {
    flex-wrap: wrap-reverse;
  }
  /* Flexbox grow/shrink */
  .ui-flex-1 {
    flex: 1 1 0%;
  }
  .ui-flex-auto {
    flex: 1 1 auto;
  }
  .ui-flex-initial {
    flex: 0 1 auto;
  }
  .ui-flex-none {
    flex: none;
  }
  .ui-grow {
    flex-grow: 1;
  }
  .ui-grow-0 {
    flex-grow: 0;
  }
  .ui-shrink {
    flex-shrink: 1;
  }
  .ui-shrink-0 {
    flex-shrink: 0;
  }
  /* Justify content */
  .ui-justify-start {
    justify-content: flex-start;
  }
  .ui-justify-end {
    justify-content: flex-end;
  }
  .ui-justify-center {
    justify-content: center;
  }
  .ui-justify-between {
    justify-content: space-between;
  }
  .ui-justify-around {
    justify-content: space-around;
  }
  .ui-justify-evenly {
    justify-content: space-evenly;
  }
  /* Align items */
  .ui-items-start {
    align-items: flex-start;
  }
  .ui-items-end {
    align-items: flex-end;
  }
  .ui-items-center {
    align-items: center;
  }
  .ui-items-baseline {
    align-items: baseline;
  }
  .ui-items-stretch {
    align-items: stretch;
  }
  /* Align self */
  .ui-self-auto {
    align-self: auto;
  }
  .ui-self-start {
    align-self: flex-start;
  }
  .ui-self-end {
    align-self: flex-end;
  }
  .ui-self-center {
    align-self: center;
  }
  .ui-self-stretch {
    align-self: stretch;
  }
  /* Visibility */
  .ui-visible {
    visibility: visible;
  }
  .ui-invisible {
    visibility: hidden;
  }
  /* Screen reader only */
  .ui-sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}
/* Text utilities */
/* Uses logical properties for international/RTL support */
@layer utilities {
  /* Text alignment - use start/end for RTL support */
  .ui-text-start {
    text-align: start;
  }
  .ui-text-center {
    text-align: center;
  }
  .ui-text-end {
    text-align: end;
  }
  .ui-text-justify {
    text-align: justify;
  }
  /* Font weight */
  .ui-font-normal {
    font-weight: var(--ui-weight-normal);
  }
  .ui-font-medium {
    font-weight: var(--ui-weight-medium);
  }
  .ui-font-bold {
    font-weight: var(--ui-weight-bold);
  }
  /* Font size (uses consistent --size-* scale derived from --unit) */
  .ui-text-xs {
    font-size: var(--ui-size-xs);
    line-height: var(--ui-leading-xs);
  }
  .ui-text-sm {
    font-size: var(--ui-size-sm);
    line-height: var(--ui-leading-sm);
  }
  .ui-text-md {
    font-size: var(--ui-size-md);
    line-height: var(--ui-leading-md);
  }
  .ui-text-lg {
    font-size: var(--ui-size-lg);
    line-height: var(--ui-leading-lg);
  }
  .ui-text-xl {
    font-size: var(--ui-size-xl);
    line-height: var(--ui-leading-xl);
  }
  .ui-text-2xl {
    font-size: var(--ui-size-2xl);
    line-height: var(--ui-leading-2xl);
  }
  .ui-text-3xl {
    font-size: var(--ui-size-3xl);
    line-height: var(--ui-leading-3xl);
  }
  /* Font family */
  .ui-font-sans {
    font-family: var(--ui-font-sans);
  }
  .ui-font-mono {
    font-family: var(--ui-font-mono);
  }
  /* Text decoration */
  .ui-underline {
    text-decoration: underline;
  }
  .ui-line-through {
    text-decoration: line-through;
  }
  .ui-no-underline {
    text-decoration: none;
  }
  /* Text transform */
  .ui-uppercase {
    text-transform: uppercase;
  }
  .ui-lowercase {
    text-transform: lowercase;
  }
  .ui-capitalize {
    text-transform: capitalize;
  }
  .ui-normal-case {
    text-transform: none;
  }
  /* Text color */
  .ui-text-primary {
    color: var(--ui-color-primary);
  }
  .ui-text-muted {
    color: var(--ui-color-text-muted);
  }
  .ui-text-success {
    color: var(--ui-color-success);
  }
  .ui-text-warning {
    color: var(--ui-color-warning);
  }
  .ui-text-danger {
    color: var(--ui-color-danger);
  }
  /* Text wrapping */
  .ui-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ui-whitespace-normal {
    white-space: normal;
  }
  .ui-whitespace-nowrap {
    white-space: nowrap;
  }
  .ui-whitespace-pre {
    white-space: pre;
  }
  .ui-whitespace-pre-wrap {
    white-space: pre-wrap;
  }
}
/* 8. Debug tools (optional) */
/* Debug grid overlay - add class="debug-grid" to body or any container */
.ui-debug-grid,
.ui-debug-grid-rows,
.ui-debug-baseline {
  position: relative;
}
.ui-debug-grid {
  --ui-debug-color: hsl(var(--ui-hue-primary) 80% 50% / 0.15);
}
.ui-debug-grid::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 100vh;
  background-image: linear-gradient(to right, var(--ui-debug-color) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-debug-color) 1px, transparent 1px);
  background-size: var(--ui-unit) var(--ui-unit);
  background-position: 0 0;
  pointer-events: none;
  z-index: 9999;
}
/* Stronger grid at row intervals (16px) */
.ui-debug-grid-rows {
  --ui-debug-color: hsl(var(--ui-hue-primary) 80% 50% / 0.1);
  --ui-debug-color-strong: hsl(var(--ui-hue-primary) 80% 50% / 0.25);
}
.ui-debug-grid-rows::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 100vh;
  background-image: linear-gradient(to right, var(--ui-debug-color) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-debug-color) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-debug-color-strong) 1px, transparent 1px);
  background-size: var(--ui-unit) var(--ui-unit), var(--ui-unit) var(--ui-unit), var(--ui-unit) var(--ui-row);
  background-position: 0 0;
  pointer-events: none;
  z-index: 9999;
}
/* Baseline grid only (horizontal lines) */
.ui-debug-baseline {
  --ui-debug-color: hsl(var(--ui-hue-danger) 80% 50% / 0.2);
}
.ui-debug-baseline::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 100vh;
  background-image: linear-gradient(to bottom, var(--ui-debug-color) 1px, transparent 1px);
  background-size: 100% var(--ui-unit);
  pointer-events: none;
  z-index: 9999;
}
/* Element boundaries outline - uses box-shadow to align with grid */
/* When outline (red) overlaps grid (blue), blend creates purple/magenta */
.ui-debug-outline *::before {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 1px hsla(0, 100%, 50%, 0.5);
  pointer-events: none;
  mix-blend-mode: multiply;
}
.ui-debug-outline * {
  position: relative;
}
`;

const sections = [
  {
    title: 'Sizes',
    examples: [
      {
        layout: 'cluster',
        items: [
          {
            tag: 'button',
            class: 'ui-button ui-button--sm',
            text: 'Small (24px)',
          },
          {
            tag: 'button',
            class: 'ui-button',
            text: 'Default (32px)',
          },
          {
            tag: 'button',
            class: 'ui-button ui-button--lg',
            text: 'Large (40px)',
          },
        ],
        code: '<button class="ui-button ui-button--sm">Small</button>\n<button class="ui-button">Default</button>\n<button class="ui-button ui-button--lg">Large</button>',
      },
    ],
  },
  {
    title: 'Variants',
    examples: [
      {
        layout: 'cluster',
        items: [
          {
            tag: 'button',
            class: 'ui-button',
            text: 'Primary',
          },
          {
            tag: 'button',
            class: 'ui-button ui-button--secondary',
            text: 'Secondary',
          },
          {
            tag: 'button',
            class: 'ui-button ui-button--ghost',
            text: 'Ghost',
          },
          {
            tag: 'button',
            class: 'ui-button ui-button--danger',
            text: 'Danger',
          },
        ],
        code: '<button class="ui-button">Primary</button>\n<button class="ui-button ui-button--secondary">Secondary</button>\n<button class="ui-button ui-button--ghost">Ghost</button>\n<button class="ui-button ui-button--danger">Danger</button>',
      },
    ],
  },
  {
    title: 'States',
    examples: [
      {
        layout: 'cluster',
        items: [
          {
            tag: 'button',
            class: 'ui-button',
            text: 'Normal',
          },
          {
            tag: 'button',
            class: 'ui-button',
            text: 'Disabled',
            attrs: {
              disabled: '',
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Full Width',
    examples: [
      {
        items: [
          {
            tag: 'button',
            class: 'ui-button ui-button--block',
            text: 'Full Width Button',
          },
        ],
        code: '<button class="ui-button ui-button--block">Full Width</button>',
      },
    ],
  },
  {
    title: 'Icon Button',
    examples: [
      {
        layout: 'cluster',
        items: [
          {
            tag: 'button',
            class: 'ui-button ui-button--icon ui-button--sm',
            text: 'X',
          },
          {
            tag: 'button',
            class: 'ui-button ui-button--icon',
            text: '+',
          },
          {
            tag: 'button',
            class: 'ui-button ui-button--icon ui-button--lg',
            text: '?',
          },
        ],
        code: '<button class="ui-button ui-button--icon">+</button>',
      },
    ],
  },
];

test.describe('button visual regression', () => {
  test('all variations', async ({ page }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <style>${tokensCss}</style>
  <style>${componentCss}</style>
  <style>
    body {
      margin: 0;
      padding: 48px;
      background-color: #fff;
      background-image:
        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      font-family: var(--ui-font-sans);
    }
    .doc-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--ui-color-text);
    }
    .doc-description {
      font-size: 14px;
      color: var(--ui-color-text-muted);
      margin-bottom: 40px;
    }
    .doc-section {
      margin-bottom: 32px;
    }
    .doc-section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--ui-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .doc-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    .doc-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 120px;
    }
    .doc-label {
      font-size: 12px;
      color: var(--ui-color-text-muted);
    }
  </style>
</head>
<body>
  <h1 class="doc-title">Button</h1>
  <p class="doc-description">Button heights align to grid rows.</p>

  ${sections
    .map(
      (section) => `
    <div class="doc-section">
      <h2 class="doc-section-title">${section.title}</h2>
      ${
        section.examples
          ? section.examples
              .map(
                (example) => `
        <div class="doc-row">
          ${example.items
            .map(
              (item) => `
            <${item.tag || 'button'}
              class="${item.class || ''}"
              ${item.attrs?.disabled !== undefined ? 'disabled' : ''}
            >${item.text}</button>
          `,
            )
            .join('')}
        </div>
      `,
              )
              .join('')
          : ''
      }
    </div>
  `,
    )
    .join('')}
</body>
</html>`;

    await page.setContent(html);
    await expect(page.locator('body')).toHaveScreenshot('button-all-variations.png');
  });
});
