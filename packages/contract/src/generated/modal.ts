// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  animate?: boolean;
  entering?: boolean;
  exiting?: boolean;
  hidden?: boolean;
  size?: ModalSize;
  visible?: boolean;
}

export const modal = Object.assign(
  (props?: ModalProps): string => {
    if (!props) return cx('modal');
    return cx('modal', {
      animate: props.animate,
      entering: props.entering,
      exiting: props.exiting,
      hidden: props.hidden,
      size: props.size,
      visible: props.visible,
    });
  },
  {
    body: (): string => cx('modal__body'),
    content: (): string => cx('modal__content'),
  },
);
