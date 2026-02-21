// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SliderSize = 'sm' | 'lg';
export type SliderColor = 'success' | 'warning' | 'danger';

export interface SliderProps {
  size?: SliderSize;
  color?: SliderColor;
}

export function slider(props?: SliderProps): string {
  if (!props) return cx('slider');
  return cx('slider', {
    size: props.size,
    color: props.color,
  });
}
