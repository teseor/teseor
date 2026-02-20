// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface DisclosureProps {
  borderless?: boolean;
  animate?: boolean;
}

export const disclosure = Object.assign(
  (props?: DisclosureProps): string => {
    if (!props) return cx('disclosure');
    return cx('disclosure', {
      borderless: props.borderless,
      animate: props.animate,
    });
  },
  {
    trigger: (): string => cx('disclosure__trigger'),
    icon: (): string => cx('disclosure__icon'),
    content: (): string => cx('disclosure__content'),
  },
);
