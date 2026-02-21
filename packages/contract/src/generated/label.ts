// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type LabelSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LabelProps {
  size?: LabelSize;
}

export const label = Object.assign(
  (props?: LabelProps): string => {
    if (!props) return cx('label');
    return cx('label', {
      size: props.size,
    });
  },
  {
    optional: (): string => cx('label__optional'),
    required: (): string => cx('label__required'),
  },
);
