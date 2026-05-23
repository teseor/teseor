// Pairwise covering-array expansion for the spec `matrix:` block.
//
// Generates a fixture set that covers every (dim_i_value, dim_j_value) pair
// at least once. For Button (4 variants × 5 intents × 3 sizes = 60 cartesian),
// pairwise yields ~12–15 cells. Greedy construction: iterate candidate cells
// in deterministic order, pick the one that covers the most still-uncovered
// pairs, repeat until all reachable pairs are covered. Lexicographic
// tiebreaking and a final sort keep the output stable across runs.
//
// `constraints:` are applied before expansion (per the matrix-expansion ADR):
// cells violating a constraint are excluded from the candidate set, and the
// pairs they would have covered are removed from the target set. This keeps
// the pair-coverage guarantee intact instead of generating-then-filtering.

export type Dimension = { name: string; values: readonly string[] };

export type Cell = Record<string, string>;

export type Constraint = {
  when: Record<string, string>;
  forbid: Record<string, readonly string[]>;
};

type PairKey = string;

function pairKey(d1: string, v1: string, d2: string, v2: string): PairKey {
  return d1 < d2 ? `${d1}=${v1}|${d2}=${v2}` : `${d2}=${v2}|${d1}=${v1}`;
}

function cellPairs(cell: Cell, dimensionNames: readonly string[]): PairKey[] {
  const out: PairKey[] = [];
  for (let i = 0; i < dimensionNames.length; i += 1) {
    for (let j = i + 1; j < dimensionNames.length; j += 1) {
      const ni = dimensionNames[i];
      const nj = dimensionNames[j];
      if (ni === undefined || nj === undefined) continue;
      const vi = cell[ni];
      const vj = cell[nj];
      if (vi === undefined || vj === undefined) continue;
      out.push(pairKey(ni, vi, nj, vj));
    }
  }
  return out;
}

function cartesian(dimensions: readonly Dimension[]): Cell[] {
  if (dimensions.length === 0) return [];
  let acc: Cell[] = [{}];
  for (const dim of dimensions) {
    const next: Cell[] = [];
    for (const cell of acc) {
      for (const value of dim.values) next.push({ ...cell, [dim.name]: value });
    }
    acc = next;
  }
  return acc;
}

function violates(cell: Cell, constraint: Constraint): boolean {
  for (const [prop, expected] of Object.entries(constraint.when)) {
    if (cell[prop] !== expected) return false;
  }
  for (const [prop, forbidden] of Object.entries(constraint.forbid)) {
    const value = cell[prop];
    if (value !== undefined && forbidden.includes(value)) return true;
  }
  return false;
}

function cellKey(cell: Cell): string {
  return Object.keys(cell)
    .sort()
    .map((k) => `${k}=${cell[k]}`)
    .join("|");
}

export function expandPairwise(
  dimensions: readonly Dimension[],
  constraints: readonly Constraint[] = [],
): Cell[] {
  const cleanDims = dimensions.filter((d) => d.values.length > 0);
  if (cleanDims.length === 0) return [];

  const candidates = cartesian(cleanDims)
    .filter((cell) => !constraints.some((c) => violates(cell, c)))
    .sort((a, b) => cellKey(a).localeCompare(cellKey(b)));

  if (cleanDims.length === 1) return candidates;

  const dimNames = cleanDims.map((d) => d.name);
  const reachable = new Set<PairKey>();
  for (const cell of candidates) {
    for (const p of cellPairs(cell, dimNames)) reachable.add(p);
  }

  const uncovered = new Set(reachable);
  const out: Cell[] = [];
  while (uncovered.size > 0) {
    let best: { cell: Cell; covered: PairKey[] } | undefined;
    for (const cell of candidates) {
      const covered = cellPairs(cell, dimNames).filter((p) => uncovered.has(p));
      if (covered.length === 0) continue;
      if (best === undefined || covered.length > best.covered.length) {
        best = { cell, covered };
      }
    }
    if (best === undefined) break;
    out.push(best.cell);
    for (const p of best.covered) uncovered.delete(p);
  }
  out.sort((a, b) => cellKey(a).localeCompare(cellKey(b)));
  return out;
}

/** Stable fixture ID for a matrix cell: `m-<value1>-<value2>-…` in the order
 * dimensions were declared. */
export function matrixFixtureId(cell: Cell, dimensions: readonly Dimension[]): string {
  const parts = dimensions
    .map((d) => cell[d.name])
    .filter((v): v is string => typeof v === "string");
  return `m-${parts.join("-")}`;
}
