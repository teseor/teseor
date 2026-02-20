// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
export type AlertSize = 'sm' | 'lg';

export interface AlertProps {
  variant?: AlertVariant;
  size?: AlertSize;
  dismissible?: boolean;
}

export const alert = Object.assign(
  (props?: AlertProps): string => {
    if (!props) return cx('alert');
    return cx('alert', {
      variant: props.variant,
      size: props.size,
      dismissible: props.dismissible,
    });
  },
  {
    icon: (): string => cx('alert__icon'),
    content: (): string => cx('alert__content'),
    title: (): string => cx('alert__title'),
    description: (): string => cx('alert__description'),
    close: (): string => cx('alert__close'),
  },
);
