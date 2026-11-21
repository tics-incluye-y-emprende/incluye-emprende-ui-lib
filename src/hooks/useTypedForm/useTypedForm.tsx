import { TypedFormConfig, TypedFormI } from "../../objectValues/form/models";
import { FieldElement } from "../../objectValues/formControl/models";

interface useTypedFormProps<Payload> extends TypedFormConfig<Payload> {}
interface useTypedFormI<Payload> {
  bind: (formField: keyof Payload) => Partial<FieldElement>;
  onSubmit: (typedPayload: Payload) => void;
  state: TypedFormI<Payload>;
}

export function useTypedForm<Payload>(
  props: useTypedFormProps<Payload>,
): useTypedFormI<Payload> {
  return {} as useTypedFormI<Payload>;
}
