import type { ChangeEvent } from "react";
import {
  DefaultValue,
  FieldElement,
  FormControlConfig,
  formControlI,
  RawValue,
} from "../formControl/models";

/** Configuration of a whole form whose submitted result is `Payload`. */
export interface TypedFormConfig<Payload> {
  /** One config per Payload key. Each adapter must return the type of its own key. */
  fieldsConfig: { [K in keyof Payload]: FormControlConfig<Payload, K> };
}

/** Immutable state of the whole form, derived from its fields: each operation returns a new form, so React detects the change. */
export interface TypedFormI<Payload> {
  /** True when every field is valid (validationState.isValid), so it can be false before the user changes anything. */
  readonly isValid: boolean;
  /** True once at least one field has been clicked or blurred; false again after reset. */
  readonly isTouched: boolean;
  /** True when at least one field's current rawValue differs from its current defaultValue. */
  readonly hasChanged: boolean;
  /** State of each field, accessed by Payload key. */
  readonly fields: { [K in keyof Payload]: formControlI<Payload, K> };
  /**
   * The complete result; undefined while the form is not valid.
   * When a field's adapter returns undefined, its current raw value
   * is included as is, even if it does not match the Payload type. The Payload usually is the body
   * expected by the API, so making the fields match it is the responsibility of the UI that
   * implements the form, not of the validators or the hook.
   */
  readonly payload: Payload | undefined;

  /** Applies a change event to a field. */
  change(field: keyof Payload, e: ChangeEvent<FieldElement>): TypedFormI<Payload>;
  /** Marks a field as focused. */
  focus(field: keyof Payload): TypedFormI<Payload>;
  /** Marks a field as touched and no longer focused. */
  blur(field: keyof Payload): TypedFormI<Payload>;
  /** Marks a field as touched. */
  click(field: keyof Payload): TypedFormI<Payload>;
  /** Changes the default values of the given fields, and the current values of those that have not changed. */
  patchValue(values: PatchValues<Payload>): TypedFormI<Payload>;
  /** Changes the current values of the given fields, but not their default values. */
  setValue(values: SetValues<Payload>): TypedFormI<Payload>;
  /** Returns every field to its current default value, untouched. */
  reset(): TypedFormI<Payload>;
}

/** New default values (raw), by Payload key. */
export type PatchValues<Payload> = { [K in keyof Payload]?: DefaultValue };

/** New current values (raw), by Payload key. */
export type SetValues<Payload> = { [K in keyof Payload]?: RawValue };
