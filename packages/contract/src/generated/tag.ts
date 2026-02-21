// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type TagSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TagVariant = 'danger' | 'primary' | 'success' | 'warning';

export interface TagProps {
  size?: TagSize;
  variant?: TagVariant;
}

export const tag = Object.assign(
  (props?: TagProps): string => {
    if (!props) return cx('tag');
    return cx('tag', {
      size: props.size,
      variant: props.variant,
    });
  },
  {
    remove: (): string => cx('tag__remove'),
  },
);

export function tagGroup(): string {
  return cx('tag-group');
}
