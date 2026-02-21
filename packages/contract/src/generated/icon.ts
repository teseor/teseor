// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconStroke = 'stroke-thin' | 'stroke-thick';

export interface IconProps {
  size?: IconSize;
  stroke?: IconStroke;
  filled?: boolean;
  spin?: boolean;
}

export function icon(props?: IconProps): string {
  if (!props) return cx('icon');
  return cx('icon', {
    size: props.size,
    stroke: props.stroke,
    filled: props.filled,
    spin: props.spin,
  });
}
