// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface TableProps {
  compact?: boolean;
  striped?: boolean;
}

export function table(props?: TableProps): string {
  if (!props) return cx('table');
  return cx('table', {
    compact: props.compact,
    striped: props.striped,
  });
}
