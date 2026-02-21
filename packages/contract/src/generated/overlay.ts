// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface OverlayProps {
  animate?: boolean;
  blur?: boolean;
  entering?: boolean;
  exiting?: boolean;
  hidden?: boolean;
  light?: boolean;
  visible?: boolean;
}

export function overlay(props?: OverlayProps): string {
  if (!props) return cx('overlay');
  return cx('overlay', {
    animate: props.animate,
    blur: props.blur,
    entering: props.entering,
    exiting: props.exiting,
    hidden: props.hidden,
    light: props.light,
    visible: props.visible,
  });
}
