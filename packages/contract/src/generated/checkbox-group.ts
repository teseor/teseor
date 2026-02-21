// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface CheckboxGroupProps {
  compact?: boolean;
  error?: boolean;
  horizontal?: boolean;
}

export const checkboxGroup = Object.assign(
  (props?: CheckboxGroupProps): string => {
    if (!props) return cx('checkbox-group');
    return cx('checkbox-group', {
      compact: props.compact,
      error: props.error,
      horizontal: props.horizontal,
    });
  },
  {
    legend: (): string => cx('checkbox-group__legend'),
    items: (): string => cx('checkbox-group__items'),
    item: (): string => cx('checkbox-group__item'),
  },
);
