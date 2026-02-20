// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface CodeBlockProps {
  compact?: boolean;
  lineNumbers?: boolean;
}

export const codeBlock = Object.assign(
  (props?: CodeBlockProps): string => {
    if (!props) return cx('code-block');
    return cx('code-block', {
      compact: props.compact,
      'line-numbers': props.lineNumbers,
    });
  },
  {
    code: (): string => cx('code-block__code'),
    line: (): string => cx('code-block__line'),
    lineNumber: (): string => cx('code-block__line-number'),
  },
);
