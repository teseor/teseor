// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextareaState = 'error' | 'success';
export type TextareaVariant = 'filled' | 'ghost';

export interface TextareaProps {
  autoSize?: boolean;
  size?: TextareaSize;
  state?: TextareaState;
  variant?: TextareaVariant;
}

export function textarea(props?: TextareaProps): string {
  if (!props) return cx('textarea');
  return cx('textarea', {
    'auto-size': props.autoSize,
    size: props.size,
    state: props.state,
    variant: props.variant,
  });
}
