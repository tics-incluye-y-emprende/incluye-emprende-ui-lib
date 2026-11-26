import { allFieldElementProps, ElementState } from "../formControl/models";

/** Kinds of validation error, using the browser's ValidityState names. */
export type ValidationType = keyof ValidityState;

/**
 * A limit of `min` and `max`. Number and range inputs compare it as a number. Date, month, week,
 * time and datetime-local inputs compare it as a text in the format of the input, e.g. "2026-11-26" or "09:30".
 */
export type RangeLimit = number | string;

/** Native validations supported by the library, with their DOM types. */
export type ValidationProps = Pick<
  allFieldElementProps,
  "required" | "minLength" | "maxLength" | "pattern"
> & { max: RangeLimit; min: RangeLimit };

/** All the rules: the native ones plus `custom`, the equivalent of the native customError. */
export type ValidationRules = ValidationProps & {
  /** Returns true when the element passes the check. It is not called before the element mounts. */
  custom: (elementState: ElementState) => boolean;
};

/** Configuration of one validation rule. */
export interface ValidationConfig<propValueType = unknown> {
  /** The rule's value, e.g. `true` for required or `3` for minLength. */
  propValue: propValueType;
  /** Message to show when the rule fails. */
  errorMessage?: string;
}

/**
 * Rules of a field; an absent rule is not evaluated. They are independent of the Payload type:
 * they evaluate the element. A rule without class for the kind of the element throws when it mounts (see validationStrategiesPerProp).
 */
export type ValidationsConfig = {
  [P in keyof ValidationRules]?: ValidationConfig<ValidationRules[P]>;
};

/** One validation rule. */
export interface ValidationI {
  /**
   * Returns true when the element passes the rule (the opposite of ValidityState flags) and false when
   * it fails. It only receives mounted elements, of a kind that its class supports.
   */
  validate(elementState: ElementState): boolean;
  /** The kind of error this rule represents. */
  readonly errorType: ValidationType;
  /** The configured message. */
  readonly errorMessage?: string;
}

/** Configuration of a Validator. */
export interface ValidationConfigI {
  /** The state of the element to validate. It never changes: another state needs another Validator. */
  elementState: ElementState;
  /** Rules to apply; an absent rule is not evaluated. */
  validations: ValidationsConfig;
}

/** Result of one rule, as shown to the form's consumer. */
export interface ErrorState {
  /** The kind of error; only present when the rule fails (isValid is false). */
  type?: ValidationType;
  /** The configured message, if any; only present when the rule fails (isValid is false). */
  message?: string;
  /** True when the rule passes, false when it fails, undefined when it is not in the config or the element has not mounted. */
  isValid: boolean | undefined;
}

/** Validation result of a whole field. */
export interface ValidationsState {
  /**
   * Whether the field is valid as a whole: undefined before the element mounts (nothing can be
   * evaluated); then, true when no rule fails. Rules that are not in the config do not count.
   * It can be false before the user changes anything. `required` is one more rule.
   */
  isValid: boolean | undefined;
  /** Result of each rule, accessed by its name. */
  errorsState: Record<keyof ValidationRules, ErrorState>;
}
