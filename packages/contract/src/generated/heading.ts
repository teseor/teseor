// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type HeadingSize = '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm';

export interface HeadingProps {
  size?: HeadingSize;
}

export function heading(props?: HeadingProps): string {
  if (!props) return cx('heading');
  return cx('heading', {
    size: props.size,
  });
}
