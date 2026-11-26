import { ElementState, FormControlConfig, formControlI } from "../formControl/models";

/** Values that can be shown in an element without a payloadToElementAdapter. */
type ShowableValue = string | number | boolean | File;

/** Makes payloadToElementAdapter required for the values that cannot be shown without it. */
type RequiredElementAdapter<Payload, K extends keyof Payload> =
  NonNullable<Payload[K]> extends ShowableValue
    ? unknown
    : Required<Pick<FormControlConfig<Payload, K>, "payloadToElementAdapter">>;

/** Configuration of a whole form whose submitted result is `Payload`. */
export interface TypedFormConfig<Payload> {
  /** One config per Payload key. Each adapter must return the type of its own key. */
  fieldsConfig: {
    [K in keyof Payload]: FormControlConfig<Payload, K> &
      RequiredElementAdapter<Payload, K>;
  };
}

/**
 * Immutable state of the whole form, derived from its fields.
 * Each operation returns a new form when some field changes, so React detects it, and the same
 * form when none does. The fields that do not change keep the same control.
 * A form without fields is valid, with the payload {}.
 * change, syncElement, focus, blur and click throw an error with the name of a field that does not exist.
 */
export interface TypedFormI<Payload> {
  /**
   * True when no field is invalid (validationState.isValid is false), so it can be false before the user changes anything.
   * Fields whose element has not mounted (isValid undefined) do not block it, so a form whose fields are shown later can be submitted.
   */
  readonly isValid: boolean;
  /** True once at least one field has been clicked or blurred; false again after reset. */
  readonly isTouched: boolean;
  /** True when at least one field's current value differs from its current defaultValue. */
  readonly hasChanged: boolean;
  /** State of each field, accessed by Payload key. */
  readonly fields: { [K in keyof Payload]: formControlI<Payload, K> };
  /**
   * The payloadValue of every field; undefined while the form is not valid.
   * It is what the adapters returned, or the default, patched or set values, so a value can be undefined. Making the fields match the Payload
   * (usually the body expected by the API) is the responsibility of the UI that implements the form.
   */
  readonly payload: Payload | undefined;
  /** The payloadValue of every field, also while the form is not valid; invalid fields are present as undefined. */
  readonly partialPayload: PartialPayload<Payload>;

  /** Changes a field to the value that its eventToPayload returned for a change event, and to the state of its element. */
  change<K extends keyof Payload>(
    field: K,
    value: Payload[K] | undefined,
    elementState: ElementState,
  ): TypedFormI<Payload>;
  /** Replaces the element state of a field, read after its element mounts or is written. */
  syncElement(field: keyof Payload, elementState: ElementState): TypedFormI<Payload>;
  /** Marks a field as focused. */
  focus(field: keyof Payload): TypedFormI<Payload>;
  /** Marks a field as touched and no longer focused. */
  blur(field: keyof Payload): TypedFormI<Payload>;
  /** Marks a field as touched. */
  click(field: keyof Payload): TypedFormI<Payload>;
  /** Changes the default values of the given fields, and the current values of those that have not changed. Absent keys do not change, undefined ones do, and unknown ones are ignored. */
  patchValue(values: PatchValues<Payload>): TypedFormI<Payload>;
  /** Changes the current values of the given fields, but not their default values. Absent keys do not change, undefined ones do, and unknown ones are ignored. */
  setValue(values: SetValues<Payload>): TypedFormI<Payload>;
  /** Returns every field to its current default value, untouched. */
  reset(): TypedFormI<Payload>;
}

/** Result of a form that may not be valid, by Payload key. */
export type PartialPayload<Payload> = {
  [K in keyof Payload]: Payload[K] | undefined;
};

/** New default values, by Payload key. */
export type PatchValues<Payload> = { [K in keyof Payload]?: Payload[K] | undefined };

/** New current values, by Payload key. */
export type SetValues<Payload> = { [K in keyof Payload]?: Payload[K] | undefined };
