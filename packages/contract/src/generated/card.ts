// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type CardVariant = 'subtle' | 'muted';
export type CardSize = 'sm' | 'lg';

export interface CardProps {
  variant?: CardVariant;
  size?: CardSize;
  flush?: boolean;
  interactive?: boolean;
  responsive?: boolean;
}

export const card = Object.assign(
  (props?: CardProps): string => {
    if (!props) return cx('card');
    return cx('card', {
      variant: props.variant,
      size: props.size,
      flush: props.flush,
      interactive: props.interactive,
      responsive: props.responsive,
    });
  },
  {
    media: (): string => cx('card__media'),
    body: (): string => cx('card__body'),
  },
);
