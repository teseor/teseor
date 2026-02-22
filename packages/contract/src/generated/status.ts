// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type StatusSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type StatusVariant = 'danger' | 'info' | 'success' | 'warning';

export interface StatusProps {
  pulse?: boolean;
  size?: StatusSize;
  variant?: StatusVariant;
}

export const status = Object.assign(
  (props?: StatusProps): string => {
    if (!props) return cx('status');
    return cx('status', {
      pulse: props.pulse,
      size: props.size,
      variant: props.variant,
    });
  },
  {
    dot: (): string => cx('status__dot'),
  },
);
