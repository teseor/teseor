// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type CloseButtonSize = 'sm' | 'lg';

export interface CloseButtonProps {
  size?: CloseButtonSize;
  subtle?: boolean;
  hover?: boolean;
  focus?: boolean;
}

export const closeButton = Object.assign(
  (props?: CloseButtonProps): string => {
    if (!props) return cx('close-button');
    return cx('close-button', {
      size: props.size,
      subtle: props.subtle,
      hover: props.hover,
      focus: props.focus,
    });
  },
  {
    icon: (): string => cx('close-button__icon'),
  },
);
