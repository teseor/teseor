// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type NavPills = 'pills';

export interface NavProps {
  pills?: NavPills;
  responsive?: boolean;
  vertical?: boolean;
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
      responsive: props.responsive,
      vertical: props.vertical,
    });
  },
  {
    item: (props?: NavItemProps): string => {
      if (!props) return cx('nav__item');
      return cx('nav__item', {
        active: props.active,
        disabled: props.disabled,
      });
    },
    list: (): string => cx('nav__list'),
  },
);
