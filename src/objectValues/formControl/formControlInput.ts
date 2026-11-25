import { RawValue } from "./models";

/**
 * Knows how to read and show the raw value in one kind of `<input>`, according to its type.
 * It is a second level of FormControlInputStrategy, because inputs use their `value` differently:
 * it is what the user writes (text-like), it identifies the option (checkbox and radio) or it cannot be written (file).
 */
export abstract class FormControlInputTypeStrategy {
  constructor(protected readonly element: HTMLInputElement) {}

  /** Returns the raw value of the input. */
  abstract getRawValue(): RawValue;

  /** Shows a raw value in the input. Writes only what differs. */
  abstract setRawValue(rawValue: RawValue): void;
}

/** Text-like inputs (text, tel, number, date...) and any type without its own strategy. */
export class TextInputStrategy extends FormControlInputTypeStrategy {
  /** Returns the input's value, without modifications. */
  getRawValue(): RawValue {
    throw new Error("Not implemented");
  }

  /**
   * Shows the text; undefined shows "".
   * It does not write an equal value, because writing moves the cursor.
   */
  setRawValue(_rawValue: RawValue): void {
    throw new Error("Not implemented");
  }
}

/**
 * A single checkbox. This version does not handle groups of checkboxes.
 * The raw value and `checked` are independent: the adapter can read `e.target.checked`.
 */
export class CheckboxInputStrategy extends FormControlInputTypeStrategy {
  /** Returns the `value` attribute, whether or not it is checked. */
  getRawValue(): RawValue {
    throw new Error("Not implemented");
  }

  /** Does nothing: the raw value is independent of `checked`, and writing `value` would replace the one set by the developer. */
  setRawValue(_rawValue: RawValue): void {
    throw new Error("Not implemented");
  }
}

/**
 * One radio of a group.
 * The raw value and `checked` are independent: the adapter can read `e.target.checked`.
 */
export class RadioInputStrategy extends FormControlInputTypeStrategy {
  /** Returns the `value` attribute, whether or not it is checked. */
  getRawValue(): RawValue {
    throw new Error("Not implemented");
  }

  /** Does nothing: the raw value is independent of `checked`, and writing `value` would replace the one set by the developer. */
  setRawValue(_rawValue: RawValue): void {
    throw new Error("Not implemented");
  }
}

/** File inputs. The File itself is obtained by the adapter, from `e.target.files`. */
export class FileInputStrategy extends FormControlInputTypeStrategy {
  /** Returns the input's value: the fake path given by the browser, "" when there is no file. */
  getRawValue(): RawValue {
    throw new Error("Not implemented");
  }

  /** An empty value (undefined or "") clears the selection. Any other is ignored: browsers do not allow writing it. */
  setRawValue(_rawValue: RawValue): void {
    throw new Error("Not implemented");
  }
}

/** Creates the strategy for the input, according to its type. */
export function executeFormControlInputStrategy(
  _element: HTMLInputElement,
): FormControlInputTypeStrategy {
  throw new Error("Not implemented");
}
