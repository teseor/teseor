import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const PACKAGES_DIR = join(ROOT, 'packages');
const SRC_DIR = join(PACKAGES_DIR, 'css/src');
const COMPONENTS_DIR = join(SRC_DIR, 'components');

const TYPE_PATHS: Record<string, string> = {
  token: 'tokens',
  primitive: 'primitives',
  component: 'components',
  utility: 'utilities',
  guide: 'guides',
};

const PATH_TYPE_MAP: [string, string][] = [
  ['components/', 'component'],
  ['layout/', 'primitive'],
  ['utilities/', 'utility'],
  ['config/tokens/', 'token'],
  ['config/guides/', 'guide'],
  ['base/', 'token'],
  ['debug/', 'utility'],
];

export interface DocSection {
  id: string;
  layout: string | null;
  rawHtml: string;
}

export interface DocEntry {
  id: string;
  title: string;
  description: string;
  type: string;
  typePath: string;
  group: string | null;
  groupLabel: string | null;
  weight: number | null;
  permalink: string;
  apiData: Record<string, unknown> | null;
  sections: DocSection[];
}

// Custom frontmatter parser matching html-doc-parser.js
// Handles unquoted colons in values (which break gray-matter/YAML)
function parseFrontmatter(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split('\n');
  let currentKey: string | null = null;
  let currentMap: Record<string, unknown> | null = null;

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const mapEntryMatch = line.match(/^(\s+)(\w[\w-]*):\s*(.*)$/);
    const topMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);

    if (topMatch && !line.startsWith(' ')) {
      if (currentKey && currentMap) {
        result[currentKey] = currentMap;
      }

      const [, key, val] = topMatch;
      const trimmed = val.trim();

      if (trimmed === '') {
        currentKey = key;
        currentMap = {};
      } else {
        currentKey = null;
        currentMap = null;
        result[key] = parseScalar(trimmed);
      }
    } else if (mapEntryMatch && currentKey && currentMap) {
      const [, , key, val] = mapEntryMatch;
      currentMap[key] = parseScalar(val.trim());
    }
  }

  if (currentKey && currentMap) {
    result[currentKey] = currentMap;
  }

  return result;
}

function parseScalar(val: string): string | number | boolean | null {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

function extractFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    return {
      frontmatter: parseFrontmatter(fmMatch[1]),
      body: fmMatch[2],
    };
  }
  return { frontmatter: {}, body: content };
}

function deriveTypeFromPath(filePath: string): string {
  const rel = relative(SRC_DIR, filePath).split(sep).join('/');
  for (const [prefix, type] of PATH_TYPE_MAP) {
    if (rel.startsWith(prefix)) return type;
  }
  return 'component';
}

function deriveIdFromPath(filePath: string, type: string): string {
  const rel = relative(SRC_DIR, filePath).split(sep).join('/');
  const dirName = dirname(rel).split('/').pop() ?? '';
  const fileName = filePath.split(sep).pop() ?? '';

  if (type === 'guide' && fileName.endsWith('.docs.html')) {
    return fileName.replace('.docs.html', '');
  }

  if (type === 'utility' && !rel.startsWith('debug/')) {
    return `${dirName}-utils`;
  }

  return dirName;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getGroupFromPath(docsFilePath: string): string | null {
  const rel = relative(COMPONENTS_DIR, docsFilePath);
  const parts = rel.split(sep);
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

function loadGroupOrder(): { groupOrder: string[] } {
  const configPath = join(PACKAGES_DIR, 'css/component-groups.config.json');
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

function discoverComponentGroups(): Map<string, { label: string; components: string[] }> {
  if (!existsSync(COMPONENTS_DIR)) return new Map();

  const groups = new Map<string, { label: string; components: string[] }>();
  const entries = readdirSync(COMPONENTS_DIR)
    .filter((name) => {
      if (name.startsWith('.') || name === 'index.scss') return false;
      return statSync(join(COMPONENTS_DIR, name)).isDirectory();
    })
    .sort();

  for (const groupName of entries) {
    const groupPath = join(COMPONENTS_DIR, groupName);
    if (existsSync(join(groupPath, 'index.scss'))) continue;

    const components = readdirSync(groupPath)
      .filter((name) => {
        if (name.startsWith('.')) return false;
        const fullPath = join(groupPath, name);
        return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'index.scss'));
      })
      .sort();

    if (components.length > 0) {
      groups.set(groupName, { label: humanize(groupName), components });
    }
  }

  return groups;
}

function findDocsFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (
      stat.isDirectory() &&
      !entry.startsWith('.') &&
      entry !== 'node_modules' &&
      entry !== 'dist'
    ) {
      findDocsFiles(fullPath, files);
    } else if (entry === 'docs.html' || entry.endsWith('.docs.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseSections(body: string): DocSection[] {
  const sectionRegex = /<!--\s*@(\w+)(?:\s*\|\s*(\w+))?\s*-->/g;
  const sections: DocSection[] = [];
  let lastIndex = 0;
  let lastSection: { id: string; layout: string | null } | null = null;

  let match = sectionRegex.exec(body);
  while (match !== null) {
    if (lastSection) {
      sections.push({
        ...lastSection,
        rawHtml: body.substring(lastIndex, match.index).trim(),
      });
    }

    lastSection = {
      id: match[1],
      layout: match[2] || null,
    };
    lastIndex = match.index + match[0].length;
    match = sectionRegex.exec(body);
  }

  if (lastSection) {
    sections.push({
      ...lastSection,
      rawHtml: body.substring(lastIndex).trim(),
    });
  }

  if (sections.length === 0 && body.trim()) {
    sections.push({
      id: 'default',
      layout: null,
      rawHtml: body.trim(),
    });
  }

  return sections;
}

function resolveDocEntry(
  filePath: string,
  groupsMap: Map<string, { label: string; components: string[] }>,
): DocEntry | null {
  const raw = readFileSync(filePath, 'utf-8');
  const { frontmatter: fm, body } = extractFrontmatter(raw);

  // Skip docs with mergeInto
  if (fm.mergeInto) return null;

  let apiData: Record<string, unknown> | null = null;
  const apiRef = (fm.api as string) ?? './api.json';
  const apiPath = join(dirname(filePath), apiRef);
  try {
    apiData = JSON.parse(readFileSync(apiPath, 'utf-8'));
  } catch {
    // api not found
  }

  const type = (fm.type as string) ?? deriveTypeFromPath(filePath);
  const id =
    (fm.id as string) ??
    deriveIdFromPath(filePath, type) ??
    (apiData as { name?: string })?.name ??
    '';
  const groupId = type === 'component' ? getGroupFromPath(filePath) : null;
  const groupInfo = groupId ? groupsMap.get(groupId) : null;
  const typePath = TYPE_PATHS[type] ?? type;
  const sections = parseSections(body);

  return {
    id,
    title:
      (fm.title as string) ??
      (apiData ? capitalize((apiData as { name?: string }).name ?? id) : id),
    description:
      (fm.description as string) ?? (apiData as { description?: string })?.description ?? '',
    type,
    typePath,
    group: groupId,
    groupLabel: groupInfo?.label ?? null,
    weight: (fm.weight as number) ?? null,
    permalink: `/${typePath}/${id}/`,
    apiData,
    sections,
  };
}

export function loadAllDocs(): DocEntry[] {
  const docsFiles = findDocsFiles(PACKAGES_DIR);
  const groupConfig = loadGroupOrder();
  const discoveredGroups = discoverComponentGroups();

  const groupsMap = new Map<string, { label: string; components: string[] }>();
  for (const gid of groupConfig.groupOrder) {
    const g = discoveredGroups.get(gid);
    if (g) groupsMap.set(gid, g);
  }

  const entries: DocEntry[] = [];
  for (const file of docsFiles) {
    try {
      const entry = resolveDocEntry(file, groupsMap);
      if (entry) entries.push(entry);
    } catch (err) {
      console.error(`Error loading ${file}: ${(err as Error).message}`);
    }
  }

  return entries;
}
