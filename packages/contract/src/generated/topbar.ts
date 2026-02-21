// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface TopbarProps {
  bordered?: boolean;
  fixed?: boolean;
  raised?: boolean;
  sticky?: boolean;
}

export const topbar = Object.assign(
  (props?: TopbarProps): string => {
    if (!props) return cx('topbar');
    return cx('topbar', {
      bordered: props.bordered,
      fixed: props.fixed,
      raised: props.raised,
      sticky: props.sticky,
    });
  },
  {
    center: (): string => cx('topbar__center'),
    end: (): string => cx('topbar__end'),
    start: (): string => cx('topbar__start'),
  },
);
