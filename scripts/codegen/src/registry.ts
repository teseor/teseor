type GeneratorContext = {
  args: Record<string, string | undefined>;
  positionals: readonly string[];
};

type GeneratorReport = {
  filesWritten: string[];
  notes: string[];
};

type GeneratorFn = (ctx: GeneratorContext) => Promise<GeneratorReport> | GeneratorReport;

const REGISTRY = new Map<string, GeneratorFn>();

function registerGenerator(name: string, fn: GeneratorFn): void {
  if (REGISTRY.has(name)) {
    throw new Error(`generator "${name}" is already registered`);
  }
  REGISTRY.set(name, fn);
}

function getGenerator(name: string): GeneratorFn | undefined {
  return REGISTRY.get(name);
}

function listGenerators(): string[] {
  return [...REGISTRY.keys()].sort();
}

export type { GeneratorContext, GeneratorFn, GeneratorReport };
export { getGenerator, listGenerators, registerGenerator };
