import { allFieldElementProps, RawValue } from "../formControl/models";

/** Kinds of validation error, using the browser's ValidityState names. */
export type ValidationType = keyof ValidityState;

/** Native validation attributes supported by the library, with their DOM types. */
export type ValidationProps = Pick<
  allFieldElementProps,
  "required" | "minLength" | "maxLength" | "pattern" | "max" | "min"
>;

/** All the rules: the native ones plus `custom`, the equivalent of the native customError. */
export type ValidationRules = ValidationProps & {
  /** Returns true when the raw value passes the check. It also decides whether undefined passes. */
  custom: (rawValue: RawValue) => boolean;
};

/** Configuration of one validation rule. */
export interface ValidationConfig<propValueType = unknown> {
  /** The rule's value, e.g. `true` for required or `3` for minLength. */
  propValue: propValueType;
  /** Message to show when the rule fails. */
  errorMessage?: string;
}

/** Rules of a field; an absent rule is not evaluated. */
export type ValidationsConfig = {
  [P in keyof ValidationRules]?: ValidationConfig<ValidationRules[P]>;
};

/** One validation rule. */
export interface ValidationI {
  /**
   * Returns true when the raw value passes the rule (the opposite of ValidityState flags).
   * A value that the rule cannot evaluate (e.g. `min` with "abc") does not pass.
   */
  validate(rawValue: RawValue): boolean;
  /** The kind of error this rule represents. */
  readonly errorType: ValidationType;
  /** The configured message. */
  readonly errorMessage?: string;
}

/** Configuration of a Validator. */
export interface ValidationConfigI {
  /** The value to validate. It never changes: another value needs another Validator. */
  rawValue: RawValue;
  /** Rules to apply; an absent rule is not evaluated. */
  validations: ValidationsConfig;
}

/** Creates the validation state of one raw value. */
export type CreateValidator = (config: ValidationConfigI) => ValidationsState;

/** Result of one rule, as shown to the form's consumer. */
export interface ErrorState {
  /** The kind of error; only present when the rule fails (isValid is false). */
  type?: ValidationType;
  /** The configured message, if any; only present when the rule fails (isValid is false). */
  message?: string;
  /** True when the rule passes, false when it fails, undefined when it is not in the config. */
  isValid: boolean | undefined;
}

/** Validation result of a whole field. */
export interface ValidationsState {
  /**
   * Whether the field is valid as a whole: true when no rule fails (its isValid is false).
   * Rules that are not in the config (undefined) do not count. It depends only on the raw value:
   * it can be false before the user changes anything. `required` is one more rule.
   */
  isValid: boolean;
  /** Result of each rule, accessed by its name. */
  errorsState: Record<keyof ValidationRules, ErrorState>;
}
