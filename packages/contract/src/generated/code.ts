// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type CodeSize = 'sm';

export interface CodeProps {
  size?: CodeSize;
}

export function code(props?: CodeProps): string {
  if (!props) return cx('code');
  return cx('code', {
    size: props.size,
  });
}
