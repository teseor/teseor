// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'secondary' | 'ghost' | 'outline' | 'danger' | 'link';
export type ButtonRadius = 'radius-none' | 'radius-sm' | 'radius-lg' | 'radius-full';

export interface ButtonProps {
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: boolean;
  radius?: ButtonRadius;
  block?: boolean;
  loading?: boolean;
}

export interface ButtonIconProps {
  start?: boolean;
  end?: boolean;
}

export const button = Object.assign(
  (props?: ButtonProps): string => {
    if (!props) return cx('button');
    return cx('button', {
      size: props.size,
      variant: props.variant,
      icon: props.icon,
      radius: props.radius,
      block: props.block,
      loading: props.loading,
    });
  },
  {
    icon: (props?: ButtonIconProps): string => {
      if (!props) return cx('button__icon');
      return cx('button__icon', {
        start: props.start,
        end: props.end,
      });
    },
  },
);
