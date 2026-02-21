// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type RadioState = 'error' | 'success';

export interface RadioProps {
  size?: RadioSize;
  state?: RadioState;
}

export function radio(props?: RadioProps): string {
  if (!props) return cx('radio');
  return cx('radio', {
    size: props.size,
    state: props.state,
  });
}
