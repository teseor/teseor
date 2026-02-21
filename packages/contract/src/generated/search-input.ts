// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SearchInputSize = 'sm' | 'lg';

export interface SearchInputProps {
  size?: SearchInputSize;
  block?: boolean;
  disabled?: boolean;
  hasClear?: boolean;
}

export const searchInput = Object.assign(
  (props?: SearchInputProps): string => {
    if (!props) return cx('search-input');
    return cx('search-input', {
      size: props.size,
      block: props.block,
      disabled: props.disabled,
      'has-clear': props.hasClear,
    });
  },
  {
    field: (): string => cx('search-input__field'),
    icon: (): string => cx('search-input__icon'),
    clear: (): string => cx('search-input__clear'),
  },
);
