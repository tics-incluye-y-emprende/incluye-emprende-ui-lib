import { RawValue } from "../formControl/models";
import {
  ValidationsState,
  ValidationConfigI,
  ValidationRules,
  ValidationConfig,
  ValidationI,
  ErrorState,
} from "./models";
import {
  CustomValidationStrategy,
  MaxLengthValidationStrategy,
  MaxValueValidationStrategy,
  MinLengthValidationStrategy,
  MinValueValidationStrategy,
  PatternValidationStrategy,
  RequiredValidationStrategy,
} from "./validationStrategy";

/** Maps each validation prop to the strategy class that evaluates it, so the Validator can create them from the config. */
export const validationStrategiesPerProp: {
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

/**
 * Validation state of one raw value: runs all the rules configured for the field and summarizes the results.
 * It is immutable: FormControl owns the raw value and creates another Validator when it changes.
 */
export class Validator implements ValidationsState {
  /** Receives the raw value and the rules to apply to it. */
  constructor(private readonly config: ValidationConfigI) {}

  /**
   * The result of the whole field: true only if no rule fails (undefined does not count).
   * `required` is one more rule: without it, the others are still evaluated with empty values.
   */
  public get isValid(): boolean {
    throw new Error("Not implemented");
  }

  /**
   * The result of each rule, calculated independently of the others.
   * Its isValid is undefined when the rule is not in the config.
   * Its type and message are only present when the rule fails.
   */
  public get errorsState(): Record<keyof ValidationRules, ErrorState> {
    throw new Error("Not implemented");
  }
}
