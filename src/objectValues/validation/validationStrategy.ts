import {
  ValidationRules,
  ValidationConfig,
  ValidationI,
  ValidationType,
} from "./models";
import { RawValue } from "../formControl/models";

/**
 * Base class for one validation rule. Each subclass knows how to evaluate one native validation.
 * A strategy knows nothing about the other rules: empty values get no special treatment
 * (unlike native forms). Combining the results is the Validator's responsibility.
 * Each rule evaluates undefined on its own. The consumer's implementation is respected: undefined
 * passes if `custom` or the `pattern` accepts it, or if `required` is false.
 * Groups (string[]): minLength, maxLength, pattern, min and max evaluate each element, and the
 * group passes when all of them pass, so a group without elements passes. `required` and
 * `custom` evaluate the group as a whole.
 */
abstract class ValidationStrategy<PropValue = unknown> implements ValidationI {
  /** Receives the rule's value and its optional error message. */
  constructor(protected readonly config: ValidationConfig<PropValue>) {}

  /** Returns true when the raw value satisfies the rule; a value that cannot be evaluated does not satisfy it. */
  abstract validate(rawValue: RawValue): boolean;
  /** Kind of error, defined by each subclass. */
  protected abstract errorTypeName: ValidationType;
  /** Public access to the kind of error. */
  public get errorType(): ValidationType {
    throw new Error("Not implemented");
  }

  /** The configured message. */
  public get errorMessage(): string | undefined {
    throw new Error("Not implemented");
  }
}

/** `required`: the field must have a value. */
class RequiredValidationStrategy extends ValidationStrategy<
  ValidationRules["required"]
> {
  errorTypeName: ValidationType = "valueMissing";

  /**
   * Passes when the field has a value, or when required is false.
   * Missing means undefined or the empty value of its kind of field: "" for text-like
   * inputs, textarea and select; nothing checked or selected (undefined or []) for
   * radio, checkbox and multiple select.
   */
  validate(_rawValue: RawValue): boolean {
    throw new Error("Not implemented");
  }
}

/** `minLength`: the text must have at least that many characters. */
class MinLengthValidationStrategy extends ValidationStrategy<
  ValidationRules["minLength"]
> {
  errorTypeName: ValidationType = "tooShort";

  /**
   * Passes when the text is long enough.
   * "" has length 0, so it fails any limit above 0. undefined fails.
   */
  validate(_rawValue: RawValue): boolean {
    throw new Error("Not implemented");
  }
}

/** `maxLength`: the text must not exceed that many characters. */
class MaxLengthValidationStrategy extends ValidationStrategy<
  ValidationRules["maxLength"]
> {
  errorTypeName: ValidationType = "tooLong";

  /** Passes when the text is not too long. "" has length 0, so it passes. undefined fails. */
  validate(_rawValue: RawValue): boolean {
    throw new Error("Not implemented");
  }
}

/** `pattern`: the text must match the regular expression. */
class PatternValidationStrategy extends ValidationStrategy<
  ValidationRules["pattern"]
> {
  errorTypeName: ValidationType = "patternMismatch";

  /**
   * Passes when the whole text matches.
   * ASSUMPTION: full match, as in native forms.
   * undefined is evaluated as "", because a pattern only evaluates texts: both pass if the pattern matches "".
   */
  validate(_rawValue: RawValue): boolean {
    throw new Error("Not implemented");
  }
}

/** Rule written by the library's consumer, like setCustomValidity in native inputs. */
class CustomValidationStrategy extends ValidationStrategy<
  ValidationRules["custom"]
> {
  errorTypeName: ValidationType = "customError";

  /** Runs the consumer's custom check. */
  validate(_rawValue: RawValue): boolean {
    throw new Error("Not implemented");
  }
}

/** `max`: the value must not be greater than the limit. */
class MaxValueValidationStrategy extends ValidationStrategy<
  ValidationRules["max"]
> {
  errorTypeName: ValidationType = "rangeOverflow";

  /**
   * Passes when value <= max, for both numbers and dates.
   * Anything that cannot be compared fails: undefined, "" and texts that are neither a number nor a date.
   */
  validate(_rawValue: RawValue): boolean {
    throw new Error("Not implemented");
  }
}

/** `min`: the value must not be less than the limit. */
class MinValueValidationStrategy extends ValidationStrategy<
  ValidationRules["min"]
> {
  errorTypeName: ValidationType = "rangeUnderflow";

  /**
   * Passes when value >= min, for both numbers and dates.
   * Anything that cannot be compared fails: undefined, "" and texts that are neither a number nor a date.
   */
  validate(_rawValue: RawValue): boolean {
    throw new Error("Not implemented");
  }
}

export {
  ValidationStrategy,
  RequiredValidationStrategy,
  MinLengthValidationStrategy,
  MaxLengthValidationStrategy,
  PatternValidationStrategy,
  CustomValidationStrategy,
  MaxValueValidationStrategy,
  MinValueValidationStrategy,
};
