// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ButtonRadius = 'radius-full' | 'radius-lg' | 'radius-none' | 'radius-sm';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonVariant = 'danger' | 'ghost' | 'link' | 'outline' | 'secondary';

export interface ButtonProps {
  block?: boolean;
  icon?: boolean;
  loading?: boolean;
  radius?: ButtonRadius;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export interface ButtonIconProps {
  end?: boolean;
  start?: boolean;
}

export const button = Object.assign(
  (props?: ButtonProps): string => {
    if (!props) return cx('button');
    return cx('button', {
      block: props.block,
      icon: props.icon,
      loading: props.loading,
      radius: props.radius,
      size: props.size,
      variant: props.variant,
    });
  },
  {
    icon: (props?: ButtonIconProps): string => {
      if (!props) return cx('button__icon');
      return cx('button__icon', {
        end: props.end,
        start: props.start,
      });
    },
  },
);
