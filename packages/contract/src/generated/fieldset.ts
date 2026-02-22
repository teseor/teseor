// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface FieldsetProps {
  bordered?: boolean;
  compact?: boolean;
}

export const fieldset = Object.assign(
  (props?: FieldsetProps): string => {
    if (!props) return cx('fieldset');
    return cx('fieldset', {
      bordered: props.bordered,
      compact: props.compact,
    });
  },
  {
    legend: (): string => cx('fieldset__legend'),
  },
);
