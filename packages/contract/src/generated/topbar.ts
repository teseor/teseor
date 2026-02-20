// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface TopbarProps {
  sticky?: boolean;
  fixed?: boolean;
  bordered?: boolean;
  raised?: boolean;
}

export const topbar = Object.assign(
  (props?: TopbarProps): string => {
    if (!props) return cx('topbar');
    return cx('topbar', {
      sticky: props.sticky,
      fixed: props.fixed,
      bordered: props.bordered,
      raised: props.raised,
    });
  },
  {
    start: (): string => cx('topbar__start'),
    center: (): string => cx('topbar__center'),
    end: (): string => cx('topbar__end'),
  },
);
