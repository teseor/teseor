// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SelectSize = 'sm' | 'lg';
export type SelectVariant = 'filled' | 'ghost';
export type SelectState = 'error' | 'success';

export interface SelectProps {
  size?: SelectSize;
  variant?: SelectVariant;
  state?: SelectState;
  block?: boolean;
}

export function select(props?: SelectProps): string {
  if (!props) return cx('select');
  return cx('select', {
    size: props.size,
    variant: props.variant,
    state: props.state,
    block: props.block,
  });
}
