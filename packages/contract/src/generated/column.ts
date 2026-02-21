// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ColumnSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ColumnProps {
  size?: ColumnSize;
}

export function column(props?: ColumnProps): string {
  if (!props) return cx('column');
  return cx('column', {
    size: props.size,
  });
}
