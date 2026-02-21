// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ScrollAreaDirection = 'both' | 'horizontal';
export type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ScrollAreaProps {
  autoHide?: boolean;
  direction?: ScrollAreaDirection;
  size?: ScrollAreaSize;
  thin?: boolean;
}

export const scrollArea = Object.assign(
  (props?: ScrollAreaProps): string => {
    if (!props) return cx('scroll-area');
    return cx('scroll-area', {
      'auto-hide': props.autoHide,
      direction: props.direction,
      size: props.size,
      thin: props.thin,
    });
  },
  {
    viewport: (): string => cx('scroll-area__viewport'),
  },
);
