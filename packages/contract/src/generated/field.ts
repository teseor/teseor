// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface FieldProps {
  horizontal?: boolean;
  responsive?: boolean;
}

export const field = Object.assign(
  (props?: FieldProps): string => {
    if (!props) return cx('field');
    return cx('field', {
      horizontal: props.horizontal,
      responsive: props.responsive,
    });
  },
  {
    control: (): string => cx('field__control'),
    label: (): string => cx('field__label'),
  },
);
