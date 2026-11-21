import { FormControlConfig, formControlI } from "../formControl/models";

export interface TypedFormConfig<Payload> {
  fieldsConfig: { [K in keyof Payload]: FormControlConfig<Payload, K> };
}

export interface TypedFormI<Payload> {
  isValid: boolean;
  isTouched: boolean;
  hasChanged: boolean;
  fields: { [K in keyof Payload]: formControlI<Payload, K> };
}
