// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type DrawerSize = 'sm' | 'lg' | 'full';
export type DrawerPosition = 'end' | 'start' | 'top' | 'bottom';

export interface DrawerProps {
  size?: DrawerSize;
  position?: DrawerPosition;
}

export const drawer = Object.assign(
  (props?: DrawerProps): string => {
    if (!props) return cx('drawer');
    return cx('drawer', {
      size: props.size,
      position: props.position,
    });
  },
  {
    header: (): string => cx('drawer__header'),
    title: (): string => cx('drawer__title'),
    description: (): string => cx('drawer__description'),
    close: (): string => cx('drawer__close'),
    body: (): string => cx('drawer__body'),
    footer: (): string => cx('drawer__footer'),
  },
);

export function drawerOverlay(): string {
  return cx('drawer-overlay');
}
