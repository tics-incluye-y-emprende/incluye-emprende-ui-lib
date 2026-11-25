import { RawValue } from "./models";

/**
 * Knows how to read and show the raw value in one kind of `<input>`, according to its type.
 * It is a second level of FormControlInputStrategy, because inputs use different properties:
 * `value` (text-like), `checked` (checkbox and radio) or a `value` that cannot be written (file).
 */
export abstract class FormControlInputTypeStrategy {
  constructor(protected readonly element: HTMLInputElement) {}

  /** Returns the next raw value. The current one is needed for radios. */
  abstract getRawValue(currentValue: RawValue): RawValue;

  /** Shows a raw value in the input. Writes only what differs. */
  abstract setRawValue(rawValue: RawValue): void;
}

/** Text-like inputs (text, tel, number, date...) and any type without its own strategy. */
export class TextInputStrategy extends FormControlInputTypeStrategy {
  /** Returns the input's value, without modifications. */
  getRawValue(_currentValue: RawValue): RawValue {
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

/** A single checkbox. This version does not handle groups of checkboxes. */
export class CheckboxInputStrategy extends FormControlInputTypeStrategy {
  /**
   * Returns the checkbox's `value` attribute ("on" by default).
   * ASSUMPTION: undefined when it is unchecked, so `required` can reject it.
   */
  getRawValue(_currentValue: RawValue): RawValue {
    throw new Error("Not implemented");
  }

  /** Checks the checkbox only if its `value` is the raw value; unchecks it otherwise. */
  setRawValue(_rawValue: RawValue): void {
    throw new Error("Not implemented");
  }
}

/** One radio of a group. */
export class RadioInputStrategy extends FormControlInputTypeStrategy {
  /** Returns the `value` attribute of the checked radio. An unchecked radio keeps the current value. */
  getRawValue(_currentValue: RawValue): RawValue {
    throw new Error("Not implemented");
  }

  /** Checks the radio only if its `value` is the raw value; unchecks it otherwise. */
  setRawValue(_rawValue: RawValue): void {
    throw new Error("Not implemented");
  }
}

/** File inputs. The File itself is obtained by the adapter, from `e.target.files`. */
export class FileInputStrategy extends FormControlInputTypeStrategy {
  /** Returns the input's value: the fake path given by the browser, "" when there is no file. */
  getRawValue(_currentValue: RawValue): RawValue {
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
