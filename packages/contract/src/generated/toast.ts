// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ToastVariant = 'success' | 'warning' | 'danger' | 'info';

export interface ToastProps {
  variant?: ToastVariant;
}

export const toast = Object.assign(
  (props?: ToastProps): string => {
    if (!props) return cx('toast');
    return cx('toast', {
      variant: props.variant,
    });
  },
  {
    icon: (): string => cx('toast__icon'),
    content: (): string => cx('toast__content'),
    title: (): string => cx('toast__title'),
    description: (): string => cx('toast__description'),
    action: (): string => cx('toast__action'),
    close: (): string => cx('toast__close'),
  },
);

export interface ToastViewportProps {
  topEnd?: boolean;
  topStart?: boolean;
  bottomEnd?: boolean;
  bottomStart?: boolean;
  topCenter?: boolean;
  bottomCenter?: boolean;
}

export function toastViewport(props?: ToastViewportProps): string {
  if (!props) return cx('toast-viewport');
  return cx('toast-viewport', {
    'top-end': props.topEnd,
    'top-start': props.topStart,
    'bottom-end': props.bottomEnd,
    'bottom-start': props.bottomStart,
    'top-center': props.topCenter,
    'bottom-center': props.bottomCenter,
  });
}
