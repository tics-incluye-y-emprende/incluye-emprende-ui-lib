import { ElementState } from "../formControl/models";
import {
  RangeLimit,
  ValidationRules,
  ValidationConfig,
  ValidationI,
  ValidationType,
} from "./models";

/**
 * Base class for one validation rule. Each first-level subclass evaluates one native validation
 * with the most common behavior, and its subclasses override only what is specific to some kinds
 * of element. Which class evaluates each kind is decided by validationStrategiesPerProp (validator.ts),
 * so no strategy asks for the kind of the element.
 * A strategy knows nothing about the other rules: empty values get no special treatment
 * (unlike native forms). Combining the results is the Validator's responsibility.
 * It only receives mounted elements: before that, the Validator does not create strategies.
 */
abstract class ValidationStrategy<PropValue = unknown> implements ValidationI {
  /** Receives the rule's value and its optional error message. */
  constructor(protected readonly config: ValidationConfig<PropValue>) {}

  /** See ValidationI. */
  abstract validate(elementState: ElementState): boolean;
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

/** `required`: the element must have a value. Common behavior, for texts, selects, numbers and dates. */
class RequiredValidationStrategy extends ValidationStrategy<
  ValidationRules["required"]
> {
  errorTypeName: ValidationType = "valueMissing";

  /** Passes when required is false or the element has a value (see hasValue). */
  validate(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }

  /** Its value is not "", or the browser has text it cannot convert (badInput). Subclasses override it. */
  protected hasValue(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }
}

/** `required` for checkboxes and radios. */
class CheckedRequiredValidationStrategy extends RequiredValidationStrategy {
  /** A checkbox must be checked; in a radio group, one radio must be checked. */
  protected hasValue(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }
}

/** `required` for file inputs. */
class FileRequiredValidationStrategy extends RequiredValidationStrategy {
  /** There must be at least one file; the fake path of the value does not count. */
  protected hasValue(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }
}

/** `minLength`: the text must have at least that many characters. */
class MinLengthValidationStrategy extends ValidationStrategy<
  ValidationRules["minLength"]
> {
  errorTypeName: ValidationType = "tooShort";

  /** Passes when the value is long enough. "" has length 0, so it fails any limit above 0. */
  validate(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }
}

/** `maxLength`: the text must not exceed that many characters. */
class MaxLengthValidationStrategy extends ValidationStrategy<
  ValidationRules["maxLength"]
> {
  errorTypeName: ValidationType = "tooLong";

  /** Passes when the value is not too long. "" does not exceed any limit. */
  validate(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }
}

/** `pattern`: the text must match the regular expression. */
class PatternValidationStrategy extends ValidationStrategy<
  ValidationRules["pattern"]
> {
  errorTypeName: ValidationType = "patternMismatch";

  /**
   * Passes when the whole value matches.
   * ASSUMPTION: full match, as in native forms. "" passes only if the pattern matches it.
   */
  validate(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }
}

/** Rule written by the library's consumer, like setCustomValidity in native inputs. */
class CustomValidationStrategy extends ValidationStrategy<
  ValidationRules["custom"]
> {
  errorTypeName: ValidationType = "customError";

  /** Runs the consumer's check with the element state. */
  validate(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }
}

/** `max`: the value must not be greater than the limit. Common behavior, for numbers. */
class MaxValueValidationStrategy extends ValidationStrategy<
  ValidationRules["max"]
> {
  errorTypeName: ValidationType = "rangeOverflow";

  /** Passes when compare is 0 or less. It fails with "" and with badInput. */
  validate(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }

  /** Below 0 when the value is smaller than the limit, 0 when equal and above 0 when greater. Compares them as numbers. Subclasses override it. */
  protected compare(_value: string, _limit: RangeLimit): number {
    throw new Error("Not implemented");
  }
}

/** `max` for date, month, week, time and datetime-local inputs. */
class DateMaxValueValidationStrategy extends MaxValueValidationStrategy {
  /** Compares them as texts: the format of these inputs makes their order the order of the dates. */
  protected compare(_value: string, _limit: RangeLimit): number {
    throw new Error("Not implemented");
  }
}

/** `min`: the value must not be less than the limit. Common behavior, for numbers. */
class MinValueValidationStrategy extends ValidationStrategy<
  ValidationRules["min"]
> {
  errorTypeName: ValidationType = "rangeUnderflow";

  /** Passes when compare is 0 or more. It fails with "" and with badInput. */
  validate(_elementState: ElementState): boolean {
    throw new Error("Not implemented");
  }

  /** Below 0 when the value is smaller than the limit, 0 when equal and above 0 when greater. Compares them as numbers. Subclasses override it. */
  protected compare(_value: string, _limit: RangeLimit): number {
    throw new Error("Not implemented");
  }
}

/** `min` for date, month, week, time and datetime-local inputs. */
class DateMinValueValidationStrategy extends MinValueValidationStrategy {
  /** Compares them as texts: the format of these inputs makes their order the order of the dates. */
  protected compare(_value: string, _limit: RangeLimit): number {
    throw new Error("Not implemented");
  }
}

export {
  ValidationStrategy,
  RequiredValidationStrategy,
  CheckedRequiredValidationStrategy,
  FileRequiredValidationStrategy,
  MinLengthValidationStrategy,
  MaxLengthValidationStrategy,
  PatternValidationStrategy,
  CustomValidationStrategy,
  MaxValueValidationStrategy,
  DateMaxValueValidationStrategy,
  MinValueValidationStrategy,
  DateMinValueValidationStrategy,
};
