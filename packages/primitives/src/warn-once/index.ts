// Deduplicates dev warnings emitted from Teseor packages so a noisy hook or
// component mounted N times still only logs once per call site. Vanilla JS —
// React and Vue wrappers both call this directly.

type WarnedHost = { __teseor_warned?: Set<string> };

// Fallback dedup set for SSR / non-browser environments where `window` doesn't
// exist. Per-process rather than per-page, which is the correct grain for a
// build / render worker.
const serverWarned = new Set<string>();

/**
 * Emits `console.warn` once per `key`, prefixed with `[teseor] `. Subsequent
 * calls with the same key are dropped within the same session.
 *
 * SSR-safe: when `window` is undefined the dedup set lives at module scope
 * instead, and a missing `console` is a no-op. In the browser the dedup state
 * lives on `window.__teseor_warned` (a `Set<string>`) so test suites can reset
 * it between cases by deleting that property.
 *
 * @param key  Stable call-site identifier (e.g. `"slot.multi-child"`).
 * @param message  Human-readable warning text — printed verbatim after the prefix.
 */
export function warnOnce(key: string, message: string): void {
  const warned = resolveWarnedSet();
  if (warned.has(key)) return;
  warned.add(key);
  if (typeof console === "undefined") return;
  console.warn(`[teseor] ${message}`);
}

function resolveWarnedSet(): Set<string> {
  if (typeof window === "undefined") return serverWarned;
  const host = window as unknown as WarnedHost;
  host.__teseor_warned ??= new Set<string>();
  return host.__teseor_warned;
}
