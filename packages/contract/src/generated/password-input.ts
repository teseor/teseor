// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type PasswordInputSize = 'sm' | 'lg';
export type PasswordInputState = 'error' | 'success';

export interface PasswordInputProps {
  size?: PasswordInputSize;
  state?: PasswordInputState;
  block?: boolean;
  disabled?: boolean;
}

export const passwordInput = Object.assign(
  (props?: PasswordInputProps): string => {
    if (!props) return cx('password-input');
    return cx('password-input', {
      size: props.size,
      state: props.state,
      block: props.block,
      disabled: props.disabled,
    });
  },
  {
    field: (): string => cx('password-input__field'),
    toggle: (): string => cx('password-input__toggle'),
  },
);
