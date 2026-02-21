// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface ContentProps {
  prose?: boolean;
  flush?: boolean;
}

export function content(props?: ContentProps): string {
  if (!props) return cx('content');
  return cx('content', {
    prose: props.prose,
    flush: props.flush,
  });
}
