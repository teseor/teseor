// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface FieldsetProps {
  compact?: boolean;
  bordered?: boolean;
}

export const fieldset = Object.assign(
  (props?: FieldsetProps): string => {
    if (!props) return cx('fieldset');
    return cx('fieldset', {
      compact: props.compact,
      bordered: props.bordered,
    });
  },
  {
    legend: (): string => cx('fieldset__legend'),
  },
);
