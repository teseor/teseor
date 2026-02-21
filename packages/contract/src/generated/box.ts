// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export interface BoxProps {
  p1?: boolean;
  p2?: boolean;
  p3?: boolean;
  p4?: boolean;
  bgSubtle?: boolean;
  bgMuted?: boolean;
  rounded?: boolean;
  roundedLg?: boolean;
}

export function box(props?: BoxProps): string {
  if (!props) return cx('box');
  return cx('box', {
    'p-1': props.p1,
    'p-2': props.p2,
    'p-3': props.p3,
    'p-4': props.p4,
    'bg-subtle': props.bgSubtle,
    'bg-muted': props.bgMuted,
    rounded: props.rounded,
    'rounded-lg': props.roundedLg,
  });
}
