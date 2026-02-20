// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type NumberInputSize = 'sm' | 'lg';

export interface NumberInputProps {
  size?: NumberInputSize;
  block?: boolean;
  disabled?: boolean;
}

export const numberInput = Object.assign(
  (props?: NumberInputProps): string => {
    if (!props) return cx('number-input');
    return cx('number-input', {
      size: props.size,
      block: props.block,
      disabled: props.disabled,
    });
  },
  {
    field: (): string => cx('number-input__field'),
    decrement: (): string => cx('number-input__decrement'),
    increment: (): string => cx('number-input__increment'),
  },
);
