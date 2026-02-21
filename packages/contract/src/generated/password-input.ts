// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type PasswordInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type PasswordInputState = 'error' | 'success';

export interface PasswordInputProps {
  block?: boolean;
  disabled?: boolean;
  size?: PasswordInputSize;
  state?: PasswordInputState;
}

export const passwordInput = Object.assign(
  (props?: PasswordInputProps): string => {
    if (!props) return cx('password-input');
    return cx('password-input', {
      block: props.block,
      disabled: props.disabled,
      size: props.size,
      state: props.state,
    });
  },
  {
    field: (): string => cx('password-input__field'),
    toggle: (): string => cx('password-input__toggle'),
  },
);
