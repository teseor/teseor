// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SelectState = 'error' | 'success';
export type SelectVariant = 'filled' | 'ghost';

export interface SelectProps {
  block?: boolean;
  size?: SelectSize;
  state?: SelectState;
  variant?: SelectVariant;
}

export function select(props?: SelectProps): string {
  if (!props) return cx('select');
  return cx('select', {
    block: props.block,
    size: props.size,
    state: props.state,
    variant: props.variant,
  });
}
