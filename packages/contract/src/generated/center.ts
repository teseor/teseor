// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface CenterProps {
  column?: boolean;
}

export function center(props?: CenterProps): string {
  if (!props) return cx('center');
  return cx('center', {
    column: props.column,
  });
}
