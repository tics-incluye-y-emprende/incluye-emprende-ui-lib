import type { ChangeEvent } from "react";
import { FieldElement, formControlI } from "../formControl/models";
import { PartialPayload, PatchValues, SetValues, TypedFormConfig, TypedFormI } from "./models";

/** Aggregates all the form controls and derives the form-level state from them. It contains no React state. */
export class TypedForm<Payload> implements TypedFormI<Payload> {
  /** Receives the config from which one form control per Payload key is created. */
  constructor(private readonly config: TypedFormConfig<Payload>) {}

  /** True only if all the fields are valid. */
  get isValid(): boolean {
    throw new Error("Not implemented");
  }

  /** True if any field has been clicked or blurred since the last reset. */
  get isTouched(): boolean {
    throw new Error("Not implemented");
  }

  /** True if any field's rawValue has changed from its defaultValue. */
  get hasChanged(): boolean {
    throw new Error("Not implemented");
  }

  /** The form control of each Payload key. */
  get fields(): { [K in keyof Payload]: formControlI<Payload, K> } {
    throw new Error("Not implemented");
  }

  /** The complete result, only when the form is valid. */
  get payload(): Payload | undefined {
    throw new Error("Not implemented");
  }

  /** The result of the valid fields, also when the form is not valid. */
  get partialPayload(): PartialPayload<Payload> {
    throw new Error("Not implemented");
  }

  /** Returns a form with the field changed. */
  change(_field: keyof Payload, _e: ChangeEvent<FieldElement>): TypedForm<Payload> {
    throw new Error("Not implemented");
  }

  /** Returns a form with the field focused. */
  focus(_field: keyof Payload): TypedForm<Payload> {
    throw new Error("Not implemented");
  }

  /** Returns a form with the field blurred. */
  blur(_field: keyof Payload): TypedForm<Payload> {
    throw new Error("Not implemented");
  }

  /** Returns a form with the field touched. */
  click(_field: keyof Payload): TypedForm<Payload> {
    throw new Error("Not implemented");
  }

  /** Returns a form with new default values. */
  patchValue(_values: PatchValues<Payload>): TypedForm<Payload> {
    throw new Error("Not implemented");
  }

  /** Returns a form with new current values and the same default values. */
  setValue(_values: SetValues<Payload>): TypedForm<Payload> {
    throw new Error("Not implemented");
  }

  /** Returns a form with every field untouched and in its default value. */
  reset(): TypedForm<Payload> {
    throw new Error("Not implemented");
  }
}
