// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SliderColor = 'danger' | 'success' | 'warning';
export type SliderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SliderProps {
  color?: SliderColor;
  size?: SliderSize;
}

export function slider(props?: SliderProps): string {
  if (!props) return cx('slider');
  return cx('slider', {
    color: props.color,
    size: props.size,
  });
}
