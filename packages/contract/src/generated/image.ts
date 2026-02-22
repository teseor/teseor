// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ImageObjectFit = 'contain' | 'cover';
export type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ImageProps {
  circle?: boolean;
  objectFit?: ImageObjectFit;
  rounded?: boolean;
  size?: ImageSize;
}

export const image = Object.assign(
  (props?: ImageProps): string => {
    if (!props) return cx('image');
    return cx('image', {
      circle: props.circle,
      'object-fit': props.objectFit,
      rounded: props.rounded,
      size: props.size,
    });
  },
  {
    caption: (): string => cx('image__caption'),
    img: (): string => cx('image__img'),
  },
);
