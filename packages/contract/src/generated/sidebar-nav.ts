// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface SidebarNavProps {
  collapsed?: boolean;
}

export interface SidebarNavItemProps {
  active?: boolean;
  disabled?: boolean;
  nested?: boolean;
}

export const sidebarNav = Object.assign(
  (props?: SidebarNavProps): string => {
    if (!props) return cx('sidebar-nav');
    return cx('sidebar-nav', {
      collapsed: props.collapsed,
    });
  },
  {
    badge: (): string => cx('sidebar-nav__badge'),
    content: (): string => cx('sidebar-nav__content'),
    footer: (): string => cx('sidebar-nav__footer'),
    group: (): string => cx('sidebar-nav__group'),
    groupItems: (): string => cx('sidebar-nav__group-items'),
    groupLabel: (): string => cx('sidebar-nav__group-label'),
    header: (): string => cx('sidebar-nav__header'),
    icon: (): string => cx('sidebar-nav__icon'),
    item: (props?: SidebarNavItemProps): string => {
      if (!props) return cx('sidebar-nav__item');
      return cx('sidebar-nav__item', {
        active: props.active,
        disabled: props.disabled,
        nested: props.nested,
      });
    },
    label: (): string => cx('sidebar-nav__label'),
    subgroup: (): string => cx('sidebar-nav__subgroup'),
    subgroupLabel: (): string => cx('sidebar-nav__subgroup-label'),
  },
);
