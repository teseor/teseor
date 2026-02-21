// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface PageHeaderProps {
  bordered?: boolean;
  sticky?: boolean;
}

export const pageHeader = Object.assign(
  (props?: PageHeaderProps): string => {
    if (!props) return cx('page-header');
    return cx('page-header', {
      bordered: props.bordered,
      sticky: props.sticky,
    });
  },
  {
    title: (): string => cx('page-header__title'),
    actions: (): string => cx('page-header__actions'),
    breadcrumb: (): string => cx('page-header__breadcrumb'),
  },
);
