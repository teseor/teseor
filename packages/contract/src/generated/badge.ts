// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BadgeVariant = 'danger' | 'primary' | 'success' | 'warning';

export interface BadgeProps {
  size?: BadgeSize;
  variant?: BadgeVariant;
}

export function badge(props?: BadgeProps): string {
  if (!props) return cx('badge');
  return cx('badge', {
    size: props.size,
    variant: props.variant,
  });
}
