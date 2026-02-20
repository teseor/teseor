// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface MenuItemProps {
  danger?: boolean;
  disabled?: boolean;
  check?: boolean;
  radio?: boolean;
}

export const menu = Object.assign((): string => cx('menu'), {
  group: (): string => cx('menu__group'),
  label: (): string => cx('menu__label'),
  item: (props?: MenuItemProps): string => {
    if (!props) return cx('menu__item');
    return cx('menu__item', {
      danger: props.danger,
      disabled: props.disabled,
      check: props.check,
      radio: props.radio,
    });
  },
  itemIcon: (): string => cx('menu__item-icon'),
  itemShortcut: (): string => cx('menu__item-shortcut'),
  separator: (): string => cx('menu__separator'),
  itemIndicator: (): string => cx('menu__item-indicator'),
});
