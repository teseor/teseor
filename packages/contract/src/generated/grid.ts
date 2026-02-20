// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type GridColumns = '2' | '3' | '4' | 'auto';

export interface GridProps {
  columns?: GridColumns;
  subgrid?: boolean;
  subgridRows?: boolean;
  subgridBoth?: boolean;
}

export function grid(props?: GridProps): string {
  if (!props) return cx('grid');
  return cx('grid', {
    columns: props.columns,
    subgrid: props.subgrid,
    'subgrid-rows': props.subgridRows,
    'subgrid-both': props.subgridBoth,
  });
}
