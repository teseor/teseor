// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type AlertSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AlertVariant = 'danger' | 'info' | 'success' | 'warning';

export interface AlertProps {
  dismissible?: boolean;
  size?: AlertSize;
  variant?: AlertVariant;
}

export const alert = Object.assign(
  (props?: AlertProps): string => {
    if (!props) return cx('alert');
    return cx('alert', {
      dismissible: props.dismissible,
      size: props.size,
      variant: props.variant,
    });
  },
  {
    close: (): string => cx('alert__close'),
    content: (): string => cx('alert__content'),
    description: (): string => cx('alert__description'),
    icon: (): string => cx('alert__icon'),
    title: (): string => cx('alert__title'),
  },
);
