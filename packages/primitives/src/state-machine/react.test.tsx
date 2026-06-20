// @vitest-environment happy-dom
import { act, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StatesSpec } from "./index.ts";
import { useStateMachine } from "./react.ts";

type ToyState = "closed" | "open";

let mountTarget: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  mountTarget = document.createElement("div");
  document.body.appendChild(mountTarget);
  root = createRoot(mountTarget);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  mountTarget.remove();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

type SendButtonProps = {
  openDelay?: number;
  disabled?: boolean;
  onState?: (state: ToyState) => void;
};

function ToyMachine(props: SendButtonProps) {
  const { openDelay = 0, disabled = false, onState } = props;
  const states = useMemo<StatesSpec<ToyState>>(
    () => ({
      closed: {
        on: {
          "trigger.click": {
            to: "open",
            after: openDelay,
            when: () => !disabled,
          },
        },
      },
      open: { on: { "trigger.click": { to: "closed" } } },
    }),
    [openDelay, disabled],
  );
  const { state, send } = useStateMachine<ToyState>(states, "closed");
  onState?.(state);
  return (
    <button type="button" onClick={() => send("trigger.click")}>
      {state}
    </button>
  );
}

function getButton(): HTMLButtonElement {
  const button = mountTarget.querySelector("button");
  if (!button) throw new Error("button missing");
  return button;
}

describe("useStateMachine (react)", () => {
  it("renders the initial state", () => {
    act(() => {
      root.render(<ToyMachine />);
    });
    expect(getButton().textContent).toBe("closed");
  });

  it("re-renders on transition", () => {
    act(() => {
      root.render(<ToyMachine />);
    });
    act(() => {
      getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getButton().textContent).toBe("open");
  });

  it("guards on the latest prop value, not the value at machine creation", () => {
    act(() => {
      root.render(<ToyMachine disabled />);
    });
    act(() => {
      getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getButton().textContent).toBe("closed");
    act(() => {
      root.render(<ToyMachine disabled={false} />);
    });
    act(() => {
      getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getButton().textContent).toBe("open");
  });

  it("schedules `after` transitions and fires them via setTimeout", () => {
    const onState = vi.fn<(s: ToyState) => void>();
    act(() => {
      root.render(<ToyMachine openDelay={250} onState={onState} />);
    });
    act(() => {
      getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getButton().textContent).toBe("closed");
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(getButton().textContent).toBe("open");
  });

  it("destroys the machine on unmount", () => {
    const onState = vi.fn<(s: ToyState) => void>();
    act(() => {
      root.render(<ToyMachine openDelay={250} onState={onState} />);
    });
    act(() => {
      getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    act(() => {
      root.unmount();
    });
    onState.mockClear();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onState).not.toHaveBeenCalled();
  });
});
