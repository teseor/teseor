// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ScrollAreaSize = 'sm' | 'lg' | 'xl';
export type ScrollAreaDirection = 'horizontal' | 'both';

export interface ScrollAreaProps {
  size?: ScrollAreaSize;
  thin?: boolean;
  direction?: ScrollAreaDirection;
  autoHide?: boolean;
}

export const scrollArea = Object.assign(
  (props?: ScrollAreaProps): string => {
    if (!props) return cx('scroll-area');
    return cx('scroll-area', {
      size: props.size,
      thin: props.thin,
      direction: props.direction,
      'auto-hide': props.autoHide,
    });
  },
  {
    viewport: (): string => cx('scroll-area__viewport'),
  },
);
