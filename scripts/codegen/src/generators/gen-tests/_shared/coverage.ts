import {
  type Cell,
  coverageFixtureId,
  type Dimension,
  expandPairwise,
  type Constraint as PairwiseConstraint,
} from "../../../pairwise.ts";
import type { Spec } from "../../gen-contract.ts";

/** Spec fields gen-tests reads beyond gen-contract's loose Spec type. */
export type TestsSpec = Spec & {
  visualStates?: Record<string, { description?: string }>;
  coverage?: Record<string, true | readonly string[]>;
};

export type CoverageFixture = { id: string; props: Record<string, unknown> };

export function declaredValues(spec: TestsSpec, dimName: string): readonly string[] {
  switch (dimName) {
    case "variant":
      return Object.keys(spec.variants ?? {});
    case "intent":
      return Object.keys(spec.intents ?? {});
    case "size":
      return Object.keys(spec.sizes ?? {});
    case "visualStates":
      return Object.keys(spec.visualStates ?? {});
    default: {
      const def = spec.props?.[dimName];
      return def?.values ?? [];
    }
  }
}

export function collectCoverageDimensions(spec: TestsSpec): Dimension[] {
  const coverage = spec.coverage;
  if (!coverage) return [];
  const out: Dimension[] = [];
  for (const [name, declaration] of Object.entries(coverage)) {
    const declared = declaredValues(spec, name);
    if (declared.length === 0) continue;
    const values =
      declaration === true ? declared : declaration.filter((v) => declared.includes(v));
    if (values.length === 0) continue;
    out.push({ name, values });
  }
  return out;
}

/** Preserves boolean / number values verbatim — needed for constraints like
 * `when: { loading: true }` that wouldn't match if we string-coerced. */
export function collectConstraints(spec: TestsSpec): PairwiseConstraint[] {
  return (spec.constraints ?? []).map((c) => ({
    when: { ...(c.when ?? {}) },
    forbid: { ...(c.forbid ?? {}) },
  }));
}

/** Translate a pairwise cell into a fixture props object. `visualStates`
 * cells (e.g. `disabled`) map to the matching boolean prop (`disabled: true`);
 * the rest pass through as `{ <dim>: <value> }`. */
export function cellToProps(cell: Cell): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [dim, value] of Object.entries(cell)) {
    if (dim === "visualStates") props[value] = true;
    else props[dim] = value;
  }
  return props;
}

export function coverageFixtures(spec: TestsSpec): CoverageFixture[] {
  const dimensions = collectCoverageDimensions(spec);
  if (dimensions.length === 0) return [];
  const constraints = collectConstraints(spec);
  // Pairwise evaluates constraints against the *translated* cell so a
  // constraint referencing `loading: true` matches a cell that translated a
  // `visualStates: "loading"` dimension into `{ loading: true }`.
  const cells = expandPairwise(dimensions, constraints, cellToProps);
  return cells.map((cell) => ({
    id: coverageFixtureId(cell, dimensions),
    props: cellToProps(cell),
  }));
}

/** Throws if any fixture ID collides — examples may share an ID with each
 * other or with a coverage cell; the rendered fixtures map keyed by ID would
 * silently overwrite the loser. */
export function assertUniqueFixtureIds(ids: readonly string[], spec: TestsSpec): void {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) {
    throw new Error(
      `gen-tests: duplicate fixture id(s) in spec "${spec.name}": ${[...dupes].join(", ")}`,
    );
  }
}
