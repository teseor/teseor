import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStateMachine, type StatesSpec } from "./index.ts";

type ToyState = "closed" | "open";

const TOY_STATES: StatesSpec<ToyState> = {
  closed: { on: { "trigger.click": { to: "open" } } },
  open: { on: { "trigger.click": { to: "closed" }, "key.escape": { to: "closed" } } },
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createStateMachine", () => {
  it("starts in the configured initial state", () => {
    const m = createStateMachine({ getStates: () => TOY_STATES, initial: "closed" });
    expect(m.getState()).toBe("closed");
  });

  it("transitions on a matching source key", () => {
    const onChange = vi.fn();
    const m = createStateMachine({
      getStates: () => TOY_STATES,
      initial: "closed",
      onChange,
    });
    m.send("trigger.click");
    expect(m.getState()).toBe("open");
    expect(onChange).toHaveBeenCalledWith("open", "closed", "trigger.click");
  });

  it("ignores source keys with no transition from the current state", () => {
    const onChange = vi.fn();
    const m = createStateMachine({
      getStates: () => TOY_STATES,
      initial: "closed",
      onChange,
    });
    m.send("key.escape");
    expect(m.getState()).toBe("closed");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not fire when the guard returns false", () => {
    let allowed = false;
    const states: StatesSpec<ToyState> = {
      closed: {
        on: { "trigger.click": { to: "open", when: () => allowed } },
      },
      open: { on: {} },
    };
    const m = createStateMachine({ getStates: () => states, initial: "closed" });
    m.send("trigger.click");
    expect(m.getState()).toBe("closed");
    allowed = true;
    m.send("trigger.click");
    expect(m.getState()).toBe("open");
  });

  it("defers transitions with `after` and fires them on timer", () => {
    const states: StatesSpec<ToyState> = {
      closed: { on: { "trigger.click": { to: "open", after: 300 } } },
      open: { on: {} },
    };
    const m = createStateMachine({ getStates: () => states, initial: "closed" });
    m.send("trigger.click");
    expect(m.getState()).toBe("closed");
    vi.advanceTimersByTime(299);
    expect(m.getState()).toBe("closed");
    vi.advanceTimersByTime(1);
    expect(m.getState()).toBe("open");
  });

  it("cancels a pending timer when a competing transition fires", () => {
    const states: StatesSpec<ToyState> = {
      closed: {
        on: {
          "trigger.pointerenter": { to: "open", after: 300 },
          "trigger.pointerleave": { to: "closed" },
        },
      },
      open: { on: {} },
    };
    const m = createStateMachine({ getStates: () => states, initial: "closed" });
    m.send("trigger.pointerenter");
    vi.advanceTimersByTime(100);
    m.send("trigger.pointerleave");
    vi.advanceTimersByTime(500);
    expect(m.getState()).toBe("closed");
  });

  it("does not cancel a pending timer for an unrelated source key", () => {
    const states: StatesSpec<ToyState> = {
      closed: {
        on: { "trigger.pointerenter": { to: "open", after: 300 } },
      },
      open: { on: {} },
    };
    const m = createStateMachine({ getStates: () => states, initial: "closed" });
    m.send("trigger.pointerenter");
    m.send("key.escape");
    vi.advanceTimersByTime(300);
    expect(m.getState()).toBe("open");
  });

  it("fires `emits` on the transition", () => {
    const emits = vi.fn();
    const states: StatesSpec<ToyState> = {
      closed: { on: { "trigger.click": { to: "open", emits } } },
      open: { on: {} },
    };
    const m = createStateMachine({ getStates: () => states, initial: "closed" });
    m.send("trigger.click");
    expect(emits).toHaveBeenCalledTimes(1);
  });

  it("fires `emits` after the `after` delay, not at send time", () => {
    const emits = vi.fn();
    const states: StatesSpec<ToyState> = {
      closed: { on: { "trigger.click": { to: "open", after: 100, emits } } },
      open: { on: {} },
    };
    const m = createStateMachine({ getStates: () => states, initial: "closed" });
    m.send("trigger.click");
    expect(emits).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(emits).toHaveBeenCalledTimes(1);
  });

  it("reads the latest states snapshot on every send", () => {
    let openDelay = 100;
    const getStates = (): StatesSpec<ToyState> => ({
      closed: { on: { "trigger.click": { to: "open", after: openDelay } } },
      open: { on: {} },
    });
    const m = createStateMachine({ getStates, initial: "closed" });
    openDelay = 500;
    m.send("trigger.click");
    vi.advanceTimersByTime(100);
    expect(m.getState()).toBe("closed");
    vi.advanceTimersByTime(400);
    expect(m.getState()).toBe("open");
  });

  it("ignores prototype keys via Object.hasOwn check", () => {
    const m = createStateMachine({ getStates: () => TOY_STATES, initial: "closed" });
    m.send("toString");
    m.send("hasOwnProperty");
    expect(m.getState()).toBe("closed");
  });

  it("does not call onChange when transitioning to the same state", () => {
    const states: StatesSpec<ToyState> = {
      closed: { on: { "trigger.click": { to: "closed" } } },
      open: { on: {} },
    };
    const onChange = vi.fn();
    const m = createStateMachine({ getStates: () => states, initial: "closed", onChange });
    m.send("trigger.click");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("drops sends after destroy", () => {
    const onChange = vi.fn();
    const m = createStateMachine({
      getStates: () => TOY_STATES,
      initial: "closed",
      onChange,
    });
    m.destroy();
    m.send("trigger.click");
    expect(m.getState()).toBe("closed");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancels a pending timer on destroy", () => {
    const states: StatesSpec<ToyState> = {
      closed: { on: { "trigger.click": { to: "open", after: 300 } } },
      open: { on: {} },
    };
    const onChange = vi.fn();
    const m = createStateMachine({ getStates: () => states, initial: "closed", onChange });
    m.send("trigger.click");
    m.destroy();
    vi.advanceTimersByTime(500);
    expect(onChange).not.toHaveBeenCalled();
  });
});
