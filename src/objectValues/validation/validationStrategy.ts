import {
  ValidationProps,
  ValidationConfig,
  ValidationI,
  ValidationType,
} from "./models";

abstract class ValidationStrategy implements ValidationI {
  constructor(private config: ValidationConfig) {}

  abstract validate(): boolean;
  protected abstract errorTypeName: ValidationType;
  public get errorType(): ValidationType {
    return this.errorTypeName;
  }

  public get validationValue(): boolean {
    return this.validate();
  }

  public get errorMessage(): string | undefined {
    return;
  }
}

class RequiredValidationStrategy extends ValidationStrategy {
  errorTypeName: ValidationType = "valueMissing";
  constructor(config: ValidationConfig<"required">) {
    super(config);
  }

  validate(): boolean {
    return false;
  }
}

class MinLengthValidationStrategy extends ValidationStrategy {
  errorTypeName: ValidationType = "tooShort";
  constructor(config: ValidationConfig) {
    super(config);
  }

  validate(): boolean {
    return false;
  }
}

class MaxLengthValidationStrategy extends ValidationStrategy {
  errorTypeName: ValidationType = "tooLong";
  constructor(config: ValidationConfig) {
    super(config);
  }

  validate(): boolean {
    return false;
  }
}

class PatternValidationStrategy extends ValidationStrategy {
  errorTypeName: ValidationType = "patternMismatch";
  constructor(config: ValidationConfig) {
    super(config);
  }

  validate(): boolean {
    return false;
  }
}

class CustomValidationStrategy extends ValidationStrategy {
  errorTypeName: ValidationType = "customError";
  constructor(config: ValidationConfig) {
    super(config);
  }

  validate(): boolean {
    return false;
  }
}

class MaxValueValidationStrategy extends ValidationStrategy {
  errorTypeName: ValidationType = "rangeOverflow";
  constructor(config: ValidationConfig) {
    super(config);
  }

  validate(): boolean {
    return false;
  }
}

class MinValueValidationStrategy extends ValidationStrategy {
  errorTypeName: ValidationType = "rangeUnderflow";
  constructor(config: ValidationConfig) {
    super(config);
  }

  validate(): boolean {
    return false;
  }
}

const validationStrategiesPerProp: Record<
  keyof ValidationProps,
  typeof ValidationStrategy
> = {
  required: RequiredValidationStrategy,
  minLength: MinLengthValidationStrategy,
  maxLength: MaxLengthValidationStrategy,
  pattern: PatternValidationStrategy,
  max: MaxValueValidationStrategy,
  min: MinValueValidationStrategy,
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
