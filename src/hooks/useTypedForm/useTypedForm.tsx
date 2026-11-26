import type { ChangeEvent, FormEvent, RefCallback } from "react";
import {
  PatchValues,
  SetValues,
  TypedFormConfig,
  TypedFormI,
} from "../../objectValues/form/models";
import { FieldElement } from "../../objectValues/formControl/models";

/**
 * Hook input: one config entry per Payload key (see TypedFormConfig).
 * ASSUMPTION: only the first config is used, so it can be written inline without losing the state on each render.
 */
export interface useTypedFormProps<Payload> extends TypedFormConfig<Payload> {}

/**
 * React props that can be spread on an input, a textarea or a select. They do not control the
 * content of the element: there is no `value` nor `checked`.
 */
export interface BoundFieldProps {
  name: string;
  /**
   * Plain callback, not a hook. React calls it with the element (null on unmount). It shows the
   * elementValue of the field there, choosing the strategy with instanceof, only when the
   * element mounts and when the elementVersion of the field is not the last one written to it.
   * So it does not write what the user enters: that belongs to the browser.
   * After each write it reads the element state and calls syncElement, so the validations evaluate
   * the element as it is. React runs refs before painting, so the state without element is not seen.
   * bind must return a new callback on each render, so React runs it again after each operation.
   */
  ref: RefCallback<FieldElement>;
  /** Value of the `required` rule. It also enables the native validation, which can block the submit, unless the form has `noValidate`. */
  required?: boolean;
  /**
   * Runs eventToPayload and reads the element state in the handler, not in the reducer, which React can
   * run later or twice, and changes the field to both results.
   */
  onChange: (e: ChangeEvent<FieldElement>) => void;
  onFocus: () => void;
  /** Marks the field as touched and no longer focused. */
  onBlur: () => void;
  /** Marks the field as touched. */
  onClick: () => void;
}

/** What the hook gives to the component that renders the form. */
export interface useTypedFormI<Payload> {
  /**
   * Returns the props that connect an element to a Payload key: `<input {...bind("name")} />`.
   *
   * Do not use hooks within the bind function, because bind is going to be
   * destructured inside the tags or components.
   */
  bind: (formField: keyof Payload & string) => BoundFieldProps;
  /**
   * Returns the form's submit handler. It always prevents the native submit. `onValid` receives the Payload and only runs when the form is valid.
   * Using the native `noValidate` on the form is the developer's decision: without it, the browser's
   * own validation (e.g. of `required`) can block the submit before this handler runs.
   * Once it runs, only the Validator decides the validity. Fields whose element has not mounted do not block it.
   */
  handleSubmit: (
    onValid: (typedPayload: Payload) => void,
  ) => (e: FormEvent<HTMLFormElement>) => void;
  /**
   * Changes the default values of the given fields, and the current values of those that have not changed.
   * ASSUMPTION: patchValue, setValue and reset are the same functions on every render, so they can be dependencies of an effect.
   */
  patchValue: (values: PatchValues<Payload>) => void;
  /** Changes the current values of the given fields, but not their default values. */
  setValue: (values: SetValues<Payload>) => void;
  /** Returns every field to its current default value, untouched. */
  reset: () => void;
  /** Current form state, exposed so the component can show errors, disable the submit button, etc. */
  state: TypedFormI<Payload>;
}

/**
 * Binds native form elements to a typed Payload.
 * It only defines the form reducer: each action calls an operation of TypedForm,
 * which returns the next form. The logic lives in TypedForm, FormControl and Validator.
 */
export function useTypedForm<Payload>(
  _props: useTypedFormProps<Payload>,
): useTypedFormI<Payload> {
  throw new Error("Not implemented");
}
