import { forwardRef, type FormHTMLAttributes } from "react";

export type FormProps = FormHTMLAttributes<HTMLFormElement>;

/** Thin wrapper around the native `<form>` element. Forwards all props and the ref. */
export const Form = forwardRef<HTMLFormElement, FormProps>((props, ref) => (
  <form ref={ref} {...props} />
));

Form.displayName = "Form";
