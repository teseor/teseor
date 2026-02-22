// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type LinkVariant = 'muted' | 'subtle';

export interface LinkProps {
  disabled?: boolean;
  external?: boolean;
  variant?: LinkVariant;
}

export function link(props?: LinkProps): string {
  if (!props) return cx('link');
  return cx('link', {
    disabled: props.disabled,
    external: props.external,
    variant: props.variant,
  });
}
