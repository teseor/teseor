// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type CheckboxSize = 'lg';
export type CheckboxState = 'error' | 'success';

export interface CheckboxProps {
  size?: CheckboxSize;
  state?: CheckboxState;
}

export function checkbox(props?: CheckboxProps): string {
  if (!props) return cx('checkbox');
  return cx('checkbox', {
    size: props.size,
    state: props.state,
  });
}
