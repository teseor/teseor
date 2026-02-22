// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ListSpacing = 'compact' | 'loose';
export type ListStyle = 'inline' | 'unstyled';

export interface ListProps {
  spacing?: ListSpacing;
  style?: ListStyle;
}

export const list = Object.assign(
  (props?: ListProps): string => {
    if (!props) return cx('list');
    return cx('list', {
      spacing: props.spacing,
      style: props.style,
    });
  },
  {
    item: (): string => cx('list__item'),
  },
);
