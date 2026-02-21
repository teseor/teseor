// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ProgressCircleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ProgressCircleVariant = 'danger' | 'success' | 'warning';

export interface ProgressCircleProps {
  indeterminate?: boolean;
  size?: ProgressCircleSize;
  variant?: ProgressCircleVariant;
}

export const progressCircle = Object.assign(
  (props?: ProgressCircleProps): string => {
    if (!props) return cx('progress-circle');
    return cx('progress-circle', {
      indeterminate: props.indeterminate,
      size: props.size,
      variant: props.variant,
    });
  },
  {
    fill: (): string => cx('progress-circle__fill'),
    track: (): string => cx('progress-circle__track'),
  },
);
