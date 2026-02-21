// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface FooterProps {
  bordered?: boolean;
  fixed?: boolean;
  raised?: boolean;
  sticky?: boolean;
}

export const footer = Object.assign(
  (props?: FooterProps): string => {
    if (!props) return cx('footer');
    return cx('footer', {
      bordered: props.bordered,
      fixed: props.fixed,
      raised: props.raised,
      sticky: props.sticky,
    });
  },
  {
    center: (): string => cx('footer__center'),
    end: (): string => cx('footer__end'),
    start: (): string => cx('footer__start'),
  },
);
