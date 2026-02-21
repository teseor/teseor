type ModifierValue = string | boolean | undefined | null;

export function cx(block: string, modifiers?: Record<string, ModifierValue>): string {
  const base = `ui-${block}`;
  if (!modifiers) return base;

  const classes = [base];
  for (const [key, value] of Object.entries(modifiers)) {
    if (value === undefined || value === null || value === false || value === '') continue;
    if (value === true) {
      classes.push(`${base}--${key}`);
    } else {
      classes.push(`${base}--${value}`);
    }
  }
  return classes.join(' ');
}
