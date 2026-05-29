// Compile-time smoke: every DOM builtin permitted by the events vocab
// (specs/_vocabulary.yaml events.builtins) must resolve in this package.
// If a future contract emits `file: File` and the package's lib drops `dom`,
// this file fails typecheck before the generated code does.
type _BuiltinsCheck = {
  date: Date;
  mouseEvent: MouseEvent;
  keyboardEvent: KeyboardEvent;
  pointerEvent: PointerEvent;
  focusEvent: FocusEvent;
  file: File;
  error: Error;
  htmlElement: HTMLElement;
};

export type {};
