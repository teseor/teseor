// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type TooltipPosition = 'bottom' | 'end' | 'hidden' | 'start' | 'top';

export interface TooltipProps {
  anchored?: boolean;
  animate?: boolean;
  position?: TooltipPosition;
  visible?: boolean;
}

export function tooltip(props?: TooltipProps): string {
  if (!props) return cx('tooltip');
  return cx('tooltip', {
    anchored: props.anchored,
    animate: props.animate,
    position: props.position,
    visible: props.visible,
  });
}
