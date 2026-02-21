/**
 * Hierarchy Configuration
 * Defines component groups and their order for navigation
 */

import type { ComponentGroup } from './docs-schema';

export interface GroupConfig {
  id: ComponentGroup;
  label: string;
  components: string[];
}

/**
 * Component groups with their members
 * Order determines nav display order
 */
export const COMPONENT_GROUPS: GroupConfig[] = [
  {
    id: 'actions',
    label: 'Actions',
    components: ['button', 'button-group'],
  },
  {
    id: 'typography',
    label: 'Typography',
    components: ['heading', 'link', 'code'],
  },
  {
    id: 'forms',
    label: 'Forms',
    components: [
      'label',
      'input',
      'textarea',
      'select',
      'checkbox',
      'radio',
      'toggle',
      'field',
      'form-helper',
      'form-error',
    ],
  },
  {
    id: 'data-display',
    label: 'Data Display',
    components: ['avatar', 'badge', 'icon', 'tag', 'status', 'card', 'table', 'data-list'],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    components: ['alert', 'spinner', 'progress', 'skeleton', 'toast'],
  },
  {
    id: 'overlays',
    label: 'Overlays',
    components: ['overlay', 'tooltip', 'popover', 'modal', 'dialog', 'drawer'],
  },
  {
    id: 'disclosure',
    label: 'Disclosure',
    components: ['disclosure', 'accordion'],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    components: ['tabs', 'breadcrumb', 'menu', 'pagination'],
  },
  {
    id: 'layout',
    label: 'Layout',
    components: ['divider'],
  },
];

/**
 * Get group for a component by id
 */
export function getGroupForComponent(componentId: string): ComponentGroup | undefined {
  for (const group of COMPONENT_GROUPS) {
    if (group.components.includes(componentId)) {
      return group.id;
    }
  }
  return undefined;
}

/**
 * Get group config by id
 */
export function getGroupConfig(groupId: ComponentGroup): GroupConfig | undefined {
  return COMPONENT_GROUPS.find((g) => g.id === groupId);
}
