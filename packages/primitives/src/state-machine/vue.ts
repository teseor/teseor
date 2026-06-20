import { onBeforeUnmount, type Ref, ref } from "vue";
import { createStateMachine, type StatesSpec } from "./index.ts";

export type UseStateMachineOptions<S extends string> = {
  /** Fires synchronously inside `send` when a transition lands. `sourceKey`
   *  is the key the caller passed to `send` — wrappers route per-event
   *  consumer callbacks (e.g. `onDismiss` reason) off it. */
  onChange?: (next: S, prev: S, sourceKey: string) => void;
};

export type UseStateMachineResult<S extends string> = {
  state: Ref<S>;
  send: (sourceKey: string) => void;
};

/**
 * Vue adapter for {@link createStateMachine}. The `getStates` callback is
 * invoked on every send so closures over reactive refs stay live without
 * needing a `watch`.
 */
export function useStateMachine<S extends string>(
  getStates: () => StatesSpec<S>,
  initial: S,
  options?: UseStateMachineOptions<S>,
): UseStateMachineResult<S> {
  const state = ref(initial) as Ref<S>;
  const machine = createStateMachine<S>({
    getStates,
    initial,
    onChange: (next, prev, sourceKey) => {
      state.value = next;
      options?.onChange?.(next, prev, sourceKey);
    },
  });
  onBeforeUnmount(() => machine.destroy());
  return {
    state,
    send: (sourceKey) => machine.send(sourceKey),
  };
}
