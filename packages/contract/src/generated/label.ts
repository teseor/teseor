// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type LabelSize = 'lg';

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
    required: (): string => cx('label__required'),
    optional: (): string => cx('label__optional'),
  },
);
