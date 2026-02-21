// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SpinnerSize = 'xs' | 'sm' | 'lg' | 'xl';

export interface SpinnerProps {
  size?: SpinnerSize;
}

export function spinner(props?: SpinnerProps): string {
  if (!props) return cx('spinner');
  return cx('spinner', {
    size: props.size,
  });
}
