// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ProgressSize = 'sm' | 'lg';
export type ProgressVariant = 'success' | 'warning' | 'danger';

export interface ProgressProps {
  size?: ProgressSize;
  variant?: ProgressVariant;
  indeterminate?: boolean;
  striped?: boolean;
  animated?: boolean;
}

export const progress = Object.assign(
  (props?: ProgressProps): string => {
    if (!props) return cx('progress');
    return cx('progress', {
      size: props.size,
      variant: props.variant,
      indeterminate: props.indeterminate,
      striped: props.striped,
      animated: props.animated,
    });
  },
  {
    bar: (): string => cx('progress__bar'),
  },
);
