// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface FormProps {
  compact?: boolean;
  inline?: boolean;
}

export const form = Object.assign(
  (props?: FormProps): string => {
    if (!props) return cx('form');
    return cx('form', {
      compact: props.compact,
      inline: props.inline,
    });
  },
  {
    section: (): string => cx('form__section'),
    actions: (): string => cx('form__actions'),
  },
);
