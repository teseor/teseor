// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type DrawerPosition = 'bottom' | 'end' | 'start' | 'top';
export type DrawerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DrawerProps {
  position?: DrawerPosition;
  size?: DrawerSize;
}

export const drawer = Object.assign(
  (props?: DrawerProps): string => {
    if (!props) return cx('drawer');
    return cx('drawer', {
      position: props.position,
      size: props.size,
    });
  },
  {
    body: (): string => cx('drawer__body'),
    close: (): string => cx('drawer__close'),
    description: (): string => cx('drawer__description'),
    footer: (): string => cx('drawer__footer'),
    header: (): string => cx('drawer__header'),
    title: (): string => cx('drawer__title'),
  },
);

export function drawerOverlay(): string {
  return cx('drawer-overlay');
}
