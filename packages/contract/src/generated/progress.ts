// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ProgressVariant = 'danger' | 'success' | 'warning';

export interface ProgressProps {
  animated?: boolean;
  indeterminate?: boolean;
  size?: ProgressSize;
  striped?: boolean;
  variant?: ProgressVariant;
}

export const progress = Object.assign(
  (props?: ProgressProps): string => {
    if (!props) return cx('progress');
    return cx('progress', {
      animated: props.animated,
      indeterminate: props.indeterminate,
      size: props.size,
      striped: props.striped,
      variant: props.variant,
    });
  },
  {
    bar: (): string => cx('progress__bar'),
  },
);
