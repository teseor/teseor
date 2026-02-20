// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type PaginationSize = 'sm' | 'lg';

export interface PaginationProps {
  size?: PaginationSize;
}

export interface PaginationLinkProps {
  active?: boolean;
  disabled?: boolean;
}

export const pagination = Object.assign(
  (props?: PaginationProps): string => {
    if (!props) return cx('pagination');
    return cx('pagination', {
      size: props.size,
    });
  },
  {
    list: (): string => cx('pagination__list'),
    item: (): string => cx('pagination__item'),
    link: (props?: PaginationLinkProps): string => {
      if (!props) return cx('pagination__link');
      return cx('pagination__link', {
        active: props.active,
        disabled: props.disabled,
      });
    },
    prev: (): string => cx('pagination__prev'),
    next: (): string => cx('pagination__next'),
    ellipsis: (): string => cx('pagination__ellipsis'),
  },
);
