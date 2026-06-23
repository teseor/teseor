export type SpecAnalysis = {
  ariaPropNames: ReadonlySet<string>;
  elementByPropControllingProp: string | undefined;
  controllablePropNames: ReadonlySet<string>;
  slotPropNames: ReadonlySet<string>;
  responsivePropNames: ReadonlySet<string>;
  branchComputes: ReadonlySet<string>;
  hasAs: boolean;
  hasPolymorphic: boolean;
  hasDisabled: boolean;
  hasLoading: boolean;
  voidStatus: "all" | "never" | "mixed";
};

export function emptyAnalysis(): SpecAnalysis {
  return {
    ariaPropNames: new Set(),
    elementByPropControllingProp: undefined,
    controllablePropNames: new Set(),
    slotPropNames: new Set(),
    responsivePropNames: new Set(),
    branchComputes: new Set(),
    hasAs: false,
    hasPolymorphic: false,
    hasDisabled: false,
    hasLoading: false,
    voidStatus: "never",
  };
}

export function mergeAnalysis(a: SpecAnalysis, b: Partial<SpecAnalysis>): SpecAnalysis {
  return {
    ariaPropNames: union(a.ariaPropNames, b.ariaPropNames),
    elementByPropControllingProp: b.elementByPropControllingProp ?? a.elementByPropControllingProp,
    controllablePropNames: union(a.controllablePropNames, b.controllablePropNames),
    slotPropNames: union(a.slotPropNames, b.slotPropNames),
    responsivePropNames: union(a.responsivePropNames, b.responsivePropNames),
    branchComputes: union(a.branchComputes, b.branchComputes),
    hasAs: a.hasAs || (b.hasAs ?? false),
    hasPolymorphic: a.hasPolymorphic || (b.hasPolymorphic ?? false),
    hasDisabled: a.hasDisabled || (b.hasDisabled ?? false),
    hasLoading: a.hasLoading || (b.hasLoading ?? false),
    voidStatus: b.voidStatus ?? a.voidStatus,
  };
}

function union<T>(a: ReadonlySet<T>, b: ReadonlySet<T> | undefined): ReadonlySet<T> {
  if (!b) return a;
  return new Set([...a, ...b]);
}
