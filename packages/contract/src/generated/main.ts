// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface MainProps {
  sidebarEnd?: boolean;
  full?: boolean;
}

export function main(props?: MainProps): string {
  if (!props) return cx('main');
  return cx('main', {
    'sidebar-end': props.sidebarEnd,
    full: props.full,
  });
}
