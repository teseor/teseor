import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VOCABULARY_PATH = resolve(REPO_ROOT, "specs", "_vocabulary.yaml");

type EventVocabulary = {
  verbs: Record<string, string>;
  synonyms: Record<string, string>;
  pattern: string;
  builtins: Record<string, string>;
};

type FormControlPropEntry = {
  type: "string" | "boolean" | "number";
  description: string;
};

export type FormControlContract = {
  /** HTML tags allowed as the form-control root (or as branches of an
   *  `elementByProp` map). */
  elements: string[];
  /** Shared props injected/forbidden-from-redeclaration on every
   *  `formControl: true` spec. */
  props: Record<string, FormControlPropEntry>;
};

export type Vocabulary = {
  components: string[];
  props: string[];
  propDescriptions: Record<string, string>;
  variants: string[];
  intents: string[];
  sizes: string[];
  sizeMap: Record<string, number>;
  states: string[];
  parts: string[];
  events: EventVocabulary;
  dom_events: Record<string, string>;
  keys: Record<string, string>;
  formControl: FormControlContract;
};

let cached: Vocabulary | null = null;

export async function loadVocabulary(): Promise<Vocabulary> {
  if (cached) return cached;
  const raw = await readFile(VOCABULARY_PATH, "utf8");
  cached = parseYaml(raw) as Vocabulary;
  return cached;
}
