// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SkeletonVariant = 'text' | 'heading' | 'circle' | 'rect' | 'static';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  pulse?: boolean;
}

export function skeleton(props?: SkeletonProps): string {
  if (!props) return cx('skeleton');
  return cx('skeleton', {
    variant: props.variant,
    pulse: props.pulse,
  });
}
