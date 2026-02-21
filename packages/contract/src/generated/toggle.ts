// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ToggleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ToggleProps {
  size?: ToggleSize;
}

export const toggle = Object.assign(
  (props?: ToggleProps): string => {
    if (!props) return cx('toggle');
    return cx('toggle', {
      size: props.size,
    });
  },
  {
    input: (): string => cx('toggle__input'),
    thumb: (): string => cx('toggle__thumb'),
    track: (): string => cx('toggle__track'),
  },
);
