// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type TabsSize = 'sm' | 'lg';

export interface TabsProps {
  size?: TabsSize;
  vertical?: boolean;
}

export interface TabsTabProps {
  active?: boolean;
}

export interface TabsPanelProps {
  active?: boolean;
}

export const tabs = Object.assign(
  (props?: TabsProps): string => {
    if (!props) return cx('tabs');
    return cx('tabs', {
      size: props.size,
      vertical: props.vertical,
    });
  },
  {
    list: (): string => cx('tabs__list'),
    tab: (props?: TabsTabProps): string => {
      if (!props) return cx('tabs__tab');
      return cx('tabs__tab', {
        active: props.active,
      });
    },
    panel: (props?: TabsPanelProps): string => {
      if (!props) return cx('tabs__panel');
      return cx('tabs__panel', {
        active: props.active,
      });
    },
  },
);
