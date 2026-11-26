import type { ChangeEvent } from "react";
import { ValidationsConfig, ValidationsState } from "../validation/models";

/** Native elements a field can be bound to. Multiple selects are not supported. */
export type FieldElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

/** All the properties of the three elements combined, so props that exist only on some of them (e.g. `pattern`) can be picked. */
export type allFieldElementProps = HTMLInputElement &
  HTMLTextAreaElement &
  HTMLSelectElement;

/**
 * What an element shows: its text, its option or whether it is checked. Undefined shows nothing.
 * It is never part of the payload nor validated.
 */
export type ElementValue = string | boolean | undefined;

/** Kind of a bound element: "select", "textarea" or "input:" plus its type, e.g. "input:checkbox". */
export type ElementKind = "select" | "textarea" | `input:${string}`;

/**
 * The properties of an element that validations need, read from it. It is never the element itself.
 * Before the element mounts, every property is undefined, but the object is still evaluated.
 */
export interface ElementState {
  /** Kind of the element. */
  readonly kind: ElementKind | undefined;
  /** Its text, the selected option or the value of the checked radio of the group; "" when there is none. A file input has the fake path given by the browser. */
  readonly value: string | undefined;
  /** Checkbox: whether it is checked. Radio: whether a radio of the group is checked. False for other kinds. */
  readonly checked: boolean | undefined;
  /** Chosen files; empty for other kinds. */
  readonly files: readonly File[] | undefined;
  /** The browser has text it cannot convert, e.g. "abc" in a number input (validity.badInput). */
  readonly badInput: boolean | undefined;
}

/**
 * Configuration of one field, identified by the Payload key `K`.
 * The value of the field always has the type of its key. Groups of checkboxes that share a name are not supported.
 */
export interface FormControlConfig<Payload, K extends keyof Payload> {
  /**
   * Returns the payload value of a change event. It only runs when the user changes the element.
   * `state` is the control before the event.
   * Return undefined when the element is empty. When its text cannot be converted, return NaN or
   * Invalid Date rather than undefined, so hasChanged and patchValue do not take it for an empty element.
   * The type of its event can be narrowed: `(e: ChangeEvent<HTMLInputElement>) => e.target.checked`.
   */
  eventToPayloadAdapter(
    e: ChangeEvent<FieldElement>,
    state: formControlI<Payload, K>,
  ): Payload[K] | undefined;
  /**
   * The opposite: returns what the element must show for a value. It is not called for
   * undefined, null, NaN, Invalid Date nor a File.
   * Optional for texts, numbers and booleans, which are shown as they are, and useless for files.
   */
  payloadToElementAdapter?(value: Payload[K]): string | boolean;
  /** Payload value the field starts with. */
  defaultValue?: Payload[K];
  /**
   * Display-only: returns the text to show while the field is not focused (3001234567 -> 300 123 4567).
   * It is not called for undefined, null, "", NaN nor Invalid Date, and it does not validate or filter.
   * Only for text-like inputs (text, tel, search, url, password) and textarea.
   */
  formatter?(value: Payload[K]): string;
  /**
   * Validation rules of the element, e.g. `{ required: { propValue: true } }`. They are independent of the Payload type.
   * `required` is one more rule; without it, the other rules are still evaluated with empty values: see validation.md.
   */
  validations?: ValidationsConfig;
}

/** A value together with the one it is related to. */
export interface ValueSate<V> {
  /** The value right now. */
  readonly currentValue: V;
  /** The earlier value; what "earlier" means depends on the field of formControlI. */
  readonly prevValue?: V;
  /** Whether the value is considered changed; the comparison depends on the field of formControlI. */
  readonly hasChanged: boolean;
}

/**
 * Immutable state of one field. Each operation only changes what its comment says: it returns a
 * new control when something changes and the same one when nothing does.
 * Values are compared with Object.is, and dates by their time. undefined and "" are different.
 */
export interface formControlI<Payload, K extends keyof Payload> {
  /**
   * currentValue is the last default value. prevValue is the one it had before the last patch;
   * undefined until the first one.
   * hasChanged is false until the first patch; then, it is true when both are different.
   */
  readonly defaultValue: ValueSate<Payload[K] | undefined>;
  /**
   * The payload value before validation: what the adapter returned, or the default, patched or set value.
   * prevValue is the value before the last operation that changed the value; undefined at the beginning.
   * hasChanged is true when currentValue differs from defaultValue.currentValue, no matter whether
   * it was changed by the user or by setValue. Then, patchValue respects it.
   */
  readonly value: ValueSate<Payload[K] | undefined>;
  /**
   * The current value; undefined while the field is not valid (validationState.isValid is false).
   * Before the element mounts it is not validated, so it is the current value. The form builds the complete Payload.
   */
  readonly payloadValue: Payload[K] | undefined;
  /**
   * Text generated by the formatter for the current value, also while the element is focused and
   * when it is not valid; undefined if there is no formatter or it is not called for the value.
   */
  readonly formattedValue: string | undefined;
  /**
   * What the element should show: formattedValue while it is not focused, if there is one; otherwise,
   * the current value converted by payloadToElementAdapter or, without it, a text or a boolean
   * as it is and a number as a text. Any other value shows nothing (undefined).
   */
  readonly elementValue: ElementValue;
  /**
   * Changes when elementValue must be written to the element again: when patchValue, setValue or
   * reset return another current value, when reset follows a change event, and on
   * focus and blur if there is a formattedValue. It does not change when the user changes the
   * element, because its content belongs to the browser while the user edits it ("1." would be rewritten as "1").
   */
  readonly elementVersion: number;
  /** True between the focus and blur events, when the element shows the value instead of the formatted one. */
  readonly isFocused: boolean;
  /** True once the element has been clicked or blurred (so keyboard users count), even if its value did not change; false again after reset. */
  readonly isTouched: boolean;
  /**
   * The properties of the element, read from it. Every one is undefined until the element mounts.
   * It comes from the last change event or the last syncElement.
   */
  readonly elementState: ElementState;
  /**
   * Result of running the field's validations over elementState, not over the value. After patchValue,
   * setValue and reset it reflects the element once the hook writes to it and calls syncElement.
   */
  readonly validationState: ValidationsState;

  /** Returns what eventToPayloadAdapter returns for the event and this control. It changes nothing. */
  eventToPayload(e: ChangeEvent<FieldElement>): Payload[K] | undefined;
  /**
   * Changes the current value to the one the user entered (see eventToPayload), and the element state
   * to the one read from the element of the event. Always returns a new control, because the content of
   * the element can change while the value does not.
   */
  change(value: Payload[K] | undefined, elementState: ElementState): formControlI<Payload, K>;
  /**
   * Replaces the element state with the one read from the element after it mounts or after a write.
   * It changes nothing else. Returns the same control when every property is equal (files are compared one by one).
   */
  syncElement(elementState: ElementState): formControlI<Payload, K>;
  /** Marks the field as focused. */
  focus(): formControlI<Payload, K>;
  /** Marks the field as touched and no longer focused. */
  blur(): formControlI<Payload, K>;
  /** Marks the field as touched. */
  click(): formControlI<Payload, K>;
  /**
   * Replaces the current default value, keeping the last one as defaultValue.prevValue.
   * undefined removes the default value.
   * It also updates the current value, but only if the field has not changed (value.hasChanged is false).
   */
  patchValue(value: Payload[K] | undefined): formControlI<Payload, K>;
  /** Updates the current value, but never defaultValue. */
  setValue(value: Payload[K] | undefined): formControlI<Payload, K>;
  /**
   * Returns the current value to the current default value, so value.hasChanged is false. The field
   * is no longer touched, so its errors are not shown immediately; isFocused does not change.
   * It returns the same control if there is nothing to return: it has its default value, is not
   * touched and has had no change event since the last reset.
   */
  reset(): formControlI<Payload, K>;
}
