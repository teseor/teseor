// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SidebarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SidebarProps {
  end?: boolean;
  size?: SidebarSize;
}

export function sidebar(props?: SidebarProps): string {
  if (!props) return cx('sidebar');
  return cx('sidebar', {
    end: props.end,
    size: props.size,
  });
}
