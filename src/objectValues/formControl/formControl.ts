import { ValidationsState } from "../validation/models";
import { Validator } from "../validation/validator";
import {
  FieldElement,
  FormControlConfig,
  formControlI,
  ValueSate,
} from "./models";

const mockedState: ValueSate<FieldElement["value"]> = {
  currentValue: "",
  prevValue: "",
  hasChanged: false,
};

abstract class FormControlStrategy<
  Payload,
  K extends keyof Payload,
> implements formControlI<Payload, K> {
  protected readonly validator: ValidationsState;

  constructor(
    protected readonly config: FormControlConfig<Payload, K>,
    validator?: ValidationsState,
  ) {
    this.validator =
      validator ?? new Validator({ validations: config.validations ?? {} });
  }

  public get validationState(): ValidationsState {
    return this.validator;
  }

  public get patchedValue(): ValueSate<FieldElement["value"]> {
    return mockedState;
  }

  public get rawValue(): ValueSate<FieldElement["value"]> {
    return mockedState;
  }

  public get payloadValue(): ValueSate<Payload[K] | undefined> {
    return {
      currentValue: undefined,
      prevValue: undefined,
      hasChanged: false,
    };
  }
}

class FormControlInputStrategy<
  Payload,
  K extends keyof Payload,
> extends FormControlStrategy<Payload, K> {}

class FormControlSelectStrategy<
  Payload,
  K extends keyof Payload,
> extends FormControlStrategy<Payload, K> {}

class FormControlTextareaStrategy<
  Payload,
  K extends keyof Payload,
> extends FormControlStrategy<Payload, K> {}

export function executeFormControlStrategy<Payload, K extends keyof Payload>(
  fieldElement: FieldElement,
): typeof FormControlStrategy<Payload, K> | undefined {
  return undefined;
}
