// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type TooltipPosition = 'top' | 'bottom' | 'start' | 'end';

export interface TooltipProps {
  position?: TooltipPosition;
  visible?: boolean;
  animate?: boolean;
  anchored?: boolean;
}

export function tooltip(props?: TooltipProps): string {
  if (!props) return cx('tooltip');
  return cx('tooltip', {
    position: props.position,
    visible: props.visible,
    animate: props.animate,
    anchored: props.anchored,
  });
}
