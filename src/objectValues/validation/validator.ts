import { RawValue } from "../formControl/models";
import {
  ValidationsState,
  ValidationConfigI,
  ValidatorI,
  ErrorState,
  ValidationRules,
  ValidationConfig,
  ValidationI,
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

/** Temporary placeholder state, to be removed with the implementation. */
const mockErrorState: ErrorState = {
  type: "valueMissing",
  message: "This field is required.",
  isValid: false,
};

/** Runs all the rules configured for one field and summarizes the results. It holds no value. */
export class Validator implements ValidatorI {
  /** Receives the rules to apply to the field. */
  constructor(private readonly config: ValidationConfigI) {}

  /**
   * Evaluates the raw value.
   * - errorsState: the result of each rule, calculated independently of the others.
   *   Its isValid is undefined when the rule is not in the config.
   *   Its type and message are only present when the rule fails.
   * - isValid: the result of the whole field.
   *   - Required: true only if no rule fails (undefined does not count).
   *   - Not required (`required` is absent or its propValue is false): true if the value is
   *     empty (undefined, "" or []) or no rule fails.
   */
  public validate(_rawValue: RawValue): ValidationsState {
    return {
      isValid: false,
      errorsState: {
        required: mockErrorState,
        minLength: mockErrorState,
        maxLength: mockErrorState,
        pattern: mockErrorState,
        max: mockErrorState,
        min: mockErrorState,
        custom: mockErrorState,
      },
    };
  }
}
