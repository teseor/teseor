// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type SearchInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SearchInputProps {
  block?: boolean;
  disabled?: boolean;
  hasClear?: boolean;
  size?: SearchInputSize;
}

export const searchInput = Object.assign(
  (props?: SearchInputProps): string => {
    if (!props) return cx('search-input');
    return cx('search-input', {
      block: props.block,
      disabled: props.disabled,
      'has-clear': props.hasClear,
      size: props.size,
    });
  },
  {
    clear: (): string => cx('search-input__clear'),
    field: (): string => cx('search-input__field'),
    icon: (): string => cx('search-input__icon'),
  },
);
