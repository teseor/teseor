// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type AspectRatioRatio = 'photo' | 'portrait' | 'square' | 'video' | 'wide';

export interface AspectRatioProps {
  ratio?: AspectRatioRatio;
}

export function aspectRatio(props?: AspectRatioProps): string {
  if (!props) return cx('aspect-ratio');
  return cx('aspect-ratio', {
    ratio: props.ratio,
  });
}
