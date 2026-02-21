// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type BlockquoteVariant = 'accent';

export interface BlockquoteProps {
  variant?: BlockquoteVariant;
}

export const blockquote = Object.assign(
  (props?: BlockquoteProps): string => {
    if (!props) return cx('blockquote');
    return cx('blockquote', {
      variant: props.variant,
    });
  },
  {
    cite: (): string => cx('blockquote__cite'),
  },
);
