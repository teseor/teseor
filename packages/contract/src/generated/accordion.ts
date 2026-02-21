// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface AccordionProps {
  borderless?: boolean;
  separated?: boolean;
}

export function accordion(props?: AccordionProps): string {
  if (!props) return cx('accordion');
  return cx('accordion', {
    borderless: props.borderless,
    separated: props.separated,
  });
}
