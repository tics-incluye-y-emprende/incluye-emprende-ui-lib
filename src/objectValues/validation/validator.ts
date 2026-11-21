import {
  ValidationProps,
  ValidationsState,
  ValidationConfigI,
  ErrorState,
} from "./models";

export class Validator implements ValidationsState {
  constructor(private config: ValidationConfigI) {}

  // If validation "required" is not present in the config, it is considered valid by default.
  public get isValid(): boolean {
    return false;
  }

  // If a component prop is not present in the config, it is considered valid by default.
  public get errorsState(): Record<keyof ValidationProps, ErrorState> {
    const mockErrorState: ErrorState = {
      type: "valueMissing",
      message: "This field is required.",
      isValid: false,
    };
    return {
      required: mockErrorState,
      minLength: mockErrorState,
      maxLength: mockErrorState,
      pattern: mockErrorState,
      max: mockErrorState,
      min: mockErrorState,
    };
  }
}
