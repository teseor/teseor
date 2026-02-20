import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');

interface DocData {
  title: string;
  type: string;
  typePath: string;
  group: string | null;
  groupLabel: string | null;
  weight: number | null;
  permalink: string;
}

export interface SidebarItem {
  title: string;
  permalink: string;
}

export interface SidebarSubgroup {
  id: string;
  label: string;
  items: SidebarItem[];
}

export interface SidebarGroup {
  id: string;
  label: string;
  items?: SidebarItem[];
  subgroups?: SidebarSubgroup[];
}

function sortByTitle(a: SidebarItem, b: SidebarItem): number {
  return a.title.localeCompare(b.title);
}

function sortByWeight(
  a: { weight: number | null; title: string },
  b: { weight: number | null; title: string },
): number {
  const wa = a.weight ?? Number.MAX_SAFE_INTEGER;
  const wb = b.weight ?? Number.MAX_SAFE_INTEGER;
  return wa !== wb ? wa - wb : a.title.localeCompare(b.title);
}

export function buildSidebar(docs: { id: string; data: DocData }[]): SidebarGroup[] {
  const groupConfig: { groupOrder: string[] } = JSON.parse(
    readFileSync(join(ROOT, 'packages/css/component-groups.config.json'), 'utf-8'),
  );

  const byType = (type: string) => docs.filter((d) => d.data.type === type);
  const byGroup = (groupId: string) => docs.filter((d) => d.data.group === groupId);

  const groups: SidebarGroup[] = [];

  // Guides (sorted by weight)
  const guides = byType('guide');
  if (guides.length > 0) {
    const sorted = guides
      .map((d) => ({ title: d.data.title, permalink: d.data.permalink, weight: d.data.weight }))
      .sort(sortByWeight);
    groups.push({ id: 'guides', label: 'Guides', items: sorted });
  }

  // Foundation (tokens, sorted by title)
  const tokens = byType('token');
  if (tokens.length > 0) {
    const sorted = tokens
      .map((d) => ({ title: d.data.title, permalink: d.data.permalink }))
      .sort(sortByTitle);
    groups.push({ id: 'foundation', label: 'Foundation', items: sorted });
  }

  // Layout (primitives, sorted by title)
  const primitives = byType('primitive');
  if (primitives.length > 0) {
    const sorted = primitives
      .map((d) => ({ title: d.data.title, permalink: d.data.permalink }))
      .sort(sortByTitle);
    groups.push({ id: 'layout', label: 'Layout', items: sorted });
  }

  // Components (grouped by subgroup, excluding typography)
  const components = byType('component');
  if (components.length > 0) {
    const subgroups: SidebarSubgroup[] = [];
    for (const gid of groupConfig.groupOrder) {
      if (gid === 'typography') continue;
      const groupDocs = byGroup(gid);
      if (groupDocs.length > 0) {
        const items = groupDocs
          .map((d) => ({ title: d.data.title, permalink: d.data.permalink }))
          .sort(sortByTitle);
        const label = groupDocs[0].data.groupLabel ?? gid.charAt(0).toUpperCase() + gid.slice(1);
        subgroups.push({ id: gid, label, items });
      }
    }
    if (subgroups.length > 0) {
      groups.push({ id: 'components', label: 'Components', subgroups });
    }
  }

  // Typography (separate top-level section)
  const typographyDocs = byGroup('typography');
  if (typographyDocs.length > 0) {
    const sorted = typographyDocs
      .map((d) => ({ title: d.data.title, permalink: d.data.permalink }))
      .sort(sortByTitle);
    groups.push({ id: 'typography', label: 'Typography', items: sorted });
  }

  // Utilities (sorted by title)
  const utilities = byType('utility');
  if (utilities.length > 0) {
    const sorted = utilities
      .map((d) => ({ title: d.data.title, permalink: d.data.permalink }))
      .sort(sortByTitle);
    groups.push({ id: 'utilities', label: 'Utilities', items: sorted });
  }

  return groups;
}
