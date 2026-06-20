import { useCallback, useEffect, useRef, useState } from "react";
import { createStateMachine, type StateMachine, type StatesSpec } from "./index.ts";

export type UseStateMachineResult<S extends string> = {
  state: S;
  send: (sourceKey: string) => void;
};

/**
 * React adapter for {@link createStateMachine}. Re-renders the host on
 * transitions; transition closures (`when`, `emits`) see fresh values each
 * send via a states-ref kept up-to-date during render.
 *
 * Pre-mount `send` calls are no-ops: the machine is created in `useEffect`,
 * which matches React's StrictMode double-mount semantics. Event handlers
 * fire after mount in practice, so the no-op window doesn't bite real code.
 */
export function useStateMachine<S extends string>(
  states: StatesSpec<S>,
  initial: S,
): UseStateMachineResult<S> {
  const [state, setState] = useState<S>(initial);
  const statesRef = useRef(states);
  statesRef.current = states;

  const machineRef = useRef<StateMachine<S> | null>(null);

  useEffect(() => {
    const machine = createStateMachine<S>({
      getStates: () => statesRef.current,
      initial,
      onChange: (next) => setState(next),
    });
    machineRef.current = machine;
    return () => {
      machine.destroy();
      machineRef.current = null;
    };
  }, [initial]);

  const send = useCallback((sourceKey: string) => {
    machineRef.current?.send(sourceKey);
  }, []);

  return { state, send };
}
