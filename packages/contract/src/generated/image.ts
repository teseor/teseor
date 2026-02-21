// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type ImageSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ImageObjectFit = 'cover' | 'contain' | 'circle';

export interface ImageProps {
  size?: ImageSize;
  rounded?: boolean;
  circle?: boolean;
  objectFit?: ImageObjectFit;
}

export const image = Object.assign(
  (props?: ImageProps): string => {
    if (!props) return cx('image');
    return cx('image', {
      size: props.size,
      rounded: props.rounded,
      circle: props.circle,
      'object-fit': props.objectFit,
    });
  },
  {
    img: (): string => cx('image__img'),
    caption: (): string => cx('image__caption'),
  },
);
