// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  size?: AvatarSize;
  square?: boolean;
}

export const avatar = Object.assign(
  (props?: AvatarProps): string => {
    if (!props) return cx('avatar');
    return cx('avatar', {
      size: props.size,
      square: props.square,
    });
  },
  {
    fallback: (): string => cx('avatar__fallback'),
    image: (): string => cx('avatar__image'),
  },
);

export function avatarGroup(): string {
  return cx('avatar-group');
}
