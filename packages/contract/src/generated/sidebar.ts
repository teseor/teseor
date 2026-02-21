// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SidebarSize = 'sm' | 'md' | 'lg';

export interface SidebarProps {
  size?: SidebarSize;
  end?: boolean;
}

export function sidebar(props?: SidebarProps): string {
  if (!props) return cx('sidebar');
  return cx('sidebar', {
    size: props.size,
    end: props.end,
  });
}
