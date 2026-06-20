import { onBeforeUnmount, type Ref, ref } from "vue";
import { createStateMachine, type StatesSpec } from "./index.ts";

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
): UseStateMachineResult<S> {
  const state = ref(initial) as Ref<S>;
  const machine = createStateMachine<S>({
    getStates,
    initial,
    onChange: (next) => {
      state.value = next;
    },
  });
  onBeforeUnmount(() => machine.destroy());
  return {
    state,
    send: (sourceKey) => machine.send(sourceKey),
  };
}
