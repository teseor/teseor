// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface RadioGroupProps {
  compact?: boolean;
  error?: boolean;
  horizontal?: boolean;
}

export const radioGroup = Object.assign(
  (props?: RadioGroupProps): string => {
    if (!props) return cx('radio-group');
    return cx('radio-group', {
      compact: props.compact,
      error: props.error,
      horizontal: props.horizontal,
    });
  },
  {
    legend: (): string => cx('radio-group__legend'),
    items: (): string => cx('radio-group__items'),
    item: (): string => cx('radio-group__item'),
  },
);
