// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ToggleSize = 'sm' | 'lg';

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
    track: (): string => cx('toggle__track'),
    thumb: (): string => cx('toggle__thumb'),
  },
);
