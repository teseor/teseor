// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type InputSize = 'sm' | 'lg';
export type InputVariant = 'filled' | 'ghost';
export type InputState = 'error' | 'success';

export interface InputProps {
  size?: InputSize;
  variant?: InputVariant;
  state?: InputState;
  autoSize?: boolean;
  block?: boolean;
}

export function input(props?: InputProps): string {
  if (!props) return cx('input');
  return cx('input', {
    size: props.size,
    variant: props.variant,
    state: props.state,
    'auto-size': props.autoSize,
    block: props.block,
  });
}

export interface InputGroupProps {
  hasPrefix?: boolean;
  hasSuffix?: boolean;
}

export interface InputGroupAddonProps {
  start?: boolean;
  end?: boolean;
  interactive?: boolean;
}

export const inputGroup = Object.assign(
  (props?: InputGroupProps): string => {
    if (!props) return cx('input-group');
    return cx('input-group', {
      'has-prefix': props.hasPrefix,
      'has-suffix': props.hasSuffix,
    });
  },
  {
    addon: (props?: InputGroupAddonProps): string => {
      if (!props) return cx('input-group__addon');
      return cx('input-group__addon', {
        start: props.start,
        end: props.end,
        interactive: props.interactive,
      });
    },
  },
);
