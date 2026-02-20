// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type PopoverPosition = 'top' | 'bottom' | 'visible' | 'hidden' | 'animate';

export interface PopoverProps {
  position?: PopoverPosition;
}

export const popover = Object.assign(
  (props?: PopoverProps): string => {
    if (!props) return cx('popover');
    return cx('popover', {
      position: props.position,
    });
  },
  {
    header: (): string => cx('popover__header'),
    title: (): string => cx('popover__title'),
  },
);
