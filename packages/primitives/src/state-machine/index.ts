// Drives a per-part state machine declared by a composite spec. The runtime
// is intentionally minimal: one current state, one pending timer, no entry/
// exit actions, no nested machines. Side effects (focus trap, scroll lock,
// portal mount) stay in their own primitives and are wired by the wrapper.
//
// Transition lookup uses `Object.hasOwn` so a consumer calling `send("toString")`
// doesn't resolve to Object.prototype.toString.

export type Transition<S extends string = string> = {
  to: S;
  /** Milliseconds to defer the transition; undefined or <=0 fires synchronously. */
  after?: number;
  /** Returns false to suppress the transition. */
  when?: () => boolean;
  /** Side-effect fired on the transition (after `after`, before state change). */
  emits?: () => void;
};

export type StateDef<S extends string = string> = {
  on?: Record<string, Transition<S>>;
};

export type StatesSpec<S extends string = string> = Record<S, StateDef<S>>;

export type StateMachine<S extends string = string> = {
  getState: () => S;
  send: (sourceKey: string) => void;
  destroy: () => void;
};

export type CreateStateMachineOptions<S extends string = string> = {
  /** Called on every `send` so closures inside transitions read fresh values. */
  getStates: () => StatesSpec<S>;
  initial: S;
  /** Fires synchronously after a transition. `sourceKey` is the key passed to
   *  `send` — wrappers route per-event consumer callbacks (e.g. `onDismiss`
   *  reason mapping) off it without a stale-closure round-trip through React
   *  state. */
  onChange?: (next: S, prev: S, sourceKey: string) => void;
};

export function createStateMachine<S extends string>(
  options: CreateStateMachineOptions<S>,
): StateMachine<S> {
  let current = options.initial;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  const clearPending = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const fire = (target: Transition<S>, sourceKey: string): void => {
    if (destroyed) return;
    target.emits?.();
    const prev = current;
    current = target.to;
    if (prev !== current) options.onChange?.(current, prev, sourceKey);
  };

  return {
    getState() {
      return current;
    },
    send(sourceKey) {
      if (destroyed) return;
      const states = options.getStates();
      if (!Object.hasOwn(states, current)) return;
      const stateDef = states[current];
      const transitions = stateDef?.on;
      if (!transitions || !Object.hasOwn(transitions, sourceKey)) return;
      const target = transitions[sourceKey];
      if (!target) return;
      if (target.when && !target.when()) return;
      clearPending();
      if (target.after !== undefined && target.after > 0) {
        timer = setTimeout(() => {
          timer = undefined;
          fire(target, sourceKey);
        }, target.after);
      } else {
        fire(target, sourceKey);
      }
    },
    destroy() {
      destroyed = true;
      clearPending();
    },
  };
}
