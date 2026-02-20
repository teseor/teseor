// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface ButtonGroupProps {
  vertical?: boolean;
}

export function buttonGroup(props?: ButtonGroupProps): string {
  if (!props) return cx('button-group');
  return cx('button-group', {
    vertical: props.vertical,
  });
}
