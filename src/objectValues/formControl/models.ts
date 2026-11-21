import { ValidationProps, ValidationsState } from "../validation/models";

export interface FormControlConfig<Payload, K extends keyof Payload> {
  eventToPayloadAdapter: (
    e: React.ChangeEvent<FieldElement>,
  ) => Payload[K] | undefined;
  required?: boolean;
  validations?: Partial<ValidationProps>;
}

export interface ValueSate<V = string | undefined> {
  currentValue: V;
  prevValue?: V;
  hasChanged: boolean;
}

export interface formControlI<Payload, K extends keyof Payload> {
  patchedValue: ValueSate<FieldElement["value"]>;
  rawValue: ValueSate<FieldElement["value"]>;
  payloadValue: ValueSate<Payload[K] | undefined>;
  formattedValue?: Omit<ValueSate, "hasChanged">;
  isLoading?: boolean;
  validationState: ValidationsState;
}

export type FieldElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export type allFieldElementProps = HTMLInputElement &
  HTMLTextAreaElement &
  HTMLSelectElement;
