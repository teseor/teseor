// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CardVariant = 'muted' | 'subtle';

export interface CardProps {
  flush?: boolean;
  interactive?: boolean;
  responsive?: boolean;
  size?: CardSize;
  variant?: CardVariant;
}

export const card = Object.assign(
  (props?: CardProps): string => {
    if (!props) return cx('card');
    return cx('card', {
      flush: props.flush,
      interactive: props.interactive,
      responsive: props.responsive,
      size: props.size,
      variant: props.variant,
    });
  },
  {
    body: (): string => cx('card__body'),
    media: (): string => cx('card__media'),
  },
);
