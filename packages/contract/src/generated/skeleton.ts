// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SkeletonVariant = 'circle' | 'heading' | 'rect' | 'static' | 'text';

export interface SkeletonProps {
  pulse?: boolean;
  variant?: SkeletonVariant;
}

export function skeleton(props?: SkeletonProps): string {
  if (!props) return cx('skeleton');
  return cx('skeleton', {
    pulse: props.pulse,
    variant: props.variant,
  });
}
