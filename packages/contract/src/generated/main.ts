// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface MainProps {
  full?: boolean;
  sidebarEnd?: boolean;
}

export function main(props?: MainProps): string {
  if (!props) return cx('main');
  return cx('main', {
    full: props.full,
    'sidebar-end': props.sidebarEnd,
  });
}
