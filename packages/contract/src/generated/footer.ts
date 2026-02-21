// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface FooterProps {
  sticky?: boolean;
  fixed?: boolean;
  bordered?: boolean;
  raised?: boolean;
}

export const footer = Object.assign(
  (props?: FooterProps): string => {
    if (!props) return cx('footer');
    return cx('footer', {
      sticky: props.sticky,
      fixed: props.fixed,
      bordered: props.bordered,
      raised: props.raised,
    });
  },
  {
    start: (): string => cx('footer__start'),
    center: (): string => cx('footer__center'),
    end: (): string => cx('footer__end'),
  },
);
