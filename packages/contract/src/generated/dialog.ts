// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface DialogProps {
  borderless?: boolean;
}

export const dialog = Object.assign(
  (props?: DialogProps): string => {
    if (!props) return cx('dialog');
    return cx('dialog', {
      borderless: props.borderless,
    });
  },
  {
    header: (): string => cx('dialog__header'),
    title: (): string => cx('dialog__title'),
    close: (): string => cx('dialog__close'),
    body: (): string => cx('dialog__body'),
    footer: (): string => cx('dialog__footer'),
  },
);
