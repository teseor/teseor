// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface MenuItemProps {
  check?: boolean;
  danger?: boolean;
  disabled?: boolean;
  radio?: boolean;
}

export const menu = Object.assign((): string => cx('menu'), {
  group: (): string => cx('menu__group'),
  item: (props?: MenuItemProps): string => {
    if (!props) return cx('menu__item');
    return cx('menu__item', {
      check: props.check,
      danger: props.danger,
      disabled: props.disabled,
      radio: props.radio,
    });
  },
  itemIcon: (): string => cx('menu__item-icon'),
  itemIndicator: (): string => cx('menu__item-indicator'),
  itemShortcut: (): string => cx('menu__item-shortcut'),
  label: (): string => cx('menu__label'),
  separator: (): string => cx('menu__separator'),
});
