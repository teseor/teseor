// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type TextareaSize = 'sm' | 'lg';
export type TextareaVariant = 'filled' | 'ghost';
export type TextareaState = 'error' | 'success';
export type TextareaResize = 'resize-none' | 'resize-horizontal' | 'resize-both';

export interface TextareaProps {
  size?: TextareaSize;
  variant?: TextareaVariant;
  state?: TextareaState;
  resize?: TextareaResize;
  autoSize?: boolean;
}

export function textarea(props?: TextareaProps): string {
  if (!props) return cx('textarea');
  return cx('textarea', {
    size: props.size,
    variant: props.variant,
    state: props.state,
    resize: props.resize,
    'auto-size': props.autoSize,
  });
}
