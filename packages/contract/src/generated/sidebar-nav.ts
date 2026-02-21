// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface SidebarNavProps {
  collapsed?: boolean;
}

export interface SidebarNavItemProps {
  active?: boolean;
  nested?: boolean;
  disabled?: boolean;
}

export const sidebarNav = Object.assign(
  (props?: SidebarNavProps): string => {
    if (!props) return cx('sidebar-nav');
    return cx('sidebar-nav', {
      collapsed: props.collapsed,
    });
  },
  {
    header: (): string => cx('sidebar-nav__header'),
    content: (): string => cx('sidebar-nav__content'),
    footer: (): string => cx('sidebar-nav__footer'),
    group: (): string => cx('sidebar-nav__group'),
    groupLabel: (): string => cx('sidebar-nav__group-label'),
    groupItems: (): string => cx('sidebar-nav__group-items'),
    subgroup: (): string => cx('sidebar-nav__subgroup'),
    subgroupLabel: (): string => cx('sidebar-nav__subgroup-label'),
    item: (props?: SidebarNavItemProps): string => {
      if (!props) return cx('sidebar-nav__item');
      return cx('sidebar-nav__item', {
        active: props.active,
        nested: props.nested,
        disabled: props.disabled,
      });
    },
    icon: (): string => cx('sidebar-nav__icon'),
    label: (): string => cx('sidebar-nav__label'),
    badge: (): string => cx('sidebar-nav__badge'),
  },
);
