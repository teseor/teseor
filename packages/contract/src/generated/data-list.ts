// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type DataListSize = 'sm' | 'lg';
export type DataListLayout = 'horizontal';
export type DataListStyle = 'divided' | 'striped';

export interface DataListProps {
  size?: DataListSize;
  layout?: DataListLayout;
  style?: DataListStyle;
}

export const dataList = Object.assign(
  (props?: DataListProps): string => {
    if (!props) return cx('data-list');
    return cx('data-list', {
      size: props.size,
      layout: props.layout,
      style: props.style,
    });
  },
  {
    item: (): string => cx('data-list__item'),
    label: (): string => cx('data-list__label'),
    value: (): string => cx('data-list__value'),
  },
);
