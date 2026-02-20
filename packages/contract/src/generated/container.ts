// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps {
  center?: boolean;
  size?: ContainerSize;
}

export function container(props?: ContainerProps): string {
  if (!props) return cx('container');
  return cx('container', {
    center: props.center,
    size: props.size,
  });
}
