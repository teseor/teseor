// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type DividerPosition = 'start' | 'end';

export interface DividerProps {
  vertical?: boolean;
  position?: DividerPosition;
  dashed?: boolean;
}

export function divider(props?: DividerProps): string {
  if (!props) return cx('divider');
  return cx('divider', {
    vertical: props.vertical,
    position: props.position,
    dashed: props.dashed,
  });
}
