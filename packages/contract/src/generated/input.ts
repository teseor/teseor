// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputState = 'error' | 'success';
export type InputVariant = 'filled' | 'ghost';

export interface InputProps {
  autoSize?: boolean;
  block?: boolean;
  size?: InputSize;
  state?: InputState;
  variant?: InputVariant;
}

export function input(props?: InputProps): string {
  if (!props) return cx('input');
  return cx('input', {
    'auto-size': props.autoSize,
    block: props.block,
    size: props.size,
    state: props.state,
    variant: props.variant,
  });
}

export interface InputGroupAddonProps {
  end?: boolean;
  interactive?: boolean;
  start?: boolean;
}

export const inputGroup = Object.assign((): string => cx('input-group'), {
  addon: (props?: InputGroupAddonProps): string => {
    if (!props) return cx('input-group__addon');
    return cx('input-group__addon', {
      end: props.end,
      interactive: props.interactive,
      start: props.start,
    });
  },
});
