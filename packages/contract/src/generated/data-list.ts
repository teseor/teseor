// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type DataListLayout = 'horizontal';
export type DataListSize = 'sm' | 'lg';
export type DataListStyle = 'divided' | 'striped';

export interface DataListProps {
  layout?: DataListLayout;
  size?: DataListSize;
  style?: DataListStyle;
}

export const dataList = Object.assign(
  (props?: DataListProps): string => {
    if (!props) return cx('data-list');
    return cx('data-list', {
      layout: props.layout,
      size: props.size,
      style: props.style,
    });
  },
  {
    item: (): string => cx('data-list__item'),
    label: (): string => cx('data-list__label'),
    value: (): string => cx('data-list__value'),
  },
);
