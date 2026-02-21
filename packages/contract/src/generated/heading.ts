// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export interface HeadingProps {
  size?: HeadingSize;
}

export function heading(props?: HeadingProps): string {
  if (!props) return cx('heading');
  return cx('heading', {
    size: props.size,
  });
}
