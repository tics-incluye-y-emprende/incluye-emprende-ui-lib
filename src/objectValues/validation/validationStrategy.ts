import {
  ValidationRules,
  ValidationConfig,
  ValidationI,
  ValidationType,
} from "./models";
import { RawValue } from "../formControl/models";

/** Base class for one validation rule. Each subclass knows how to evaluate one native validation. */
abstract class ValidationStrategy<PropValue = unknown> implements ValidationI {
  /** Receives the rule's value and its optional error message. */
  constructor(protected readonly config: ValidationConfig<PropValue>) {}

  /** Returns true when the raw value satisfies the rule. */
  abstract validate(rawValue: RawValue): boolean;
  /** Kind of error, defined by each subclass. */
  protected abstract errorTypeName: ValidationType;
  /** Public access to the kind of error. */
  public get errorType(): ValidationType {
    return this.errorTypeName;
  }

  /** The configured message. */
  public get errorMessage(): string | undefined {
    return;
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
    return false;
  }
}

/** `minLength`: the text must have at least that many characters. */
class MinLengthValidationStrategy extends ValidationStrategy<
  ValidationRules["minLength"]
> {
  errorTypeName: ValidationType = "tooShort";

  /**
   * Passes when the text is long enough.
   * ASSUMPTION: an empty optional field passes, as in native forms.
   */
  validate(_rawValue: RawValue): boolean {
    return false;
  }
}

/** `maxLength`: the text must not exceed that many characters. */
class MaxLengthValidationStrategy extends ValidationStrategy<
  ValidationRules["maxLength"]
> {
  errorTypeName: ValidationType = "tooLong";

  /** Passes when the text is not too long. */
  validate(_rawValue: RawValue): boolean {
    return false;
  }
}

/** `pattern`: the text must match the regular expression. */
class PatternValidationStrategy extends ValidationStrategy<
  ValidationRules["pattern"]
> {
  errorTypeName: ValidationType = "patternMismatch";

  /**
   * Passes when the whole text matches.
   * ASSUMPTION: full match, and empty passes, as in native forms.
   */
  validate(_rawValue: RawValue): boolean {
    return false;
  }
}

/** Rule written by the library's consumer, like setCustomValidity in native inputs. */
class CustomValidationStrategy extends ValidationStrategy<
  ValidationRules["custom"]
> {
  errorTypeName: ValidationType = "customError";

  /** Runs the consumer's custom check. */
  validate(_rawValue: RawValue): boolean {
    return false;
  }
}

/** `max`: the value must not be greater than the limit. */
class MaxValueValidationStrategy extends ValidationStrategy<
  ValidationRules["max"]
> {
  errorTypeName: ValidationType = "rangeOverflow";

  /** Passes when value <= max, for both numbers and dates. */
  validate(_rawValue: RawValue): boolean {
    return false;
  }
}

/** `min`: the value must not be less than the limit. */
class MinValueValidationStrategy extends ValidationStrategy<
  ValidationRules["min"]
> {
  errorTypeName: ValidationType = "rangeUnderflow";

  /** Passes when value >= min, for both numbers and dates. */
  validate(_rawValue: RawValue): boolean {
    return false;
  }
}

/** Maps each validation prop to the strategy class that evaluates it, so the Validator can create them from the config. */
const validationStrategiesPerProp: {
  [P in keyof ValidationRules]: new (
    config: ValidationConfig<ValidationRules[P]>,
  ) => ValidationI;
} = {
  required: RequiredValidationStrategy,
  minLength: MinLengthValidationStrategy,
  maxLength: MaxLengthValidationStrategy,
  pattern: PatternValidationStrategy,
  max: MaxValueValidationStrategy,
  min: MinValueValidationStrategy,
  custom: CustomValidationStrategy,
};

export {
  validationStrategiesPerProp,
  ValidationStrategy,
  RequiredValidationStrategy,
  MinLengthValidationStrategy,
  MaxLengthValidationStrategy,
  PatternValidationStrategy,
  CustomValidationStrategy,
  MaxValueValidationStrategy,
  MinValueValidationStrategy,
};
