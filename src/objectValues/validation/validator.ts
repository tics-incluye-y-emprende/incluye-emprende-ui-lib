import { RawValue } from "../formControl/models";
import {
  ValidationsState,
  ValidationConfigI,
  ValidatorI,
  ErrorState,
} from "./models";

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
   * If a rule, including "required", is not present in the config, it is considered valid by default.
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
