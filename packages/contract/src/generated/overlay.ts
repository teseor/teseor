// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface OverlayProps {
  light?: boolean;
  blur?: boolean;
  visible?: boolean;
  animate?: boolean;
}

export function overlay(props?: OverlayProps): string {
  if (!props) return cx('overlay');
  return cx('overlay', {
    light: props.light,
    blur: props.blur,
    visible: props.visible,
    animate: props.animate,
  });
}
