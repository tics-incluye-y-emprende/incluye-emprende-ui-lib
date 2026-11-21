import { formControlI } from "../formControl/models";
import { TypedFormConfig, TypedFormI } from "./models";

export class TypedForm<Payload> implements TypedFormI<Payload> {
  constructor(private config: TypedFormConfig<Payload>) {}

  get isValid(): boolean {
    return false;
  }

  get isTouched(): boolean {
    return false;
  }

  get hasChanged(): boolean {
    return false;
  }

  get fields(): { [K in keyof Payload]: formControlI<Payload, K> } {
    return {} as { [K in keyof Payload]: formControlI<Payload, K> };
  }
}
