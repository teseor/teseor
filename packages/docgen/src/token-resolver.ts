// Resolves SCSS variable expressions to concrete CSS values.
// Parses _variables.scss to build a token map, then resolves
// CSS var() references in api.json `default` fields.

import postcss from 'postcss';
import postcssScss from 'postcss-scss';

interface NumericValue {
  value: number;
  unit: string; // 'rem' | 'px' | 'em' | 'ms' | '%' | '' (unitless)
}

const REM_TO_PX = 16;
const NUMERIC_RE = /^(-?\d+\.?\d*)(rem|px|em|ms|%)$/;

function parseNumeric(raw: string): NumericValue | null {
  const trimmed = raw.trim();
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    return { value: Number.parseFloat(trimmed), unit: '' };
  }
  const match = trimmed.match(NUMERIC_RE);
  if (match) {
    return { value: Number.parseFloat(match[1]), unit: match[2] };
  }
  return null;
}

function formatValue(val: NumericValue): string {
  if (val.value === 0) return '0';

  if (val.unit === 'rem') {
    const px = val.value * REM_TO_PX;
    return `${px}px`;
  }

  if (val.unit === '') {
    return String(val.value);
  }

  return `${val.value}${val.unit}`;
}

// Evaluate a single SCSS expression against already-resolved variables.
function evaluateScssExpr(expr: string, vars: Map<string, NumericValue>): NumericValue | null {
  const trimmed = expr.trim();

  const literal = parseNumeric(trimmed);
  if (literal) return literal;

  // Variable reference: $var-name
  const varRef = trimmed.match(/^\$([a-z][\w-]*)$/);
  if (varRef) return vars.get(varRef[1]) ?? null;

  // Negation: -$var
  const negRef = trimmed.match(/^-\$([a-z][\w-]*)$/);
  if (negRef) {
    const val = vars.get(negRef[1]);
    return val ? { value: -val.value, unit: val.unit } : null;
  }

  // Multiplication: $var * N
  const mul1 = trimmed.match(/^\$([a-z][\w-]*)\s*\*\s*(-?\d+\.?\d*)$/);
  if (mul1) {
    const base = vars.get(mul1[1]);
    return base ? { value: base.value * Number.parseFloat(mul1[2]), unit: base.unit } : null;
  }

  // Multiplication: N * $var
  const mul2 = trimmed.match(/^(-?\d+\.?\d*)\s*\*\s*\$([a-z][\w-]*)$/);
  if (mul2) {
    const base = vars.get(mul2[2]);
    return base ? { value: Number.parseFloat(mul2[1]) * base.value, unit: base.unit } : null;
  }

  return null;
}

// Walk _variables.scss declarations and resolve numeric tokens.
// Returns a map of --ui-* CSS custom property names to their resolved values.
export function buildTokenMap(variablesScss: string): Map<string, string> {
  const root = postcss().process(variablesScss, { syntax: postcssScss }).root;
  const scssVars = new Map<string, NumericValue>();
  const result = new Map<string, string>();

  root.walkDecls((decl) => {
    if (!decl.prop.startsWith('$')) return;

    const varName = decl.prop.slice(1);
    const expr = decl.value.trim();

    // Skip non-numeric expressions: colors, fonts, shadows, sass maps
    if (isNonNumeric(expr)) return;

    const resolved = evaluateScssExpr(expr, scssVars);
    if (resolved) {
      scssVars.set(varName, resolved);
      result.set(`--ui-${varName}`, formatValue(resolved));
    }
  });

  return result;
}

function isNonNumeric(expr: string): boolean {
  // Sass maps
  if (expr.startsWith('(')) return true;

  // Color functions
  if (
    expr.includes('oklch') ||
    expr.includes('hsl') ||
    expr.includes('rgb') ||
    expr.includes('color-mix')
  ) {
    return true;
  }

  // Font stacks
  if (expr.includes('system-ui') || expr.includes('monospace')) return true;

  // Easing functions
  if (expr.includes('cubic-bezier')) return true;

  // Top-level commas (multi-value shorthand, font stacks)
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) return true;
  }

  return false;
}

// Resolve a `default` expression from api.json to a concrete CSS value.
// Returns null when the expression can't be resolved (unknown vars, complex expressions).
export function resolveDefaultValue(
  defaultExpr: string,
  tokenMap: Map<string, string>,
): string | null {
  if (!defaultExpr) return null;

  const trimmed = defaultExpr.trim();

  // Direct token reference: --ui-something
  if (trimmed.startsWith('--ui-')) {
    return tokenMap.get(trimmed) ?? null;
  }

  // Legacy var() wrapper: var(--ui-something)
  const simpleVar = trimmed.match(/^var\((--ui-[\w-]+)\)$/);
  if (simpleVar) return tokenMap.get(simpleVar[1]) ?? null;

  // calc() expression: calc(var(--ui-row) * 6)
  if (trimmed.startsWith('calc(') && trimmed.endsWith(')')) {
    return evaluateCalcExpr(trimmed.slice(5, -1).trim(), tokenMap);
  }

  return null;
}

function evaluateCalcExpr(expr: string, tokenMap: Map<string, string>): string | null {
  let substituted = expr;
  const varRefs = [...expr.matchAll(/var\((--ui-[\w-]+)\)/g)];

  for (const ref of varRefs) {
    const resolved = tokenMap.get(ref[1]);
    if (!resolved) return null;
    substituted = substituted.replace(ref[0], resolved);
  }

  return evaluateArithmetic(substituted);
}

function evaluateArithmetic(expr: string): string | null {
  const trimmed = expr.trim();

  // Binary operation: left op right
  const match = trimmed.match(/^(.+?)\s*([*/+-])\s*(.+)$/);
  if (!match) return null;

  const left = parseNumeric(match[1].trim());
  const right = parseNumeric(match[3].trim());
  if (!left || !right) return null;

  const op = match[2];
  let value: number;
  let unit: string;

  switch (op) {
    case '*':
      value = left.value * right.value;
      unit = left.unit || right.unit;
      break;
    case '/':
      if (right.value === 0) return null;
      value = left.value / right.value;
      unit = left.unit || right.unit;
      break;
    case '+':
      if (left.unit && right.unit && left.unit !== right.unit) return null;
      value = left.value + right.value;
      unit = left.unit || right.unit;
      break;
    case '-':
      if (left.unit && right.unit && left.unit !== right.unit) return null;
      value = left.value - right.value;
      unit = left.unit || right.unit;
      break;
    default:
      return null;
  }

  return formatValue({ value, unit });
}
