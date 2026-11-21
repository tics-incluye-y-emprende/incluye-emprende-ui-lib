import { allFieldElementProps, FieldElement } from "../formControl/models";

export type ValidationType = keyof ValidityState;
export type ValidationProps = Pick<
  allFieldElementProps,
  "required" | "minLength" | "maxLength" | "pattern" | "max" | "min"
>;

export interface ValidationConfig<propValueType = unknown> {
  propValue: propValueType;
  errorMessage?: string;
}

export interface ValidationI {
  validationValue: boolean;
  errorType: ValidationType;
  errorMessage?: string;
}

export interface ValidationConfigI {
  validations: Partial<ValidationProps>;
}

export interface ErrorState {
  type: ValidationType;
  message: string | undefined;
  isValid: boolean;
}

export interface ValidationsState {
  isValid: boolean;
  errorsState: Record<keyof ValidationProps, ErrorState>;
}
