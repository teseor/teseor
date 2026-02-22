// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconStroke = 'stroke-thick' | 'stroke-thin';

export interface IconProps {
  filled?: boolean;
  size?: IconSize;
  spin?: boolean;
  stroke?: IconStroke;
}

export function icon(props?: IconProps): string {
  if (!props) return cx('icon');
  return cx('icon', {
    filled: props.filled,
    size: props.size,
    spin: props.spin,
    stroke: props.stroke,
  });
}
