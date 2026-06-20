// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent, h, nextTick, ref } from "vue";
import type { StatesSpec } from "./index.ts";
import { useStateMachine } from "./vue.ts";

type ToyState = "closed" | "open";

let mountTarget: HTMLDivElement;
let app: App | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  mountTarget = document.createElement("div");
  document.body.appendChild(mountTarget);
});

afterEach(() => {
  app?.unmount();
  app = null;
  mountTarget.remove();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

function getButton(): HTMLButtonElement {
  const button = mountTarget.querySelector("button");
  if (!button) throw new Error("button missing");
  return button;
}

function mountToyMachine(opts: { openDelay?: number; disabled?: boolean } = {}): {
  openDelay: ReturnType<typeof ref<number>>;
  disabled: ReturnType<typeof ref<boolean>>;
} {
  const openDelay = ref<number>(opts.openDelay ?? 0);
  const disabled = ref<boolean>(opts.disabled ?? false);
  const Toy = defineComponent({
    setup() {
      const getStates = (): StatesSpec<ToyState> => ({
        closed: {
          on: {
            "trigger.click": {
              to: "open",
              after: openDelay.value,
              when: () => !disabled.value,
            },
          },
        },
        open: { on: { "trigger.click": { to: "closed" } } },
      });
      // biome-ignore lint/correctness/useHookAtTopLevel: vue composable inside setup(), not a react hook
      const { state, send } = useStateMachine<ToyState>(getStates, "closed");
      return () =>
        h(
          "button",
          {
            type: "button",
            onClick: () => send("trigger.click"),
          },
          state.value,
        );
    },
  });
  app = createApp(Toy);
  app.mount(mountTarget);
  return { openDelay, disabled };
}

describe("useStateMachine (vue)", () => {
  it("renders the initial state", () => {
    mountToyMachine();
    expect(getButton().textContent).toBe("closed");
  });

  it("re-renders on transition", async () => {
    mountToyMachine();
    getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(getButton().textContent).toBe("open");
  });

  it("reads the latest reactive guard value at send time", async () => {
    const { disabled } = mountToyMachine({ disabled: true });
    getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(getButton().textContent).toBe("closed");
    disabled.value = false;
    getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(getButton().textContent).toBe("open");
  });

  it("schedules `after` transitions via setTimeout", async () => {
    mountToyMachine({ openDelay: 250 });
    getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(getButton().textContent).toBe("closed");
    vi.advanceTimersByTime(250);
    await nextTick();
    expect(getButton().textContent).toBe("open");
  });

  it("destroys the machine on unmount", async () => {
    mountToyMachine({ openDelay: 250 });
    getButton().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    app?.unmount();
    app = null;
    vi.advanceTimersByTime(500);
    expect(document.body.querySelector("button")).toBeNull();
  });
});
