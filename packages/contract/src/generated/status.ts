// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info';
export type StatusSize = 'sm' | 'lg';

export interface StatusProps {
  variant?: StatusVariant;
  size?: StatusSize;
  pulse?: boolean;
}

export const status = Object.assign(
  (props?: StatusProps): string => {
    if (!props) return cx('status');
    return cx('status', {
      variant: props.variant,
      size: props.size,
      pulse: props.pulse,
    });
  },
  {
    dot: (): string => cx('status__dot'),
  },
);
