// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ModalSize = 'sm' | 'lg' | 'full' | 'entering';

export interface ModalProps {
  size?: ModalSize;
  visible?: boolean;
}

export const modal = Object.assign(
  (props?: ModalProps): string => {
    if (!props) return cx('modal');
    return cx('modal', {
      size: props.size,
      visible: props.visible,
    });
  },
  {
    content: (): string => cx('modal__content'),
    body: (): string => cx('modal__body'),
  },
);
