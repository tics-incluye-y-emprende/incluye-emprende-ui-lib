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
  /** Returns true when the raw value is valid. */
  custom: (rawValue: RawValue) => boolean;
};

/** Configuration of one validation rule. */
export interface ValidationConfig<propValueType = unknown> {
  /** The rule's value, e.g. `true` for required or `3` for minLength. */
  propValue: propValueType;
  /** Message to show when the rule fails. */
  errorMessage?: string;
}

/** Rules of a field; an absent rule is considered valid. */
export type ValidationsConfig = {
  [P in keyof ValidationRules]?: ValidationConfig<ValidationRules[P]>;
};

/** One validation rule. */
export interface ValidationI {
  /** Returns true when the raw value passes the rule (the opposite of ValidityState flags). */
  validate(rawValue: RawValue): boolean;
  /** The kind of error this rule represents. */
  readonly errorType: ValidationType;
  /** The configured message. */
  readonly errorMessage?: string;
}

/** Configuration of a Validator. */
export interface ValidationConfigI {
  /** Rules to apply; an absent rule is considered valid. */
  validations: ValidationsConfig;
}

/** Evaluates all the rules of a field. */
export interface ValidatorI {
  validate(rawValue: RawValue): ValidationsState;
}

/** Result of one rule, as shown to the form's consumer. */
export interface ErrorState {
  /** The kind of error. */
  type: ValidationType;
  /** Text to show to the user, if any. */
  message: string | undefined;
  /** True when the rule passes. */
  isValid: boolean;
}

/** Validation result of a whole field. */
export interface ValidationsState {
  /** True when all its rules pass. */
  isValid: boolean;
  /** Result of each rule, accessed by its name. */
  errorsState: Record<keyof ValidationRules, ErrorState>;
}
