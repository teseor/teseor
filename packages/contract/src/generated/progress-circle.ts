// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ProgressCircleSize = 'sm' | 'lg' | 'xl';
export type ProgressCircleVariant = 'success' | 'warning' | 'danger';

export interface ProgressCircleProps {
  size?: ProgressCircleSize;
  variant?: ProgressCircleVariant;
  indeterminate?: boolean;
}

export const progressCircle = Object.assign(
  (props?: ProgressCircleProps): string => {
    if (!props) return cx('progress-circle');
    return cx('progress-circle', {
      size: props.size,
      variant: props.variant,
      indeterminate: props.indeterminate,
    });
  },
  {
    track: (): string => cx('progress-circle__track'),
    fill: (): string => cx('progress-circle__fill'),
  },
);
