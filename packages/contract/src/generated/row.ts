// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type RowSize = 'xs' | 'sm' | 'md' | 'lg' | 'start' | 'center' | 'end' | 'between';

export interface RowProps {
  size?: RowSize;
}

export function row(props?: RowProps): string {
  if (!props) return cx('row');
  return cx('row', {
    size: props.size,
  });
}
