// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type NumberInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface NumberInputProps {
  block?: boolean;
  disabled?: boolean;
  size?: NumberInputSize;
}

export const numberInput = Object.assign(
  (props?: NumberInputProps): string => {
    if (!props) return cx('number-input');
    return cx('number-input', {
      block: props.block,
      disabled: props.disabled,
      size: props.size,
    });
  },
  {
    decrement: (): string => cx('number-input__decrement'),
    field: (): string => cx('number-input__field'),
    increment: (): string => cx('number-input__increment'),
  },
);
