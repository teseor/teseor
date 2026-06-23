export const APPEND_SLOTS = [
  "react.module.imports",
  "react.module.typeAliases",
  "react.module.constants",
  "react.component.jsdoc",
  "react.component.propsTypeOwn",
  "react.component.bodyDestructure",
  "react.component.bodyHelpers",
  "react.component.useStateInits",
  "react.component.useEffectBlocks",
  "react.component.useRefDecls",
  "react.root.attrs",

  "vue.module.imports",
  "vue.module.typeAliases",
  "vue.component.jsdoc",
  "vue.component.propsType",
  "vue.component.bodyHelpers",
  "vue.component.refDecls",
  "vue.component.watchEffects",
  "vue.root.attrs",

  "contract.atomic.propMembers",
  "contract.atomic.typeAliases",
  "contract.atomic.eventMembers",
  "contract.composite.partTypeMembers",

  "docs.atomic.jsdocExamples",
  "docs.atomic.propsSection",
  "docs.atomic.examplesSection",
  "docs.composite.partsTable",

  "tests.atomic.fixtureProps",
  "tests.atomic.specProps",
] as const;

export const EXCLUSIVE_SLOTS = [
  "react.root.tag",
  "react.root.childrenBody",
  "vue.root.tag",
  "vue.root.childrenBody",
] as const;

export const DECORATE_SLOTS = ["react.root.bodyWrap", "vue.root.bodyWrap"] as const;

export type AppendSlot = (typeof APPEND_SLOTS)[number];
export type ExclusiveSlot = (typeof EXCLUSIVE_SLOTS)[number];
export type DecorateSlot = (typeof DECORATE_SLOTS)[number];
export type EmitSlot = AppendSlot | ExclusiveSlot | DecorateSlot;

export function slotKind(slot: EmitSlot): "append" | "exclusive" | "decorate" {
  if ((APPEND_SLOTS as readonly string[]).includes(slot)) return "append";
  if ((EXCLUSIVE_SLOTS as readonly string[]).includes(slot)) return "exclusive";
  return "decorate";
}
