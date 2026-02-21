// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type NavPills = 'pills';

export interface NavProps {
  pills?: NavPills;
  vertical?: boolean;
  responsive?: boolean;
}

export interface NavItemProps {
  active?: boolean;
  disabled?: boolean;
}

export const nav = Object.assign(
  (props?: NavProps): string => {
    if (!props) return cx('nav');
    return cx('nav', {
      pills: props.pills,
      vertical: props.vertical,
      responsive: props.responsive,
    });
  },
  {
    list: (): string => cx('nav__list'),
    item: (props?: NavItemProps): string => {
      if (!props) return cx('nav__item');
      return cx('nav__item', {
        active: props.active,
        disabled: props.disabled,
      });
    },
  },
);
