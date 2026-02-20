// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface VisuallyHiddenProps {
  focusable?: boolean;
}

export function visuallyHidden(props?: VisuallyHiddenProps): string {
  if (!props) return cx('visually-hidden');
  return cx('visually-hidden', {
    focusable: props.focusable,
  });
}
