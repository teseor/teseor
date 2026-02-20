// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type LinkVariant = 'muted' | 'subtle';

export interface LinkProps {
  variant?: LinkVariant;
  disabled?: boolean;
  external?: boolean;
}

export function link(props?: LinkProps): string {
  if (!props) return cx('link');
  return cx('link', {
    variant: props.variant,
    disabled: props.disabled,
    external: props.external,
  });
}
