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
  /** Returns true when the raw value passes the check. Its failure is ignored, like any other rule's, in an empty field that is not required. */
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
  /** Rules to apply; an absent rule is not evaluated. */
  validations: ValidationsConfig;
}

/** Evaluates all the rules of a field. */
export interface ValidatorI {
  validate(rawValue: RawValue): ValidationsState;
}

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
   * Rules that are not in the config (undefined) do not count.
   * Exception: a field that is not required (`required` is absent or its propValue is false)
   * is also valid when it is empty (undefined, "" or []), even if some rule fails.
   */
  isValid: boolean;
  /**
   * Result of each rule, accessed by its name. A rule can fail while the field is valid
   * (empty and not required), so check the field's isValid before showing its message.
   */
  errorsState: Record<keyof ValidationRules, ErrorState>;
}
