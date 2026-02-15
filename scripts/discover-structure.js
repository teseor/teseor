#!/usr/bin/env node
/**
 * Shared discovery module for scanning component and layout directories.
 * Derives structure from filesystem — no manual registration needed.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function isComponentDir(dirPath) {
  return statSync(dirPath).isDirectory() && existsSync(join(dirPath, 'index.scss'));
}

function humanize(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Scan layout/ for primitives (dirs with index.scss).
 * Returns sorted array of primitive names.
 */
export function discoverPrimitives(layoutDir) {
  if (!existsSync(layoutDir)) return [];

  return readdirSync(layoutDir)
    .filter((name) => {
      if (name.startsWith('.') || name === 'index.scss') return false;
      return isComponentDir(join(layoutDir, name));
    })
    .sort();
}

/**
 * Scan components/[group]/[name]/ structure.
 * Returns Map<groupId, { label, components[] }> where components are sorted.
 */
export function discoverComponents(componentsDir) {
  if (!existsSync(componentsDir)) return new Map();

  const groups = new Map();
  const entries = readdirSync(componentsDir)
    .filter((name) => {
      if (name.startsWith('.') || name === 'index.scss') return false;
      return statSync(join(componentsDir, name)).isDirectory();
    })
    .sort();

  for (const groupName of entries) {
    const groupPath = join(componentsDir, groupName);

    // Skip if this is a direct component (no group nesting)
    if (existsSync(join(groupPath, 'index.scss'))) continue;

    const components = readdirSync(groupPath)
      .filter((name) => {
        if (name.startsWith('.')) return false;
        return isComponentDir(join(groupPath, name));
      })
      .sort();

    if (components.length > 0) {
      groups.set(groupName, {
        label: humanize(groupName),
        components,
      });
    }
  }

  return groups;
}
