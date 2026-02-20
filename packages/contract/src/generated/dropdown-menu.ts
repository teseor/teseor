// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface DropdownMenuProps {
  open?: boolean;
  top?: boolean;
  alignEnd?: boolean;
  fullWidth?: boolean;
}

export const dropdownMenu = Object.assign(
  (props?: DropdownMenuProps): string => {
    if (!props) return cx('dropdown-menu');
    return cx('dropdown-menu', {
      open: props.open,
      top: props.top,
      'align-end': props.alignEnd,
      'full-width': props.fullWidth,
    });
  },
  {
    trigger: (): string => cx('dropdown-menu__trigger'),
    triggerIcon: (): string => cx('dropdown-menu__trigger-icon'),
    panel: (): string => cx('dropdown-menu__panel'),
  },
);
