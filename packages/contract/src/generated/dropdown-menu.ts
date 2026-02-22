// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface DropdownMenuProps {
  alignEnd?: boolean;
  fullWidth?: boolean;
  open?: boolean;
  top?: boolean;
}

export const dropdownMenu = Object.assign(
  (props?: DropdownMenuProps): string => {
    if (!props) return cx('dropdown-menu');
    return cx('dropdown-menu', {
      'align-end': props.alignEnd,
      'full-width': props.fullWidth,
      open: props.open,
      top: props.top,
    });
  },
  {
    panel: (): string => cx('dropdown-menu__panel'),
    trigger: (): string => cx('dropdown-menu__trigger'),
    triggerIcon: (): string => cx('dropdown-menu__trigger-icon'),
  },
);
