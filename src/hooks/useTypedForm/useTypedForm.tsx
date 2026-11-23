import type { ChangeEvent, FormEvent, RefCallback } from "react";
import {
  PatchValues,
  SetValues,
  TypedFormConfig,
  TypedFormI,
} from "../../objectValues/form/models";
import { FieldElement } from "../../objectValues/formControl/models";

/** Hook input: one config entry per Payload key (see TypedFormConfig). */
interface useTypedFormProps<Payload> extends TypedFormConfig<Payload> {}

/** React props that can be spread on an input, a textarea or a select. */
export interface BoundFieldProps {
  name: string;
  /**
   * Plain callback, not a hook. React calls it with the element (null on unmount) and it shows
   * the current raw value there, choosing the strategy with instanceof. Elements of the same
   * radio or checkbox group each receive their own call.
   * bind must return a new callback on each render, so React runs it again after patchValue and setValue.
   * It does not write to fields with a formatter: `value` already controls them.
   */
  ref: RefCallback<FieldElement>;
  /** Value of the `required` rule. */
  required?: boolean;
  /** Only for fields with a formatter: the raw value while focused, the formatted one otherwise. */
  value?: string;
  onChange: (e: ChangeEvent<FieldElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

/** What the hook gives to the component that renders the form. */
interface useTypedFormI<Payload> {
  /**
   * Returns the props that connect an element to a Payload key: `<input {...bind("name")} />`.
   *
   * Do not use hooks within the bind function, because bind is going to be
   * destructured inside the tags or components.
   */
  bind: (formField: keyof Payload & string) => BoundFieldProps;
  /** Returns the form's submit handler. `onValid` receives the typed Payload and only runs when the form is valid. */
  handleSubmit: (
    onValid: (typedPayload: Payload) => void,
  ) => (e: FormEvent<HTMLFormElement>) => void;
  /** Changes the default values of the given fields, and the current values of those the user has not changed. */
  patchValue: (values: PatchValues<Payload>) => void;
  /** Changes the current values of the given fields, but not their default values. */
  setValue: (values: SetValues<Payload>) => void;
  /** Current form state, exposed so the component can show errors, disable the submit button, etc. */
  state: TypedFormI<Payload>;
}

/**
 * Binds native form elements to a typed Payload.
 * It only defines the form reducer: each action calls an operation of TypedForm,
 * which returns the next form. The logic lives in TypedForm, FormControl and Validator.
 */
export function useTypedForm<Payload>(
  props: useTypedFormProps<Payload>,
): useTypedFormI<Payload> {
  return {} as useTypedFormI<Payload>;
}
