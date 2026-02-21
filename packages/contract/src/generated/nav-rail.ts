// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface NavRailProps {
  end?: boolean;
}

export const navRail = Object.assign(
  (props?: NavRailProps): string => {
    if (!props) return cx('nav-rail');
    return cx('nav-rail', {
      end: props.end,
    });
  },
  {
    items: (): string => cx('nav-rail__items'),
    actions: (): string => cx('nav-rail__actions'),
  },
);
