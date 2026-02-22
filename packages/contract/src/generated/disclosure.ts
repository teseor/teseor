// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface DisclosureProps {
  animate?: boolean;
  borderless?: boolean;
}

export const disclosure = Object.assign(
  (props?: DisclosureProps): string => {
    if (!props) return cx('disclosure');
    return cx('disclosure', {
      animate: props.animate,
      borderless: props.borderless,
    });
  },
  {
    content: (): string => cx('disclosure__content'),
    icon: (): string => cx('disclosure__icon'),
    trigger: (): string => cx('disclosure__trigger'),
  },
);
