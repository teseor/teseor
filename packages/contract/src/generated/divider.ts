// Auto-generated from api.json. Do not edit — run: pnpm generate:contract
import { cx } from '../cx';

export type DividerPosition = 'end' | 'start';

export interface DividerProps {
  dashed?: boolean;
  position?: DividerPosition;
  vertical?: boolean;
}

export function divider(props?: DividerProps): string {
  if (!props) return cx('divider');
  return cx('divider', {
    dashed: props.dashed,
    position: props.position,
    vertical: props.vertical,
  });
}
