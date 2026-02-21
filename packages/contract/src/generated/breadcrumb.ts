// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface BreadcrumbItemProps {
  hidden?: boolean;
}

export const breadcrumb = Object.assign((): string => cx('breadcrumb'), {
  item: (props?: BreadcrumbItemProps): string => {
    if (!props) return cx('breadcrumb__item');
    return cx('breadcrumb__item', {
      hidden: props.hidden,
    });
  },
  link: (): string => cx('breadcrumb__link'),
  current: (): string => cx('breadcrumb__current'),
  ellipsis: (): string => cx('breadcrumb__ellipsis'),
});
