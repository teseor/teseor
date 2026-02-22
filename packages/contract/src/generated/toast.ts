// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ToastVariant = 'danger' | 'info' | 'success' | 'warning';

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
    action: (): string => cx('toast__action'),
    close: (): string => cx('toast__close'),
    content: (): string => cx('toast__content'),
    description: (): string => cx('toast__description'),
    icon: (): string => cx('toast__icon'),
    title: (): string => cx('toast__title'),
  },
);

export interface ToastViewportProps {
  bottomCenter?: boolean;
  bottomEnd?: boolean;
  bottomStart?: boolean;
  topCenter?: boolean;
  topEnd?: boolean;
  topStart?: boolean;
}

export function toastViewport(props?: ToastViewportProps): string {
  if (!props) return cx('toast-viewport');
  return cx('toast-viewport', {
    'bottom-center': props.bottomCenter,
    'bottom-end': props.bottomEnd,
    'bottom-start': props.bottomStart,
    'top-center': props.topCenter,
    'top-end': props.topEnd,
    'top-start': props.topStart,
  });
}
