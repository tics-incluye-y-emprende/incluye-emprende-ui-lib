import { ElementState, ElementValue } from "./models";

/**
 * Knows how to show a value in one kind of `<input>`, according to its type.
 * It is a second level of FormControlInputStrategy, because inputs show it differently:
 * as their text (text-like), being checked (checkbox and radio) or not at all (file).
 */
export abstract class FormControlInputTypeStrategy {
  constructor(protected readonly element: HTMLInputElement) {}

  /** Shows a value in the input. Writes only what differs. */
  abstract setElementValue(value: ElementValue): void;

  /** Reads the properties that validations need. The kind is "input:" plus the type of the input. */
  abstract getElementState(): ElementState;
}

/** Text-like inputs (text, tel, number, date...) and any type without its own strategy. Their state has their text and validity.badInput. */
export class TextInputStrategy extends FormControlInputTypeStrategy {
  /**
   * Shows the text; undefined shows "", and a boolean is written as a text.
   * It does not write an equal value, because writing moves the cursor.
   */
  setElementValue(_value: ElementValue): void {
    throw new Error("Not implemented");
  }

  getElementState(): ElementState {
    throw new Error("Not implemented");
  }
}

/** A single checkbox. Groups of checkboxes are not supported. Its state has its `value` and whether it is checked. */
export class CheckboxInputStrategy extends FormControlInputTypeStrategy {
  /** A boolean checks or unchecks it, and a text checks it only if it is its `value`. undefined unchecks it. It never writes `value`. */
  setElementValue(_value: ElementValue): void {
    throw new Error("Not implemented");
  }

  getElementState(): ElementState {
    throw new Error("Not implemented");
  }
}

/**
 * One radio of a group. Its state describes the whole group: the radios with the same name in its form,
 * or in the document when it has no form. value is the one of the checked radio, "" if none is.
 */
export class RadioInputStrategy extends FormControlInputTypeStrategy {
  /** Checks it only if its `value` is the text; a boolean is compared as a text ("true" or "false"). It never writes `value`. */
  setElementValue(_value: ElementValue): void {
    throw new Error("Not implemented");
  }

  getElementState(): ElementState {
    throw new Error("Not implemented");
  }
}

/** File inputs. Their state has the chosen files and the fake path as value. */
export class FileInputStrategy extends FormControlInputTypeStrategy {
  /**
   * An empty value (undefined or "") clears the selection. Any other is ignored.
   * A File set by code has no elementValue, so the selection is cleared: browsers do not allow showing it.
   */
  setElementValue(_value: ElementValue): void {
    throw new Error("Not implemented");
  }

  getElementState(): ElementState {
    throw new Error("Not implemented");
  }
}

/** Creates the strategy for the input, according to its type. */
export function executeFormControlInputStrategy(
  _element: HTMLInputElement,
): FormControlInputTypeStrategy {
  throw new Error("Not implemented");
}
