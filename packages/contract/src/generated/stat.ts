// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type StatSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface StatProps {
  size?: StatSize;
}

export const stat = Object.assign(
  (props?: StatProps): string => {
    if (!props) return cx('stat');
    return cx('stat', {
      size: props.size,
    });
  },
  {
    label: (): string => cx('stat__label'),
    value: (): string => cx('stat__value'),
  },
);
