type WarnedHost = { __teseor_warned?: Set<string> };

// SSR fallback when `window` is unavailable.
const serverWarned = new Set<string>();

/**
 * Emits `console.warn` once per `key`, prefixed `[teseor] `. No-op when
 * `console` is undefined; SSR-safe. Browser dedup state lives on
 * `window.__teseor_warned` — delete it between tests to reset.
 *
 * Keys are global and must be finite/static — prefix per package
 * (e.g. `react.slot.multi-child`). Dynamic keys leak memory.
 */
export function warnOnce(key: string, message: string): void {
  if (typeof console === "undefined") return;
  const warned = resolveWarnedSet();
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[teseor] ${message}`);
}

function resolveWarnedSet(): Set<string> {
  if (typeof window === "undefined") return serverWarned;
  const host = window as unknown as WarnedHost;
  host.__teseor_warned ??= new Set<string>();
  return host.__teseor_warned;
}
