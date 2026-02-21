// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface ContentProps {
  flush?: boolean;
  prose?: boolean;
}

export function content(props?: ContentProps): string {
  if (!props) return cx('content');
  return cx('content', {
    flush: props.flush,
    prose: props.prose,
  });
}
